
const { getJson } = require("./http");
const { isRelevant } = require("./relevance");

let spotifyToken = null;
let spotifyTokenUntil = 0;

async function spotifyAccessToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (spotifyToken && Date.now() < spotifyTokenUntil) return spotifyToken;
  const credentials = Buffer.from(`${id}:${secret}`).toString("base64");
  const data = await getJson("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    label: "Spotify API",
  });
  spotifyToken = data.access_token;
  spotifyTokenUntil = Date.now() + Math.max(0, (data.expires_in || 3600) - 60) * 1000;
  return spotifyToken;
}

function spotifyShow(show) {
  const url = show.external_urls?.spotify;
  if (!show.name || !url) return null;
  const description = String(show.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return {
    title: show.name,
    author: show.publisher || null,
    url,
    source: "spotify",
    type: "podcast",
    description: description || null,
    snippet: description || null,
    signal: show.total_episodes || 0,
    published_at: null,
    thumbnail: show.images?.find((image) => image.width >= 300)?.url || show.images?.[0]?.url || null,
  };
}

async function fetchSpotifyPodcasts(topic) {
  const token = await spotifyAccessToken();
  if (!token) return [];
  const market = /^[A-Z]{2}$/.test(process.env.SPOTIFY_MARKET || "") ? process.env.SPOTIFY_MARKET : "US";
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(topic)}&type=show&market=${market}&limit=10`;
  const data = await getJson(url, { headers: { Authorization: `Bearer ${token}` }, label: "Spotify API" });
  return (data.shows?.items || [])
    .filter((show) => isRelevant(`${show.name || ""} ${show.publisher || ""} ${show.description || ""}`, topic))
    .map(spotifyShow)
    .filter(Boolean)
    .slice(0, 5);
}

async function fetchApplePodcasts(topic) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(topic)}&entity=podcast&limit=5`;
  const data = await getJson(url, { label: "iTunes Search API" });

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
      author: show.artistName || null,
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

async function fetchPodcasts(topic) {
  // Spotify leads when configured and returns relevant shows. Its development
  // quota is restrictive, so keep the keyless catalog as a graceful fallback.
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    try {
      const spotify = await fetchSpotifyPodcasts(topic);
      if (spotify.length) return spotify;
    } catch (error) {
      console.warn("Spotify podcast search unavailable:", error.message);
    }
  }
  return fetchApplePodcasts(topic);
}

module.exports = { fetchPodcasts, spotifyShow };
