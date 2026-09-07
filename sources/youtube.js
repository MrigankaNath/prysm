
const { getJson } = require("./http");
const { isRelevant } = require("./relevance");

/* ISO-8601 durations, as YouTube returns them: PT4M13S. */
function seconds(iso) {
  const m = /^P(?:([\d.]+)D)?T?(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?$/.exec(
    String(iso || ""),
  );
  if (!m) return 0;
  const [, d, h, min, sec] = m.map((v) => (v ? Number(v) : 0));
  return d * 86400 + h * 3600 + min * 60 + sec;
}

/** Views and length for a batch of ids — one request, one unit, 50 at a time. */
async function videoStats(apiKey, ids) {
  const wanted = ids.filter(Boolean).slice(0, 50);
  if (wanted.length === 0) return {};

  try {
    const data = await getJson(
      "https://www.googleapis.com/youtube/v3/videos" +
        `?part=statistics,contentDetails&id=${wanted.join(",")}&key=${apiKey}`,
      { label: "YouTube API" },
    );
    return Object.fromEntries(
      (data.items || []).map((v) => [
        v.id,
        {
          views: Number(v.statistics?.viewCount) || 0,
          length: seconds(v.contentDetails?.duration),
        },
      ]),
    );
  } catch {
    /* Statistics are an enrichment, not a requirement — a video with no view
       count still belongs in the lane. */
    return {};
  }
}

/* The API returns titles and descriptions HTML-escaped, so "Doesn&#39;t Need"
 * arrives with the entity intact. React renders a text node literally, which
 * means the escape survives all the way to the card — it does not decode on
 * the way out, it just shows.
 */
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text) {
  return (text || "").replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    if (code[0] !== "#") return NAMED[code.toLowerCase()] ?? match;
    const point =
      code[1] === "x" || code[1] === "X"
        ? Number.parseInt(code.slice(2), 16)
        : Number(code.slice(1));
    return Number.isFinite(point) ? String.fromCodePoint(point) : match;
  });
}

async function fetchYoutube(topic) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(topic)}&key=${apiKey}`;
  const data = await getJson(url, { label: "YouTube API" });
  const items = data.items || [];

  /* A second call for statistics. `search` costs 100 units; `videos` costs 1,
     so this is a 1% increase on the topic for the only quality signal this
     lane has — without it a video is the one result type on the page with
     nothing to say for itself. Duration comes along free in the same call and
     drops Shorts, which are never the thing someone means by "a video about
     this". */
  const stats = await videoStats(apiKey, items.map((i) => i.id.videoId));

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
    /* Under a minute is a Short. Nobody looking for an explanation of a topic
       means one, and they crowd out the videos that are. Anything with no
       duration recorded is kept — absence of data isn't evidence. */
    .filter((item) => {
      const len = stats[item.id.videoId]?.length;
      return !len || len >= 60;
    })
    .slice(0, 5)
    .map((item) => ({
      title: decodeEntities(item.snippet.title),
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: "youtube",
      type: "video",
      snippet: decodeEntities(item.snippet.description),
      published_at: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url || null,
      signal: stats[item.id.videoId]?.views || 0,
      duration: stats[item.id.videoId]?.length || null,
    }));
}

module.exports = { fetchYoutube, decodeEntities };
