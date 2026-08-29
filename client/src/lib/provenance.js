/* Why an item is worth your time — stated, not scored.
 *
 * The tempting version of this is a number: rate everything 0–100 and sort.
 * It doesn't survive contact with the data. A paper cited four thousand times,
 * a video with two million views and an accepted Stack Overflow answer are not
 * commensurable, and any single figure that claims they are has invented a
 * comparison rather than made one. Worse, a score hides its reasoning exactly
 * where the reasoning is the point.
 *
 * So: one badge, naming the strongest verifiable fact about the item. A
 * content farm can fake a headline; it cannot fake a DOI, a citation count or
 * a university domain.
 *
 * Costs nothing. Every field read here is already in the payload — this is a
 * re-reading of what the adapters return, not a new request.
 */

/* Institutional domains, by suffix rather than by list. A curated allow-list
   of universities would bias toward whoever happened to be on it; suffixes are
   granted, not chosen. */
const INSTITUTIONAL =
  /(^|\.)(edu|gov|mil|int)$|(^|\.)(ac|edu|gov)\.[a-z]{2}$|(^|\.)(nasa|noaa|nih|cern|esa)\.[a-z]+$/i;

/* Thresholds are deliberately high. A badge that most items earn is not a
   signal, it's decoration — these mark the exceptional, not the adequate. */
const HIGHLY_CITED = 500;
const WIDELY_USED = 5000;
const WELL_ANSWERED = 100;
const MUCH_DISCUSSED = 200;

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * The single strongest claim that can be made about an item, or null.
 *
 * Order matters: peer review outranks citation count, because one is a
 * judgement by people qualified to make it and the other is a popularity
 * measure that a wrong paper can also score well on.
 */
export function provenanceOf(item) {
  if (!item) return null;
  const host = hostOf(item.url);
  const n = typeof item.signal === "number" ? item.signal : 0;

  if (item.peer_reviewed === true) {
    return { label: item.venue || "Peer reviewed", tone: "reviewed" };
  }

  if (INSTITUTIONAL.test(host)) {
    return { label: "Institutional", tone: "institutional" };
  }

  if (item.source === "openalex" && n >= HIGHLY_CITED) {
    return { label: `${n.toLocaleString()} citations`, tone: "cited" };
  }

  if (item.source === "github" && n >= WIDELY_USED) {
    return { label: `${(n / 1000).toFixed(0)}k stars`, tone: "used" };
  }

  if (item.source === "stackexchange" && n >= WELL_ANSWERED) {
    return { label: `${n.toLocaleString()} votes`, tone: "answered" };
  }

  if (item.source === "hackernews" && n >= MUCH_DISCUSSED) {
    return { label: `${n.toLocaleString()} points`, tone: "discussed" };
  }

  /* A preprint is not a flaw — most of the strongest work in ML appears there
     first — but the reader is entitled to know which one they're looking at. */
  if (item.peer_reviewed === false) {
    return { label: "Preprint", tone: "preprint" };
  }

  return null;
}
