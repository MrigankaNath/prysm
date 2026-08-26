import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiJson } from "../lib/api";
import {
  IconSearch,
  IconClock,
  IconCompass,
  IconChevronRight,
  IconPrism,
  IconArticles,
} from "./Icons";

const EMPTY_RESULTS = { topics: [], bundles: [], content: [] };
const RECENTS_KEY = "prysm.recentSearches";
const MAX_RECENTS = 5;

// Static until there's enough usage data to rank real ones — the embeddings /
// click-data version of this is the eventual replacement.
const SUGGESTED_TOPICS = [
  "quantum computing",
  "stoicism",
  "react hooks",
  "systems design",
  "behavioural economics",
  "machine learning",
];

function readRecents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function pushRecent(topic) {
  try {
    const next = [topic, ...readRecents().filter((t) => t !== topic)].slice(
      0,
      MAX_RECENTS,
    );
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — recents are a convenience, not a requirement */
  }
}

function CommandPalette({ open, setOpen }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const [recents, setRecents] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // metaKey covers ⌘ on macOS, ctrlKey covers Ctrl on Windows/Linux.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!open) {
      // The page underneath scrolls behind a fixed overlay otherwise.
      document.body.style.overflow = "";
      return;
    }

    setQuery("");
    setResults(EMPTY_RESULTS);
    setRecents(readRecents());
    document.body.style.overflow = "hidden";
    const focusTimeout = setTimeout(() => inputRef.current?.focus(), 20);

    return () => {
      clearTimeout(focusTimeout);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }

    setSearching(true);
    const debounce = setTimeout(() => {
      apiJson(`/api/search?q=${encodeURIComponent(query)}`, EMPTY_RESULTS)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 200);

    return () => clearTimeout(debounce);
  }, [query]);

  if (!open) return null;

  const goToTopic = (topic) => {
    pushRecent(topic);
    setOpen(false);
    navigate(`/explore/${encodeURIComponent(topic)}`);
  };

  const goToBundle = (id) => {
    setOpen(false);
    navigate(`/prisms/${id}`);
  };

  const openContent = (url) => {
    setOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const trimmedQuery = query.trim();
  const hasResults =
    results.topics.length > 0 ||
    results.bundles.length > 0 ||
    results.content.length > 0;

  return (
    <div className="command-overlay" onClick={() => setOpen(false)}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="command-input-wrapper">
          <IconSearch className="command-input-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you want to learn?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && trimmedQuery) {
                e.preventDefault();
                goToTopic(trimmedQuery.toLowerCase());
              }
            }}
          />
          <kbd className="command-esc">esc</kbd>
        </div>

        <div className="command-body">
          {!trimmedQuery && (
            <>
              {recents.length > 0 && (
                <div className="command-group">
                  <div className="command-group-label">
                    <IconClock className="command-group-icon" />
                    Recent
                  </div>
                  {recents.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      className="command-item"
                      onClick={() => goToTopic(topic)}
                    >
                      <span className="command-item-main">{topic}</span>
                      <IconChevronRight className="command-item-chevron" />
                    </button>
                  ))}
                </div>
              )}

              <div className="command-group">
                <div className="command-group-label">
                  <IconCompass className="command-group-icon" />
                  Try exploring
                </div>
                <div className="command-suggestions">
                  {SUGGESTED_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      className="command-suggestion"
                      onClick={() => goToTopic(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="command-hintbar">
                <span>
                  <kbd>↵</kbd> to explore
                </span>
                <span>
                  <kbd>esc</kbd> to close
                </span>
              </div>
            </>
          )}

          {trimmedQuery && (
            <>
              <div className="command-group">
                <button
                  type="button"
                  className="command-item command-item-primary"
                  onClick={() => goToTopic(trimmedQuery.toLowerCase())}
                >
                  <span className="command-item-icon">
                    <IconSearch />
                  </span>
                  <span className="command-item-main">
                    Explore &ldquo;<strong>{trimmedQuery}</strong>&rdquo;
                  </span>
                  <span className="command-item-meta">
                    {searching ? "searching…" : "↵"}
                  </span>
                </button>
              </div>

              {results.topics.length > 0 && (
                <div className="command-group">
                  <div className="command-group-label">Topics</div>
                  {results.topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      className="command-item"
                      onClick={() => goToTopic(topic)}
                    >
                      <span className="command-item-main">{topic}</span>
                      <IconChevronRight className="command-item-chevron" />
                    </button>
                  ))}
                </div>
              )}

              {results.bundles.length > 0 && (
                <div className="command-group">
                  <div className="command-group-label">Prisms</div>
                  {results.bundles.map((bundle) => (
                    <button
                      key={bundle.id}
                      type="button"
                      className="command-item"
                      onClick={() => goToBundle(bundle.id)}
                    >
                      <span className="command-item-icon">
                        <IconPrism />
                      </span>
                      <span className="command-item-main">{bundle.title}</span>
                      <span className="command-item-meta">{bundle.topic}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.content.length > 0 && (
                <div className="command-group">
                  <div className="command-group-label">Content</div>
                  {results.content.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="command-item"
                      onClick={() => openContent(item.url)}
                    >
                      <span className="command-item-icon">
                        <IconArticles />
                      </span>
                      <span className="command-item-main">{item.title}</span>
                      <span className="command-item-meta">{item.topic}</span>
                    </button>
                  ))}
                </div>
              )}

              {!searching && !hasResults && (
                <p className="command-empty">
                  Nothing curated for that yet — press <kbd>↵</kbd> to pull live
                  results from across the web.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
