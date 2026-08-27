import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBookmarks, getHistory, getTopics, subscribe } from "../lib/library";
import ResultCard from "../components/ResultCard";
import TopicIcon from "../components/TopicIcon";
import { apiJson } from "../lib/api";
import {
  IconBookmark,
  IconHistory,
  IconCompass,
  IconChevronRight,
} from "../components/Icons";

function Feed({ session }) {
  const [discover, setDiscover] = useState({ topics: [], items: [] });
  /* Without this the empty state renders for a beat before the fetch resolves,
     so every visit flashes "Nothing here yet" at someone who has plenty. */
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
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

  useEffect(() => {
    apiJson("/api/feed/discover", { topics: [], items: [] })
      .then((data) =>
        setDiscover({
          topics: data?.topics || [],
          items: Array.isArray(data?.items) ? data.items : [],
        }),
      )
      .finally(() => setLoading(false));
  }, [session]);

  const { bookmarks, history, topics } = library;
  const isEmpty =
    !loading &&
    bookmarks.length === 0 &&
    history.length === 0 &&
    discover.items.length === 0 &&
    topics.length === 0;

  // Topics come from the account when it has them, falling back to whatever
  // this device recorded — so the section is never empty on a fresh browser
  // that has an account, or on a signed-out one that has local history.
  const topicList = discover.topics.length
    ? discover.topics.map((topic) => ({ topic, total: null }))
    : topics.map(({ topic, total }) => ({ topic, total }));

  const visibleItems = showAll ? discover.items : discover.items.slice(0, 8);

  return (
    <div className="page page-wide feed">
      <header className="feed-head">
        <div>
          <h1 className="feed-title">Your feed</h1>
          <p className="feed-sub">
            Built from what you&rsquo;ve saved and searched — not from what&rsquo;s
            trending.
          </p>
        </div>

        {/*  ILLUSTRATION SLOT — "feed mark", ~200x140.  */}
        <div className="illo-slot illo-slot-head" aria-hidden="true">
          <span className="illo-hint">illustration</span>
        </div>
      </header>

      {isEmpty && (
        <div className="feed-empty">
          <p className="feed-empty-title">Nothing here yet</p>
          <p className="feed-empty-copy">
            Search any topic and it starts filling in. Press{" "}
            <kbd className="inline-kbd">⌘K</kbd>, or browse the{" "}
            <Link to="/spectrum" className="inline-link">
              Spectrum
            </Link>
            .
          </p>
        </div>
      )}

      {topicList.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconCompass className="feed-section-icon" />
            Continue exploring
          </h3>
          <div className="feed-topic-row">
            {topicList.slice(0, 8).map(({ topic, total }) => (
              <Link
                key={topic}
                to={`/explore/${encodeURIComponent(topic)}`}
                className="feed-topic-card"
              >
                <span className="feed-topic-head">
                  <TopicIcon topic={topic} />
                  <span className="feed-topic-name">{topic}</span>
                </span>
                <span className="feed-topic-meta">
                  {total !== null ? `${total} results` : "Open"}{" "}
                  <IconChevronRight />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {discover.items.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconCompass className="feed-section-icon" />
            Because you searched
          </h3>
          <div className="cat-cols">
            {visibleItems.map((item) => (
              <ResultCard
                key={item.url}
                item={item}
                topic={item.topic || ""}
                category={item.category || "articles"}
              />
            ))}
          </div>
          {discover.items.length > 8 && (
            <button
              type="button"
              className="cat-expand"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? "Show less"
                : `Show ${discover.items.length - 8} more`}
            </button>
          )}
        </section>
      )}

      {bookmarks.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconBookmark className="feed-section-icon" />
            Saved for later
            <Link to="/wavelength" className="feed-section-link">
              All {bookmarks.length}
            </Link>
          </h3>
          <div className="cat-stack">
            {bookmarks.slice(0, 4).map((item) => (
              <ResultCard
                key={item.url}
                item={item}
                topic={item.topic || ""}
                category={item.category || "articles"}
              />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconHistory className="feed-section-icon" />
            Recently opened
            <Link to="/wavelength" className="feed-section-link">
              All {history.length}
            </Link>
          </h3>
          <div className="cat-stack">
            {history.slice(0, 4).map((item) => (
              <ResultCard
                key={item.url}
                item={item}
                topic={item.topic || ""}
                category={item.category || "articles"}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Feed;
