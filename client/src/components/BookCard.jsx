import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { topicColor, lighten } from "../lib/topicIcon";
import BrandMark from "./BrandMark";

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
/* The lane is no longer all free scans, so the card has to say which it is —
   otherwise every board makes the same promise and one in three keeps it. */
const ACCESS_LABEL = {
  free: "Free to read",
  borrow: "Borrow free",
  buy: "Buy",
};

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
                {/* The Prysm mark, colophon-style in the bottom corner — where
                    a publisher's device goes on a real jacket. It was an
                    outline triangle, which is the shape the logo is built from
                    but not the logo. */}
                <BrandMark className="book-mark" />
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
        {/* Books cached before the lane admitted paid titles carry no `access`
            field, and every one of those was free to read. */}
        <span className={`book-free is-${item.access || "free"}`}>
          {ACCESS_LABEL[item.access] || "Free to read"}
        </span>
        {item.year && <span className="book-year">{item.year}</span>}
        <BookmarkButton item={item} topic={topic} category={category} />
      </div>
    </article>
  );
}

export default BookCard;
