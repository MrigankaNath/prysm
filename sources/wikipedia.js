/* Wikipedia's one-line definition — the free safety net under the overview.
 *
 * Tavily writes the better primer when it answers, but it does not always
 * answer: a niche topic can come back with an empty `answer`, and a user out
 * of quota never gets to ask. Both cases used to fall through to whatever
 * snippet was longest, which meant a research paper's abstract set at display
 * scale — text that opens mid-argument ("...are described, and their study
 * justified") and reads as gibberish where a definition should be.
 *
 * This is free, keyless and effectively unlimited, so it can run in either
 * case. It is deliberately only the *fallback*: the REST summary is an
 * encyclopaedia opening, which is accurate but drier than the primer Tavily
 * writes, and preferring it wholesale would undo a decision made earlier.
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

/** Two sentences at most, to match what the page has room to show. */
function trim(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const sentences = clean.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return clean.slice(0, 300);
  return sentences.slice(0, 2).join(" ").trim();
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
