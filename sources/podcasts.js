const { isRelevant } = require("./relevance");

async function fetchPodcasts(topic) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(topic)}&entity=podcast&limit=5`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`iTunes Search API returned ${res.status}`);
  }

  const data = await res.json();

  return (data.results || [])
    .filter((show) => show.collectionName && show.trackViewUrl)
    /* iTunes always returns something. Its `term=` is a loose match against
       show titles, so a topic with no podcast about it comes back with five
       unrelated shows rather than none — measured: "bernoulli's theorem"
       returned Nashville Vineyard Podcast, The Eternal Debate and Calling All
       Beings, and not one of the five mentioned Bernoulli.
       Shows are matched at show level, so a specific topic legitimately
       empties this lane. That is the right answer: no podcast about a subject
       is a fact, and five wrong ones is a lie. */
    .filter((show) =>
      isRelevant(
        `${show.collectionName} ${show.artistName || ""} ${show.primaryGenreName || ""}`,
        topic,
      ),
    )
    .map((show) => ({
      title: show.collectionName,
      url: show.trackViewUrl,
      source: "podcasts",
      type: "podcast",
      snippet: [
        show.artistName,
        show.primaryGenreName,
        show.trackCount ? `${show.trackCount} episodes` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      signal: show.trackCount || 0,
      published_at: show.releaseDate || null,
      thumbnail: show.artworkUrl600 || show.artworkUrl100 || null,
    }));
}

module.exports = { fetchPodcasts };
