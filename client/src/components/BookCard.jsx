import { useState } from "react";
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
 *
 * The real jacket goes on that board wherever there is one. The typeset cover
 * was written when this lane was filtered to free public-domain scans, where
 * the artwork genuinely was a photograph of a title page and unreadable at
 * shelf size. Opening the lane to every book changed the input: measured
 * across four topics, 19 of 20 results carry a cover and at -L they are real
 * jackets, around 330x500 for 11-59 kB. The design survives as the fallback,
 * which is what it is good at — a book with no artwork still looks made
 * rather than broken.
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
  const [artBroken, setArtBroken] = useState(false);
  const art = item.thumbnail && !artBroken ? item.thumbnail : null;

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
              <span className={`book-cover${art ? " has-art" : ""}`}>
                {art ? (
                  <img
                    className="book-art"
                    src={art}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={() => setArtBroken(true)}
                    /* Open Library serves whatever it has at -L, and a few are
                       thumbnails: one measured cover was 152px wide, which
                       upscales to mush on a 168px board. Under the floor the
                       typeset cover is the better picture. */
                    onLoad={(e) => {
                      if (e.currentTarget.naturalWidth < 200) setArtBroken(true);
                    }}
                  />
                ) : (
                  <>
                    <span className="book-cover-text">
                      <span className="book-cover-title">{item.title}</span>
                      {author && (
                        <span className="book-cover-author">{author}</span>
                      )}
                    </span>
                    {/* A prism. The book is one object in a set, and this is
                        the mark the set is named for. */}
                    <IconPrism className="book-mark" />
                  </>
                )}
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
