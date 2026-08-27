/* The overview is the answer half of the Tavily article search rather than a
 * search of its own. `include_answer` is free on any query, so the separate
 * "What is X?" call this replaces cost a full credit — a quarter of a topic's
 * budget — for one paragraph. See sources/tavily.js for the bundle. */
const { fetchTavilyOverview } = require("./tavily");

async function fetchOverview(topic) {
  return fetchTavilyOverview(topic);
}

module.exports = { fetchOverview };
