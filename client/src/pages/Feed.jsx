import { useState, useEffect } from "react";

function Feed({ session, interestsVersion }) {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/feed/personalized`, {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setFeed(Array.isArray(data) ? data : []));
  }, [session, interestsVersion]);

  return (
    <div className="page">
      <h2>Today&apos;s Feed</h2>
      {feed.length === 0 ? (
        <p>No curated content yet — press ⌘K to explore any topic.</p>
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
