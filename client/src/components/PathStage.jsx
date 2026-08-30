import { Check, ChevronDown, ArrowUpRight } from "lucide-react";
import { recordVisit } from "../lib/library";
import { hostOf } from "../lib/result";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_GRADIENTS,
  categoryStroke,
} from "./categories";
import { provenanceOf } from "../lib/provenance";
import PrismGlyph from "./PrismGlyph";

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

/* How far each stop leans off the column. Bigger than it could be when the
   trail carried descriptions: names are short and clamped now, so the weave
   can be wide enough to actually read as a route. */
function leanOf(index) {
  return Math.round(Math.sin(index * 0.95) * 34 + 34);
}

function Stop({ item, index, state, topic, open, onOpen, onToggle }) {
  const Icon = CATEGORY_ICONS[item.category];
  const [hue, lit] = CATEGORY_GRADIENTS[item.category] || ["#8b5cf6", "#c4b5fd"];
  const host = hostOf(item.url);
  const mark = provenanceOf(item);
  const kind = CATEGORY_LABELS[item.category] || item.category;
  const done = state === "done";

  const visit = () => recordVisit(item, { topic, category: item.category });

  return (
    <li
      className={`stop is-${state}${open ? " is-open" : ""}`}
      style={{ "--lean": `${leanOf(index)}px`, "--type": hue, "--type-lit": lit }}
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
            ) : (
              Icon && (
                <Icon
                  className="stop-node-icon"
                  stroke={categoryStroke(item.category)}
                />
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
  nextUrl,
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

      {/* The glyph is a sibling of the list, not a child of it: an <ol> takes
          list items and nothing else. */}
      <div className="stage-run">
        <PrismGlyph hue={stage.hue} />

        <ol className="stage-trail">
          {shown.map((item, i) => (
            <Stop
              key={item.url}
              item={item}
              index={i}
              state={
                doneUrls.includes(item.url)
                  ? "done"
                  : item.url === nextUrl
                    ? "next"
                    : "ahead"
              }
              topic={topic}
              open={openUrl === item.url}
              onOpen={onOpen}
              onToggle={onToggle}
            />
          ))}
        </ol>
      </div>

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
