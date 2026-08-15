async function fetchWikipedia(topic) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srprop=snippet|timestamp&srsearch=${encodeURIComponent(topic)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Prysm/1.0 (https://prysm-black.vercel.app)" },
  });

  if (!res.ok) {
    throw new Error(`Wikipedia API returned ${res.status}`);
  }

  const data = await res.json();
  const hit = data.query?.search?.[0];

  if (!hit) return null;

  return {
    title: hit.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`,
    source: "wikipedia",
    type: "reference",
    snippet: hit.snippet.replace(/<[^>]+>/g, ""),
    published_at: hit.timestamp,
    thumbnail: null,
  };
}

module.exports = { fetchWikipedia };
