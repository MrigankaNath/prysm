import { useState, useEffect } from "react";

function App() {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/feed")
      .then((res) => res.json())
      .then((data) => setFeed(data));
  }, []);

  return (
    <div>
      <h1>Prysm</h1>
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

export default App;
