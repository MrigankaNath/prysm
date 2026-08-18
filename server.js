const express = require("express");
const rateLimit = require("express-rate-limit");

const cors = require("cors");
const pool = require("./db");
const { requireAuth, optionalAuth } = require("./db/supabase");
const { getCached, setCached } = require("./db/topicCache");
const { fetchHackerNews } = require("./sources/hackerNews");
const { fetchOverview } = require("./sources/overview");
const { fetchStackExchange } = require("./sources/stackExchange");
const { fetchArxiv } = require("./sources/arxiv");
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
app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const depthOrder = ["beginner", "intermediate", "advanced"];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ id: req.userId, email: req.userEmail });
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

app.get("/api/feed", async (req, res) => {
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

app.get("/api/content/:id", async (req, res) => {
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

app.get("/api/feed/daily", async (req, res) => {
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

app.get("/api/feed/personalized", optionalAuth, async (req, res) => {
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

app.get("/api/explore", async (req, res) => {
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
const LIVE_CATEGORIES = {
  overview: { fetch: fetchOverview, empty: null, expected: 1 },
  discussions: { fetch: fetchHackerNews, empty: [], expected: 20, saturation: 1000 },
  qa: { fetch: fetchStackExchange, empty: [], expected: 5, saturation: 1000 },
  papers: { fetch: fetchArxiv, empty: [], expected: 5 },
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

      return { name, score: fill * quality };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ name }) => name);

  // The overview is a primer, so it always leads regardless of score.
  return ["overview", ...scored.filter((name) => name !== "overview")].filter(
    (name) => name === "overview" ? Boolean(categories.overview) : true,
  );
}

async function loadLiveCategory(topic, category, fetchFn, emptyValue, ...args) {
  try {
    const cached = await getCached(topic, category);
    if (cached) return cached;

    const results = await fetchFn(topic, ...args);
    await setCached(topic, category, results);
    return results;
  } catch (err) {
    console.error(`live discovery: ${category} failed for topic "${topic}"`, err);
    return emptyValue;
  }
}

// Fetched first because all five are free and keyless, so they cost nothing but
// a little latency — and what they return tells us which of the metered sources
// are actually worth calling.
const PROBE_CATEGORIES = ["discussions", "papers", "books", "podcasts"];

// A topic sitting in books with almost nothing on arXiv is a humanities topic:
// GitHub will only return noise for it (a "stoicism" search yields 140-star
// hobby repos), so we skip the call rather than fetch junk and rank it last.
function profileTopic(probe) {
  const papers = probe.papers?.length || 0;
  const books = probe.books?.length || 0;

  if (papers >= 3 && books <= 2) return "technical";
  if (books >= 3 && papers <= 1) return "humanities";
  return "mixed";
}

app.get("/api/explore/:topic/live", async (req, res) => {
  const topic = req.params.topic.trim().toLowerCase();

  if (!topic) {
    return res.status(400).json({ error: "topic is required" });
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
    // Phase 1 — free, keyless sources. These double as the topic probe.
    const probeResults = await Promise.all(PROBE_CATEGORIES.map((name) => load(name)));
    const categories = Object.fromEntries(
      PROBE_CATEGORIES.map((name, i) => [name, probeResults[i]]),
    );

    const profile = profileTopic(categories);

    // Phase 2 — metered sources, plus the ones this topic actually warrants.
    const second = [
      ["overview"],
      ["articles"],
      ["videos"],
      ["qa", profile],
      ...(profile === "humanities" ? [] : [["code"]]),
    ];

    const secondResults = await Promise.all(second.map(([name, ...a]) => load(name, ...a)));
    second.forEach(([name], i) => {
      categories[name] = secondResults[i];
    });

    res.json({
      topic,
      categories,
      order: rankCategories(categories),
      profile,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong fetching live results" });
  }
});

app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();

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

app.get("/api/bundles", async (req, res) => {
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

app.get("/api/bundles/:id", async (req, res) => {
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

app.get("/api/content/:id/next", async (req, res) => {
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
