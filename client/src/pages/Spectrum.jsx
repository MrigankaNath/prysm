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

      {/* An index, not a tab bar.
          The first version of this showed one domain at a time and hid the
          other twenty-three, which is the wrong trade for a page whose whole
          job is browsing: it put 144 of the 150 topics behind a click, and the
          panel opened below the grid rather than where the eye was. These jump
          to a section instead. Everything stays on the page; this is for
          getting to it quickly. */}
      <nav className="spec-index" aria-label="Jump to a domain">
        {CLUSTERS.map((cluster) => (
          <a
            key={cluster.id}
            href={`#domain-${cluster.id}`}
            className="spec-domain"
            style={{ "--hue": cluster.hue }}
          >
            <TopicIcon
              topic={cluster.label}
              icon={cluster.icon}
              color={cluster.hue}
            />
            <span className="spec-domain-name">{cluster.label}</span>
          </a>
        ))}
      </nav>

      <div className="spec-clusters">
        {CLUSTERS.map((cluster) => (
          <section
            key={cluster.id}
            id={`domain-${cluster.id}`}
            className="spec-cluster"
            style={{ "--hue": cluster.hue }}
          >
            <header className="spec-head">
              <TopicIcon
                topic={cluster.label}
                icon={cluster.icon}
                color={cluster.hue}
              />
              <div className="spec-head-copy">
                <h3 className="spec-cluster-label">{cluster.label}</h3>
                <p className="spec-cluster-blurb">{cluster.blurb}</p>
              </div>
            </header>

            {/* Wraps rather than scrolls. A rail made sense when the tiles
                were connected and a wrapped row would have drawn a connector
                into the gutter; without them, a horizontal scroller just hides
                topics behind a gesture nobody knows is available. */}
            <div className="spec-grid">
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
