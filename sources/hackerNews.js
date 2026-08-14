async function fetchHackerNews(topic) {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Hacker News API returned ${res.status}`);
  }

  const data = await res.json();

  return data.hits
    .filter((hit) => hit.title)
    .map((hit) => ({
      title: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "hackernews",
      type: "discussion",
      snippet: `${hit.points} points, ${hit.num_comments} comments`,
      published_at: hit.created_at,
      thumbnail: null,
    }));
}

module.exports = { fetchHackerNews };
