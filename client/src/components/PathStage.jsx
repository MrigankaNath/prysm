import { Fragment, useState } from "react";
import { Check, ChevronDown, ArrowUpRight } from "lucide-react";
import { recordVisit } from "../lib/library";
import { hostOf, formatSignal } from "../lib/result";
import {
  CATEGORY_ICONS,
  CATEGORY_ART,
  CATEGORY_LABELS,
  CATEGORY_GRADIENTS,
} from "./categories";
import { provenanceOf } from "../lib/provenance";
import RoadRun from "./RoadRun";

/* One stage of the roadmap, and the stops along it.
 *
 * The trail carries almost no text. A stop is a marker, its type icon and a
 * name — everything else about it (what it is, where it's from, what can be
 * verified about it) is a click away on the marker itself. The previous
 * version put all of that on the trail at once, which answered questions
 * nobody had asked yet and buried the one thing the view is for: what to open
 * next.
 *
 * Nothing here is locked. The games this layout borrows from grey a marker to
 * mean gated, and a tooltip explains what you must finish first. The path is
 * coverage, not a prerequisite graph — a quiet marker means unread, every one
 * of them opens, and no copy anywhere may suggest otherwise.
 */
/* A stage is a shortlist. Past about five the reader is scanning a list again
   rather than following a route, which is the thing this view exists to
   avoid — so the rest is one click away instead of on the page. */
const VISIBLE = 5;

/* How far each stop leans off the column.
 *
 * One arc across the whole run, anchored at both ends: the first and last
 * stops sit on the column and the middle bulges out. Normalising by the
 * stage's own length is what makes a three-stop stage curve as clearly as a
 * nine-stop one.
 *
 * The previous version was a running sine on the index alone, which is why
 * short stages looked wrong — at three stops it produced 34, 62, 66: a drift
 * to the right that flattened out, reading as a crooked line rather than a
 * curve. Two points cannot describe a curve at all, so they stack straight.
 */

function Stop({ item, side, state, topic, open, onOpen, onToggle }) {
  const Icon = CATEGORY_ICONS[item.category];
  const art = CATEGORY_ART[item.category];
  const [hue, lit] = CATEGORY_GRADIENTS[item.category] || ["#8b5cf6", "#c4b5fd"];
  const host = hostOf(item.url);
  const mark = provenanceOf(item);
  const signal = formatSignal(item);
  const kind = CATEGORY_LABELS[item.category] || item.category;
  const done = state === "done";
  /* A website's marker carries the site's own mark rather than a globe. Every
     stop in that lane is a website, so the category glyph identifies nothing —
     the favicon is the only thing that tells one stop from another at a
     glance. Falls back to the glyph if the icon 404s. */
  const [markBroken, setMarkBroken] = useState(false);
  const favicon =
    item.category === "websites" && !markBroken ? item.thumbnail : null;

  const visit = () => recordVisit(item, { topic, category: item.category });

  return (
    <li
      className={`stop side-${side} is-${state}${open ? " is-open" : ""}`}
      style={{ "--type": hue, "--type-lit": lit }}
    >
      <div className="stop-marker">
        <button
          type="button"
          className="stop-node"
          aria-expanded={open}
          aria-label={`${kind}: ${item.title}. Show details`}
          onClick={() => onOpen(open ? null : item.url)}
        >
          <span className="stop-node-face">
            {done ? (
              <Check className="stop-node-check" strokeWidth={3.4} />
            ) : favicon ? (
              <img
                className="stop-node-mark"
                src={favicon}
                alt=""
                onError={() => setMarkBroken(true)}
              />
            ) : art ? (
              /* The marker is a dark disc so the artwork can be the lit thing
                 on it — the inverse of the flat-glyph-on-a-coloured-disc it
                 replaced. The lane's hue survives in the rim and the halo. */
              <img className="stop-node-art" src={art} alt="" />
            ) : (
              Icon && (
                /* currentColor for the fallback: an unknown category has no
                   artwork, and the icon's own gradient is a light ramp, which
                   is the one thing that cannot read on the dark face. */
                <Icon className="stop-node-icon" stroke="currentColor" />
              )
            )}
          </span>
        </button>
      </div>

      <div className="stop-label">
        <span className="stop-type">{kind}</span>
        <a
          className="stop-name"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={visit}
        >
          {item.title}
        </a>

        {/* Who made it, how many people met it, and where it lives. A title
            alone does not say whether a link is worth opening — and for a
            website the domain *is* the recommendation, so it leads. */}
        <div className="stop-facts">
          {host && (
            <span
              className={
                item.category === "websites" ? "stop-domain" : "stop-host"
              }
            >
              {host}
            </span>
          )}
          {item.author && <span className="stop-by">{item.author}</span>}
          {signal && <span className="stop-signal">{signal}</span>}
          {/* The strongest verifiable fact about the item, as a category
              rather than a number — the same badge the popover carries, moved
              up so the decision to click can be made without opening it. */}
          {mark && <span className={`mark mark-${mark.tone}`}>{mark.label}</span>}
        </div>
      </div>

      {open && (
        <div className="stop-pop" role="dialog" aria-label={item.title}>
          <span className="stop-pop-type">{kind}</span>
          <h4 className="stop-pop-title">{item.title}</h4>

          {item.snippet && <p className="stop-pop-note">{item.snippet}</p>}

          <div className="stop-pop-meta">
            {host && <span className="stop-pop-host">{host}</span>}
            {mark && <span className={`mark mark-${mark.tone}`}>{mark.label}</span>}
          </div>

          <div className="stop-pop-actions">
            <a
              className="stop-pop-go"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={visit}
            >
              Open
              <ArrowUpRight className="stop-pop-go-icon" />
            </a>
            <button
              type="button"
              className="stop-pop-tick"
              aria-pressed={done}
              onClick={() => onToggle(item.url)}
            >
              {done ? "Read" : "Mark read"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function PathStage({
  stage,
  topic,
  doneUrls,
  litUrl,
  openUrl,
  onOpen,
  onToggle,
  expanded,
  onExpand,
}) {
  const shown = expanded ? stage.items : stage.items.slice(0, VISIBLE);
  const hidden = stage.items.length - shown.length;

  return (
    <section className="stage" style={{ "--stage": stage.hue }}>
      {/* The level plate. Once the stops are staggered this is the only thing
          separating one run from the next, so it is a bordered block rather
          than a line of text — and the number belongs on it, because stages
          really are a sequence.

          It carries no count: the route panel already lists every stage with
          one, and saying it twice is the clutter this view is escaping. */}
      <header className="stage-head">
        <span className="stage-n">Stage {stage.n}</span>
        <h3 className="stage-label">{stage.label}</h3>
        <p className="stage-blurb">{stage.blurb}</p>
      </header>

      <ol className="stage-trail">
        {shown.map((item, i) => (
          <Fragment key={item.url}>
            {i > 0 && <RoadRun from={i % 2 === 0 ? "r" : "l"} />}
            <Stop
            item={item}
            side={i % 2 === 0 ? "l" : "r"}
            state={
              doneUrls.includes(item.url)
                ? "done"
                : item.url === litUrl
                  ? "next"
                  : "ahead"
            }
            topic={topic}
            open={openUrl === item.url}
            onOpen={onOpen}
            onToggle={onToggle}
            />
          </Fragment>
        ))}
      </ol>

      {(hidden > 0 || expanded) && (
        <button type="button" className="stage-more" onClick={onExpand}>
          {hidden > 0 ? `Show ${hidden} more` : "Show less"}
          <ChevronDown className={`stage-more-icon${expanded ? " up" : ""}`} />
        </button>
      )}
    </section>
  );
}

export default PathStage;
