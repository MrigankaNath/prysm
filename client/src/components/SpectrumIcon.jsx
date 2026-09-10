import TopicIcon from "./TopicIcon";
import { domainArt, topicArt } from "../lib/spectrumIcons";

/**
 * A Spectrum topic or domain, drawn from the icon pack.
 *
 * These are full-colour 3D objects with their own gradients, reflections and
 * glow — the opposite of the monotone glyphs `TopicIcon` is built for. So they
 * do not get its treatment: a coloured icon on a plate filled with the same
 * hue has nothing to sit against, which is the note DESIGN.md already records
 * against the roadmap marker. The hue moves to the rim and the plate stays
 * dark, exactly as the marker does.
 *
 * `bare` is for a caller that already provides the frame — the topic grid's
 * `.rail-tile` is a dark slab with the hue on its border, so a second plate
 * inside it would be a box in a box.
 *
 * Falls back to `TopicIcon` when the pack has nothing. Every label in
 * clusters.js resolves today, but a label edited without its file renamed
 * should degrade to the Iconify glyph rather than to a broken image.
 */
function SpectrumIcon({ topic, domain, hue, bare = false, className = "" }) {
  const src = domain ? domainArt(domain) : topicArt(topic);

  if (!src) {
    return <TopicIcon topic={topic} color={hue} className={className} />;
  }

  const image = (
    <img
      className="spec-art-img"
      src={src}
      alt=""
      /* Lazy is right here and wrong for a favicon: the page carries 281 of
         these across 33 sections, and all but the first screen are below the
         fold. */
      loading="lazy"
      decoding="async"
    />
  );

  if (bare) return image;

  return (
    <span
      className={`spec-art ${className}`.trim()}
      style={{ "--hue": hue }}
      aria-hidden="true"
    >
      {image}
    </span>
  );
}

export default SpectrumIcon;
