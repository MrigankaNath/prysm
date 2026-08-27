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

/* Slash commands. Two kinds, because scoping a 10-item Prism library is thin
   on its own — the navigation ones are what make this a command palette
   rather than a search box.
   `scope` narrows what a query searches; `to` jumps straight to a page. */
const COMMANDS = [
  { key: "explore", hint: "topic", label: "Explore a topic live", scope: "explore" },
  { key: "prism", hint: "query", label: "Search Prisms only", scope: "prism", to: "/prisms" },
  { key: "spectrum", label: "Browse the Spectrum", to: "/spectrum" },
  { key: "saved", label: "Your saved items", to: "/wavelength" },
  { key: "feed", label: "Your feed", to: "/" },
];

/** Split "/prism react hooks" into its command and the rest of the query. */
function parseCommand(raw) {
  const match = /^\/(\w*)\s*(.*)$/s.exec(raw);
  if (!match) return { command: null, rest: raw, partial: null };

  const [, word, rest] = match;
  const command = COMMANDS.find((c) => c.key === word.toLowerCase());
  // Still typing the command name — show the menu filtered to what matches.
  if (!command) return { command: null, rest: "", partial: word.toLowerCase() };
  return { command, rest, partial: null };
}
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
  /* The active command is state, not part of the input value. Keeping it in
     the text meant it rendered twice — once as the chip, once as the typed
     "/prism" still sitting in the field. */
  const [scope, setScope] = useState(null);
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
    setScope(null);
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
    const term = query.trim();

    if (!term) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }

    setSearching(true);
    const debounce = setTimeout(() => {
      apiJson(`/api/search?q=${encodeURIComponent(term)}`, EMPTY_RESULTS)
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

  const { partial } = parseCommand(query);
  const command = scope;
  const trimmedQuery = query.trim();
  const showCommandMenu = !scope && partial !== null;
  const matchingCommands = showCommandMenu
    ? COMMANDS.filter((c) => c.key.startsWith(partial))
    : [];

  const runCommand = (c) => {
    if (c.to && !c.scope) {
      setOpen(false);
      navigate(c.to);
      return;
    }
    // Promote to a chip and hand the empty field back for the actual query.
    setScope(c);
    setQuery("");
    inputRef.current?.focus();
  };
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
          {command && (
            <span className={`command-scope scope-${command.key}`}>
              /{command.key}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you want to learn?"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              // "/prism " (name + space) promotes straight to a chip, so the
              // command never lingers as text next to its own chip.
              const done = !scope && /^\/(\w+)\s$/.exec(value);
              const matched =
                done && COMMANDS.find((c) => c.key === done[1].toLowerCase());
              if (matched) {
                runCommand(matched);
                return;
              }
              setQuery(value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (showCommandMenu && matchingCommands[0]) {
                  e.preventDefault();
                  runCommand(matchingCommands[0]);
                } else if (trimmedQuery && command?.scope !== "prism") {
                  e.preventDefault();
                  goToTopic(trimmedQuery.toLowerCase());
                }
              }
              // Backspace on an empty query drops the scope rather than
              // stranding you in a mode you can't see how to leave.
              if (e.key === "Backspace" && scope && !query) {
                e.preventDefault();
                setScope(null);
              }
            }}
          />
          <kbd className="command-esc">esc</kbd>
        </div>

        <div className="command-body">
          {showCommandMenu && (
            <div className="command-group">
              <div className="command-group-label">Commands</div>
              {matchingCommands.length === 0 && (
                <p className="command-empty">No command matches that.</p>
              )}
              {matchingCommands.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="command-item"
                  onClick={() => runCommand(c)}
                >
                  <span className={`command-scope scope-${c.key}`}>/{c.key}</span>
                  <span className="command-item-main">{c.label}</span>
                  {c.hint && <span className="command-item-meta">{c.hint}</span>}
                </button>
              ))}
            </div>
          )}

          {!showCommandMenu && !command && !trimmedQuery && (
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

              <div className="command-group">
                <div className="command-group-label">Commands</div>
                <div className="command-suggestions">
                  {COMMANDS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      className={`command-cmdchip scope-${c.key}`}
                      onClick={() => runCommand(c)}
                    >
                      /{c.key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="command-hintbar">
                <span>
                  <kbd>/</kbd> for commands
                </span>
                <span>
                  <kbd>↵</kbd> to explore
                </span>
                <span>
                  <kbd>esc</kbd> to close
                </span>
              </div>
            </>
          )}

          {!showCommandMenu && command && !trimmedQuery && (
            <div className="command-group">
              {/* A navigation command is an action, so it gets a row you can
                  click. Telling someone to press a key and giving them nothing
                  to aim at is the usual way this pattern goes wrong. */}
              {command.to && !command.scope ? (
                <button
                  type="button"
                  className="command-item command-item-primary"
                  onClick={() => {
                    setOpen(false);
                    navigate(command.to);
                  }}
                >
                  <span className={`command-scope scope-${command.key}`}>
                    /{command.key}
                  </span>
                  <span className="command-item-main">{command.label}</span>
                  <span className="command-item-meta">↵</span>
                </button>
              ) : (
                <p className="command-empty">
                  {command.scope === "prism"
                    ? "Type to search Prisms by title or topic."
                    : "Type a topic to pull live results from across the web."}
                </p>
              )}
            </div>
          )}

          {!showCommandMenu && trimmedQuery && (
            <>
              {command?.scope !== "prism" && (
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
              )}

              {command?.scope !== "prism" && results.topics.length > 0 && (
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

              {command?.scope !== "prism" && results.content.length > 0 && (
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

              {!searching && command?.scope === "prism" && results.bundles.length === 0 && (
                <p className="command-empty">
                  No Prism matches &ldquo;{trimmedQuery}&rdquo;. Ten exist so far
                  — clear the <kbd>/prism</kbd> scope to search everything.
                </p>
              )}

              {!searching && command?.scope !== "prism" && !hasResults && (
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
