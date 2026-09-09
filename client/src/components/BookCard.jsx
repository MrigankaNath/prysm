import { useState } from "react";
import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { topicColor, lighten } from "../lib/topicIcon";
import BrandMark from "./BrandMark";

/* Books are objects, so they get drawn as objects — with the real jacket when
 * there is one and a typeset board when there isn't.
 *
 * The typeset board used to be the only option, because the lane was free
 * scans and their artwork was mostly a photograph of a title page: a sheet of
 * cream paper with a paragraph of 8pt type in the middle of it, unreadable at
 * shelf size. Opening the lane to every book changed what the images are —
 * measured across three topics, 18 of 18 covers were real jackets — so the
 * jacket leads and the typeset board is the fallback.
 *
 * Both are the same object at the same size, which is the only thing the shelf
 * really requires. Everything on the board is sized in container units, so a
 * book scales as one piece at any shelf width rather than needing a breakpoint
 * per size. */
/* The lane is no longer all free scans, so the card has to say which it is —
   otherwise every board makes the same promise and one in three keeps it. */
const ACCESS_LABEL = {
  free: "Free to read",
  borrow: "Borrow free",
  buy: "Buy",
};

function BookCard({ item, topic, category = "books" }) {
  const band = topicColor(item.title || "");

  /* Two guards, because Open Library fails in two ways. `?default=false` on
     the adapter's URL makes a missing cover a 404, which fires onError — but
     a row cached before that shipped still asks for the default, and what
     comes back is a blank 1px image with HTTP 200. That "loads" successfully,
     so onError never fires and the board came up empty. */
  const [coverBroken, setCoverBroken] = useState(false);
  const cover = coverBroken ? null : item.thumbnail;

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
            {cover ? (
              <>
                <img
                  className="book-jacket"
                  src={cover}
                  alt=""
                  loading="lazy"
                  onError={() => setCoverBroken(true)}
                  onLoad={(event) => {
                    if (event.currentTarget.naturalWidth < 10) {
                      setCoverBroken(true);
                    }
                  }}
                />
                {/* The hinge, over the photograph. A jacket wraps the spine,
                    so the shading belongs on the artwork rather than under
                    it — without it the image reads as a pasted rectangle. */}
                <span className="book-bind" aria-hidden="true" />
              </>
            ) : (
              <>
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
              </>
            )}

            {/* Cloth grain, over whichever board was drawn — it is what stops
                a jacket reading as a screenshot and a colour band as a
                rectangle. */}
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
