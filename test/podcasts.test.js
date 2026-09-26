const test = require("node:test");
const assert = require("node:assert/strict");
const { spotifyShow } = require("../sources/podcasts");

test("Spotify shows retain the playable destination, artwork, and episode count", () => {
  assert.deepEqual(spotifyShow({
    name: "Physics Today",
    publisher: "Physics Society",
    description: "Conversations about physics",
    total_episodes: 42,
    external_urls: { spotify: "https://open.spotify.com/show/physics-today" },
    images: [{ url: "https://i.scdn.co/image/cover", width: 640 }],
  }), {
    title: "Physics Today",
    author: "Physics Society",
    url: "https://open.spotify.com/show/physics-today",
    source: "spotify",
    type: "podcast",
    description: "Conversations about physics",
    snippet: "Conversations about physics",
    signal: 42,
    published_at: null,
    thumbnail: "https://i.scdn.co/image/cover",
  });
});

test("Spotify search results without a destination cannot become cards", () => {
  assert.equal(spotifyShow({ name: "Untitled", images: [] }), null);
});
