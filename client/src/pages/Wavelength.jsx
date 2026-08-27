import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getBookmarks,
  getHistory,
  getTopics,
  removeBookmark,
  subscribe,
} from "../lib/library";
import ResultCard from "../components/ResultCard";
import TopicIcon from "../components/TopicIcon";
import { IconBookmark, IconHistory, IconTarget } from "../components/Icons";

const TABS = [
  { id: "saved", label: "Saved", Icon: IconBookmark },
  { id: "history", label: "History", Icon: IconHistory },
  { id: "topics", label: "Topics", Icon: IconTarget },
];

function Wavelength() {
  const [tab, setTab] = useState("saved");
  const [library, setLibrary] = useState(() => ({
    bookmarks: getBookmarks(),
    history: getHistory(),
    topics: getTopics(),
  }));

  useEffect(
    () =>
      subscribe(() =>
        setLibrary({
          bookmarks: getBookmarks(),
          history: getHistory(),
          topics: getTopics(),
        }),
      ),
    [],
  );

  const counts = {
    saved: library.bookmarks.length,
    history: library.history.length,
    topics: library.topics.length,
  };

  return (
    <div className="page page-wide wavelength">
      <header className="wl-head">
        <div>
          <h1 className="wl-title">Wavelength</h1>
          <p className="wl-subtitle">
            What you&rsquo;ve saved, what you&rsquo;ve opened, and where
            you&rsquo;ve been looking.
          </p>
        </div>

        {/*  ILLUSTRATION SLOT — "your wavelength", ~200x140.
            A personal/abstract mark next to the page title.  */}
        <div className="illo-slot illo-slot-head" aria-hidden="true">
          <span className="illo-hint">illustration</span>
        </div>
      </header>

      <div className="wl-tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`wl-tab${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon className="wl-tab-icon" />
            {label}
            <span className="wl-tab-count">{counts[id]}</span>
          </button>
        ))}
      </div>

      {tab === "saved" &&
        (library.bookmarks.length === 0 ? (
          <p className="wl-empty">
            Nothing saved yet. Hit the bookmark on any result and it lands
            here.{" "}
            <Link to="/spectrum" className="inline-link">
              Find something to read
            </Link>
            .
          </p>
        ) : (
          <div className="cat-stack">
            {library.bookmarks.map((item) => (
              <div key={item.url} className="wl-saved-row">
                <ResultCard
                  item={item}
                  topic={item.topic || ""}
                  category={item.category || "articles"}
                />
                <button
                  type="button"
                  className="wl-remove"
                  onClick={() => removeBookmark(item.url)}
                  aria-label="Remove from saved"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ))}

      {tab === "history" &&
        (library.history.length === 0 ? (
          <p className="wl-empty">
            Nothing opened yet — anything you click from a search shows up here.
          </p>
        ) : (
          <div className="cat-stack">
            {library.history.map((item) => (
              <ResultCard
                key={item.url}
                item={item}
                topic={item.topic || ""}
                category={item.category || "articles"}
              />
            ))}
          </div>
        ))}

      {tab === "topics" &&
        (library.topics.length === 0 ? (
          <p className="wl-empty">
            No topics explored yet. Press{" "}
            <kbd className="inline-kbd">⌘K</kbd> and search for anything.
          </p>
        ) : (
          <div className="wl-topic-grid">
            {library.topics.map(({ topic, total }) => (
              <Link
                key={topic}
                to={`/explore/${encodeURIComponent(topic)}`}
                className="wl-topic-tile"
              >
                <span className="feed-topic-head">
                  <TopicIcon topic={topic} />
                  <span className="wl-topic-name">{topic}</span>
                </span>
                <span className="wl-topic-meta">{total} results</span>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}

export default Wavelength;
