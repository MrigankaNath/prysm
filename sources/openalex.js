/* OpenAlex — the general-purpose half of the papers lane.
 *
 * arXiv indexes physics, maths, CS, quantitative biology/finance, statistics
 * and economics, and nothing else. For medicine, wet-lab biology, chemistry,
 * psychology, history or literature it returns nothing at all, which left the
 * whole category empty on any topic outside its subject list.
 *
 * OpenAlex covers ~250M works across every discipline, is free and keyless,
 * and carries two things arXiv's Atom feed does not: a citation count, and
 * enough publication metadata to say whether a paper was peer reviewed. Both
 * are what the reader needs to judge a preprint.
 *
 * Rate limit is 100k requests/day. This runs once per topic per 14 days.
 */

const ENDPOINT = "https://api.openalex.org/works";

/* Only top-level fields; OpenAlex's `select` doesn't take nested paths. Cuts
   the response from ~200kB to a few kB. */
const FIELDS = [
  "id",
  "doi",
  "display_name",
  "publication_date",
  "type",
  "cited_by_count",
  "is_retracted",
  "is_paratext",
  "abstract_inverted_index",
  "primary_location",
  "best_oa_location",
].join(",");

/* OpenAlex ships abstracts as an inverted index — {word: [positions]} — rather
   than plain text, because the index is a fact about the abstract and not a
   reproduction of it. Rebuilding it is the documented way to read one. */
function abstractFrom(inverted) {
  if (!inverted || typeof inverted !== "object") return "";

  const words = [];
  for (const [word, positions] of Object.entries(inverted)) {
    if (!Array.isArray(positions)) continue;
    for (const at of positions) words[at] = word;
  }

  return words.join(" ").replace(/\s+/g, " ").trim();
}

/* Repositories (arXiv, bioRxiv, SSRN) host preprints; journals and conference
   proceedings imply review. `submittedVersion` is the author's manuscript
   before review, whatever it is hosted on. Anything that fits neither is left
   unlabelled rather than guessed at. */
function reviewStatus(work) {
  const location = work.primary_location || {};
  const source = location.source || {};

  if (
    work.type === "preprint" ||
    source.type === "repository" ||
    location.version === "submittedVersion"
  ) {
    return { peerReviewed: false, venue: "Preprint" };
  }

  if (source.type === "journal" || source.type === "conference") {
    return { peerReviewed: true, venue: source.display_name || "Peer reviewed" };
  }

  return { peerReviewed: null, venue: null };
}

/* Prefer a copy the reader can actually open. Same principle as the books
   adapter, which only returns free-to-read titles — a paywalled landing page
   is a dead end. */
function bestUrl(work) {
  return (
    work.best_oa_location?.landing_page_url ||
    work.primary_location?.landing_page_url ||
    work.doi ||
    work.id
  );
}

async function fetchOpenAlex(topic) {
  const url =
    `${ENDPOINT}?search=${encodeURIComponent(topic)}` +
    `&per-page=8&sort=relevance_score:desc&select=${FIELDS}`;

  /* A slow scholarly index shouldn't hold up the page. Papers is a phase-one
     probe, so everything downstream waits on it. */
  const res = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`OpenAlex API returned ${res.status}`);
  }

  const data = await res.json();
  const works = Array.isArray(data?.results) ? data.results : [];

  return works
    /* is_paratext covers front matter, editorial boards and issue covers —
       records that are indexed as works but are not papers. */
    .filter((w) => w?.display_name && !w.is_retracted && !w.is_paratext)
    .map((work) => {
      const { peerReviewed, venue } = reviewStatus(work);

      return {
        title: String(work.display_name).replace(/\s+/g, " ").trim(),
        url: bestUrl(work),
        source: "openalex",
        type: "paper",
        snippet: abstractFrom(work.abstract_inverted_index).slice(0, 280),
        published_at: work.publication_date || null,
        thumbnail: null,
        signal: Number(work.cited_by_count) || 0,
        peer_reviewed: peerReviewed,
        venue,
      };
    });
}

module.exports = { fetchOpenAlex };
