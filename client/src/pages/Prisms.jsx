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
    <div>
      <h2>Prisms</h2>
      <ul>
        {bundles.map((bundle) => (
          <li key={bundle.id}>
            <Link to={`/prisms/${bundle.id}`}>{bundle.title}</Link> —{" "}
            {bundle.topic}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Prisms;
