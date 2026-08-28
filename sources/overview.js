/* The overview is the answer half of the Tavily article search rather than a
 * search of its own. `include_answer` is free on any query, so the separate
 * "What is X?" call this replaces cost a full credit — a quarter of a topic's
 * budget — for one paragraph. See sources/tavily.js for the bundle.
 *
 * Tavily does not always answer, though: a niche topic can come back with an
 * empty `answer`, and the page then had nothing to open with. Wikipedia is the
 * free fallback for exactly that case. */
const { fetchTavilyOverview } = require("./tavily");
const { fetchWikipediaOverview } = require("./wikipedia");

async function fetchOverview(topic) {
  let answer = null;
  try {
    answer = await fetchTavilyOverview(topic);
  } catch (err) {
    // A dead or rate-limited Tavily shouldn't cost the page its definition.
    console.error(`overview: tavily failed for topic "${topic}"`, err);
  }

  if (answer?.snippet) return answer;
  return fetchWikipediaOverview(topic);
}

module.exports = { fetchOverview };
