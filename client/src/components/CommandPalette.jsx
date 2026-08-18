import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const EMPTY_RESULTS = { topics: [], bundles: [], content: [] };

function CommandPalette({ open, setOpen }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
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
    if (open) {
      setQuery("");
      setResults(EMPTY_RESULTS);
      const focusTimeout = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(focusTimeout);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }

    setSearching(true);
    const debounce = setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then(setResults)
        .finally(() => setSearching(false));
    }, 200);

    return () => clearTimeout(debounce);
  }, [query]);

  if (!open) return null;

  const goToTopic = (topic) => {
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

  return (
    <div className="command-overlay" onClick={() => setOpen(false)}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-wrapper">
          <svg
            className="command-input-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for anything"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Enter goes straight to exploring the typed topic — previously it
              // did nothing at all and you had to click the row.
              if (e.key === "Enter" && query.trim()) {
                e.preventDefault();
                goToTopic(query.trim().toLowerCase());
              }
            }}
          />
        </div>

        {trimmedQuery && (
          <div className="command-results">
            <div className="command-group">
              <div className="command-group-label">Explore</div>
              <button
                type="button"
                className="command-item command-item-primary"
                onClick={() => goToTopic(trimmedQuery.toLowerCase())}
              >
                <span>
                  Explore &ldquo;<strong>{trimmedQuery}</strong>&rdquo;
                </span>
                <span className="command-item-meta">
                  {searching ? "searching…" : "press ↵"}
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
                    {topic}
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
                    {bundle.title}
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
                    {item.title}
                    <span className="command-item-meta">{item.topic}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommandPalette;
