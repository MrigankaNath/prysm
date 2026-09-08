import { useState } from "react";
import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { hostOf, venueChip, effortOf, publishedOn } from "../lib/result";
import { CATEGORY_ICONS, CATEGORY_LABELS, categoryStroke } from "./categories";
import { lighten, topicColor } from "../lib/topicIcon";

/* Two lanes ship a mark that identifies the item rather than its category.
 *
 * Websites carry the site's favicon. Code carries the repository owner's
 * avatar, which the GitHub adapter already returns — and that is the right
 * mark for the lane even though nearly every link in it is GitHub. A GitHub
 * logo on every card would say exactly what the code glyph already says; the
 * owner's avatar says which project, which is the part the reader does not
 * know yet. Same rule the websites lane settled on. */
const OWN_MARK = new Set(["websites", "code"]);

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
  const venue = venueChip(item);
  const effort = effortOf(item, category);
  const published = publishedOn(item);
  const byline = item.author || null;
  /* No media band. It was a 16:9 panel on every card — roughly half the
     card's height — and with no artwork in the feed it held nothing but the
     category glyph, which the meta row states in words two lines below. */
  const [markBroken, setMarkBroken] = useState(false);
  const ownMark =
    OWN_MARK.has(category) && !markBroken ? item.thumbnail : null;

  return (
    <article
      className={`fcard${compact ? " is-compact" : ""}`}
      style={{ "--band": band, "--band-lit": lighten(band, 0.4) }}
    >
      {/* Out of the text flow and pinned to the corner: the save control on
          top, and under it the mark for where the link actually goes. At this
          size it is a fact about the destination rather than a decoration —
          you can tell a Vercel repo from a Rust one before reading a word. */}
      <div className="fcard-aside">
        <BookmarkButton item={item} topic={topic} category={category} />
        {ownMark && (
          <span className="fcard-crest">
            <img src={ownMark} alt="" onError={() => setMarkBroken(true)} />
          </span>
        )}
      </div>

      <div className="fcard-body">
        <div className="fcard-top">
          <span className="fcard-kind">
            <Icon stroke={categoryStroke(category)} />
            {CATEGORY_LABELS[category] || "Articles"}
          </span>
          {topic && <span className="fcard-topic">{topic}</span>}
          {effort && <span className="fcard-effort">{effort}</span>}
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

        {(byline || published || host) && (
          <footer className="fcard-foot">
            <span className="fcard-fact">
              <span className="fcard-fact-label">{byline ? "By" : "From"}</span>
              <span className="fcard-fact-value">{byline || host}</span>
            </span>
            {published && (
              <span className="fcard-fact is-right">
                <span className="fcard-fact-label">Published</span>
                <span className="fcard-fact-value">{published}</span>
              </span>
            )}
          </footer>
        )}

        {venue && (
          <span className={`venue-chip${venue.reviewed ? " reviewed" : ""}`}>
            {venue.reviewed ? "Peer reviewed" : "Preprint"}
          </span>
        )}

      </div>
    </article>
  );
}

export default FeedCard;
