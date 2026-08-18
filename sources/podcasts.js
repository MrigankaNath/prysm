async function fetchPodcasts(topic) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(topic)}&entity=podcast&limit=5`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`iTunes Search API returned ${res.status}`);
  }

  const data = await res.json();

  return (data.results || [])
    .filter((show) => show.collectionName && show.trackViewUrl)
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
