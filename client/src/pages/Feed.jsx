import { useState, useEffect } from "react";

function Feed() {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/feed/daily`)
      .then((res) => res.json())
      .then((data) => setFeed(data));
  }, []);

  return (
    <div>
      <h2>Today's Feed</h2>
      <ul>
        {feed.map((item) => (
          <li key={item.id}>
            {item.title} — {item.topic} ({item.depth_level})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Feed;
