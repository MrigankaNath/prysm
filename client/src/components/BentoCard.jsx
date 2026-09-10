import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

/**
 * One cell of the Spectrum bento.
 *
 * The artwork sits on a ruled panel rather than on the card itself. That panel
 * is doing real work: these icons are small, saturated 3D objects, and against
 * a flat dark card they float with nothing to give them scale. A drawn grid
 * behind them reads as a surface the object is resting on — it is what makes a
 * 64px illustration look like a photographed thing rather than a sticker.
 *
 * `wide` lays the panel beside the copy instead of above it. A bento is only a
 * bento if the cells differ; a grid of thirty-three identical cards is a table.
 *
 * The vertical tag on the panel's edge is the one place a count belongs — it
 * fills the gutter the rotated text needs anyway, and it answers "how much is
 * in here" before the click.
 *
 * Nothing here draws a coloured stroke on the card. The active state is three
 * things that are all light: the card's own surface brightens, a blurred disc
 * behind the icon fades up, and the arrow token fills and takes the prism ring
 * the nav and the auth button already use. An outline in a flat hue reads as
 * neon on a black page; a surface getting lighter reads as a thing being
 * pointed at.
 */
function BentoCard({ to, art, glow, title, blurb, tag, wide = false }) {
  return (
    <Link
      to={to}
      className={`bento${wide ? " is-wide" : ""}`}
      /* The light under the icon is the icon's own colour, not the domain's
         band — see the note in lib/spectrumIcons.js. */
      style={{ "--glow": glow || "#a1a1aa" }}
    >
      <span className="bento-panel">
        <span className="bento-rule" aria-hidden="true" />
        {/* Sits between the ruling and the icon, so when it fades up it lights
            the grid lines from under the object rather than washing over
            them. */}
        <span className="bento-halo" aria-hidden="true" />
        {art ? (
          <img className="bento-art" src={art} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="bento-art is-empty" aria-hidden="true" />
        )}
        {tag && <span className="bento-tag">{tag}</span>}
      </span>

      <span className="bento-copy">
        <span className="bento-text">
          <span className="bento-title">{title}</span>
          {blurb && <span className="bento-blurb">{blurb}</span>}
        </span>
        <span className="bento-go" aria-hidden="true">
          <ArrowUpRight />
        </span>
      </span>
    </Link>
  );
}

export default BentoCard;
