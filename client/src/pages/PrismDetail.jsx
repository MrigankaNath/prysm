import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ResultCard from "../components/ResultCard";
import { IconPrism, IconChevronRight } from "../components/Icons";
import { apiFetch } from "../lib/api";

const DEPTHS = [
  { id: "beginner", label: "Start here" },
  { id: "intermediate", label: "Go deeper" },
  { id: "advanced", label: "The hard part" },
];

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

  const items = bundle.items || [];

  return (
    <div className="page page-wide">
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

        <div className="prism-progress" aria-hidden="true">
          {items.map((item, i) => (
            <span key={item.id} className={`prism-step depth-dot-${item.depth_level}`}>
              {i + 1}
            </span>
          ))}
        </div>
      </header>

      {/* Grouped by depth so the path reads as three stages rather than a flat
          numbered list — the ordering is the whole point of a Prism. */}
      {DEPTHS.map(({ id: depth, label }) => {
        const stage = items.filter((item) => item.depth_level === depth);
        if (stage.length === 0) return null;

        return (
          <section key={depth} className="prism-stage">
            <h3 className="prism-stage-head">
              <span className={`prism-stage-dot depth-dot-${depth}`} />
              {label}
              <span className="prism-stage-count">{stage.length}</span>
            </h3>
            <div className="cat-stack">
              {stage.map((item) => (
                <ResultCard
                  key={item.id}
                  item={{ ...item, snippet: item.description }}
                  topic={bundle.topic}
                  category="curated"
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default PrismDetail;
