const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const cors = require("cors");
const pool = require("./db");
const { requireAuth } = require("./db/supabase");
const { getCached, setCached } = require("./db/topicCache");
const { getQuota, consumeTopic } = require("./db/usage");
const { fetchWikipediaOverview } = require("./sources/wikipedia");
const { fetchHackerNews } = require("./sources/hackerNews");
const { fetchWebsites } = require("./sources/websites");
const { fetchOverview } = require("./sources/overview");
const { fetchStackExchange } = require("./sources/stackExchange");
const { fetchPapers } = require("./sources/papers");
const { fetchGithub } = require("./sources/github");
const { fetchYoutube } = require("./sources/youtube");
const { fetchTavily } = require("./sources/tavily");
const { fetchPodcasts } = require("./sources/podcasts");
const { fetchBooks } = require("./sources/books");

const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(
  /\/$/,
  "",
);

const app = express();

// Render sits behind a proxy; without this express-rate-limit buckets every
// request under the proxy IP and the limits below apply globally instead of
// per-client.
app.set("trust proxy", 1);

/* helmet's default Cross-Origin-Resource-Policy is "same-origin", which is
   wrong for this deployment: the client is served from Vercel and the API from
   Render, so every response is cross-origin by design. CORS still restricts
   who may read it. */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "10kb" }));

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// Baseline ceiling for everything else. Generous enough that normal browsing
// never sees it.
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/* Burst protection only. A cache miss on /api/explore/:topic/live costs 3
   Tavily credits and 100 YouTube units, so an unmetered script requesting
   unique topics drains the month in minutes.
   This is per-IP and per-window; the monthly per-account budget that decides
   who can afford a *fresh* topic lives in db/usage.js, because the cost is in
   cache misses and this limiter cannot tell one from a hit. */
const liveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many topic lookups — try again in a few minutes" },
});

app.use("/api/", readLimiter);

/* Topics become primary-key material in topic_cache, so an unbounded string
   is both a storage-growth problem on a 500MB free tier and a cache-pollution
   vector. Anything a real topic needs fits well inside this. */
const MAX_TOPIC_LENGTH = 80;

function normaliseTopic(raw) {
  const topic = String(raw || "")
    .trim()
    .toLowerCase();
  if (!topic || topic.length > MAX_TOPIC_LENGTH) return null;
  // Letters, numbers, spaces and the handful of separators real topics use.
  if (!/^[\p{L}\p{N} .+#'&/-]+$/u.test(topic)) return null;
  return topic;
}

const depthOrder = ["beginner", "intermediate", "advanced"];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ id: req.userId, email: req.userEmail });
});

app.get("/api/usage", requireAuth, async (req, res) => {
  try {
    const quota = await getQuota(req.userId);
    res.json({
      used: quota.used,
      limit: quota.limit,
      remaining: quota.remaining,
      plan: quota.plan,
      period: quota.period,
      appExhausted: quota.appExhausted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong reading usage" });
  }
});

app.get("/api/interests", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT topic, created_at FROM user_interests WHERE user_id = $1 ORDER BY created_at",
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching interests" });
  }
});

app.post("/api/interests", writeLimiter, requireAuth, async (req, res) => {
  const topic = typeof req.body.topic === "string" ? req.body.topic.trim() : "";

  if (!topic) {
    return res.status(400).json({ error: "topic is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_interests (user_id, topic) VALUES ($1, $2)
       ON CONFLICT (user_id, topic) DO NOTHING
       RETURNING topic, created_at`,
      [req.userId, topic],
    );
    res.status(201).json(result.rows[0] || { topic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong following that topic" });
  }
});

app.delete("/api/interests/:topic", writeLimiter, requireAuth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM user_interests WHERE user_id = $1 AND topic = $2",
      [req.userId, req.params.topic],
    );
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong unfollowing that topic" });
  }
});

app.get("/api/history", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT content_items.*, user_content_history.consumed_at
       FROM user_content_history
       JOIN content_items ON user_content_history.content_item_id = content_items.id
       WHERE user_content_history.user_id = $1
       ORDER BY user_content_history.consumed_at DESC`,
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching history" });
  }
});

app.post("/api/history", writeLimiter, requireAuth, async (req, res) => {
  const contentItemId = parseInt(req.body.content_item_id);

  if (!Number.isInteger(contentItemId)) {
    return res.status(400).json({ error: "content_item_id is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_content_history (user_id, content_item_id) VALUES ($1, $2)
       ON CONFLICT (user_id, content_item_id) DO NOTHING
       RETURNING content_item_id, consumed_at`,
      [req.userId, contentItemId],
    );
    res.status(201).json(result.rows[0] || { content_item_id: contentItemId });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(404).json({ error: "Content not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong recording history" });
  }
});

/* Record a topic the user explored. Account-bound, so the feed follows the
   person rather than the browser. */
app.post("/api/topics", writeLimiter, requireAuth, async (req, res) => {
  const topic = normaliseTopic(req.body.topic);
  if (!topic) return res.status(400).json({ error: "Invalid topic" });

  try {
    await pool.query(
      `INSERT INTO user_topics (user_id, topic) VALUES ($1, $2)
       ON CONFLICT (user_id, topic)
       DO UPDATE SET explored_at = now()`,
      [req.userId, topic],
    );
    res.status(201).json({ topic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong recording the topic" });
  }
});

app.get("/api/topics", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT topic, explored_at FROM user_topics WHERE user_id = $1 ORDER BY explored_at DESC LIMIT 60",
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching topics" });
  }
});

/* The feed's discovery half: real results from the topics this user actually
   searched, read straight out of topic_cache.
 *
 * This costs nothing — the cache was already populated by the searches
 * themselves, so no external API is called here. Expired rows are skipped
 * rather than refetched; the topic simply drops out until it's searched again.
 */
const DISCOVER_SKIP = new Set(["overview"]);

app.get("/api/feed/discover", requireAuth, async (req, res) => {
  try {
    const topics = await pool.query(
      "SELECT topic FROM user_topics WHERE user_id = $1 ORDER BY explored_at DESC LIMIT 8",
      [req.userId],
    );

    if (topics.rows.length === 0) return res.json({ topics: [], items: [] });

    const names = topics.rows.map((r) => r.topic);
    /* Deliberately ignores expires_at, unlike live search.
     *
     * Freshness matters when you ask a question; it does not matter much for a
     * list of things to read later — a fortnight-old set of articles on string
     * theory is still worth reading. Honouring the TTL here meant a topic
     * silently vanished from the feed the moment its cache lapsed, which is
     * how the feed ended up almost empty. The outer bound stops genuinely
     * ancient rows lingering forever. */
    const cached = await pool.query(
      `SELECT topic, source, results FROM topic_cache
        WHERE topic = ANY($1) AND fetched_at > now() - interval '90 days'`,
      [names],
    );

    // Group by topic so the interleave below can round-robin across them.
    const byTopic = new Map(names.map((t) => [t, []]));
    for (const row of cached.rows) {
      if (DISCOVER_SKIP.has(row.source)) continue;
      const list = Array.isArray(row.results) ? row.results : [];
      for (const item of list) {
        if (!item?.url || !item?.title) continue;
        byTopic.get(row.topic)?.push({ ...item, topic: row.topic, category: row.source });
      }
    }

    /* Round-robin across topics rather than concatenating: eight items from
       your most recent search followed by eight from the one before reads as
       two blocks, not a feed. */
    /* Source order is already meaningful — each adapter ranks by relevance and
       engagement — so it's kept. (An earlier version shuffled with
       `sort(() => Math.random() - 0.5)`, which is both a biased shuffle and
       reorders the feed on every refresh.) */
    const buckets = names.map((t) => byTopic.get(t) || []);

    const seen = new Set();
    const items = [];
    const depth = Math.max(...buckets.map((b) => b.length), 0);
    for (let i = 0; i < depth && items.length < 40; i += 1) {
      for (const bucket of buckets) {
        const item = bucket[i];
        if (!item || seen.has(item.url)) continue;
        seen.add(item.url);
        items.push(item);
      }
    }

    res.json({ topics: names, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong building your feed" });
  }
});

app.get("/api/feed", requireAuth, async (req, res) => {
  const { topic } = req.query;

  try {
    let result;
    if (topic) {
      result = await pool.query(
        "SELECT * FROM content_items WHERE topic = $1",
        [topic],
      );
    } else {
      result = await pool.query("SELECT * FROM content_items");
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching the feed" });
  }
});

app.get("/api/content/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid content id" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM content_items WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching content" });
  }
});

app.get("/api/feed/daily", requireAuth, async (req, res) => {
  const { topic, count } = req.query;
  let limit = parseInt(count);

  if (!Number.isInteger(limit) || limit <= 0) {
    limit = 3;
  }

  try {
    let result;
    if (topic) {
      result = await pool.query(
        "SELECT * FROM content_items WHERE topic = $1 ORDER BY date_added DESC LIMIT $2",
        [topic, limit],
      );
    } else {
      result = await pool.query(
        "SELECT * FROM content_items ORDER BY date_added DESC LIMIT $1",
        [limit],
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong fetching the daily feed" });
  }
});

app.get("/api/feed/personalized", requireAuth, async (req, res) => {
  let limit = parseInt(req.query.count);
  if (!Number.isInteger(limit) || limit <= 0) {
    limit = 3;
  }

  try {
    if (!req.userId) {
      const result = await pool.query(
        "SELECT * FROM content_items ORDER BY date_added DESC LIMIT $1",
        [limit],
      );
      return res.json(result.rows);
    }

    const interestsResult = await pool.query(
      "SELECT topic FROM user_interests WHERE user_id = $1",
      [req.userId],
    );
    const interestTopics = interestsResult.rows.map((row) => row.topic);

    if (interestTopics.length === 0) {
      const result = await pool.query(
        "SELECT * FROM content_items ORDER BY date_added DESC LIMIT $1",
        [limit],
      );
      return res.json(result.rows);
    }

    const lastDepthResult = await pool.query(
      `SELECT DISTINCT ON (content_items.topic) content_items.topic, content_items.depth_level
       FROM user_content_history
       JOIN content_items ON user_content_history.content_item_id = content_items.id
       WHERE user_content_history.user_id = $1
       ORDER BY content_items.topic, user_content_history.consumed_at DESC`,
      [req.userId],
    );
    const lastDepthByTopic = Object.fromEntries(
      lastDepthResult.rows.map((row) => [row.topic, row.depth_level]),
    );

    const candidatesResult = await pool.query(
      `SELECT content_items.*
       FROM content_items
       WHERE NOT EXISTS (
         SELECT 1 FROM user_content_history
         WHERE user_content_history.user_id = $1
         AND user_content_history.content_item_id = content_items.id
       )`,
      [req.userId],
    );

    const scored = candidatesResult.rows.map((item) => {
      let score = 0;

      if (interestTopics.includes(item.topic)) {
        score += 3;
      }

      const daysSinceAdded =
        (Date.now() - new Date(item.date_added).getTime()) / 86400000;
      if (daysSinceAdded <= 7) {
        score += 1;
      }

      const lastDepth = lastDepthByTopic[item.topic];
      const nextDepth = lastDepth
        ? depthOrder[depthOrder.indexOf(lastDepth) + 1]
        : null;
      if (nextDepth && item.depth_level === nextDepth) {
        score += 2;
      }

      return { ...item, score };
    });

    scored.sort(
      (a, b) =>
        b.score - a.score || new Date(b.date_added) - new Date(a.date_added),
    );

    res.json(scored.slice(0, limit).map(({ score, ...item }) => item));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong building your feed" });
  }
});

app.get("/api/explore", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         topic,
         COUNT(*) AS item_count,
         ARRAY_AGG(DISTINCT type) AS types,
         ARRAY_AGG(DISTINCT depth_level) AS depth_levels
       FROM content_items
       GROUP BY topic
       ORDER BY topic`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching topics" });
  }
});

// Keyed by category, not by which API produced it — the point is that users
// see "what it is" (an article, a paper), never "where it came from."
// `expected` is a full result set for that category, used to measure how well a
// topic is served there. `saturation` is the engagement level at which a
// category counts as strong, on a log scale so a 40k-star repo doesn't drown
// out everything else.
/* Cache lifetime is per source, because these decay at wildly different rates
   and a single global TTL has to be wrong for most of them.
 *
 * Storage is not the constraint — a fully cached topic is ~24 kB across all
 * nine sources, so even 10,000 topics is ~240 MB against Supabase's 500 MB.
 * The constraint is metered quota: Tavily costs 4 credits per topic refetch
 * against 1,000/month, so a short TTL spends the budget re-fetching answers
 * that did not change. It also matters for the feed, which reads this cache —
 * at 24h a topic searched on Monday has vanished from the feed by Wednesday.
 *
 * The numbers below are "how long before this answer is meaningfully wrong":
 *   - a definition, or a public-domain book, essentially never
 *   - top-voted answers and podcast back catalogues, a fortnight
 *   - articles, repos and videos, about a week
 *   - Hacker News, days — new threads are the whole point of it            */
const TTL_HOURS = {
  /* Overview and articles are the only two that cost money, and at a week they
     were the most expensive thing in the app for the wrong reason: a topic
     anyone kept visiting was re-bought four times a month. At thirty days it
     is bought once.
     Staleness is bounded by the lanes around them — discussions refresh every
     three days and papers every fortnight — so what goes a month old is the
     definition and the explainer articles, which are the most evergreen part
     of the page. An explainer on photosynthesis is not different in November.
     They share one Tavily bundle, so they must share a TTL: whichever lapsed
     first would pay for both halves and discard the other. */
  overview: 24 * 30,
  articles: 24 * 30,
  books: 24 * 30,
  papers: 24 * 14,
  qa: 24 * 14,
  podcasts: 24 * 14,
  code: 24 * 7,
  videos: 24 * 7,
  /* Editor-curated links change about as often as a book does. */
  websites: 24 * 30,
  discussions: 24 * 3,
};

const DEFAULT_TTL_HOURS = 24 * 7;

const LIVE_CATEGORIES = {
  overview: { fetch: fetchOverview, empty: null, expected: 1 },
  websites: { fetch: fetchWebsites, empty: [], expected: 5 },
  discussions: { fetch: fetchHackerNews, empty: [], expected: 20, saturation: 1000 },
  qa: { fetch: fetchStackExchange, empty: [], expected: 5, saturation: 1000 },
  papers: { fetch: fetchPapers, empty: [], expected: 6 },
  code: { fetch: fetchGithub, empty: [], expected: 5, saturation: 50000 },
  videos: { fetch: fetchYoutube, empty: [], expected: 5 },
  articles: { fetch: fetchTavily, empty: [], expected: 9 },
  podcasts: { fetch: fetchPodcasts, empty: [], expected: 5, saturation: 2000 },
  books: { fetch: fetchBooks, empty: [], expected: 5 },
};

// Sources without an engagement metric (arXiv, YouTube search, Tavily, Open
// Library) can't be scored on quality, so they sit at a fixed middling value:
// a category with genuinely strong engagement should outrank them, a weak one
// should fall below them.
const UNSCORED_BASELINE = 0.6;

/* Videos and articles lead whenever they have anything, because they are where
   most people should start on most topics. A multiplier wasn't enough — on
   "react hooks" a 58k-star repo still outranked them — and the ordering is a
   deliberate editorial choice rather than a popularity contest. Categories
   with no results are skipped, so a topic with nothing on YouTube still won't
   open with an empty Videos section. Everything else stays score-ranked. */
const START_HERE = ["videos", "articles"];

// Not every topic is best served by the same medium: philosophy lives in
// podcasts and books, a JS library lives in code and Q&A. Rank categories per
// topic instead of showing one fixed order. Deterministic for now — the
// embedding/quality model in the AI phase replaces this.
function rankCategories(categories) {
  const scored = Object.entries(categories)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Boolean(value)))
    .map(([name, value]) => {
      const config = LIVE_CATEGORIES[name];
      const items = Array.isArray(value) ? value : [value];
      const fill = Math.min(items.length / (config.expected || 1), 1);

      let quality = UNSCORED_BASELINE;
      if (config.saturation) {
        const peak = Math.max(...items.map((item) => item.signal || 0));
        // Log-scaled so quality lifts a category without one outlier dominating:
        // 58k-star React repos score ~1, the 140-star repos a philosophy search
        // turns up score ~0.45, which drops Code below the neutral categories.
        quality = Math.min(Math.log10(peak + 1) / Math.log10(config.saturation), 1);
      }

      /* Videos and articles are where most people should start on most
         topics — one is the lowest-effort way in, the other is the most
         complete. They earn a boost rather than a fixed slot, so a topic that
         genuinely has nothing on YouTube still won't lead with an empty
         Videos section. */
      return { name, score: fill * quality };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ name }) => name);

  const has = (name) => {
    const value = categories[name];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  };

  const lead = START_HERE.filter(has);
  const rest = scored.filter(
    (name) => name !== "overview" && !lead.includes(name),
  );

  // The overview is a primer, so it always leads regardless of score.
  return ["overview", ...lead, ...rest].filter(
    (name) => name === "overview" ? Boolean(categories.overview) : true,
  );
}

async function loadLiveCategory(topic, category, fetchFn, emptyValue, ...args) {
  try {
    const cached = await getCached(topic, category);
    if (cached) return cached;

    const results = await fetchFn(topic, ...args);

    /* Don't cache an empty result for a week — an adapter that failed, was
       rate-limited, or filtered everything out would otherwise pin the topic
       to "nothing here" long after the cause passed. Retry those in an hour. */
    const isEmpty =
      results == null || (Array.isArray(results) && results.length === 0);

    await setCached(
      topic,
      category,
      results,
      isEmpty ? 1 : TTL_HOURS[category] || DEFAULT_TTL_HOURS,
    );
    return results;
  } catch (err) {
    console.error(`live discovery: ${category} failed for topic "${topic}"`, err);
    return emptyValue;
  }
}

// Fetched first because all five are free and keyless, so they cost nothing but
// a little latency — and what they return tells us which of the metered sources
// are actually worth calling.
const PROBE_CATEGORIES = ["discussions", "papers", "books", "podcasts", "websites"];

/* What the monthly budget actually pays for: overview and articles, which
   share one round of Tavily searches.
 *
 * Videos used to be in here and shouldn't have been. The per-account quota
 * exists to protect Tavily's 1,000 credits a month; YouTube is a completely
 * separate allowance (10,000 units a day, 100 per search) that Tavily spending
 * does not touch. Gating one on the other meant videos vanished whenever the
 * Tavily budget ran out — and videos is the lane with the broadest coverage of
 * any, so it was the worst possible one to drop. It now runs like every other
 * free source and fails on its own quota if it ever hits it. */
const METERED_CATEGORIES = ["overview", "articles"];

/* Articles stands in for "has anyone paid for this topic yet". It shares a
   fetch with the overview and expires on the same schedule, so if its row is
   live the metered half of this topic is already bought and paid for — by
   whoever explored it first, not necessarily this user. topic_cache is shared,
   so most lookups after the first cost nothing and must not be charged. */
async function isTopicWarm(topic) {
  return Boolean(await getCached(topic, "articles"));
}

// A topic sitting in books with almost nothing on arXiv is a humanities topic:
// GitHub will only return noise for it (a "stoicism" search yields 140-star
// hobby repos), so we skip the call rather than fetch junk and rank it last.
/* Repos are only useful when the topic is something you'd actually write or
   read code for. "quantum computing" and "astrophysics" profile as technical,
   but nobody exploring those wants a repo list — they want the explanation.
   So Code is gated on the topic naming a language, tool, or software practice.

   Matching is whole-word, not substring: "cli" inside "climate science" and
   "java" inside "javascript" both false-positived when this used includes().
   Extending either list is a one-line edit. */
const CODE_WORDS = new Set([
  // languages
  "python", "javascript", "typescript", "js", "ts", "rust", "go", "golang",
  "java", "kotlin", "swift", "ruby", "php", "scala", "haskell", "elixir",
  "clojure", "lua", "c", "c++", "c#", "perl", "dart", "zig", "ocaml",
  "erlang", "solidity", "sql", "bash", "shell",
  // runtimes, frameworks, libraries
  "react", "vue", "angular", "svelte", "nextjs", "next.js", "nuxt", "node",
  "nodejs", "deno", "bun", "django", "flask", "rails", "laravel", "spring",
  "express", "fastapi", "pytorch", "tensorflow", "numpy", "pandas", "jax",
  "keras", "langchain", "tailwind", "webpack", "vite", "graphql", "prisma",
  "postgres", "postgresql", "mysql", "sqlite", "redis", "mongodb",
  // tools and practice
  "git", "docker", "kubernetes", "k8s", "terraform", "ansible", "linux",
  "regex", "api", "apis", "sdk", "cli", "compiler", "compilers",
  "interpreter", "debugging", "devops", "microservices", "webassembly",
  "wasm", "kernel", "database", "databases",
  // the craft itself
  "programming", "coding", "code", "software", "developer", "development",
  "frontend", "backend", "fullstack", "algorithm", "algorithms", "hooks",
  "refactoring", "scripting", "testing",
]);

/* Multi-word topics where the artifact people want really is a repo. */
const CODE_PHRASES = [
  "system design",
  "data structure",
  "design pattern",
  "machine learning",
  "deep learning",
  "neural network",
  "computer vision",
  "web dev",
  "open source",
  "unit test",
  "code review",
  "operating system",
  "distributed system",
];

function demandsCode(topic) {
  const lower = topic.toLowerCase();
  if (CODE_PHRASES.some((phrase) => lower.includes(phrase))) return true;

  return lower
    .split(/[\s,/]+/)
    .some((token) => CODE_WORDS.has(token.replace(/^[^a-z0-9+#.]+|[^a-z0-9+#.]+$/g, "")));
}

/* Which Stack Exchange sites to query. Derived from the code signal rather
   than the papers-vs-books profile: "string theory" is paper-heavy and so
   profiles as technical, but its answers live on physics.stackexchange, not
   Stack Overflow. */
function qaPool(topic, profile) {
  if (demandsCode(topic)) return "code";
  if (profile === "humanities") return "humanities";
  if (profile === "technical") return "science";
  return "mixed";
}

/* Counts arXiv's contribution to the papers lane, not the lane itself.
 *
 * arXiv indexes physics, maths, CS and statistics and nothing else, which is
 * exactly what makes its hit count a usable signal for "is this topic
 * technical". OpenAlex, which now supplies the rest of the lane, covers every
 * discipline — so counting the merged lane would find papers for stoicism and
 * the French Revolution too, and classify everything as technical. The
 * narrowness is the measurement. */
function arxivCount(papers) {
  return (papers || []).filter((item) => item.source === "arxiv").length;
}

function profileTopic(probe) {
  const papers = arxivCount(probe.papers);
  const books = probe.books?.length || 0;

  if (papers >= 3 && books <= 2) return "technical";
  if (books >= 3 && papers <= 1) return "humanities";
  return "mixed";
}

app.get("/api/explore/:topic/live", requireAuth, liveLimiter, async (req, res) => {
  const topic = normaliseTopic(req.params.topic);

  if (!topic) {
    return res.status(400).json({ error: "Invalid topic" });
  }

  const load = (name, ...args) =>
    loadLiveCategory(
      topic,
      name,
      LIVE_CATEGORIES[name].fetch,
      LIVE_CATEGORIES[name].empty,
      ...args,
    );

  try {
    /* A topic someone has already explored is served from a shared cache and
       costs nothing, so it is never charged and never blocked. Only the first
       person to ask for a topic spends anything. */
    const warm = await isTopicWarm(topic);
    const quota = await getQuota(req.userId);

    let metered = true;
    let withheld = null;

    if (!warm) {
      if (quota.appExhausted) {
        metered = false;
        withheld = "app";
      } else if (quota.remaining <= 0) {
        metered = false;
        withheld = "plan";
      } else {
        await consumeTopic(req.userId);
      }
    }

    // Phase 1 — free, keyless sources. These double as the topic probe.
    const probeResults = await Promise.all(PROBE_CATEGORIES.map((name) => load(name)));
    const categories = Object.fromEntries(
      PROBE_CATEGORIES.map((name, i) => [name, probeResults[i]]),
    );

    const profile = profileTopic(categories);

    /* Phase 2. Out of quota withholds only the three that cost money — the
       free sources still run, so the page is a smaller version of itself
       rather than an error. There is real content either way. */
    const second = [
      ...(metered ? METERED_CATEGORIES.map((name) => [name]) : []),
      ["videos"],
      ["qa", qaPool(topic, profile)],
      ...(demandsCode(topic) ? [["code"]] : []),
    ];

    const secondResults = await Promise.all(second.map(([name, ...a]) => load(name, ...a)));
    second.forEach(([name], i) => {
      categories[name] = secondResults[i];
    });

    /* Out of quota still gets a definition. Wikipedia is free and keyless, so
       withholding it would save nothing and cost the page the one thing it
       most needs to open with.
       Deliberately not cached: the row would then serve for a month and shut
       out the better Tavily answer the next person with quota pays for. */
    if (!metered) {
      categories.overview = await fetchWikipediaOverview(topic).catch(() => null);
    }

    res.json({
      topic,
      categories,
      order: rankCategories(categories),
      profile,
      usage: {
        used: quota.used + (warm || !metered ? 0 : 1),
        limit: quota.limit,
        plan: quota.plan,
        // Free because someone already explored it, so nothing was charged.
        cached: warm,
        withheld,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong fetching live results" });
  }
});

/* Open Library is keyless and free, so this costs nothing but somebody else's
   bandwidth — which is exactly why it gets its own ceiling. Looser than the
   live-discovery limiter because the palette searches as you type, tighter
   than the blanket read limit because each miss is an outbound request. */
const booksLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many book searches — try again in a few minutes" },
});

/* Books on their own, for the palette's /books command.
 *
 * Goes through loadLiveCategory rather than calling the adapter directly, so a
 * search here writes the same `topic_cache` row the explore page reads: look a
 * topic up in the palette and its Books lane is already paid for when someone
 * opens it, and the other way round. */
app.get("/api/books", requireAuth, booksLimiter, async (req, res) => {
  const topic = normaliseTopic(req.query.q || "");

  if (!topic) return res.json({ topic: "", items: [] });

  try {
    const items = await loadLiveCategory(topic, "books", fetchBooks, []);
    res.json({ topic, items: Array.isArray(items) ? items : [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong searching books" });
  }
});

app.get("/api/search", requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, MAX_TOPIC_LENGTH);

  if (!q) {
    return res.json({ topics: [], bundles: [], content: [] });
  }

  try {
    const like = `%${q}%`;

    const [topicsResult, bundlesResult, contentResult] = await Promise.all([
      pool.query(
        "SELECT DISTINCT topic FROM content_items WHERE topic ILIKE $1 ORDER BY topic LIMIT 5",
        [like],
      ),
      pool.query(
        "SELECT id, title, topic FROM bundles WHERE title ILIKE $1 ORDER BY title LIMIT 5",
        [like],
      ),
      pool.query(
        "SELECT id, title, topic, url FROM content_items WHERE title ILIKE $1 ORDER BY title LIMIT 5",
        [like],
      ),
    ]);

    res.json({
      topics: topicsResult.rows.map((row) => row.topic),
      bundles: bundlesResult.rows,
      content: contentResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong searching" });
  }
});

app.get("/api/bundles", requireAuth, async (req, res) => {
  const { topic } = req.query;

  try {
    let result;
    if (topic) {
      result = await pool.query("SELECT * FROM bundles WHERE topic = $1", [
        topic,
      ]);
    } else {
      result = await pool.query("SELECT * FROM bundles");
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching bundles" });
  }
});

app.get("/api/bundles/recommended", requireAuth, async (req, res) => {
  try {
    const interestsResult = await pool.query(
      "SELECT topic FROM user_interests WHERE user_id = $1",
      [req.userId],
    );
    const interestTopics = interestsResult.rows.map((row) => row.topic);

    if (interestTopics.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT
         bundles.id,
         bundles.title,
         bundles.topic,
         bundles.description,
         COUNT(bundle_items.id) FILTER (
           WHERE NOT EXISTS (
             SELECT 1 FROM user_content_history
             WHERE user_content_history.user_id = $1
             AND user_content_history.content_item_id = bundle_items.content_item_id
           )
         ) AS unconsumed_count
       FROM bundles
       JOIN bundle_items ON bundle_items.bundle_id = bundles.id
       WHERE bundles.topic = ANY($2::text[])
       GROUP BY bundles.id
       ORDER BY unconsumed_count DESC`,
      [req.userId, interestTopics],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong fetching recommended bundles" });
  }
});

app.get("/api/bundles/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid bundle id" });
  }

  try {
    const bundleResult = await pool.query(
      "SELECT * FROM bundles WHERE id = $1",
      [id],
    );

    if (bundleResult.rows.length === 0) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    const itemsResult = await pool.query(
      `SELECT content_items.*
       FROM bundle_items
       JOIN content_items ON bundle_items.content_item_id = content_items.id
       WHERE bundle_items.bundle_id = $1
       ORDER BY bundle_items.position`,
      [id],
    );

    const bundle = bundleResult.rows[0];
    res.json({
      id: bundle.id,
      title: bundle.title,
      topic: bundle.topic,
      description: bundle.description,
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching the bundle" });
  }
});

app.get("/api/content/:id/next", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid content id" });
  }

  try {
    const currentResult = await pool.query(
      "SELECT * FROM content_items WHERE id = $1",
      [id],
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    const current = currentResult.rows[0];
    const currentDepthIndex = depthOrder.indexOf(current.depth_level);
    const nextDepth = depthOrder[currentDepthIndex + 1];

    if (!nextDepth) {
      return res.json({
        current: current.title,
        message: "You've reached the most advanced level for this topic.",
        next: [],
      });
    }

    const nextResult = await pool.query(
      "SELECT * FROM content_items WHERE topic = $1 AND depth_level = $2",
      [current.topic, nextDepth],
    );

    res.json({
      current: current.title,
      nextDepth,
      next: nextResult.rows,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong finding the next step" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`prysm running on port ${PORT}`));
