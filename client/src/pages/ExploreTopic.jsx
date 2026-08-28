import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  categoryStroke,
  CATEGORY_GRADIENTS,
} from "../components/categories";
import ResultCard from "../components/ResultCard";
import BookCard from "../components/BookCard";
import PaperCard from "../components/PaperCard";
import MediaCard from "../components/MediaCard";
import Prose from "../components/Prose";
import { recordTopic } from "../lib/library";
import { apiFetch, apiJson } from "../lib/api";
import {
  IconChevronDown,
  IconGrid,
  IconChevronRight,
  IconWikipedia,
} from "../components/Icons";
import TopicIcon from "../components/TopicIcon";
import { lighten, topicColor } from "../lib/topicIcon";

/* How many results a category shows before "Show more". Four, not three: the
   lanes render in two columns, so an odd number always leaves a dangling row
   with a gap beside it. The expander can reveal an odd remainder — that only
   happens once, at the bottom. */
const COLLAPSED_COUNT = 4;

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

/* One rail item per category: a tile you can see, with its name underneath.
   The previous version was icon-only with the label revealed on hover, which
   meant the row was unreadable until you moved a cursor over it — and on
   touch, where there is no hover, never readable at all. */
function RailItem({ id, label, count, hue, active, onSelect }) {
  const Icon = id === "all" ? IconGrid : CATEGORY_ICONS[id] || IconGrid;

  return (
    <button
      type="button"
      className={`rail-item${active ? " active" : ""}`}
      style={{ "--hue": hue }}
      onClick={() => onSelect(id)}
      aria-label={`${label}, ${count} results`}
      aria-pressed={active}
    >
      <span className="rail-tile">
        <Icon stroke={categoryStroke(id)} />
        <span className="rail-count">{count}</span>
      </span>
      <span className="rail-label">{label}</span>
    </button>
  );
}

function CategoryRail({ sections, active, onSelect, total }) {
  return (
    <nav className="rail" aria-label="Filter results by category">
      <RailItem
        id="all"
        label="Everything"
        count={total}
        hue="#a1a1aa"
        active={active === "all"}
        onSelect={onSelect}
      />
      {sections.map(({ key, items }) => (
        <RailItem
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
  /* Four lanes hold objects rather than links and are laid out as such: a
     shelf of books, a stack of papers, and artwork-led cards for the two that
     ship real images. The rest stay rows, which is right for them — an article
     or a thread is a link and nothing more. */
  const layout =
    category === "books"
      ? "books"
      : category === "papers"
        ? "papers"
        : category === "videos" || category === "podcasts"
          ? "media"
          : null;

  return (
    <section
      className={`cat-section cat-${category}`}
      style={{
        "--stagger": `${Math.min(index, 6) * 60}ms`,
        "--cat": (CATEGORY_GRADIENTS[category] || [])[0] || "#a1a1aa",
      }}
    >
      <header className="cat-head">
        <span className="cat-head-icon">
          {Icon && <Icon stroke={categoryStroke(category)} />}
        </span>
        <h3 className="cat-head-title">{CATEGORY_LABELS[category] || category}</h3>
        <span className="cat-head-count">{items.length}</span>
      </header>

      {layout === "books" && (
        <div className="book-shelf">
          {visible.map((item, i) => (
            <BookCard key={`${item.url}-${i}`} item={item} topic={topic} />
          ))}
        </div>
      )}

      {layout === "papers" && (
        <div className="paper-stack">
          {visible.map((item, i) => (
            <PaperCard key={`${item.url}-${i}`} item={item} topic={topic} />
          ))}
        </div>
      )}

      {layout === "media" && (
        <div className="media-grid">
          {visible.map((item, i) => (
            <MediaCard
              key={`${item.url}-${i}`}
              item={item}
              topic={topic}
              category={category}
            />
          ))}
        </div>
      )}

      {!layout && (
        <div className="cat-cols">
          {visible.map((item, i) => (
            <ResultCard
              key={`${item.url}-${i}`}
              item={item}
              topic={topic}
              category={category}
            />
          ))}
        </div>
      )}

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

/* Shown when the paid half of a topic was withheld.
 *
 * The page is still full of results — every keyless source ran — so this
 * explains what is missing and why rather than apologising. Two different
 * situations, and only one of them is fixed by upgrading: a personal cap is
 * the user's to lift, an app-wide one is nobody's. */
function QuotaNotice({ usage }) {
  if (!usage?.withheld) return null;
  const appWide = usage.withheld === "app";

  return (
    <aside className="quota-notice">
      <div className="quota-notice-copy">
        <p className="quota-notice-title">
          {appWide
            ? "New topics are paused until next month"
            : `You've explored ${usage.limit} new topics this month`}
        </p>
        <p className="quota-notice-body">
          {appWide
            ? "Prysm's shared search budget is spent. Everything already explored still opens in full, and new topics come back on the 1st."
            : "The overview, curated articles and videos below need a fresh search. Everything else on this page is here, and any topic someone has already explored still opens in full."}
        </p>
      </div>
      {!appWide && (
        <Link to="/settings" className="btn-bounce quota-notice-cta">
          See plans
          <IconChevronRight />
        </Link>
      )}
    </aside>
  );
}

/* The answer, set as type rather than boxed in a card. It gets the top of the
   page to itself; the sources begin below the fold. */
function Overview({ overview, topic }) {
  if (!overview) return null;

  const wiki = /(^|\.)wikipedia\.org$/i.test(
    (() => {
      try {
        return new URL(overview.url || "").hostname;
      } catch {
        return "";
      }
    })(),
  );

  return (
    <section className="overview">
      <Prose text={overview.snippet || overview.title} topic={topic} />

      {/* An unattributed paragraph asks to be trusted; a linked one earns it.
          Only rendered for Wikipedia — a synthesised answer has no single
          page to point at, and inventing one would be worse than none. */}
      {wiki && overview.url && (
        <a
          className="overview-source"
          href={overview.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconWikipedia className="overview-source-mark" />
          Wikipedia
          <IconChevronRight className="overview-source-go" />
        </a>
      )}

      <div className="overview-foot" style={{ "--delay": "420ms" }}>
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
  const [usage, setUsage] = useState(null);

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
        setUsage(live.usage || null);
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

  /* The server already falls back to Wikipedia when Tavily has no answer, so
     by the time it gets here an overview is either a real definition or
     genuinely unavailable.
     The last resort is an article snippet and *only* an article snippet. It
     used to reach into papers, books and Q&A too, which is how a research
     abstract ended up set at display scale as the page's opening line — text
     that starts mid-argument ("...are described, and their study justified")
     reads as gibberish in the one place that has to make sense. Better to open
     with nothing than with that. */
  const overview = useMemo(() => {
    if (!categories) return null;
    const direct = Array.isArray(categories.overview)
      ? categories.overview[0]
      : categories.overview;
    if (direct?.snippet || direct?.title) return direct;

    return (
      (categories.articles || []).find((i) => i?.snippet?.length > 90) || null
    );
  }, [categories]);

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
      <header
        className="explore-banner"
        style={{
          "--band": topicColor(topic),
          "--band-lit": lighten(topicColor(topic), 0.4),
        }}
      >
        <TopicIcon topic={topic} />
        <div className="explore-banner-copy">
          <span className="explore-eyebrow">Exploring</span>
          <h1 className="explore-title">{topic}</h1>
          <p className="explore-banner-meta">
            {loading
              ? "Pulling the best of the web"
              : total > 0
                ? `${total} source${total === 1 ? "" : "s"} across ${sections.length} ${
                    sections.length === 1 ? "category" : "categories"
                  }`
                : "Nothing found yet"}
          </p>
        </div>
      </header>

      {loading && (
        <div className="explore-loading">
          <div className="skeleton-row">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-card" style={{ "--i": i }} />
            ))}
          </div>
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
          <QuotaNotice usage={usage} />

          <Overview overview={overview} topic={topic} />

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
            <CategoryRail
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
