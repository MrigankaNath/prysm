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
  };
  const label = labels[item.source];
  return label ? `${rounded} ${label}` : null;
}
