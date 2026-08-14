const { XMLParser } = require("fast-xml-parser");

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

  return list.map((entry) => ({
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
  }));
}

module.exports = { fetchArxiv };
