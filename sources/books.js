// Only surfaces books that are free to read in full. Open Library's
// `ebook_access` has to be filtered inside `q` (the standalone query param is
// ignored), and we re-check it here so a silently-changed API can't leak
// borrow-only or print-disabled results through.
// Open Library's relevance ranking is loose on multi-word topics — a search for
// "machine learning" surfaces "The Time Machine". Keep a book only if its title
// carries every topic term, or a catalogued subject matches one; that drops the
// coincidental hits without discarding relevant books that lack subject data.
/* Subjects decide it, and the title only gets a vote when there are none.
 *
 * A title match on its own is not evidence — "typescript" is also the archival
 * word for a typed manuscript, so a search for the language returned E. E.
 * Cummings' The Enormous Room, a Mormon journal from 1841 and a typescript
 * copy of Henry the Second, all five of five with the word in the title and
 * none of them about programming.
 *
 * Catalogued subjects separate them cleanly: the false positives carry
 * "Ambulance drivers", "Manuscript preparation" and "Mormon Church", while the
 * one real result carries "TypeScript (Computer program language)". So when a
 * book has subjects, they have to agree with the topic. Plenty of scanned
 * books have none catalogued at all, and those still fall back to a strict
 * title match rather than being dropped for a gap in the metadata. */
function isRelevant(doc, tokens, phrase) {
  if (tokens.length === 0) return true;

  const subjects = (doc.subject || []).map((s) => s.toLowerCase());
  const title = (doc.title || "").toLowerCase();

  /* Subjects required, with no title fallback. A book with nothing catalogued
     cannot be verified as being about the topic, and "unverifiable" and
     "relevant" are not the same claim — measured on "typescript", the fallback
     was the only thing still letting a 1799 manuscript copy through. It costs
     real results on thinly catalogued scans (stoicism drops from five to one)
     and that is the right trade: one book actually about the subject beats
     five where you have to work out which. */
  void title;
  return subjects.some(
    (subject) =>
      subject.includes(phrase) || tokens.some((t) => subject.includes(t)),
  );
}

async function fetchBooks(topic) {
  const phrase = topic.toLowerCase().replace(/[-_]+/g, " ").trim();
  const tokens = phrase.split(/\s+/).filter((word) => word.length > 3);

  const query = `${topic} ebook_access:public`;
  const url =
    "https://openlibrary.org/search.json" +
    `?q=${encodeURIComponent(query)}` +
    "&limit=40" +
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
      /* Structured as well as joined into the snippet: the books lane sets a
         typographic cover when Open Library has no image, and that needs the
         author and year separately rather than parsed back out of a string. */
      author: doc.author_name?.[0] || null,
      year: doc.first_publish_year || null,
      /* ?default=false matters: without it Open Library serves a blank 1px
         image for a cover it doesn't have, instead of a 404. The <img> then
         "loads" successfully and onError never fires, so the board came up
         empty rather than falling back to a typeset cover. */
      thumbnail: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg?default=false`
        : null,
    }));
}

module.exports = { fetchBooks };
