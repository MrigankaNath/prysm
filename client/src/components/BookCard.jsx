import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { topicColor, lighten } from "../lib/topicIcon";
import { IconPrism } from "./Icons";

/* Books are objects, so they get drawn as objects — and every one is typeset
 * rather than photographed.
 *
 * Open Library has an image for maybe half of what it returns, and most of
 * those are scans of a title page: a sheet of cream paper with a paragraph of
 * 8pt type in the middle of it. At shelf size that is unreadable, and beside a
 * real jacket it looks broken. Designing all of them is the only way the shelf
 * is consistent, and it puts the title and author at a size you can read.
 *
 * The board is a banded cover — a panel of the topic's colour over a dark
 * plate that carries the type — and everything on it is sized in container
 * units, so the whole cover scales as one object at any shelf width rather
 * than needing a breakpoint per size.
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
        {/* The front board is the reference plane and the depth runs behind
            it, so the book opens away from the reader rather than swinging
            through them. */}
        <span className="book-slab">
          <span className="book-front">
            <span className="book-stripe" aria-hidden="true">
              <span className="book-bind" />
            </span>

            <span className="book-plate">
              <span className="book-bind is-soft" aria-hidden="true" />
              <span className="book-cover">
                <span className="book-cover-text">
                  <span className="book-cover-title">{item.title}</span>
                  {author && (
                    <span className="book-cover-author">{author}</span>
                  )}
                </span>
                {/* A prism. The book is one object in a set, and this is the
                    mark the set is named for. */}
                <IconPrism className="book-mark" />
              </span>
            </span>

            {/* Cloth grain, over both panels. */}
            <span className="book-texture" aria-hidden="true" />
          </span>

          <span className="book-pages" aria-hidden="true" />
          <span className="book-back" aria-hidden="true" />
        </span>
      </a>

      {/* The cover carries the title, so this is only what the cover can't
          say: whether it's readable, when it's from, and the control to keep
          it. Repeating the title would print it twice at two sizes. */}
      <div className="book-meta">
        <span className="book-free">Free to read</span>
        {item.year && <span className="book-year">{item.year}</span>}
        <BookmarkButton item={item} topic={topic} category={category} />
      </div>
    </article>
  );
}

export default BookCard;
