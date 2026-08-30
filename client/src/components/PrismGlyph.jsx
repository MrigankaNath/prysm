/* A prism turning slowly in the hollow the stage's curve leaves.
 *
 * The stops weave to the right, which opens a void on the left of every run.
 * This holds that space so the layout is designed around it rather than
 * leaving it to read as a margin that got away — and it is a placeholder: real
 * artwork goes here, the way `illo-slot` marks the other reserved spaces.
 *
 * Built from the same four layers as the loader's prism — lit edge, dark core,
 * refraction, underlight — so the two read as the same object. It never
 * announces anything, so it is `aria-hidden` and drops out entirely on narrow
 * screens, where the gutter it lives in is space the trail needs back.
 */
function PrismGlyph({ hue }) {
  return (
    <span className="pglyph" style={{ "--glyph": hue }} aria-hidden="true">
      <span className="pglyph-halo" />
      <span className="pglyph-body">
        <span className="pglyph-face" />
        <span className="pglyph-core" />
        <span className="pglyph-refract" />
        <span className="pglyph-underlight" />
      </span>
    </span>
  );
}

export default PrismGlyph;
