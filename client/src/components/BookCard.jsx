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
        {/* The board. A real jacket sits on top of it; a typeset one is it. */}
        <span className="book-face">
          {showImage ? (
            <img
              src={item.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setBroken(true)}
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
        </span>
        {/* Spine and page block, drawn rather than imaged: the left edge is
            where the binding is, the right is the cut pages. */}
        <span className="book-spine" aria-hidden="true" />
        <span className="book-pages" aria-hidden="true" />
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
