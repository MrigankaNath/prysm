import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTopics, subscribe } from "../lib/library";
import { IconCompass, IconHistory } from "../components/Icons";
import TopicIcon from "../components/TopicIcon";
import { CLUSTERS } from "../lib/clusters";

function Spectrum() {
  const [recent, setRecent] = useState(() => getTopics().slice(0, 6));
  const [openId, setOpenId] = useState(CLUSTERS[0].id);
  const open = CLUSTERS.find((c) => c.id === openId) || CLUSTERS[0];

  useEffect(() => subscribe(() => setRecent(getTopics().slice(0, 6))), []);

  return (
    <div className="page page-wide spectrum">
      <header className="spec-hero">
        <span className="spec-eyebrow">
          <IconCompass className="spec-eyebrow-icon" />
          Spectrum
        </span>
        <h1 className="spec-title">Everything worth looking into</h1>
        <p className="spec-sub">
          Pick a band and follow it. Every topic pulls live results from across
          the web — articles, papers, videos, code and more, sorted by what they
          actually are.
        </p>

        {/*  ILLUSTRATION SLOT — "spectrum banner", full-width ~1080x220.
            The best place for a wide prism/light-split piece.  */}
        <div className="illo-slot illo-slot-banner" aria-hidden="true">
          <span className="illo-hint">wide illustration — prism / light split</span>
        </div>
      </header>

      {recent.length > 0 && (
        <section className="spec-recent">
          <h3 className="spec-recent-head">
            <IconHistory className="spec-recent-icon" />
            Pick up where you left off
          </h3>
          <div className="spec-chip-row">
            {recent.map(({ topic }) => (
              <Link
                key={topic}
                to={`/explore/${encodeURIComponent(topic)}`}
                className="spec-chip"
              >
                {topic}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Twenty-five domains is too many to stack as banner-and-rail sections
          — that was nine thousand pixels of page and no way to see the map.
          They are a grid you pick from, and the one you pick opens below. The
          shape of the list is the point: it should be obvious at a glance that
          this covers music and cooking as well as compilers. */}
      <div className="spec-domains" role="tablist" aria-label="Domains">
        {CLUSTERS.map((cluster) => (
          <button
            key={cluster.id}
            type="button"
            role="tab"
            aria-selected={cluster.id === openId}
            className={`spec-domain${cluster.id === openId ? " active" : ""}`}
            style={{ "--hue": cluster.hue }}
            onClick={() => setOpenId(cluster.id)}
          >
            <TopicIcon
              topic={cluster.label}
              icon={cluster.icon}
              color={cluster.hue}
            />
            <span className="spec-domain-name">{cluster.label}</span>
          </button>
        ))}
      </div>

      <section
        className="spec-cluster"
        style={{ "--hue": open.hue }}
        /* Keyed on the domain so the section animates in again on each pick,
           rather than the text swapping under a static frame. */
        key={open.id}
      >
        <header className="spec-banner">
          <TopicIcon topic={open.label} icon={open.icon} color={open.hue} />
          <div className="spec-banner-copy">
            <span className="spec-banner-eyebrow">
              {open.topics.length} topics
            </span>
            <h3 className="spec-cluster-label">{open.label}</h3>
            <p className="spec-cluster-blurb">{open.blurb}</p>
          </div>
        </header>

        <div className="rail is-lg">
          {open.topics.map((topic) => (
            <Link
              key={topic}
              to={`/explore/${encodeURIComponent(topic)}`}
              className="rail-item"
              style={{ "--hue": open.hue }}
            >
              <span className="rail-tile">
                <TopicIcon topic={topic} color={open.hue} />
              </span>
              <span className="rail-label">{topic}</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Spectrum;
