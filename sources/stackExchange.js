const { relevanceScore } = require("./relevance");

// Stack Exchange has no cross-site search — `site` is required — so we fan out
// across a spread of sites and merge by score. This is what makes Q&A useful
// for non-technical topics, where Hacker News has nothing to say.
// Each site is a separate HTTP request and the keyless quota is 300/day, so
// querying all of these per topic burned it in ~50 topics. Pick three that suit
// the topic instead — chosen by the caller from cheap, keyless probe signals.
/* Stack Overflow is only in the pool for topics that are actually about code.
   It dwarfs every other site in traffic, so including it for, say, "string
   theory" means its high-vote "string" questions bury the physics answers. */
const SITE_POOLS = {
  code: ["stackoverflow", "softwareengineering", "dba"],
  science: ["physics", "math", "chemistry"],
  humanities: ["philosophy", "history", "literature"],
  mixed: ["physics", "philosophy", "economics"],
};

const ENTITIES = {
  "&quot;": '"',
  "&#39;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&hellip;": "…",
};

function decodeEntities(text = "") {
  return text
    .replace(/&quot;|&#39;|&amp;|&lt;|&gt;|&hellip;/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

async function searchSite(topic, site) {
  const url =
    "https://api.stackexchange.com/2.3/search/advanced" +
    `?order=desc&sort=votes&pagesize=3&filter=default` +
    `&q=${encodeURIComponent(topic)}&site=${site}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();

  return (data.items || [])
    .filter((item) => item.answer_count > 0)
    .map((item) => ({
      title: decodeEntities(item.title),
      tags: item.tags || [],
      url: item.link,
      source: "stackexchange",
      type: "qa",
      score: item.score,
      snippet: `${item.score} votes · ${item.answer_count} answer${
        item.answer_count === 1 ? "" : "s"
      }${item.is_answered ? " · accepted" : ""}`,
      published_at: item.creation_date
        ? new Date(item.creation_date * 1000).toISOString()
        : null,
      thumbnail: null,
    }));
}

async function fetchStackExchange(topic, pool = "mixed") {
  const sites = SITE_POOLS[pool] || SITE_POOLS.mixed;

  const perSite = await Promise.all(
    sites.map((site) => searchSite(topic, site).catch(() => [])),
  );

  const scored = perSite
    .flat()
    .map((item) => ({
      ...item,
      relevance: relevanceScore(
        `${item.title} ${(item.tags || []).join(" ")}`,
        topic,
      ),
    }))
    // `q=` is an OR match, so a "string theory" search returns Java string
    // questions. Require every topic term before the vote count is even
    // considered.
    .filter((item) => item.relevance >= 1);

  return scored
    // Relevance first, votes only as the tie-break — sorting by votes alone
    // lets the busiest site win regardless of topic.
    .sort((a, b) => b.relevance - a.relevance || b.score - a.score)
    .slice(0, 5)
    .map(({ score, relevance, tags, ...item }) => ({
      ...item,
      signal: score || 0,
    }));
}

module.exports = { fetchStackExchange };
