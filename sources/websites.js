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

/* "Further reading" is half bibliography and half web resource: Stanford's
   "Introduction to Machine Learning" lives there, and so does "Annas, Julia
   (1994). Hellenistic Philosophy of Mind. University of California Press."
   Dropping the whole section to be rid of the books cost the good half —
   machine learning fell from three entries to one — so the *entry* is judged
   instead of the section. A book belongs in the books lane; a citation is what
   a book looks like here. */
/* An ISBN, or a page or volume reference. Nothing else.
 *
 * Two wider tests were tried and both took the best entries with them.
 * `class="citation"` excludes web resources, because Wikipedia wraps those in
 * cite templates too. `(eds.)` excludes reference works — an encyclopedia has
 * editors, so matching on it dropped the Stanford Encyclopedia of Philosophy
 * and the IEP, which are the two strongest results the stoicism lane has.
 * A book is identified by having an ISBN; that is the whole of it. */
const CITATION = /\bISBN\b|\bpp\.\s*\d|\bvol\.\s*\d/i;

/* Hosts that appear in these sections but are not somewhere to go and read:
   archive wrappers, and the authority-control block every article ends with
   (national library catalogue IDs, VIAF, Wikidata). */
const SKIP_HOST =
  /(web\.archive\.org|archive\.today|viaf\.org|isni\.org|d-nb\.info|id\.loc\.gov|bnf\.fr|ndl\.go\.jp|nkp\.cz|kopkatalogs\.lv|wikidata\.org|worldcat\.org|doi\.org|jstor\.org|ncbi\.nlm\.nih\.gov|snaccooperative\.org|idref\.fr|portal\.issn\.org|collections\.yale\.edu|nla\.gov\.au|sudoc\.fr|libris\.kb\.se|nukat\.edu\.pl|bibsys\.no|cerl\.org)/i;

/* Titles the authority block and archive links carry — a country name or the
   word "Archived" tells the reader nothing about where they are going. */
const SKIP_TITLE =
  /^(archived?|edit|isni|viaf|wikidata|japan|israel|france|germany|spain|italy|poland|latvia|korea|czech republic|united states|australia|netherlands|sweden|norway|catalonia|vatican|greece|belgium|portugal|romania|russia)$/i;

/* Wikipedia's own library-lookup templates. They sit in the External links
   section and look like entries, but they lead to a catalogue search rather
   than to a site about the topic. */
const SKIP_TEMPLATE =
  /^(online books|resources in your library|resources in other libraries|works by|works at|quotations related|media related|texts on wikisource|library resources)/i;

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

/* How much text around a link counts as its entry. Pairing <li> tags was tried
   and abandoned: a section's HTML carries the article's navboxes too — 712
   list items on "Stoicism" — and non-greedy pairing across those nested lists
   attached links to the wrong entry, which silently dropped the Stanford
   Encyclopedia and the IEP. A window needs no correct nesting to be right. */
const CONTEXT = 260;

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

  /* Each link is judged with the text around it — that is the only place the
     ISBN and editor marks that identify a book citation appear. */
  for (const match of html.matchAll(LINK)) {
    const [full, url, rawTitle] = match;

    /* Bounded by the entry's own list item where one is near enough, so an
       ISBN in the *next* bibliography line cannot disqualify this link — that
       is what kept dropping Stanford's "Introduction to Machine Learning",
       which sits directly above a book. The fixed window is the fallback for
       links that are not in a list at all. */
    const open = html.lastIndexOf("<li", match.index);
    const close = html.indexOf("</li>", match.index);
    const from =
      open >= 0 && match.index - open < CONTEXT * 4
        ? open
        : Math.max(0, match.index - CONTEXT);
    const to =
      close >= 0 && close - match.index < CONTEXT * 4
        ? close
        : match.index + full.length + CONTEXT;

    if (CITATION.test(html.slice(from, to))) continue;

    if (!url.startsWith("http") || SKIP_HOST.test(url)) continue;

    const name = cleanTitle(rawTitle);
    /* A bare number is a citation id that lost its label; too short is a
       fragment like "hub" or "here", which names nothing. */
    if (
      name.length < 8 ||
      SKIP_TITLE.test(name) ||
      SKIP_TEMPLATE.test(name) ||
      !/[a-z]{3}/i.test(name)
    ) {
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
    /* The site's own mark, which is as close to a preview as this lane can
       honestly get. Measured on the sites this lane actually returns: only one
       page in five carries an og:image (academic and museum sites are the
       least likely to), and the free screenshot renderers now answer 403. A
       favicon is served for every host and identifies the destination at a
       glance, which is what the preview was wanted for. */
    thumbnail: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.host)}&sz=64`,
  }));
}

module.exports = { fetchWebsites };
