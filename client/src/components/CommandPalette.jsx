import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiJson } from "../lib/api";
import { getBookmarks, getHistory, getTopics } from "../lib/library";
import { SPECTRUM_TOPICS } from "../lib/clusters";
import {
  IconSearch,
  IconClock,
  IconCompass,
  IconChevronRight,
  IconPrism,
  IconArticles,
} from "./Icons";

const EMPTY_RESULTS = { topics: [], bundles: [], content: [] };

/* Slash commands. Every one of them scopes a search rather than jumping
   somewhere: picking `/spectrum` used to close the palette and navigate, which
   threw away the query you were half way through typing and left you to start
   again in a different search box. Now the command becomes a chip in the field
   and what you type next is searched inside it.
   `to` is still here, but as a row you can choose once the scope is on — going
   to the page is an option, not the only outcome. */
const COMMANDS = [
  { key: "explore", hint: "topic", label: "Explore a topic live", scope: "explore" },
  { key: "prism", hint: "query", label: "Search Prisms", scope: "prism", to: "/prisms", go: "Open Prisms" },
  { key: "spectrum", hint: "topic", label: "Search the Spectrum", scope: "spectrum", to: "/spectrum", go: "Browse the Spectrum" },
  { key: "saved", hint: "title", label: "Search your saved items", scope: "saved", to: "/wavelength", go: "Open your saved items" },
  { key: "feed", hint: "topic", label: "Search your feed", scope: "feed", to: "/", go: "Open your feed" },
];

/* Scopes answered from what's already on the device — no request, so results
   appear as fast as you type. `prism` isn't here because the Prism library
   lives on the server. */
const LOCAL_SCOPES = new Set(["spectrum", "saved", "feed"]);

function matches(haystack, term) {
  return String(haystack || "").toLowerCase().includes(term);
}

/** The rows a local scope shows for `term`, normalised to one shape. */
function localResults(scope, term) {
  const q = term.trim().toLowerCase();

  if (scope === "spectrum") {
    const all = SPECTRUM_TOPICS;
    const hits = q
      ? all.filter((t) => matches(t.topic, q) || matches(t.cluster, q))
      : all;
    return hits.slice(0, 8).map((t) => ({
      id: t.topic,
      main: t.topic,
      meta: t.cluster,
      topic: t.topic,
    }));
  }

  if (scope === "saved") {
    const hits = getBookmarks().filter(
      (b) => !q || matches(b.title, q) || matches(b.topic, q),
    );
    return hits.slice(0, 8).map((b) => ({
      id: b.url,
      main: b.title,
      meta: b.topic,
      url: b.url,
    }));
  }

  // feed — your own history and the topics you've explored.
  const seen = new Set();
  const rows = [];
  for (const item of getHistory()) {
    if (q && !matches(item.title, q) && !matches(item.topic, q)) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    rows.push({ id: item.url, main: item.title, meta: item.topic, url: item.url });
  }
  for (const { topic } of getTopics()) {
    if (q && !matches(topic, q)) continue;
    if (seen.has(topic)) continue;
    seen.add(topic);
    rows.push({ id: topic, main: topic, meta: "topic", topic });
  }
  return rows.slice(0, 8);
}

/** Split "/prism react hooks" into its command and the rest of the query. */
function parseCommand(raw) {
  const match = /^\/(\w*)\s*(.*)$/s.exec(raw);
  if (!match) return { command: null, rest: raw, partial: null };

  const [, word, rest] = match;
  const command = COMMANDS.find((c) => c.key === word.toLowerCase());
  // Still typing the command name — show the menu filtered to what matches.
  if (!command) return { command: null, rest: "", partial: word.toLowerCase() };
  /* A complete name with nothing after it is still uncommitted: "/saved" could
     be on its way to nothing else, but the user hasn't pressed anything yet.
     Keeping the menu up gives Enter and Tab something to accept — without
     this, typing the whole command and hitting Enter searched the web for the
     literal string "/saved". */
  if (!rest) return { command, rest: "", partial: word.toLowerCase() };
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

const SCOPE_LABELS = {
  spectrum: "Spectrum topics",
  saved: "Saved",
  feed: "Your feed",
};

const SCOPE_EMPTY = {
  spectrum: "No topics here yet.",
  saved: "You haven't saved anything yet.",
  feed: "Nothing in your feed yet — explore a topic to start it.",
};

/** One list shape for every scope answered from this device. */
function LocalRows({ label, rows, onPick, emptyText }) {
  return (
    <div className="command-group">
      <div className="command-group-label">{label}</div>
      {rows.length === 0 ? (
        <p className="command-empty">{emptyText}</p>
      ) : (
        rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className="command-item"
            onClick={() => onPick(row)}
          >
            <span className="command-item-main">{row.main}</span>
            {row.meta && <span className="command-item-meta">{row.meta}</span>}
          </button>
        ))
      )}
    </div>
  );
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

    // A local scope reads from this device, so the request would be discarded.
    if (!term || LOCAL_SCOPES.has(scope?.scope)) {
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
  }, [query, scope]);

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

  /* Always promotes to a chip and hands the empty field back. Navigating on
     selection is what the old version did, and it discarded whatever you were
     typing at the moment you told it what you were looking for. */
  const runCommand = (c) => {
    setScope(c);
    setQuery("");
    inputRef.current?.focus();
  };

  const goToPage = (to) => {
    setOpen(false);
    navigate(to);
  };

  const isLocal = LOCAL_SCOPES.has(command?.scope);
  const localRows = isLocal ? localResults(command.scope, query) : [];

  const openRow = (row) => {
    if (row.url) return openContent(row.url);
    if (row.topic) return goToTopic(row.topic);
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
              /* A name followed by a space promotes straight to a chip, so the
                 command never lingers as text next to its own chip. The tail is
                 kept rather than dropped, so pasting "/prism react hooks" whole
                 scopes and searches instead of being read as a topic. */
              const done = !scope && /^\/(\w+)\s(.*)$/s.exec(value);
              const matched =
                done && COMMANDS.find((c) => c.key === done[1].toLowerCase());
              if (matched) {
                setScope(matched);
                setQuery(done[2]);
                return;
              }
              setQuery(value);
            }}
            onKeyDown={(e) => {
              /* Tab completes the command the same way Enter does. It is what
                 people reach for to accept a suggestion, and leaving it to move
                 focus out of the field mid-search is its own small betrayal. */
              if ((e.key === "Enter" || e.key === "Tab") && showCommandMenu) {
                if (matchingCommands[0]) {
                  e.preventDefault();
                  runCommand(matchingCommands[0]);
                  return;
                }
              }

              if (e.key === "Enter" && !showCommandMenu) {
                // Inside a local scope, Enter takes the first match rather
                // than abandoning the scope to run a live search.
                if (isLocal) {
                  if (localRows[0]) {
                    e.preventDefault();
                    openRow(localRows[0]);
                  }
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
            <>
              {/* Going to the page is still available — it just isn't automatic
                  any more. Telling someone to press a key and giving them
                  nothing to aim at is the usual way this pattern goes wrong. */}
              {command.to && (
                <div className="command-group">
                  <button
                    type="button"
                    className="command-item"
                    onClick={() => goToPage(command.to)}
                  >
                    <span className={`command-scope scope-${command.key}`}>
                      /{command.key}
                    </span>
                    <span className="command-item-main">{command.go}</span>
                    <IconChevronRight className="command-item-chevron" />
                  </button>
                </div>
              )}

              {isLocal ? (
                <LocalRows
                  label={SCOPE_LABELS[command.scope]}
                  rows={localRows}
                  onPick={openRow}
                  emptyText={SCOPE_EMPTY[command.scope]}
                />
              ) : (
                <div className="command-group">
                  <p className="command-empty">
                    {command.scope === "prism"
                      ? "Type to search Prisms by title or topic."
                      : "Type a topic to pull live results from across the web."}
                  </p>
                </div>
              )}
            </>
          )}

          {!showCommandMenu && trimmedQuery && isLocal && (
            <LocalRows
              label={SCOPE_LABELS[command.scope]}
              rows={localRows}
              onPick={openRow}
              emptyText={`Nothing in ${SCOPE_LABELS[command.scope].toLowerCase()} matches that.`}
            />
          )}

          {!showCommandMenu && trimmedQuery && !isLocal && (
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
