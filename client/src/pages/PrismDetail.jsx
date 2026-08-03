import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function PrismDetail() {
  const { id } = useParams();
  const [bundle, setBundle] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/bundles/${id}`)
      .then((res) => res.json())
      .then((data) => setBundle(data));
  }, [id]);

  if (!bundle) return <p className="page">Loading...</p>;

  return (
    <div className="page">
      <h2>{bundle.title}</h2>
      <p>{bundle.description}</p>
      <ol className="card-list">
        {bundle.items.map((item) => (
          <li key={item.id}>
            <a className="card" href={item.url} target="_blank" rel="noopener noreferrer">
              <div className="card-title">{item.title}</div>
              <div className="card-meta">{item.depth_level} · {item.type}</div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default PrismDetail;
