const { XMLParser } = require("fast-xml-parser");
const { isRelevant } = require("./relevance");

const parser = new XMLParser();

async function fetchArxiv(topic) {
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(topic)}&start=0&max_results=5`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`arXiv API returned ${res.status}`);
  }

  const xml = await res.text();
  const data = parser.parse(xml);
  const entries = data.feed?.entry;
  const list = Array.isArray(entries) ? entries : entries ? [entries] : [];

  return list
    .map((entry) => ({
      title: String(entry.title || "").replace(/\s+/g, " ").trim(),
      url: entry.id,
      source: "arxiv",
      type: "paper",
      snippet: String(entry.summary || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 280),
      published_at: entry.published,
      thumbnail: null,
      /* Everything on arXiv is a preprint. Most of the good ones are peer
         reviewed eventually, but the copy linked here is the submitted one. */
      peer_reviewed: false,
      venue: "Preprint",
    }))
    /* `all:` is an OR match, so an out-of-scope topic comes back with noise
       rather than nothing: "french revolution" returned "A Cubic Surface of
       Revolution" and "Information Revolution". That is the same failure the
       Stack Exchange adapter has, and it matters twice over here, because
       profileTopic() reads the arXiv count as its signal for "is this topic
       technical" — five junk results classified a history topic as science. */
    .filter((item) => isRelevant(`${item.title} ${item.snippet}`, topic));
}

module.exports = { fetchArxiv };
