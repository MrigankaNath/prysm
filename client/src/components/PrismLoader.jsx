/* A glass prism falling through the dark, refracting as it goes.
 *
 * Ported from the canvas export rather than dropped in: that version is built
 * on a composition runtime — `CompositionStage`, `useComposition`,
 * `interpolate`, a tweaks panel — which is about 120kB of editor scaffolding
 * for a four-second loop. The loop is deterministic and never interactive, so
 * it is keyframes here and costs nothing but the paint.
 *
 * The authored timing is kept exactly: three scenes over 4s, looping.
 *   Descend  0.00–1.50s  the prism drops in, tumbling slowly
 *   Refract  1.50–3.10s  it lights up, neon haze blooming either side
 *   Dissolve 3.10–4.00s  it accelerates out of frame, haze back to black
 *
 * The one substitution is colour. The export ships its own neon triad; this
 * uses three of Prysm's own prism bands, which sit in the same cyan / violet /
 * magenta relationship. A loader is the first thing you see on the page and
 * had no business introducing a fourth palette.
 */

const HAZE_HUES = ["#06b6d4", "#8b5cf6", "#ec4899"];

/* Soft smoke either side of the fall — three depths per side, each wider,
   taller, further out and more blurred than the last. Computed here rather
   than in CSS because the source does the same arithmetic, and a stack of
   nested calc() would only hide it. */
const PUFFS = [-1, 1].flatMap((side) =>
  HAZE_HUES.map((hue, i) => ({
    key: `${side}-${i}`,
    hue,
    w: 300 + i * 110,
    h: 520 + i * 170,
    x: side * (105 + i * 78),
    lift: 90 + i * 130,
    blur: 44 + i * 22,
    opacity: 0.6 - i * 0.14,
  })),
);

function PrismLoader({ label = "Gathering your Prisms" }) {
  return (
    <div className="prism-loader" role="status" aria-label={label}>
      <div className="pl-sky" aria-hidden="true" />

      <div className="pl-cam" aria-hidden="true">
        <div className="pl-fall">
          {/* The shaft of light it falls through. Anchored above the prism and
              travelling with it, so the frame's own edge does the clipping —
              the source grows its height to match the fall, which is the same
              picture with arithmetic in it. */}
          <span className="pl-shaft" />

          <span className="pl-bloom" />

          <span className="pl-haze">
            {PUFFS.map((p) => (
              <span
                key={p.key}
                className="pl-puff"
                style={{
                  "--w": `${p.w}px`,
                  "--h": `${p.h}px`,
                  "--x": `${p.x}px`,
                  "--lift": `${p.lift}px`,
                  "--blur": `${p.blur}px`,
                  "--o": p.opacity,
                  "--hue": p.hue,
                }}
              />
            ))}
          </span>

          <span className="pl-prism">
            <span className="pl-face" />
            <span className="pl-core" />
            <span className="pl-refract" />
            <span className="pl-underlight" />
          </span>
        </div>
      </div>

      <div className="pl-vignette" aria-hidden="true" />
      <p className="pl-caption">{label}</p>
    </div>
  );
}

export default PrismLoader;
