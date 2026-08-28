import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { topicColor, lighten } from "../lib/topicIcon";
import { IconBooks } from "./Icons";

/* Books are objects, so they get drawn as objects — and every one of them is
 * typeset rather than photographed.
 *
 * Open Library has a cover for maybe half of what it returns, and "a cover" is
 * doing a lot of work in that sentence: some are jackets, most are scans of a
 * title page, and a scanned title page is a sheet of cream paper with a
 * paragraph of 8pt type in the middle of it. At shelf size that is unreadable,
 * and next to a real jacket it looks broken. Designing all of them is the only
 * way the shelf is consistent, and it means the title and author are set at a
 * size you can actually read.
 */
function BookCard({ item, topic, category = "books" }) {
  const band = topicColor(item.title || "");

  /* Author and year come through as fields now; the joined snippet is the
     fallback for anything cached before that change shipped. */
  const author =
    item.author ||
    (item.snippet || "").replace(/\s*·\s*free to read$/, "").split(" · ")[0] ||
    "";

  return (
    <article
      className="book"
      style={{ "--band": band, "--band-lit": lighten(band, 0.45) }}
    >
      <a
        className="book-object"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordVisit(item, { topic, category })}
        aria-label={`${item.title}${author ? ` by ${author}` : ""}`}
      >
        {/* A slab, not a face: front and back boards half the spine's depth
            apart, with the block of pages bridging them at the fore edge.
            Rotating this about its own centre opens the book out; pivoting on
            the binding foreshortened the cover into itself and read as a
            squeeze rather than a turn. */}
        <span className="book-slab">
          <span className="book-front">
            {/* Cloth, then grain over it. Flat colour is what makes a drawn
                book look like a coloured rectangle. */}
            <span className="book-grain" aria-hidden="true" />
            {/* Light down the hinge, and the boards it runs between. */}
            <span className="book-binding" aria-hidden="true" />

            <span className="book-cover">
              <IconBooks className="book-mark" />
              <span className="book-cover-title">{item.title}</span>
              {author && <span className="book-cover-author">{author}</span>}
            </span>
          </span>

          {/* The cut pages, standing on edge between the two boards. */}
          <span className="book-pages" aria-hidden="true" />
          <span className="book-back" aria-hidden="true">
            <span className="book-grain" aria-hidden="true" />
          </span>
        </span>
      </a>

      {/* The cover carries the title, so this is only what the cover can't
          say: whether it's readable, and the control to keep it. */}
      <div className="book-meta">
        <span className="book-free">Free to read</span>
        {item.year && <span className="book-year">{item.year}</span>}
        <BookmarkButton item={item} topic={topic} category={category} />
      </div>
    </article>
  );
}

export default BookCard;
