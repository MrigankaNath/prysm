import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const SOURCE_LABELS = {
  hackernews: "Hacker News",
  wikipedia: "Wikipedia",
  arxiv: "arXiv",
};

function Feed() {
  const [feed, setFeed] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTopic = searchParams.get("topic") || "";
  const [query, setQuery] = useState(searchTopic);
  const [curatedResults, setCuratedResults] = useState([]);
  const [liveResults, setLiveResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/feed/daily`)
      .then((res) => res.json())
      .then((data) => setFeed(data));
  }, []);

  useEffect(() => {
    setQuery(searchTopic);

    if (!searchTopic) {
      setCuratedResults([]);
      setLiveResults(null);
      return;
    }

    setSearchLoading(true);
    setLiveResults(null);

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
        setLiveResults(live.sources);
      })
      .finally(() => setSearchLoading(false));
  }, [searchTopic]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim().toLowerCase();
    if (trimmed) setSearchParams({ topic: trimmed });
  };

  const clearSearch = () => {
    setQuery("");
    setSearchParams({});
  };

  const hasLiveResults =
    liveResults && Object.values(liveResults).some((items) => items.length > 0);

  return (
    <div className="page">
      <form className="topic-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search a topic to explore..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
        {searchTopic && (
          <button type="button" className="clear-search" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

      {searchTopic && (
        <section className="search-results">
          <h2>Results for &quot;{searchTopic}&quot;</h2>
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
            liveResults &&
            Object.entries(liveResults).map(
              ([source, items]) =>
                items.length > 0 && (
                  <div key={source}>
                    <h3>From {SOURCE_LABELS[source] || source}</h3>
                    <ul className="card-list">
                      {items.map((item, i) => (
                        <li key={`${source}-${i}`}>
                          <a
                            className="card"
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="card-title">{item.title}</div>
                            <div className="card-meta">{item.snippet}</div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
            )}

          {!searchLoading && curatedResults.length === 0 && !hasLiveResults && (
            <p>No results found for this topic.</p>
          )}
        </section>
      )}

      <h2>Today's Feed</h2>
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
    </div>
  );
}

export default Feed;
