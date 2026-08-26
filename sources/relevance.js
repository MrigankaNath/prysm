/* Shared relevance check for keyword-search sources.
 *
 * Several source APIs do loose keyword matching: Stack Exchange's `q=` treats
 * "string theory" as "string" OR "theory", which is why a physics search
 * returns Java string questions with high vote counts. Sorting the merged
 * results by score then puts the *least* relevant ones on top, because the
 * off-topic sites are simply busier.
 *
 * So: drop results that don't actually mention the topic, and rank by how well
 * they match before falling back to the source's own score.
 */

// Words too common to carry meaning in a topic query.
const STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "or", "in", "on", "for", "to", "with",
  "what", "how", "why", "is", "are", "de", "la",
]);

/** The words a result has to match to count as on-topic. */
function topicTerms(topic) {
  return String(topic || "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/** Whole-word match, so "string" doesn't match "strings" only by luck and
 *  doesn't match "strlen" at all. Plurals are handled explicitly. */
function hasTerm(haystack, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}(?:s|es)?\\b`, "i").test(haystack);
}

/**
 * How many of the topic's terms appear in `text`, 0..1.
 * A multi-word topic matching the exact phrase scores 1 regardless.
 */
function relevanceScore(text, topic) {
  const haystack = String(text || "");
  const phrase = String(topic || "").trim();
  if (!phrase) return 1;

  if (phrase.includes(" ") && new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(haystack)) {
    return 1;
  }

  const terms = topicTerms(phrase);
  if (terms.length === 0) return 1;

  const hits = terms.filter((term) => hasTerm(haystack, term)).length;
  return hits / terms.length;
}

/**
 * Multi-word topics must match every term — that is what separates "string
 * theory" from "query string". Single-word topics must match that word.
 */
function isRelevant(text, topic, threshold = 1) {
  return relevanceScore(text, topic) >= threshold;
}

module.exports = { topicTerms, relevanceScore, isRelevant };
