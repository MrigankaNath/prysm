import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Prisms() {
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/bundles`)
      .then((res) => res.json())
      .then((data) => setBundles(data));
  }, []);

  return (
    <div className="page">
      <h2>Prisms</h2>
      <ul className="card-list">
        {bundles.map((bundle) => (
          <li key={bundle.id}>
            <Link className="card" to={`/prisms/${bundle.id}`}>
              <div className="card-title">{bundle.title}</div>
              <div className="card-meta">{bundle.topic}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Prisms;
