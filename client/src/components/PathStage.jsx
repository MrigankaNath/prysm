import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { recordVisit } from "../lib/library";
import { hostOf } from "../lib/result";
import { CATEGORY_ICONS, CATEGORY_LABELS, categoryStroke } from "./categories";
import { provenanceOf } from "../lib/provenance";

/* One stage of the roadmap, and the stops along it.
 *
 * The roadmap is not a metaphor laid over a list — the plate a stop is drawn
 * on *is* the record of whether you read it. Duolingo greys a node to mean
 * locked; nothing here is locked, and pretending otherwise would be a lie
 * about a path that is coverage rather than a prerequisite graph. So a stop
 * ahead of you is quiet, not disabled, and every one of them opens.
 *
 * The plate is also the tick, which is the one control this view exists for.
 * That still honours the rule it came from — marking something read and
 * opening it are different intentions, so they stay different controls — the
 * tick has simply moved onto the marker that was already stating the same
 * fact. One thing on screen, one thing to click, no duplicated state.
 */
/* A stage is a shortlist. Past about five the reader is scanning a list again
   rather than following a route, which is the thing this view exists to
   avoid — so the rest is one click away instead of on the page. */
const VISIBLE = 5;

/* How far each stop leans off the column. A roadmap that runs dead straight
   reads as a list with round bullets; the weave is what says "route". It is a
   sine rather than a zigzag so the drift is gradual, and it is bounded to
   40px because the titles beside it are real headlines, not "Unit 3" — a
   Duolingo-scale stagger would drag them out of a readable column. */
function leanOf(index) {
  return Math.round(Math.sin(index * 0.85) * 20 + 20);
}

function Stop({ item, index, state, topic, onToggle }) {
  const Icon = CATEGORY_ICONS[item.category];
  const host = hostOf(item.url);
  const mark = provenanceOf(item);
  const kind = CATEGORY_LABELS[item.category] || item.category;
  const done = state === "done";

  return (
    <li
      className={`stop is-${state}`}
      style={{ "--lean": `${leanOf(index)}px` }}
    >
      <button
        type="button"
        className="stop-plate"
        aria-pressed={done}
        aria-label={
          done ? `Mark ${item.title} as unread` : `Mark ${item.title} as read`
        }
        onClick={() => onToggle(item.url)}
      >
        {done ? (
          <Check className="stop-plate-check" strokeWidth={3.2} />
        ) : (
          Icon && (
            <Icon className="stop-plate-icon" stroke={categoryStroke(item.category)} />
          )
        )}
      </button>

      <div className="stop-body">
        <span className="stop-kind">{kind}</span>

        <a
          className="stop-title"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordVisit(item, { topic, category: item.category })}
        >
          {item.title}
        </a>

        {/* What you are about to open, before you open it. The adapters
            already return a snippet; the path was throwing it away and asking
            people to judge a link by its title alone. */}
        {item.snippet && <p className="stop-note">{item.snippet}</p>}

        <span className="stop-meta">
          {host && <span className="stop-host">{host}</span>}
          {mark && <span className={`mark mark-${mark.tone}`}>{mark.label}</span>}
        </span>

        {state === "next" && (
          <a
            className="stop-go"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordVisit(item, { topic, category: item.category })}
          >
            Start here
          </a>
        )}
      </div>
    </li>
  );
}

function PathStage({ stage, topic, doneUrls, nextUrl, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? stage.items : stage.items.slice(0, VISIBLE);
  const hidden = stage.items.length - shown.length;
  const doneHere = stage.items.filter((i) => doneUrls.includes(i.url)).length;

  return (
    <section className="stage" style={{ "--stage": stage.hue }}>
      <header className="stage-head">
        <span className="stage-n">Stage {stage.n}</span>
        <h3 className="stage-label">{stage.label}</h3>
        <p className="stage-blurb">{stage.blurb}</p>
        <span className="stage-count">
          {doneHere} of {stage.items.length} read
        </span>
      </header>

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
            onToggle={onToggle}
          />
        ))}
      </ol>

      {hidden > 0 && (
        <button
          type="button"
          className="stage-more"
          onClick={() => setExpanded(true)}
        >
          Show {hidden} more
          <ChevronDown className="stage-more-icon" />
        </button>
      )}

      {expanded && stage.items.length > VISIBLE && (
        <button
          type="button"
          className="stage-more"
          onClick={() => setExpanded(false)}
        >
          Show less
          <ChevronDown className="stage-more-icon up" />
        </button>
      )}
    </section>
  );
}

export default PathStage;
