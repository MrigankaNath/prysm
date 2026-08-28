/* The definition, and where it came from.
 *
 * Wikipedia leads. It is free and keyless, so preferring it costs nothing, and
 * unlike a synthesised answer it can be *cited* — the overview is the first
 * thing anyone reads, and a linked encyclopaedia entry earns trust where an
 * unattributed paragraph only asks for it.
 *
 * Tavily's answer is the fallback, for topics Wikipedia has no article on. It
 * is the `include_answer` of a search already being made (sources/tavily.js),
 * so it is free as well — this ordering buys a source line, not credits.
 */
const { fetchTavilyOverview } = require("./tavily");
const { fetchWikipediaOverview } = require("./wikipedia");

async function fetchOverview(topic) {
  try {
    const wiki = await fetchWikipediaOverview(topic);
    if (wiki?.snippet) return wiki;
  } catch (err) {
    console.error(`overview: wikipedia failed for topic "${topic}"`, err);
  }

  try {
    return await fetchTavilyOverview(topic);
  } catch (err) {
    console.error(`overview: tavily failed for topic "${topic}"`, err);
    return null;
  }
}

module.exports = { fetchOverview };
