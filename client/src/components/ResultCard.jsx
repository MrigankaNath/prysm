import { useState, useEffect } from "react";
import {
  isBookmarked,
  toggleBookmark,
  recordVisit,
  subscribe,
} from "../lib/library";
import { IconBookmark, IconPlay } from "./Icons";
import { hostOf, formatSignal, venueChip } from "../lib/result";

function useBookmarkState(url) {
  const [saved, setSaved] = useState(() => isBookmarked(url));
  useEffect(() => subscribe(() => setSaved(isBookmarked(url))), [url]);
  return saved;
}

export function BookmarkButton({ item, topic, category }) {
  const saved = useBookmarkState(item.url);

  return (
    <button
      type="button"
      className={`bookmark-btn${saved ? " saved" : ""}`}
      title={saved ? "Saved to Wavelength" : "Save for later"}
      aria-label={saved ? "Remove bookmark" : "Save for later"}
      aria-pressed={saved}
      onClick={() => toggleBookmark(item, { topic, category })}
    >
      <IconBookmark />
    </button>
  );
}

function Meta({ item }) {
  const host = hostOf(item.url);
  const signal = formatSignal(item);
  const venue = venueChip(item);

  return (
    <div className="res-meta">
      {host && <span>{host}</span>}
      {signal && <span className="res-signal">{signal}</span>}
      {venue && (
        <span className={`venue-chip${venue.reviewed ? " reviewed" : ""}`}>
          {venue.label}
        </span>
      )}
      {item.depth_level && (
        <span className={`res-depth depth-${item.depth_level}`}>
          {item.depth_level}
        </span>
      )}
    </div>
  );
}

/* Thumbnails sit inside their own padded plate, so the image never butts up
   against the type beside it. */
function Thumb({ item, category }) {
  const [broken, setBroken] = useState(false);

  return (
    <span className={`res-plate plate-${category}`}>
      <span className="res-thumb">
        {item.thumbnail && !broken ? (
          <img
            src={item.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            /* Referrer-less requests are what most image CDNs reject when a
               thumbnail silently fails to appear. */
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
          />
        ) : (
          /* A hidden <img> leaves an empty box that looks identical to a
             missing thumbnail, so a failure falls back to the gradient
             instead — visibly deliberate rather than broken. */
          <span className="res-thumb-fallback" aria-hidden="true" />
        )}
        {category === "videos" && (
          <span className="res-play" aria-hidden="true">
            <IconPlay />
          </span>
        )}
      </span>
    </span>
  );
}

/* One row per result. The title *is* the link — no card, no arrow, no chrome.
   The bookmark is a sibling button rather than nested inside the anchor, since
   a button inside an <a> is invalid and swallows the click on some browsers. */
function ResultCard({ item, topic, category }) {
  const hasThumb =
    ["videos", "podcasts", "books"].includes(category) && item.thumbnail;
  // Videos and podcasts render as tiles, so their thumbnail leads the card
  // rather than sitting beside the text.
  const isTile = category === "videos" || category === "podcasts";

  return (
    <div
      className={`res${hasThumb ? " res-with-thumb" : ""}${isTile ? " res-tile" : ""}`}
    >
      {hasThumb && (
        <a
          className="res-thumb-link"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => recordVisit(item, { topic, category })}
        >
          <Thumb item={item} category={category} />
        </a>
      )}

      <div className="res-body">
        <a
          className="res-link"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordVisit(item, { topic, category })}
        >
          {category === "code" && item.thumbnail && (
            <img className="res-avatar" src={item.thumbnail} alt="" loading="lazy" />
          )}
          {item.title}
        </a>

        {item.snippet && <p className="res-snippet">{item.snippet}</p>}
        <Meta item={item} />
      </div>

      <BookmarkButton item={item} topic={topic} category={category} />
    </div>
  );
}

export default ResultCard;
