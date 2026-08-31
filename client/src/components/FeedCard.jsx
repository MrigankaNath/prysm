import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { hostOf, formatSignal, venueChip } from "../lib/result";
import { CATEGORY_ICONS, CATEGORY_LABELS, categoryStroke } from "./categories";
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
  const venue = venueChip(item);
  const showThumb = !compact && THUMBED.has(category) && item.thumbnail;
  /* Everything else fills the same band with its category glyph.
     Leaving it out is what made a podcast sitting next to a video look
     stretched: the row is as tall as its tallest card either way, so the
     choice is between a card with a header and a card with a hole in it. */
  const showGlyph = !compact && !showThumb;

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

      {showGlyph && (
        <span className="fcard-thumb is-glyph" aria-hidden="true">
          <Icon stroke={categoryStroke(category)} />
        </span>
      )}

      <div className="fcard-body">
        <div className="fcard-top">
          <span className="fcard-kind">
            <Icon stroke={categoryStroke(category)} />
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
          onClick={() => recordVisit(item, { topic, category })}
        >
          {item.title}
        </a>

        {/* Rendered even when empty: the reserved two lines are what keep
            every card in a row the same height. */}
        {!compact && <p className="fcard-snippet">{item.snippet || ""}</p>}

        {(host || signal || venue) && (
          <div className="fcard-foot">
            {host && <span>{host}</span>}
            {signal && <span className="fcard-signal">{signal}</span>}
            {venue && (
              <span className={`venue-chip${venue.reviewed ? " reviewed" : ""}`}>
                {venue.reviewed ? "Peer reviewed" : "Preprint"}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default FeedCard;
