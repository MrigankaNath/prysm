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

const { postJson, hostOf } = require("./http");
const { hostRank, RANK } = require("./quality");

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

/* Asking for 20 costs exactly what asking for 6 does — `max_results` is free,
   which is the same measurement that took the tiers from 3 to 6. The tail is
   where the community platforms live: an institutional page outranks a
   Substack post on a general query nearly every time, so with six results the
   whole of Reddit, Substack, Medium and Quora simply never appeared. Measured
   in the tail of these same three queries: 6 community results on "stoicism",
   10 on "react hooks", 2 on "french revolution". */
const PER_TIER = 20;

/* Two lanes carved out of the results we already pay for, because they are not
   articles and were never competing fairly with them.
 *
 * `essays` is long-form writing by a person — the Substack explainer, the
 * Medium walkthrough. `community` is where people talk to each other. They are
 * split rather than merged because a Substack essay is a different reading
 * experience from a Reddit thread, and the path ranks by kind: folding them
 * together would place an essay in the sequence as though it were a thread.
 *
 * The gain is not only the new lanes. Routed out, a Medium SEO post can no
 * longer take one of the four article slots it used to win on tech topics. */
const LANES = [
  {
    name: "essays",
    type: "essay",
    hosts: ["substack.com", "medium.com", "dev.to", "hashnode.dev", "hashnode.com"],
  },
  {
    name: "community",
    type: "discussion",
    hosts: ["reddit.com", "lesswrong.com", "lobste.rs"],
  },
  /* Quora is a question with answers under it, so it belongs in Q&A rather
     than in discussions — and it leads that lane, because Stack Exchange is
     the one people already know how to find. */
  { name: "answers", type: "question", hosts: ["quora.com"] },
];

/* Anyone can publish on these platforms, which is the point of them and also
   the risk: there is no editor between a first draft and the open web. So they
   are held to a higher relevance floor than articles — measured, this keeps
   Jared Henderson on Stoicism (0.65) and the r/Stoicism reading thread (0.50)
   and drops the 0.44 tangents. */
const LANE_MIN_SCORE = 0.5;

/* One lane is not a reading list of one publication. Medium took 7 of 10 slots
   on "react hooks" uncapped. */
const LANE_PER_DOMAIN = 2;

const LANE_TAKE = 8;

/* The tail belongs to the new lanes, not to Articles.
 *
 * Asking for twenty does not reorder anything — measured, "stoicism scholarly
 * analysis" returns an identical top six at max_results 6 and 20 — so this is
 * not fixing a regression. It pins the article tiers to the same candidate
 * window they were tuned against, so the one thing the extra results can still
 * change is closed off: when the domain cap or the URL dedupe blocks a top
 * result, a pool of twenty lets a tier backfill from far down the tail rather
 * than simply keeping fewer. Articles sees the first six of each tier;
 * everything past that is only ever read by the two lanes below. */
const ARTICLE_POOL = 6;

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
  /* Has its own lane too, through the Stack Exchange API, which returns vote
     counts and accepted flags that a web result does not carry. */
  "stackoverflow.com",
  "stackexchange.com",
  "serverfault.com",
  "superuser.com",
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

/* Subdomains are the norm on these platforms, not the exception —
   `jaredhenderson.substack.com`, `meganslo.medium.com` — so this matches the
   host or any subdomain of it, never a substring. */
function laneOf(url) {
  const host = hostOf(url);
  if (!host) return null;

  const lane = LANES.find(({ hosts }) =>
    hosts.some((h) => host === h || host.endsWith(`.${h}`)),
  );

  return lane ? lane.name : "articles";
}

async function runTier(apiKey, topic, tier) {
  const data = await postJson(
    ENDPOINT,
    {
      api_key: apiKey,
      query: tier.query(topic),
      max_results: PER_TIER,
      exclude_domains: EXCLUDE,
      ...(tier.answer ? { include_answer: "basic" } : {}),
    },
    /* Longer than the 8s the other adapters get, because this is the one call
       that costs money and the one whose failure is charged for: the quota is
       consumed before the fetch, so a timeout here bills a topic and returns
       an empty page. Measured, a tier takes anywhere from 0.5s to 4.5s
       depending on nothing the caller controls. */
    { label: "Tavily API", timeoutMs: 20_000 },
  );

  return {
    answer: data.answer || null,
    top: data.results?.[0] || null,
    items: (data.results || [])
      .filter((item) => item.url && item.title && (item.score ?? 1) >= MIN_SCORE)
      .map((item, pos) => ({
        pos,
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
/* Two URLs, one page. The same article is served under a tracking suffix, a
   locale prefix or a trailing slash, and Udemy returned the identical title
   twice on "stoicism" — the URL set can't see it, and a reader who opens both
   has been sent to the same place twice. */
function titleKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupe(tiers) {
  const seenUrl = new Set();
  const seenTitle = new Set();
  const perDomain = new Map();
  const out = [];

  for (const tier of tiers) {
    let kept = 0;
    const articles = tier.items.filter(
      (item) =>
        item.pos < ARTICLE_POOL &&
        laneOf(item.url) === "articles" &&
        hostRank(item.url) !== RANK.drop,
    );

    /* What the site is, before how well it matched. Tavily's score is a
       relevance measure and orders a university page, an engineering blog and
       a keyword-farm page by how thoroughly each says the topic's name — which
       is the one thing they all do equally well. */
    articles.sort(
      (a, b) => hostRank(a.url) - hostRank(b.url) || b.score - a.score,
    );

    for (const item of articles) {
      if (kept >= KEEP_PER_TIER) break;

      const host = hostOf(item.url);
      if (!host || seenUrl.has(item.url)) continue;

      const key = titleKey(item.title);
      if (seenTitle.has(key)) continue;

      const used = perDomain.get(host) || 0;
      if (used >= PER_DOMAIN) continue;

      kept += 1;

      seenUrl.add(item.url);
      seenTitle.add(key);
      perDomain.set(host, used + 1);
      // `score` was only ever for ordering and filtering; it isn't a public
      // engagement signal like stars or votes, so it doesn't ship to the client.
      const { score, pos, ...rest } = item;
      out.push(rest);
    }
  }

  return out;
}

/* The lanes are flattened across tiers rather than walked tier by tier: the
   depth tags are a property of the *query*, and a Reddit thread that turned up
   under "scholarly analysis" is not an advanced resource — it is a thread the
   phrasing happened to reach. So they are ordered by relevance alone, and the
   depth label is dropped rather than carried through as a claim it can't
   support. */
function collectLane(tiers, lane) {
  const seenUrl = new Set();
  const perDomain = new Map();
  const out = [];

  const items = tiers
    .flatMap((tier) => tier.items)
    .filter((item) => laneOf(item.url) === lane.name && item.score >= LANE_MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  for (const item of items) {
    if (out.length >= LANE_TAKE) break;

    const host = hostOf(item.url);
    if (!host || seenUrl.has(item.url)) continue;

    const used = perDomain.get(host) || 0;
    if (used >= LANE_PER_DOMAIN) continue;

    seenUrl.add(item.url);
    perDomain.set(host, used + 1);

    const { score, pos, depth_level, ...rest } = item;
    out.push({ ...rest, type: lane.type });
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
    essays: collectLane(tiers, LANES[0]),
    community: collectLane(tiers, LANES[1]),
    answers: collectLane(tiers, LANES[2]),
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

async function fetchTavilyEssays(topic) {
  return (await tavilyBundle(topic)).essays;
}

async function fetchTavilyCommunity(topic) {
  return (await tavilyBundle(topic)).community;
}

async function fetchTavilyAnswers(topic) {
  return (await tavilyBundle(topic)).answers;
}

module.exports = {
  fetchTavily,
  fetchTavilyOverview,
  fetchTavilyEssays,
  fetchTavilyCommunity,
  fetchTavilyAnswers,
  laneOf,
};
