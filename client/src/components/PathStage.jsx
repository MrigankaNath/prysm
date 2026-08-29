import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { recordVisit } from "../lib/library";
import { hostOf } from "../lib/result";
import { CATEGORY_LABELS } from "./categories";
import { provenanceOf } from "../lib/provenance";

/* One stage of a path, and the items in it.
 *
 * The checkbox is the whole point. Every other surface in the app is a link
 * you follow and forget; this is the one that remembers you came back. It is a
 * real button beside the link rather than the row itself, because marking
 * something done and opening it are different intentions — you tick things off
 * that you read yesterday.
 */
/* A stage is a shortlist. Beyond about five the reader is scanning a list
   again rather than following a route, which is the thing this view exists to
   avoid — so the rest is one click away instead of on the page. */
const VISIBLE = 5;

function PathStage({ stage, topic, doneUrls, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? stage.items : stage.items.slice(0, VISIBLE);
  const hidden = stage.items.length - shown.length;

  return (
    <section className="stage" style={{ "--stage": stage.hue }}>
      <header className="stage-head">
        <span className="stage-n">{stage.n}</span>
        <div className="stage-copy">
          <h3 className="stage-label">{stage.label}</h3>
          <p className="stage-blurb">{stage.blurb}</p>
        </div>
        <span className="stage-count">
          {stage.items.filter((i) => doneUrls.includes(i.url)).length}/
          {stage.items.length}
        </span>
      </header>

      <ol className="stage-list">
        {shown.map((item) => {
          const done = doneUrls.includes(item.url);
          const host = hostOf(item.url);
          const mark = provenanceOf(item);

          return (
            <li key={item.url} className={`step${done ? " is-done" : ""}`}>
              <button
                type="button"
                className="step-tick"
                aria-pressed={done}
                aria-label={done ? "Mark as not done" : "Mark as done"}
                onClick={() => onToggle(item.url)}
              >
                <Check className="step-tick-mark" strokeWidth={3} />
              </button>

              <a
                className="step-link"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  recordVisit(item, { topic, category: item.category })
                }
              >
                {item.title}
              </a>

              <span className="step-meta">
                <span className="step-kind">
                  {CATEGORY_LABELS[item.category] || item.category}
                </span>
                {host && <span className="step-host">{host}</span>}
                {/* One badge, naming the strongest verifiable fact. A score
                    would imply a paper and a video are commensurable; this
                    says what is actually true about each. */}
                {mark && (
                  <span className={`mark mark-${mark.tone}`}>{mark.label}</span>
                )}
              </span>
            </li>
          );
        })}
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
