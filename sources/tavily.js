/* Tavily is the only metered source, so it sets the ceiling on the whole
 * product: 1000 credits a month, and every credit spent here is a topic
 * nobody else gets to explore. Everything below is about buying more with the
 * same money.
 *
 * Three things this gets right that the previous version didn't:
 *
 * 1. The overview rides along. `include_answer` is free on any search, and the
 *    beginner query is phrased as a question, so it returns both a definition
 *    and the beginner articles. The separate "What is X?" call it replaces was
 *    a whole credit for one paragraph — a quarter of the budget for a topic.
 *
 * 2. `max_results` costs nothing. Asking for 3 results per tier and asking for
 *    6 are the same credit, so there is no reason to ask for 3.
 *
 * 3. `search_depth: "advanced"` costs double and, measured on this corpus,
 *    returned *worse* sources — it buys deeper extraction per page, not better
 *    pages, and only the snippet is used. Basic depth throughout.
 */

const ENDPOINT = "https://api.tavily.com/search";

/* Suffixes were A/B'd against a humanities topic and a physics one, because a
   phrase that works on one often fails on the other:
     "expert analysis"           — nature.com and PMC on quantum entanglement,
                                   but "Expertise Finder" and "4 Experts In
                                   stoicism" on philosophy. It matches pages
                                   *about* experts.
     "advanced critical analysis" — a Facebook group and a patent aggregator.
     "scholarly analysis"        — Stanford Encyclopedia of Philosophy on
                                   stoicism, IOP Publishing on entanglement.
   Wordier phrasings lost across the board. Keep them short. */
const TIERS = [
  {
    depth_level: "beginner",
    /* Phrased as a question so `include_answer` has something to answer.
       Retrieval still lands on introductory pages — NASA, Caltech, Wikipedia,
       r/explainlikeimfive — because that is what the wording asks for. */
    query: (t) => `What is ${t}? A beginner introduction, explained simply.`,
    answer: true,
  },
  { depth_level: "intermediate", query: (t) => `${t} in-depth guide` },
  { depth_level: "advanced", query: (t) => `${t} scholarly analysis` },
];

const PER_TIER = 6;

/* Domains that have their own lane, or that consistently return SEO filler in
   place of an article. Free to apply — exclusions happen at query time. */
const EXCLUDE = [
  // Has its own lane.
  "youtube.com",
  "m.youtube.com",
  // A group or profile page is never the article you wanted, and discussions
  // have their own lane too.
  "facebook.com",
  "x.com",
  "twitter.com",
  // Observed returning SEO filler in place of an article.
  "patsnap.com",
  "eurekamag.com",
];

/* Tavily's own relevance score, 0..1. Below this the result is usually a page
   that mentions the topic once. It does not separate good sources from content
   farms — both score in the 0.6s — so it is a floor, not a quality filter. */
const MIN_SCORE = 0.3;

/* One domain shouldn't take three of the slots. Caps across the whole set
   rather than per tier, because the same site tends to rank for all three. */
const PER_DOMAIN = 2;

/* Fewer than are requested, because the tiers are processed in order and the
   first one to claim a URL keeps it. Uncapped, beginner took six of ten and
   advanced was left with two — and the advanced tier is the one that earns its
   credit, since a beginner explainer is easy to find and an expert source
   isn't. */
const KEEP_PER_TIER = 4;

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function runTier(apiKey, topic, tier) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: tier.query(topic),
      max_results: PER_TIER,
      exclude_domains: EXCLUDE,
      ...(tier.answer ? { include_answer: "basic" } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily API returned ${res.status}`);
  }

  const data = await res.json();

  return {
    answer: data.answer || null,
    top: data.results?.[0] || null,
    items: (data.results || [])
      .filter((item) => item.url && item.title && (item.score ?? 1) >= MIN_SCORE)
      .map((item) => ({
        title: item.title,
        url: item.url,
        source: "tavily",
        type: "article",
        snippet: (item.content || "").slice(0, 280),
        published_at: item.published_date || null,
        thumbnail: null,
        depth_level: tier.depth_level,
        score: item.score ?? 0,
      })),
  };
}

/* Tiers overlap: a good explainer ranks for "beginner introduction" and
   "in-depth guide" alike. First tier to claim a URL keeps it, so the depth
   label stays the one the query actually asked for. */
function dedupe(tiers) {
  const seenUrl = new Set();
  const perDomain = new Map();
  const out = [];

  for (const tier of tiers) {
    let kept = 0;
    for (const item of [...tier.items].sort((a, b) => b.score - a.score)) {
      if (kept >= KEEP_PER_TIER) break;

      const host = hostOf(item.url);
      if (!host || seenUrl.has(item.url)) continue;

      const used = perDomain.get(host) || 0;
      if (used >= PER_DOMAIN) continue;

      kept += 1;

      seenUrl.add(item.url);
      perDomain.set(host, used + 1);
      // `score` was only ever for ordering and filtering; it isn't a public
      // engagement signal like stars or votes, so it doesn't ship to the client.
      const { score, ...rest } = item;
      out.push(rest);
    }
  }

  return out;
}

async function runBundle(topic) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const tiers = await Promise.all(
    TIERS.map((tier) => runTier(apiKey, topic, tier)),
  );

  const withAnswer = tiers.find((tier) => tier.answer);

  return {
    articles: dedupe(tiers),
    overview: withAnswer?.answer
      ? {
          title: `What is ${topic}?`,
          url: withAnswer.top?.url || null,
          source: "overview",
          type: "overview",
          snippet: withAnswer.answer,
          published_at: null,
          thumbnail: null,
        }
      : null,
  };
}

/* The overview and the articles are two categories with their own cache rows,
 * but one round of searches. This holds the in-flight promise so the two
 * `loadLiveCategory` calls — which run concurrently in phase two — share it
 * instead of each paying for its own three searches.
 *
 * Their TTLs are aligned in server.js for the same reason: if they expired at
 * different times, the one that lapsed first would run the bundle and the
 * other would throw the fresh half away.
 */
const inflight = new Map();

function tavilyBundle(topic) {
  if (!inflight.has(topic)) {
    const pending = runBundle(topic).finally(() => {
      // Long enough to cover one request, short enough that a retry after a
      // failure isn't served the same rejected promise.
      setTimeout(() => inflight.delete(topic), 30_000).unref?.();
    });
    inflight.set(topic, pending);
  }
  return inflight.get(topic);
}

async function fetchTavily(topic) {
  return (await tavilyBundle(topic)).articles;
}

async function fetchTavilyOverview(topic) {
  return (await tavilyBundle(topic)).overview;
}

module.exports = { fetchTavily, fetchTavilyOverview };
