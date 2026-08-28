/* Wikipedia writes the definition.
 *
 * It leads rather than backs up Tavily for one reason above the others: it can
 * be *cited*. The overview is the first thing anyone reads, and an unattributed
 * paragraph asks to be trusted where a linked encyclopaedia entry earns it.
 * Free, keyless and effectively unlimited, so it costs nothing to prefer.
 *
 * Tavily's `include_answer` stays as the fallback for topics Wikipedia has no
 * article on. It rides along on a search already being made, so it is free too
 * — this ordering saves no credits, it buys a source line.
 */

const REST = "https://en.wikipedia.org/api/rest_v1/page/summary";
const SEARCH = "https://en.wikipedia.org/w/api.php";

/* Wikipedia's own search, so a topic that isn't an exact article title still
   resolves — "quantum robotics" has no page, "Quantum robotics" phrasing does
   not either, but the search finds the nearest real article. */
async function bestTitle(topic) {
  const url =
    `${SEARCH}?action=query&list=search&format=json&origin=*` +
    `&srlimit=1&srsearch=${encodeURIComponent(topic)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;

  const data = await res.json();
  return data?.query?.search?.[0]?.title || null;
}

/* The page clamps the overview at three lines of display type, which is about
   240 characters. A second sentence is kept only when it fits inside that —
   otherwise the clamp cuts it mid-word and the "read more" reveals a sentence
   fragment rather than a thought. */
const ROOM = 240;

function trim(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const sentences = clean.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return clean.slice(0, ROOM);

  let out = sentences[0].trim();
  for (const next of sentences.slice(1, 3)) {
    if (out.length + next.length > ROOM) break;
    out += " " + next.trim();
  }
  return out;
}

async function fetchWikipediaOverview(topic) {
  const title = await bestTitle(topic);
  if (!title) return null;

  const res = await fetch(`${REST}/${encodeURIComponent(title)}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;

  const page = await res.json();
  /* A disambiguation page lists senses instead of defining anything, so its
     extract is a worse answer than none. */
  if (page.type === "disambiguation") return null;

  const snippet = trim(page.extract);
  if (snippet.length < 40) return null;

  return {
    title: `What is ${topic}?`,
    url: page.content_urls?.desktop?.page || null,
    source: "overview",
    type: "overview",
    snippet,
    published_at: null,
    thumbnail: null,
  };
}

module.exports = { fetchWikipediaOverview };
