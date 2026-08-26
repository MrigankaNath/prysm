import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "../components/categories";
import ResultCard from "../components/ResultCard";
import Prose from "../components/Prose";
import { recordTopic } from "../lib/library";
import { apiFetch, apiJson } from "../lib/api";
import { IconChevronDown, IconGrid } from "../components/Icons";

// How many results a category shows before "Show more".
const COLLAPSED_COUNT = 3;

/* One hue per category, so the row reads as a colour key rather than a list of
   identical pills. Order matches CATEGORY_ORDER. */
const PICKER_HUES = {
  articles: "#3b82f6",
  videos: "#ec4899",
  podcasts: "#f59e0b",
  books: "#10b981",
  code: "#06b6d4",
  papers: "#8b5cf6",
  qa: "#f472b6",
  discussions: "#22d3ee",
  curated: "#a3e635",
};

/* Icon-only, with the name revealed on hover/focus. The label is still in the
   DOM as the accessible name, so this stays usable by keyboard and screen
   reader — it's only visually collapsed. */
function PickerButton({ id, label, count, hue, active, onSelect }) {
  return (
    <button
      type="button"
      className={`picker-chip${active ? " active" : ""}`}
      style={{ "--hue": hue }}
      onClick={() => onSelect(id)}
      aria-label={`${label}, ${count} results`}
      aria-pressed={active}
    >
      <span className="picker-mark">
        {id === "all" ? (
          <IconGrid />
        ) : (
          (() => {
            const Icon = CATEGORY_ICONS[id];
            return Icon ? <Icon /> : <IconGrid />;
          })()
        )}
      </span>
      <span className="picker-count">{count}</span>
      <span className="picker-tip" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}

function CategoryPicker({ sections, active, onSelect, total }) {
  return (
    <nav className="picker" aria-label="Filter results by category">
      <PickerButton
        id="all"
        label="Everything"
        count={total}
        hue="#a1a1aa"
        active={active === "all"}
        onSelect={onSelect}
      />
      {sections.map(({ key, items }) => (
        <PickerButton
          key={key}
          id={key}
          label={CATEGORY_LABELS[key] || key}
          count={items.length}
          hue={PICKER_HUES[key] || "#a1a1aa"}
          active={active === key}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}

function CategorySection({ category, items, topic, index }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[category];
  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hidden = items.length - visible.length;
  const isMediaGrid = category === "videos";

  return (
    <section
      className="cat-section"
      style={{ "--stagger": `${Math.min(index, 6) * 60}ms` }}
    >
      <header className="cat-head">
        <span className="cat-head-icon">{Icon && <Icon />}</span>
        <h3 className="cat-head-title">{CATEGORY_LABELS[category] || category}</h3>
        <span className="cat-head-count">{items.length}</span>
      </header>

      <div className={isMediaGrid ? "cat-grid" : "cat-cols"}>
        {visible.map((item, i) => (
          <ResultCard
            key={`${item.url}-${i}`}
            item={item}
            topic={topic}
            category={category}
          />
        ))}
      </div>

      {hidden > 0 && (
        <button
          type="button"
          className="cat-expand"
          onClick={() => setExpanded(true)}
        >
          Show {hidden} more <IconChevronDown className="cat-expand-icon" />
        </button>
      )}

      {expanded && items.length > COLLAPSED_COUNT && (
        <button
          type="button"
          className="cat-expand"
          onClick={() => setExpanded(false)}
        >
          Show less <IconChevronDown className="cat-expand-icon up" />
        </button>
      )}
    </section>
  );
}

/* The answer, set as type rather than boxed in a card. It gets the top of the
   page to itself; the sources begin below the fold. */
function Overview({ overview, topic, total, categories }) {
  if (!overview) return null;

  return (
    <section className="overview">
      <Prose text={overview.snippet || overview.title} topic={topic} />

      <div className="overview-foot" style={{ "--delay": "420ms" }}>
        <span className="overview-count">
          {total} source{total === 1 ? "" : "s"} across {categories}{" "}
          {categories === 1 ? "category" : "categories"}
        </span>
        <span className="overview-cue" aria-hidden="true">
          <IconChevronDown />
        </span>
      </div>
    </section>
  );
}

function ExploreTopic() {
  const { topic = "" } = useParams();
  const [curated, setCurated] = useState([]);
  const [categories, setCategories] = useState(null);
  const [order, setOrder] = useState(CATEGORY_ORDER);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState("all");

  useEffect(() => {
    if (!topic) return;

    setLoading(true);
    setFailed(false);
    setCategories(null);
    setActive("all");
    window.scrollTo(0, 0);

    Promise.all([
      apiJson(`/api/feed?topic=${encodeURIComponent(topic)}`, []),
      apiFetch(`/api/explore/${encodeURIComponent(topic)}/live`).then((res) => {
        if (!res.ok) throw new Error(`live search failed: ${res.status}`);
        return res.json();
      }),
    ])
      .then(([curatedItems, live]) => {
        setCurated(Array.isArray(curatedItems) ? curatedItems : []);
        setCategories(live.categories || null);
        setOrder(live.order?.length ? live.order : CATEGORY_ORDER);
        // Remembered twice on purpose: locally so the topic list works
        // instantly and offline, and against the account so the feed follows
        // the person to another browser rather than living in this one.
        recordTopic(topic, live.categories);
        apiFetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        }).catch(() => {});
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [topic]);

  const overview = categories?.overview
    ? Array.isArray(categories.overview)
      ? categories.overview[0]
      : categories.overview
    : null;

  const sections = useMemo(() => {
    if (!categories) return [];
    return order
      .filter((key) => key !== "overview")
      .map((key) => {
        const value = categories[key];
        const items = Array.isArray(value) ? value : value ? [value] : [];
        return { key, items };
      })
      .filter(({ items }) => items.length > 0);
  }, [categories, order]);

  const total = sections.reduce((sum, s) => sum + s.items.length, 0);
  const shown =
    active === "all" ? sections : sections.filter((s) => s.key === active);

  return (
    <div className="page page-wide explore">
      <header className="explore-hero">
        <span className="explore-eyebrow">Exploring</span>
        <h1 className="explore-title">{topic}</h1>
        <div className="explore-rule" aria-hidden="true" />
      </header>

      {loading && (
        <div className="explore-loading">
          <div className="skeleton-row">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-card" style={{ "--i": i }} />
            ))}
          </div>
          <p>Pulling the best of the web on {topic}…</p>
        </div>
      )}

      {failed && !loading && (
        <p className="explore-error">
          Couldn&rsquo;t reach live search just now. Try again in a moment, or{" "}
          <Link to="/" className="inline-link">
            head back to your feed
          </Link>
          .
        </p>
      )}

      {!loading && !failed && (
        <>
          <Overview
            overview={overview}
            topic={topic}
            total={total}
            categories={sections.length}
          />

          {curated.length > 0 && (
            <section className="cat-section">
              <header className="cat-head">
                <h3 className="cat-head-title">From Prysm</h3>
                <span className="cat-head-count">{curated.length}</span>
              </header>
              <div className="cat-cols">
                {curated.map((item) => (
                  <ResultCard
                    key={`curated-${item.id}`}
                    item={item}
                    topic={topic}
                    category="curated"
                  />
                ))}
              </div>
            </section>
          )}

          {sections.length > 1 && (
            <CategoryPicker
              sections={sections}
              active={active}
              onSelect={setActive}
              total={total}
            />
          )}

          {shown.map(({ key, items }, i) => (
            <CategorySection
              key={key}
              category={key}
              items={items}
              topic={topic}
              index={i}
            />
          ))}

          {total === 0 && curated.length === 0 && (
            <p className="explore-error">
              Nothing found for &ldquo;{topic}&rdquo;. Try a broader phrase.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default ExploreTopic;
