import { useState, useEffect } from "react";

function Spectrum() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/feed`)
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  return (
    <div>
      <h2>Spectrum</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.title} — {item.topic} ({item.depth_level})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Spectrum;
