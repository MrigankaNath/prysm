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
 * The badge is a *category*, never a number. "1,827 points" is not information
 * at a glance — the reader has no idea whether that is a lot, and the answer
 * differs by source and by community. "Much discussed" is the claim the number
 * was standing in for, and it means the same thing everywhere. Counts still
 * appear in the meta line, where a number is what you actually want.
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
const WELL_ANSWERED = 60;
const MUCH_DISCUSSED = 200;
const MUCH_WATCHED = 100000;
/* A show that has run this long has been doing it for years. Episode count is
   the only durable fact iTunes gives, and longevity is the honest reading of
   it — not quality, but not nothing either. */
const LONG_RUNNING = 100;

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
    return { label: "Widely cited", tone: "cited" };
  }

  if (item.source === "github" && n >= WIDELY_USED) {
    return { label: "Widely used", tone: "used" };
  }

  /* Ranked above the vote thresholds on purpose: acceptance is a judgement by
     the person who asked, which is a stronger claim than a count — and unlike
     a count it means the same thing on every Stack Exchange site. */
  if (item.source === "stackexchange" && item.accepted) {
    return { label: "Accepted answer", tone: "reviewed" };
  }

  if (item.source === "stackexchange" && n >= WELL_ANSWERED) {
    return { label: "Well answered", tone: "answered" };
  }

  if (item.source === "hackernews" && n >= MUCH_DISCUSSED) {
    return { label: "Much discussed", tone: "discussed" };
  }

  if (item.source === "youtube" && n >= MUCH_WATCHED) {
    return { label: "Widely watched", tone: "watched" };
  }

  if (item.source === "podcasts" && n >= LONG_RUNNING) {
    return { label: "Long running", tone: "running" };
  }

  /* Every book in this lane is readable in full, for free, right now — Open
     Library is filtered to `ebook_access:public` and the adapter re-checks it.
     Universal within the lane, but a strong claim about a book in general:
     most of them you cannot open. */
  if (item.category === "books" || item.source === "openlibrary") {
    return { label: "Full text", tone: "free" };
  }

  /* A preprint is not a flaw — most of the strongest work in ML appears there
     first — but the reader is entitled to know which one they're looking at. */
  if (item.peer_reviewed === false) {
    return { label: "Preprint", tone: "preprint" };
  }

  /* No badge is a meaningful state, not a gap. It says the item is relevant
     and nothing stronger can be verified about it — which is the honest thing
     to say about most of the open web, and the reason the badges elsewhere
     mean anything. */
  return null;
}
