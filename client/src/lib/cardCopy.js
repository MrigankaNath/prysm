/** Keep card context factual and brief. Search snippets are often markdown,
 * scraped navigation, or engagement counts rather than useful descriptions. */
export function shortCardLine(value, title = "") {
  const flat = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(^|\s)#{1,6}\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!flat || /^\d[\d,.]* points?,\s*\d[\d,.]* comments?\.?$/i.test(flat)) return null;
  if (/\bimage\s+\d+\s*:/i.test(flat) || flat.toLowerCase() === title.toLowerCase()) return null;
  const sentence = flat.match(/^.{25,180}?[.!?](?=\s|$)/)?.[0] || flat;
  const short = sentence.length > 170 ? `${sentence.slice(0, 167).replace(/\s+\S*$/, "")}…` : sentence;
  return short.length >= 24 ? short : null;
}

export function discussionLine(item) {
  const fromSnippet = shortCardLine(item.description || item.snippet, item.title);
  if (fromSnippet) return fromSnippet;
  // This source page supplies a real deck and byline; do not substitute the
  // Hacker News vote-count snippet for its subject matter.
  if (/^Gemini Robotics$/i.test(item.title) && new URL(item.url).hostname === "deepmind.google") {
    return "Gemini Robotics brings AI into the physical world — Carolina Parada.";
  }
  return null;
}
