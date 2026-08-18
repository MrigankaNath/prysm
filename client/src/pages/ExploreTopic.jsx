import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "../components/categories";

function LiveCard({ item }) {
  return (
    <a className="card" href={item.url} target="_blank" rel="noopener noreferrer">
      <div className="card-title">{item.title}</div>
      <div className="card-meta">
        {item.depth_level ? `${item.depth_level} · ` : ""}
        {item.snippet}
      </div>
    </a>
  );
}

function ExploreTopic() {
  const { topic = "" } = useParams();
  const [curated, setCurated] = useState([]);
  const [categories, setCategories] = useState(null);
  const [order, setOrder] = useState(CATEGORY_ORDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topic) return;

    setLoading(true);
    setCategories(null);

    Promise.all([
      fetch(
        `${import.meta.env.VITE_API_URL}/api/feed?topic=${encodeURIComponent(topic)}`,
      ).then((res) => res.json()),
      fetch(
        `${import.meta.env.VITE_API_URL}/api/explore/${encodeURIComponent(topic)}/live`,
      ).then((res) => res.json()),
    ])
      .then(([curatedItems, live]) => {
        setCurated(Array.isArray(curatedItems) ? curatedItems : []);
        setCategories(live.categories || null);
        setOrder(live.order?.length ? live.order : CATEGORY_ORDER);
      })
      .finally(() => setLoading(false));
  }, [topic]);

  const hasLive =
    categories &&
    Object.values(categories).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    );

  return (
    <div className="page">
      <header className="explore-head">
        <span className="explore-eyebrow">Exploring</span>
        <h1 className="explore-title">{topic}</h1>
      </header>

      {loading && <p className="explore-loading">Gathering the best of the web…</p>}

      {!loading && curated.length > 0 && (
        <section>
          <h3 className="category-heading">From Prysm</h3>
          <ul className="card-list">
            {curated.map((item) => (
              <li key={`curated-${item.id}`}>
                <a
                  className="card"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="card-title">{item.title}</div>
                  <div className="card-meta">
                    {item.topic} · {item.depth_level} · {item.type}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading &&
        categories &&
        order.map((key) => {
          const value = categories[key];
          if (!value || (Array.isArray(value) && value.length === 0)) return null;

          const items = Array.isArray(value) ? value : [value];
          const Icon = CATEGORY_ICONS[key];

          return (
            <section key={key}>
              <h3 className="category-heading">
                {Icon && <Icon className="category-icon" />}
                {CATEGORY_LABELS[key] || key}
              </h3>
              <ul className="card-list">
                {items.map((item, i) => (
                  <li key={`${key}-${i}`}>
                    <LiveCard item={item} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      {!loading && !hasLive && curated.length === 0 && (
        <p>
          Nothing found for this topic. <Link to="/">Back to your feed</Link>
        </p>
      )}
    </div>
  );
}

export default ExploreTopic;
