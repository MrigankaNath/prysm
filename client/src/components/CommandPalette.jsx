import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const EMPTY_RESULTS = { topics: [], bundles: [], content: [] };

function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      return;
    }

    const debounce = setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then(setResults);
    }, 200);

    return () => clearTimeout(debounce);
  }, [query]);

  if (!open) return null;

  const goToTopic = (topic) => {
    setOpen(false);
    navigate(`/?topic=${encodeURIComponent(topic)}`);
  };

  const goToBundle = (id) => {
    setOpen(false);
    navigate(`/prisms/${id}`);
  };

  const openContent = (url) => {
    setOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const hasResults =
    results.topics.length > 0 || results.bundles.length > 0 || results.content.length > 0;

  return (
    <div className="command-overlay" onClick={() => setOpen(false)}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search topics, prisms, content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {query.trim() && !hasResults && (
          <div className="command-empty">No results</div>
        )}

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
    </div>
  );
}

export default CommandPalette;
