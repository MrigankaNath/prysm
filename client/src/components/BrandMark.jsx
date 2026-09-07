import { useId } from "react";

/* The Prysm mark.
 *
 * Inline rather than an <img>, so it takes its size from whatever it sits in
 * and can be given a drop shadow or a mask like any other element. The
 * gradient id is generated per instance: two copies on one page — the nav and
 * the auth card, say — would otherwise declare the same id twice, and the
 * second one unmounting takes the first one's fill with it.
 *
 * The viewBox is the artwork's own bounding box, not the 256 square it was
 * drawn in. That square left 38% of the frame empty, so every placement was
 * rendering a mark two-thirds the size of the box it had been given — small in
 * the nav and lost inside the rounded plate a browser draws around a favicon.
 */
function BrandMark({ className = "", title }) {
  const gradient = useId();

  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      viewBox="46 47 166 166"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
    >
      <defs>
        <linearGradient
          id={gradient}
          x1="105"
          y1="52"
          x2="156"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1749DC" />
          <stop offset=".5" stopColor="#1678F3" />
          <stop offset="1" stopColor="#27B9F3" />
        </linearGradient>
      </defs>
      {/* evenodd is load-bearing: the second subpath is the cut-out face, not
          an outline, and a nonzero fill closes it up into a solid blob. */}
      <path
        fill={`url(#${gradient})`}
        fillRule="evenodd"
        d="M113 59Q128 41 142 60L204 149Q215 166 198 176L140 206Q128 212 117 206L58 174Q44 166 52 151ZM120 68Q123 64 123 70L123 190Q124 198 117 194L63 165Q57 162 62 155Z"
      />
    </svg>
  );
}

export default BrandMark;
