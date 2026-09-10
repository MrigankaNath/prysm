import { Link, Navigate, useParams } from "react-router-dom";
import { CLUSTERS } from "../lib/clusters";
import { domainArt, topicArt } from "../lib/spectrumIcons";
import BentoCard from "../components/BentoCard";
import { IconChevronRight } from "../components/Icons";

/**
 * One domain, and the topics inside it.
 *
 * The same bento the index uses, so stepping in is a change of contents rather
 * than a change of language. The header repeats the domain's own hero at the
 * size Spectrum drew it, which is what makes the transition read as going
 * *into* the card you pressed.
 *
 * An unknown id redirects rather than rendering an empty page: these ids come
 * from the icon pack's slugs, so a bad one is a stale link, not a topic
 * someone typed.
 */
function SpectrumDomain() {
  const { id } = useParams();
  const cluster = CLUSTERS.find((c) => c.id === id);

  if (!cluster) return <Navigate to="/spectrum" replace />;

  return (
    <div className="page page-wide spectrum">
      <Link to="/spectrum" className="spec-back">
        <IconChevronRight />
        Spectrum
      </Link>

      <header className="spec-domain-hero" style={{ "--hue": cluster.hue }}>
        <span className="spec-domain-art">
          <img src={domainArt(cluster.id)} alt="" decoding="async" />
        </span>
        <div>
          <h1 className="spec-title">{cluster.label}</h1>
          <p className="spec-sub">{cluster.blurb}</p>
          <p className="spec-domain-count">
            {cluster.topics.length} topics · every one pulls live results
          </p>
        </div>
      </header>

      {/* Uniform here, unlike the index. The wide cell exists to give a blurb
          room, and a topic has none — a two-column card holding one short
          title is mostly empty space. */}
      <div className="bento-grid is-topics">
        {cluster.topics.map((topic) => (
          <BentoCard
            key={topic}
            to={`/explore/${encodeURIComponent(topic)}`}
            art={topicArt(topic)}
            hue={cluster.hue}
            title={topic}
            tag={cluster.label}
          />
        ))}
      </div>
    </div>
  );
}

export default SpectrumDomain;
