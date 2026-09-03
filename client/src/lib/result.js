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

/* How long the thing takes, where that is a fact rather than a guess.
 *
 * Only two lanes know: YouTube returns a duration and iTunes an episode count.
 * Nothing else carries length — an article's snippet is clipped to 280 chars
 * regardless of whether the piece is 500 words or 5000, so a "7 min read" on
 * one would be invented. The slot collapses instead. */
export function effortOf(item, category) {
  if (category === "videos" && item.duration > 0) {
    return `${Math.max(1, Math.round(item.duration / 60))} min watch`;
  }
  if (category === "podcasts" && item.signal > 0) {
    return `${item.signal} episodes`;
  }
  return null;
}

export function publishedOn(item) {
  if (!item.published_at) return null;
  const date = new Date(item.published_at);
  return Number.isFinite(date.valueOf())
    ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
}

/* A different picture on every card that has no picture of its own.
 *
 * Seeded from the URL, so it is stable for an item across sessions and two
 * cards never collide by accident the way one gradient per category would. */
export function artFor(url) {
  const key = String(url || "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100003;
  }
  return {
    "--art-a": `${hash % 360}deg`,
    "--art-b": `${(hash * 7) % 360}deg`,
    "--art-x": `${30 + (hash % 40)}%`,
  };
}
