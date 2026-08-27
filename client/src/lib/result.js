/** Shared by both result presentations — explore's rows and the feed's cards. */

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function formatSignal(item) {
  if (typeof item.signal !== "number" || item.signal <= 0) return null;
  const rounded =
    item.signal >= 1000 ? `${(item.signal / 1000).toFixed(1)}k` : item.signal;
  const labels = {
    github: "stars",
    hackernews: "points",
    stackexchange: "votes",
    podcasts: "episodes",
    openalex: "citations",
  };
  const label = labels[item.source];
  return label ? `${rounded} ${label}` : null;
}

/**
 * How a paper was published, as a chip.
 *
 * A preprint is not worse than a reviewed paper — most of the strongest work
 * in ML appears on arXiv first — but the reader is entitled to know which one
 * they are looking at. Papers whose status the index doesn't record get no
 * chip rather than a guess.
 */
export function venueChip(item) {
  if (item.peer_reviewed === true) {
    return { label: item.venue || "Peer reviewed", reviewed: true };
  }
  if (item.peer_reviewed === false) {
    return { label: item.venue || "Preprint", reviewed: false };
  }
  return null;
}
