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

  if (!bundle) return <p>Loading...</p>;

  return (
    <div>
      <h2>{bundle.title}</h2>
      <p>{bundle.description}</p>
      <ol>
        {bundle.items.map((item) => (
          <li key={item.id}>
            {item.title} ({item.depth_level})
          </li>
        ))}
      </ol>
    </div>
  );
}

export default PrismDetail;
