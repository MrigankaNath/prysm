import { useLayoutEffect, useRef, useState } from "react";

/* The dashed run between two markers on a route.
 *
 * Drawn at the element's real pixel size rather than in a stretched viewBox.
 * The first version used `preserveAspectRatio="none"` over a 0-100 box, which
 * meant the browser scaled the path about six times wider than tall — the
 * curve flattened and, worse, the dashes stretched with it, so the gaps read
 * as uneven along the sweep. Measuring costs one ResizeObserver and makes the
 * dash pattern uniform everywhere.
 *
 * The curve leaves each marker vertically and is shaped by the run's own
 * height, not its width, so a wide screen bends the middle further out instead
 * of pulling the whole thing flat.
 *
 * `from` is the side the run leaves: "l" sweeps left-to-right, "r" the other
 * way, which is what gives the column its weave.
 */
function RoadRun({ from }) {
  const ref = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  /* Measured before paint, then kept in step by an observer.
   *
   * Relying on the observer's first callback alone left the run blank: the
   * curve only exists once a width is known, and that callback is delivered
   * asynchronously — when it did not arrive the element stayed empty with
   * nothing to retry it. Reading the box directly on mount means the run is
   * drawn on the first frame and the observer only has to handle changes. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const measure = ({ width, height }) =>
      setBox((prev) => {
        const w = Math.round(width);
        const h = Math.round(height);
        return prev.w === w && prev.h === h ? prev : { w, h };
      });

    const remeasure = () => measure(el.getBoundingClientRect());
    remeasure();

    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect));
    observer.observe(el);

    /* The window listener is not redundant. This element's width comes from
       the page, so a window resize is what actually changes it — and the
       observer's change notifications were not arriving here, leaving every
       run frozen at the width it was first drawn at. */
    window.addEventListener("resize", remeasure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, []);

  const { w, h } = box;
  /* How far the control points reach down and up. Tied to height, not width,
     so a wider column bends the middle further rather than flattening it —
     and past half the height the two handles overlap, which is what keeps the
     departure from each marker steep instead of lazy. */
  const pull = h * 0.8;

  const d =
    from === "l"
      ? `M 0 0 C 0 ${pull}, ${w} ${h - pull}, ${w} ${h}`
      : `M ${w} 0 C ${w} ${pull}, 0 ${h - pull}, 0 ${h}`;

  return (
    <li className="road-run" ref={ref} aria-hidden="true">
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <path d={d} />
        </svg>
      )}
    </li>
  );
}

export default RoadRun;
