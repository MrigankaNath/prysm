import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CATEGORY_ICONS } from "../components/categoryIcons";

const CATEGORY_LABELS = {
  overview: "Overview",
  articles: "Articles",
  videos: "Videos",
  podcasts: "Podcasts",
  books: "Books",
  code: "Code",
  papers: "Research Papers",
  qa: "Q&A",
  discussions: "Discussions",
};

const CATEGORY_ORDER = [
  "overview",
  "articles",
  "videos",
  "podcasts",
  "books",
  "code",
  "papers",
  "qa",
  "discussions",
];

function LiveCard({ item }) {
  return (
    <a className="card" href={item.url} target="_blank" rel="noopener noreferrer">
      <div className="card-title">{item.title}</div>
      <div className="card-meta">
        {item.depth_level ? `${item.depth_level} · ` : ""}
        {item.snippet}
      </div>
    </a>
  );
}

function Feed({ session, interestsVersion }) {
  const [feed, setFeed] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTopic = searchParams.get("topic") || "";
  const [curatedResults, setCuratedResults] = useState([]);
  const [liveCategories, setLiveCategories] = useState(null);
  const [categoryOrder, setCategoryOrder] = useState(CATEGORY_ORDER);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/feed/personalized`, {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setFeed(data));
  }, [session, interestsVersion]);

  useEffect(() => {
    if (!searchTopic) {
      setCuratedResults([]);
      setLiveCategories(null);
      return;
    }

    setSearchLoading(true);
    setLiveCategories(null);

    Promise.all([
      fetch(
        `${import.meta.env.VITE_API_URL}/api/feed?topic=${encodeURIComponent(searchTopic)}`,
      ).then((res) => res.json()),
      fetch(
        `${import.meta.env.VITE_API_URL}/api/explore/${encodeURIComponent(searchTopic)}/live`,
      ).then((res) => res.json()),
    ])
      .then(([curated, live]) => {
        setCuratedResults(curated);
        setLiveCategories(live.categories);
        // The server ranks categories per topic — podcasts lead a philosophy
        // search, code leads a library search. Fall back to a fixed order.
        setCategoryOrder(live.order?.length ? live.order : CATEGORY_ORDER);
      })
      .finally(() => setSearchLoading(false));
  }, [searchTopic]);

  const clearSearch = () => setSearchParams({});

  const hasLiveResults =
    liveCategories &&
    CATEGORY_ORDER.some((key) => {
      const value = liveCategories[key];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });

  return (
    <div className="page">
      {searchTopic && (
        <section className="search-results">
          <div className="search-results-head">
            <h2>Results for &quot;{searchTopic}&quot;</h2>
            <button type="button" className="clear-search" onClick={clearSearch}>
              Clear
            </button>
          </div>
          {searchLoading && <p>Loading...</p>}

          {!searchLoading && curatedResults.length > 0 && (
            <>
              <h3>From Prysm</h3>
              <ul className="card-list">
                {curatedResults.map((item) => (
                  <li key={`curated-${item.id}`}>
                    <a
                      className="card"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="card-title">{item.title}</div>
                      <div className="card-meta">
                        {item.topic} · {item.depth_level} · {item.type}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!searchLoading &&
            liveCategories &&
            categoryOrder.map((key) => {
              const value = liveCategories[key];
              if (!value || (Array.isArray(value) && value.length === 0)) return null;

              const items = Array.isArray(value) ? value : [value];
              const Icon = CATEGORY_ICONS[key];

              return (
                <div key={key}>
                  <h3 className="category-heading">
                    {Icon && <Icon className="category-icon" />}
                    {CATEGORY_LABELS[key] || key}
                  </h3>
                  <ul className="card-list">
                    {items.map((item, i) => (
                      <li key={`${key}-${i}`}>
                        <LiveCard item={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

          {!searchLoading && curatedResults.length === 0 && !hasLiveResults && (
            <p>No results found for this topic.</p>
          )}
        </section>
      )}

      <h2>Today's Feed</h2>
      {feed.length === 0 ? (
        <p>No curated content yet — try searching a topic above.</p>
      ) : (
        <ul className="card-list">
          {feed.map((item) => (
            <li key={item.id}>
              <a className="card" href={item.url} target="_blank" rel="noopener noreferrer">
                <div className="card-title">{item.title}</div>
                <div className="card-meta">
                  {item.topic} · {item.depth_level} · {item.type}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Feed;
