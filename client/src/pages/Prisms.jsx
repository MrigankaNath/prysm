import { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";

// Lazy so three.js / R3F stay out of the main bundle — same reason the Hero page
// is code-split. Only users who visit this page pay for the 3D dependencies.
const PrismModel = lazy(() => import("../components/PrismModel"));

function Prisms({ session, interestsVersion }) {
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    const fetchGeneric = () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/bundles`)
        .then((res) => res.json())
        .then(setBundles);

    if (!session) {
      fetchGeneric();
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/bundles/recommended`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((recommended) => {
        if (recommended.length > 0) {
          setBundles(recommended);
        } else {
          fetchGeneric();
        }
      });
  }, [session, interestsVersion]);

  return (
    <div className="page">
      <header className="prisms-header">
        <div className="prisms-header-model" aria-hidden="true">
          <Suspense fallback={null}>
            <PrismModel />
          </Suspense>
        </div>
        <div className="prisms-header-copy">
          <h2>Prisms</h2>
          <p>
            Curated paths through a topic — ordered beginner to advanced, so you
            know where to start and what comes next.
          </p>
        </div>
      </header>

      {bundles.length === 0 ? (
        <p>No Prisms curated yet.</p>
      ) : (
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
      )}
    </div>
  );
}

export default Prisms;
