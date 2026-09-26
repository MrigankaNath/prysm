import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DiscoveryFeed from "../components/DiscoveryFeed";
import { apiJson } from "../lib/api";
import { IconChevronRight } from "../components/Icons";
import feedIllo from "../assets/feed.svg";

function Feed({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    apiJson("/api/feed/discover", { items: [] })
      .then((data) => setItems(Array.isArray(data?.items) ? data.items : []))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="page page-wide feed">
      <header className="feed-head">
        <div className="feed-head-copy">
          <h1 className="feed-title">Your feed</h1>
          <p className="feed-sub">Good things to check out, drawn from the topics you explore.</p>
        </div>

        <figure className="feed-illo" aria-hidden="true">
          <img src={feedIllo} alt="" />
        </figure>
      </header>

      {!loading && items.length === 0 && (
        <div className="feed-empty">
          <p className="feed-empty-title">Nothing to discover yet</p>
          <p className="feed-empty-copy">
            Search a topic and new discoveries will appear here. Press{" "}
            <kbd className="inline-kbd">⌘K</kbd> to search from anywhere.
          </p>
          <Link to="/spectrum" className="btn-bounce">
            Browse the Spectrum
            <IconChevronRight />
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">Because you searched</h3>
          <DiscoveryFeed items={items} limit={showAll ? undefined : 8} />
          {items.length > 8 && (
            <button
              type="button"
              className="cat-expand"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? "Show less"
                : `Show ${items.length - 8} more`}
            </button>
          )}
        </section>
      )}

    </div>
  );
}

export default Feed;
