/* The dashed run between two markers on a route.
 *
 * Drawn rather than measured. The svg is inset by half a marker on both sides
 * in CSS, so x=0 and x=100 in its viewBox are exactly the two marker centres
 * whatever the markers are sized at — there is no percentage to keep in sync
 * and it survives the breakpoint that shrinks them. `preserveAspectRatio` is
 * off so the curve stretches to whatever width the column has, and
 * `non-scaling-stroke` keeps the dashes an even weight through that stretch.
 *
 * `from` is the side the run leaves: "l" sweeps left-to-right, "r" the other
 * way, which is what gives the column its weave.
 */
function RoadRun({ from }) {
  return (
    <li className="proad-link" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={
            from === "l"
              ? "M 0 0 C 0 42, 100 58, 100 100"
              : "M 100 0 C 100 42, 0 58, 0 100"
          }
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </li>
  );
}

export default RoadRun;
