import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTopics, subscribe } from "../lib/library";
import { IconCompass, IconHistory } from "../components/Icons";
import { CLUSTERS } from "../lib/clusters";
import BentoCard from "../components/BentoCard";
import { artColor, domainArt } from "../lib/spectrumIcons";

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

      {/* Domains only.
          Every topic on one page was 248 tiles down ten thousand pixels — a
          reference table, not somewhere to browse. The domains are the choice
          worth putting in front of someone; the topics are what they came for
          once they have made it, and they live a click in.

          `dense` because the wide cells would otherwise leave holes: auto-flow
          skips a two-column card that will not fit the remaining space, and
          dense backfills the gap with the next card that does. */}
      <div className="bento-grid">
        {CLUSTERS.map((cluster, i) => (
          <BentoCard
            key={cluster.id}
            to={`/spectrum/${cluster.id}`}
            art={domainArt(cluster.id)}
            glow={artColor(cluster.id)}
            title={cluster.label}
            blurb={cluster.blurb}
            tag={`${cluster.topics.length} topics`}
            /* One wide cell per row of four keeps a rhythm without the page
               reading as two different grids stacked. */
            wide={i % 7 === 0}
          />
        ))}
      </div>
    </div>
  );
}

export default Spectrum;
