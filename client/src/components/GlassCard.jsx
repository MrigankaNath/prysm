import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { hostOf, formatSignal } from "../lib/result";
import { IconDiscussions, IconQA, IconChevronRight } from "./Icons";

/* Discussions and Q&A — conversations, carded on glass.
 *
 * Neither lane has an image, so the card can't be led by one. What it can be
 * led by is the thing that actually decides whether a thread is worth opening:
 * how many people weighed in, and whether the question got an answer that
 * stuck. As rows both of those were the smallest text on the line.
 *
 * The two share a shell so the text-only lanes read as one family rather than
 * as two lanes that happen to sit near each other.
 */
const MARKS = { discussions: IconDiscussions, qa: IconQA };

/* Adapters put the engagement line in `snippet` for these two ("784 points,
   237 comments"), which the foot already states properly — so a snippet that
   is only numbers is dropped rather than printed twice. */
const NUMERIC_ONLY = /^[\d\s,.·k+]*(points?|comments?|votes?|answers?|accepted)[\s\S]{0,40}$/i;

function GlassCard({ item, topic, category }) {
  const Mark = MARKS[category] || IconDiscussions;
  const host = hostOf(item.url);
  const signal = formatSignal(item);
  const blurb =
    item.snippet && !NUMERIC_ONLY.test(item.snippet) ? item.snippet : null;

  return (
    <article className={`glass glass-${category}`}>
      <a
        className="glass-hit"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordVisit(item, { topic, category })}
        aria-label={item.title}
      />

      <div className="glass-top">
        <span className="glass-mark">
          <Mark />
        </span>
        {host && <span className="glass-host">{host}</span>}
        <BookmarkButton item={item} topic={topic} category={category} />
      </div>

      <h4 className="glass-title">{item.title}</h4>
      {blurb && <p className="glass-blurb">{blurb}</p>}

      <div className="glass-foot">
        {signal && <span className="glass-signal">{signal}</span>}
        {item.depth_level && (
          <span className={`res-depth depth-${item.depth_level}`}>
            {item.depth_level}
          </span>
        )}
        <span className="glass-go" aria-hidden="true">
          Open
          <IconChevronRight />
        </span>
      </div>
    </article>
  );
}

export default GlassCard;
