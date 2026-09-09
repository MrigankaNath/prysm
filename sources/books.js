
const { getJson } = require("./http");

/* The lane is the best books on a topic, not the free ones.
 *
 * It used to be filtered to `ebook_access:public`, which sounds like a
 * generous default and is actually a severe one: public-domain scans are
 * roughly the pre-1929 shelf, so the filter was choosing from about five per
 * cent of what exists. Measured on "machine learning", everything a person
 * would actually recommend was excluded by it — Géron's Hands-On ML (532
 * readers), Mueller's Introduction (131), Murphy (81), Chip Huyen's Designing
 * ML Systems (58) — because none of them are free. The lane wasn't picking bad
 * books; it was picking from a shelf that had none of the good ones on it.
 *
 * So every book is admitted and each says what it is: read it free, borrow it,
 * or buy it. `readinglog_count` — how many people have shelved it — is the
 * ranking signal, and it is dense where Open Library's ratings are sparse. */
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

  /* Every token, not any one of them — the same OR-match that put Java string
     questions under "string theory" and "A Cubic Surface of Revolution" under
     "french revolution".
     It was survivable while the lane was ordered by Open Library's relevance
     and filtered to free scans. Ranked by how many people have read something,
     it stops being survivable: "The Time Machine" carries the subject
     "machine" and 1,917 readers, so on "machine learning" it does not merely
     appear, it leads. Tokens may match across different subjects — a book
     tagged "machine" and "learning" separately is still about both. */
  if (subjects.some((subject) => subject.includes(phrase))) return true;

  return tokens.every((token) =>
    subjects.some((subject) => subject.includes(token)),
  );
}

/* What a reader can actually do with it. `ebook_access` is Open Library's own
   field: `public` is a full scan, `borrowable` is a lending copy, and
   `printdisabled`/`no_ebook` mean the text is not online at all. */
function accessOf(doc) {
  if (doc.ebook_access === "public" && doc.ia?.length) return "free";
  if (doc.ebook_access === "borrowable" && doc.ia?.length) return "borrow";
  return "buy";
}

const ACCESS_LABEL = { free: "free to read", borrow: "borrowable", buy: "in print" };

/* Where to send someone who has to buy it.
 *
 * This used to build `amazon.com/dp/<isbn10>` on the rule that an ISBN-10
 * doubles as an ASIN. It does — but only for the edition Amazon actually
 * stocks, and Open Library's `isbn` array spans every edition ever catalogued,
 * so the first ISBN-10 is usually one Amazon has never carried. Measured
 * across three topics, **six of nineteen book links 404ed and every single
 * failure was one of these**; on "machine learning" four of eight were dead,
 * including Géron, which is the best-known book on the subject.
 *
 * The work's own Open Library page always resolves — it is the record this
 * result was built from — and it carries the buy links for the editions that
 * do exist, chosen by someone who can see which those are. That is a better
 * answer than guessing, and it is the only one that cannot 404. */
function buyUrl(doc) {
  if (doc.key) return `https://openlibrary.org${doc.key}`;

  const isbn = (doc.isbn || [])[0];
  return isbn ? `https://openlibrary.org/isbn/${isbn}` : null;
}

/* Where the title goes: the scan if there is one to read or borrow, a shop if
   there isn't. A book with neither is dropped — there is nowhere to send
   anyone. */
function urlFor(doc) {
  const access = accessOf(doc);
  if (access !== "buy") return `https://archive.org/details/${doc.ia[0]}`;
  return buyUrl(doc);
}

async function fetchBooks(topic) {
  const phrase = topic.toLowerCase().replace(/[-_]+/g, " ").trim();
  const tokens = phrase.split(/\s+/).filter((word) => word.length > 3);

  const url =
    "https://openlibrary.org/search.json" +
    `?q=${encodeURIComponent(topic)}` +
    "&limit=40" +
    "&fields=title,author_name,first_publish_year,ia,ebook_access,cover_i," +
    "subject,ratings_average,ratings_count,readinglog_count,isbn,key";

  const data = await getJson(url, { label: "Open Library API" });


  return (data.docs || [])
    .filter((doc) => doc.title && isRelevant(doc, tokens, phrase))
    .map((doc) => ({ doc, access: accessOf(doc), url: urlFor(doc) }))
    .filter((entry) => entry.url)
    /* Readers first, rating second. A rating is an average over a handful of
       votes here — Open Library's ratings are thin — while the reading log is
       dense and is the closer measure of "the book people on this subject
       actually end up with". */
    .sort(
      (a, b) =>
        (b.doc.readinglog_count || 0) - (a.doc.readinglog_count || 0) ||
        (b.doc.ratings_average || 0) - (a.doc.ratings_average || 0),
    )
    .slice(0, 8)
    .map(({ doc, access, url }) => ({
      title: doc.title,
      url,
      source: "books",
      type: "book",
      access,
      snippet: [
        doc.author_name?.[0],
        doc.first_publish_year ? `${doc.first_publish_year}` : null,
        ACCESS_LABEL[access],
      ]
        .filter(Boolean)
        .join(" · "),
      published_at: null,
      /* Structured as well as joined into the snippet: the books lane sets a
         typographic cover when Open Library has no image, and that needs the
         author and year separately rather than parsed back out of a string. */
      author: doc.author_name?.[0] || null,
      year: doc.first_publish_year || null,
      // How many people have this on a shelf. Ranks the lane, and badges it.
      signal: doc.readinglog_count || 0,
      /* -L, not -M. When the lane was free scans only, the artwork was mostly
         photographs of a title page and not worth the bytes; opening it to
         every book changed that — measured across four topics, 19 of 20
         results carry a cover and at -L they are real jackets, 330x500 or so
         for 11-59 kB. That is small enough to ship and large enough to draw
         at shelf size without softening.

         ?default=false matters: without it Open Library serves a blank 1px
         image for a cover it doesn't have, instead of a 404. The <img> then
         "loads" successfully and onError never fires, so the board came up
         empty rather than falling back to a typeset cover. */
      thumbnail: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`
        : null,
    }));
}

module.exports = { fetchBooks, isRelevant, accessOf, urlFor };
