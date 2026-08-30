const { isRelevant } = require("./relevance");

/* Algolia's `query` is a loose match, and this was the one keyword source with
 * no gate on it at all — no relevance check, no floor, no cap. It showed.
 * "cosmos" returned Azure Cosmos DB, a hand-scanning keyboard generator and an
 * SMS browser, all of which are real threads and none of which are about the
 * universe. Multi-word topics were worse: the OR-match means "string theory"
 * matches any thread about strings.
 *
 * Two gates, for two different failures. Relevance drops what the search
 * should never have returned. The floor drops what is on topic but has no
 * discussion on it — this lane exists because people argued about something,
 * and a thread nobody replied to is not that.
 */
const MIN_POINTS = 25;

/* The same link is submitted to Hacker News more than once — a well-known
 * paper picks up a fresh submission every few years, and Algolia returns all
 * of them as separate hits. They are one resource behind one URL, so they
 * collapse to the best-attended submission: the URL is what the reader opens,
 * and the points are what this lane is ranked on.
 *
 * Left in, they cost the path two stops for one thing and broke the page: a
 * stop is identified by its URL, so two of them opened two popovers at once
 * and collided as React keys. Map.set on an existing key keeps the original
 * insertion position, so Algolia's relevance order survives this.
 */
function bestPerUrl(hits) {
  const best = new Map();

  for (const hit of hits) {
    const key = hit.url || `hn:${hit.objectID}`;
    const prev = best.get(key);
    if (!prev || (hit.points || 0) > (prev.points || 0)) best.set(key, hit);
  }

  return [...best.values()];
}

async function fetchHackerNews(topic) {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Hacker News API returned ${res.status}`);
  }

  const data = await res.json();

  return bestPerUrl(
    data.hits
      .filter((hit) => hit.title)
      .filter((hit) => isRelevant(hit.title, topic))
      .filter((hit) => (hit.points || 0) >= MIN_POINTS),
  )
    /* Algolia's own relevance order is kept rather than re-sorting by points:
       sorting a loose match by popularity is exactly what put `rust-lang/rust`
       fifth on GitHub. The path does its own ranking downstream. */
    .slice(0, 8)
    .map((hit) => ({
      title: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "hackernews",
      type: "discussion",
      signal: hit.points || 0,
      snippet: `${hit.points} points, ${hit.num_comments} comments`,
      published_at: hit.created_at,
      thumbnail: null,
    }));
}

module.exports = { fetchHackerNews };
