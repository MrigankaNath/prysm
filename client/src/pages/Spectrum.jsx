import { useState, useEffect } from "react";

function Spectrum() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/feed`)
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  return (
    <div className="page">
      <h2>Spectrum</h2>
      {items.length === 0 ? (
        <p>No curated content yet.</p>
      ) : (
        <ul className="card-list">
          {items.map((item) => (
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

export default Spectrum;
