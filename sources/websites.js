/* The best sites on the web for a topic, chosen by people.
 *
 * Every other lane is algorithmic — a search API ranking pages by relevance,
 * which answers "is this about the topic" and says nothing about whether it is
 * any good. This lane is the one piece of human curation in the app:
 * Wikipedia's "External links" and "Further reading" sections are maintained
 * by editors, and what they list is overwhelmingly institutional. Measured:
 * stoicism returns the Stanford Encyclopedia of Philosophy, the Internet
 * Encyclopedia of Philosophy and Britannica; sculpture returns the V&A, the
 * Corning Museum of Glass and the Cass Sculpture Foundation; machine learning
 * returns Stanford's introduction and JMLR.
 *
 * It has to be the *sections*, not the article's links. `prop=extlinks`
 * returns every URL in the page — 151 of them on "Telescope", nearly all
 * citations — where the two curated sections hold a handful that were chosen.
 *
 * Free and keyless, like the overview it sits beside.
 */

const API = "https://en.wikipedia.org/w/api.php";

/* Wikipedia blocks the default user agent of most HTTP clients outright — it
   answered 403 until this was set. Their policy asks for something
   identifying. */
const UA = "Prysm/1.0 (https://github.com/MrigankaNath/prysm)";

const CURATED_SECTIONS = new Set(["external links", "further reading"]);

/* Hosts that appear in these sections but are not somewhere to go and read:
   archive wrappers, and the authority-control block every article ends with
   (national library catalogue IDs, VIAF, Wikidata). */
const SKIP_HOST =
  /(web\.archive\.org|archive\.today|viaf\.org|isni\.org|d-nb\.info|id\.loc\.gov|bnf\.fr|ndl\.go\.jp|nkp\.cz|kopkatalogs\.lv|wikidata\.org|worldcat\.org|doi\.org|jstor\.org|ncbi\.nlm\.nih\.gov|snaccooperative\.org|idref\.fr|portal\.issn\.org|collections\.yale\.edu|nla\.gov\.au|sudoc\.fr|libris\.kb\.se|nukat\.edu\.pl|bibsys\.no|cerl\.org)/i;

/* Titles the authority block and archive links carry — a country name or the
   word "Archived" tells the reader nothing about where they are going. */
const SKIP_TITLE =
  /^(archived?|edit|isni|viaf|wikidata|japan|israel|france|germany|spain|italy|poland|latvia|korea|czech republic|united states|australia|netherlands|sweden|norway|catalonia|vatican|greece|belgium|portugal|romania|russia)$/i;

async function wiki(params) {
  const url = `${API}?${new URLSearchParams({
    format: "json",
    formatversion: "2",
    origin: "*",
    ...params,
  })}`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Wikipedia returned ${res.status}`);
  return res.json();
}

/* The topic is rarely an exact article title, so it is resolved the same way
   the overview resolves it. */
async function bestTitle(topic) {
  const data = await wiki({
    action: "query",
    list: "search",
    srlimit: "1",
    srsearch: topic,
  });
  return data?.query?.search?.[0]?.title || null;
}

/* Wikipedia's external anchors are marked up consistently enough to read with
   a pattern; pulling in a DOM parser for two sections of one page would cost
   more than it settles. */
const LINK = /<a rel="nofollow" class="external text" href="([^"]+)"[^>]*>([^<]{2,160})<\/a>/g;

/* These are citation-style entries, so a title routinely arrives quoted and
   with a trailing description — `"The First Telescopes". Part of an exhibit…`.
   Stripping only the outer quotes left the inner one stranded mid-title, so
   quotes go entirely and the label is cut at the first sentence. */
function cleanTitle(raw) {
  const flat = String(raw)
    .replace(/&amp;/g, "&")
    .replace(/&quot;|["'“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const sentence = flat.split(/\.\s+/)[0];
  const short = sentence.length >= 8 ? sentence : flat;
  return short.length > 90 ? `${short.slice(0, 88).trimEnd()}…` : short;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function linksIn(title, index) {
  const data = await wiki({
    action: "parse",
    page: title,
    section: String(index),
    prop: "text",
  });

  const html = data?.parse?.text || "";
  const out = [];

  for (const [, url, rawTitle] of html.matchAll(LINK)) {
    if (!url.startsWith("http") || SKIP_HOST.test(url)) continue;

    const name = cleanTitle(rawTitle);
    /* A bare number is a citation id that lost its label; too short is a
       fragment like "hub" or "here", which names nothing. */
    if (name.length < 8 || SKIP_TITLE.test(name) || !/[a-z]{3}/i.test(name)) {
      continue;
    }

    const host = hostOf(url);
    if (!host) continue;

    out.push({ title: name, url, host });
  }

  return out;
}

async function fetchWebsites(topic) {
  const title = await bestTitle(topic);
  if (!title) return [];

  const sections = await wiki({ action: "parse", page: title, prop: "sections" });
  const wanted = (sections?.parse?.sections || [])
    .filter((s) => CURATED_SECTIONS.has(String(s.line || "").toLowerCase()))
    .map((s) => s.index);

  if (wanted.length === 0) return [];

  const found = [];
  for (const index of wanted) {
    try {
      found.push(...(await linksIn(title, index)));
    } catch {
      /* one missing section shouldn't empty the lane */
    }
  }

  /* One entry per domain. These sections often list several pages of the same
     institution, and this lane is a list of places to go, not pages. */
  const seen = new Set();
  const unique = [];
  for (const item of found) {
    if (seen.has(item.host)) continue;
    seen.add(item.host);
    unique.push(item);
  }

  return unique.slice(0, 8).map((item) => ({
    title: item.title,
    url: item.url,
    source: "wikipedia",
    type: "website",
    /* No snippet. These sections carry a link and a name, not a description,
       and the host is already printed in the card's footer — filling this with
       it just printed the domain twice on every card. */
    snippet: null,
    published_at: null,
    thumbnail: null,
  }));
}

module.exports = { fetchWebsites };
