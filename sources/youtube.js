const { isRelevant } = require("./relevance");

async function fetchYoutube(topic) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(topic)}&key=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`YouTube API returned ${res.status}`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items
    /* YouTube's relevance is good but not tight: measured, three to five of
       five were on topic depending on the query. Ten are requested and the
       drift is dropped, rather than showing five and hoping. */
    .filter((item) =>
      isRelevant(
        `${item.snippet.title} ${item.snippet.description || ""}`,
        topic,
      ),
    )
    .slice(0, 5)
    .map((item) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: "youtube",
      type: "video",
      snippet: item.snippet.description,
      published_at: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url || null,
    }));
}

module.exports = { fetchYoutube };
