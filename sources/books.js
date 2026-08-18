// Only surfaces books that are free to read in full. Open Library's
// `ebook_access` has to be filtered inside `q` (the standalone query param is
// ignored), and we re-check it here so a silently-changed API can't leak
// borrow-only or print-disabled results through.
// Open Library's relevance ranking is loose on multi-word topics — a search for
// "machine learning" surfaces "The Time Machine". Keep a book only if its title
// carries every topic term, or a catalogued subject matches one; that drops the
// coincidental hits without discarding relevant books that lack subject data.
function isRelevant(doc, tokens, phrase) {
  if (tokens.length === 0) return true;

  const title = (doc.title || "").toLowerCase();
  if (tokens.every((token) => title.includes(token))) return true;

  // Match the whole phrase, not single tokens: "Time machines" is a subject on
  // The Time Machine and would otherwise sneak through a "machine" search.
  const subjects = (doc.subject || []).map((s) => s.toLowerCase());
  return subjects.some((subject) => subject.includes(phrase));
}

async function fetchBooks(topic) {
  const phrase = topic.toLowerCase().replace(/[-_]+/g, " ").trim();
  const tokens = phrase.split(/\s+/).filter((word) => word.length > 3);

  const query = `${topic} ebook_access:public`;
  const url =
    "https://openlibrary.org/search.json" +
    `?q=${encodeURIComponent(query)}` +
    "&limit=20" +
    "&fields=title,author_name,first_publish_year,ia,ebook_access,cover_i,subject";

  const res = await fetch(url, {
    headers: { "User-Agent": "Prysm/1.0 (https://prysm-black.vercel.app)" },
  });

  if (!res.ok) {
    throw new Error(`Open Library API returned ${res.status}`);
  }

  const data = await res.json();

  return (data.docs || [])
    .filter(
      (doc) =>
        doc.ebook_access === "public" &&
        doc.ia?.length &&
        isRelevant(doc, tokens, phrase),
    )
    .slice(0, 5)
    .map((doc) => ({
      title: doc.title,
      url: `https://archive.org/details/${doc.ia[0]}`,
      source: "books",
      type: "book",
      snippet: [
        doc.author_name?.[0],
        doc.first_publish_year ? `${doc.first_publish_year}` : null,
        "free to read",
      ]
        .filter(Boolean)
        .join(" · "),
      published_at: null,
      thumbnail: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null,
    }));
}

module.exports = { fetchBooks };
