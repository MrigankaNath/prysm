import { useState, useEffect } from "react";

function Feed() {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/feed/daily`)
      .then((res) => res.json())
      .then((data) => setFeed(data));
  }, []);

  return (
    <div className="page">
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
