// Stack Exchange has no cross-site search — `site` is required — so we fan out
// across a spread of sites and merge by score. This is what makes Q&A useful
// for non-technical topics, where Hacker News has nothing to say.
const SITES = [
  "stackoverflow",
  "philosophy",
  "history",
  "physics",
  "literature",
  "economics",
];

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

async function fetchStackExchange(topic) {
  const perSite = await Promise.all(
    SITES.map((site) => searchSite(topic, site).catch(() => [])),
  );

  return perSite
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, ...item }) => item);
}

module.exports = { fetchStackExchange };
