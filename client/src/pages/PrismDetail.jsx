import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PrismStep from "../components/PrismStep";
import { IconPrism, IconChevronRight } from "../components/Icons";
import { apiFetch } from "../lib/api";
import { getProgress, toggleDone, subscribe } from "../lib/library";

const DEPTHS = [
  { id: "beginner", label: "Start here" },
  { id: "intermediate", label: "Go deeper" },
  { id: "advanced", label: "The hard part" },
];

/* Split from the fetching wrapper so the page can be rendered against a fixed
   bundle — the real one is behind the auth gate, which makes every visual
   change unverifiable without an account. */
export function PrismBody({ bundle }) {
  const items = bundle.items || [];

  /* Keyed on the Prism, not on its topic.
   *
   * Progress is stored per topic, and an Explore path for "react" is a
   * different set of items from the React Prism — sharing the key let this
   * page overwrite the path's length, so the feed offered to resume "3 of 21"
   * on a page that has eleven stops. `recordPathSize` is deliberately not
   * called for the same reason: with no total recorded, journey.js filters
   * this entry out of the feed's resume rows rather than rendering a raw key
   * and linking to an explore page that doesn't exist. */
  const key = `prism:${bundle.id}`;
  const [done, setDone] = useState(() => new Set(getProgress(key)));

  useEffect(() => subscribe(() => setDone(new Set(getProgress(key)))), [key]);

  const position = new Map(items.map((item, i) => [item.id, i + 1]));

  return (
    <>
      <header className="prism-hero">
        <Link to="/prisms" className="prism-back">
          <IconChevronRight className="prism-back-icon" />
          All Prisms
        </Link>

        <span className="prism-eyebrow">
          <IconPrism className="prism-eyebrow-icon" />
          {bundle.topic}
        </span>
        <h1 className="prism-title">{bundle.title}</h1>
        {bundle.description && (
          <p className="prism-sub">
            {bundle.description.replace(/^\[curated\]\s*/, "")}
          </p>
        )}

        <div className="prism-progress">
          {items.map((item, i) => (
            <span
              key={item.id}
              className={`prism-step stage-${item.depth_level}${
                done.has(item.url) ? " done" : ""
              }`}
            >
              {i + 1}
            </span>
          ))}
          <span className="prism-progress-count">
            {items.filter((item) => done.has(item.url)).length} of {items.length}
          </span>
        </div>
      </header>

      {/* Grouped by depth so the path reads as three stages rather than a flat
          numbered list — the ordering is the whole point of a Prism. */}
      {DEPTHS.map(({ id: depth, label }) => {
        const stage = items.filter((item) => item.depth_level === depth);
        if (stage.length === 0) return null;

        return (
          <section key={depth} className={`prism-stage stage-${depth}`}>
            <h3 className="prism-stage-head">
              {label}
              <span className="prism-stage-count">{stage.length}</span>
            </h3>

            <div className="prism-steps">
              {stage.map((item) => (
                <PrismStep
                  key={item.id}
                  item={item}
                  index={position.get(item.id)}
                  topic={bundle.topic}
                  done={done.has(item.url)}
                  onToggle={() => toggleDone(key, item.url)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

function PrismDetail() {
  const { id } = useParams();
  const [bundle, setBundle] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    apiFetch(`/api/bundles/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(setBundle)
      .catch(() => setFailed(true));
  }, [id]);

  if (failed) {
    return (
      <div className="page page-wide">
        <p className="wl-empty">
          Couldn&rsquo;t load that Prism.{" "}
          <Link to="/prisms" className="inline-link">
            Back to all Prisms
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!bundle) return <p className="page page-wide wl-empty">Loading…</p>;

  return (
    <div className="page page-wide">
      <PrismBody bundle={bundle} />
    </div>
  );
}

export default PrismDetail;
