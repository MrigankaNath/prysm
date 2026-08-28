import { useState } from "react";
import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { hostOf, formatSignal } from "../lib/result";
import { IconPlay } from "./Icons";

/* Videos and podcasts, on one card.
 *
 * Both ship real artwork, and artwork is the reason you pick one over another —
 * so it leads, at the aspect it was made in. A 16:9 still letterboxed into a
 * square, or square cover art cropped to widescreen, throws away the part that
 * made it worth showing.
 */
const ASPECT = { videos: "16 / 9", podcasts: "1 / 1" };

function MediaCard({ item, topic, category }) {
  const [broken, setBroken] = useState(false);
  const host = hostOf(item.url);
  const signal = formatSignal(item);
  const showArt = item.thumbnail && !broken;

  return (
    <article className={`media media-${category}`}>
      <a
        className="media-art"
        style={{ aspectRatio: ASPECT[category] || "16 / 9" }}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordVisit(item, { topic, category })}
        aria-label={item.title}
      >
        {showArt ? (
          <img
            src={item.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
          />
        ) : (
          /* Visibly deliberate rather than a blank box, which reads the same
             as a still-loading one. */
          <span className="media-art-fallback" aria-hidden="true" />
        )}

        {category === "videos" && (
          <span className="media-play" aria-hidden="true">
            <IconPlay />
          </span>
        )}
      </a>

      <div className="media-body">
        <a
          className="media-title"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordVisit(item, { topic, category })}
        >
          {item.title}
        </a>
        {item.snippet && <p className="media-sub">{item.snippet}</p>}
        <div className="media-foot">
          {host && <span>{host}</span>}
          {signal && <span className="media-signal">{signal}</span>}
        </div>
      </div>

      <BookmarkButton item={item} topic={topic} category={category} />
    </article>
  );
}

export default MediaCard;
