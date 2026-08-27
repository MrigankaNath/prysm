import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTopics, subscribe } from "../lib/library";
import { IconCompass, IconHistory } from "../components/Icons";
import TopicIcon from "../components/TopicIcon";
import { CLUSTERS } from "../lib/clusters";

function Spectrum() {
  const [recent, setRecent] = useState(() => getTopics().slice(0, 6));

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

      <div className="spec-clusters">
        {CLUSTERS.map((cluster, i) => (
          <section
            key={cluster.id}
            className="spec-cluster"
            style={{ "--hue": cluster.hue, "--stagger": `${i * 70}ms` }}
          >
            <header className="spec-banner">
              <TopicIcon
                topic={cluster.label}
                icon={cluster.icon}
                color={cluster.hue}
              />
              <div className="spec-banner-copy">
                <span className="spec-banner-eyebrow">
                  {cluster.topics.length} topics
                </span>
                <h3 className="spec-cluster-label">{cluster.label}</h3>
                <p className="spec-cluster-blurb">{cluster.blurb}</p>
              </div>
            </header>

            <div className="rail is-lg">
              {cluster.topics.map((topic) => (
                <Link
                  key={topic}
                  to={`/explore/${encodeURIComponent(topic)}`}
                  className="rail-item"
                  style={{ "--hue": cluster.hue }}
                >
                  <span className="rail-tile">
                    <TopicIcon topic={topic} color={cluster.hue} />
                  </span>
                  <span className="rail-label">{topic}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Spectrum;
