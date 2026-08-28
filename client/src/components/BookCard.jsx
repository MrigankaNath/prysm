import { useState } from "react";
import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { topicColor, lighten } from "../lib/topicIcon";

/* Books are objects, so they get drawn as objects.
 *
 * Open Library returns a cover for maybe half of what it finds, which as a row
 * of thumbnails meant one entry with a picture and the next with a gap — the
 * lane read as a broken list rather than a shelf. Every book here has a cover:
 * a real one where it exists, and a typeset one where it doesn't, built from
 * the title and author on a ground derived from the title itself. Both are the
 * same shape, so the shelf is even either way.
 */
function BookCard({ item, topic, category = "books" }) {
  const [broken, setBroken] = useState(false);
  const band = topicColor(item.title || "");
  const showImage = item.thumbnail && !broken;

  /* Author and year come through as fields now; the joined snippet is the
     fallback for anything cached before that change shipped. */
  const byline =
    [item.author, item.year].filter(Boolean).join(" · ") ||
    (item.snippet || "").replace(/\s*·\s*free to read$/, "");

  return (
    <article className="book" style={{ "--band": band, "--band-lit": lighten(band, 0.45) }}>
      <a
        className="book-object"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordVisit(item, { topic, category })}
        aria-label={item.title}
      >
        {/* The board, and the page mounted on it.
            What Open Library returns is almost always a scanned *title page*,
            not a jacket — cream paper, black type, square edges. Bleeding that
            to the board's edge looked like a cropped screenshot; inset with a
            margin it reads as a page sitting on a cover, which is what it is. */}
        <span className="book-board">
          {showImage ? (
            <img
              className="book-page"
              src={item.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setBroken(true)}
              /* Belt and braces for rows cached before ?default=false shipped,
                 and for any host that answers a missing image with a
                 placeholder rather than an error. */
              onLoad={(e) => {
                if (e.currentTarget.naturalWidth < 10) setBroken(true);
              }}
            />
          ) : (
            <span className="book-typeset" aria-hidden="true">
              <span className="book-typeset-rule" />
              <span className="book-typeset-title">{item.title}</span>
              {item.author && (
                <span className="book-typeset-author">{item.author}</span>
              )}
            </span>
          )}

          {/* The gutter shadow — paper curving into the binding. */}
          <span className="book-gutter" aria-hidden="true" />
        </span>

        {/* The block of pages, seen edge-on because the board is turned. */}
        <span className="book-block" aria-hidden="true" />
        {/* The spine, standing away from the board at the binding. */}
        <span className="book-spine" aria-hidden="true" />
      </a>

      <div className="book-meta">
        <a
          className="book-title"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordVisit(item, { topic, category })}
        >
          {item.title}
        </a>
        {byline && <p className="book-byline">{byline}</p>}
        <span className="book-free">Free to read</span>
      </div>

      <BookmarkButton item={item} topic={topic} category={category} />
    </article>
  );
}

export default BookCard;
