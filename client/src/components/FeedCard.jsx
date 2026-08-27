import { BookmarkButton } from "./ResultCard";
import { hostOf, formatSignal } from "../lib/result";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "./categories";
import { lighten, topicColor } from "../lib/topicIcon";
import { IconPlay } from "./Icons";

/* Videos only, and deliberately not the other two categories that ship an
   image. A 16:9 still is exactly the shape of a full-bleed band, so it crops
   to nothing; square podcast art and 2:3 book covers have to be cut in half to
   fit one, and a card grid where only some rows carry a tall image is ragged
   enough with one category doing it. */
const THUMBED = new Set(["videos"]);

/**
 * A result on the feed.
 *
 * The explore page renders results as rows deliberately — there you are
 * scanning 27 of them across nine lanes and a border around each is noise.
 * The feed is a different job: eight items, mixed categories, drawn from up to
 * eight different searches. A row list gives them all identical weight and
 * shows neither which topic an item came from nor what kind of thing it is,
 * which are the two facts that decide whether it is worth a click. So the feed
 * cards them, and spends the extra space on exactly those two facts.
 */
function FeedCard({ item, topic, category, compact = false }) {
  const band = topicColor(topic || item.topic || "");
  const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.articles;
  const host = hostOf(item.url);
  const signal = formatSignal(item);
  const showThumb = !compact && THUMBED.has(category) && item.thumbnail;

  return (
    <article
      className={`fcard${compact ? " is-compact" : ""}${showThumb ? " has-thumb" : ""}`}
      style={{ "--band": band, "--band-lit": lighten(band, 0.4) }}
    >
      {showThumb && (
        <a
          className="fcard-thumb"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img src={item.thumbnail} alt="" loading="lazy" decoding="async"
               referrerPolicy="no-referrer" />
          {category === "videos" && (
            <span className="fcard-play" aria-hidden="true">
              <IconPlay />
            </span>
          )}
        </a>
      )}

      <div className="fcard-body">
        <div className="fcard-top">
          <span className="fcard-kind">
            <Icon />
            {CATEGORY_LABELS[category] || "Articles"}
          </span>
          {topic && <span className="fcard-topic">{topic}</span>}
          <BookmarkButton item={item} topic={topic} category={category} />
        </div>

        <a
          className="fcard-link"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.title}
        </a>

        {/* Rendered even when empty: the reserved two lines are what keep
            every card in a row the same height. */}
        {!compact && <p className="fcard-snippet">{item.snippet || ""}</p>}

        {(host || signal) && (
          <div className="fcard-foot">
            {host && <span>{host}</span>}
            {signal && <span className="fcard-signal">{signal}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

export default FeedCard;
