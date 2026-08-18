const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconFeed(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="6.5" rx="2" />
      <rect x="3" y="13.5" width="18" height="6.5" rx="2" />
    </svg>
  );
}

// A prism — the shape the whole product is named for.
export function IconPrism(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 L21 19 H3 Z" />
    </svg>
  );
}

// Light split into bands.
export function IconSpectrum(props) {
  return (
    <svg {...base} {...props}>
      <line x1="5" y1="14" x2="5" y2="19" />
      <line x1="9.7" y1="9" x2="9.7" y2="19" />
      <line x1="14.3" y1="5" x2="14.3" y2="19" />
      <line x1="19" y1="11" x2="19" y2="19" />
    </svg>
  );
}

export function IconWavelength(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12 q3 -7 6 0 t6 0 t6 0" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16" y2="16" />
    </svg>
  );
}

/* --- Category icons -------------------------------------------------------
   These are stroked with a shared gradient rather than currentColor. A single
   <PrismGradientDefs /> is mounted once at the app root: repeating the
   <linearGradient> inside every icon would duplicate the same DOM id, and every
   icon would silently resolve to whichever copy rendered first.
-------------------------------------------------------------------------- */

const PRISM_GRADIENT_ID = "prism-gradient";

export function PrismGradientDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <linearGradient
          id={PRISM_GRADIENT_ID}
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.3" stopColor="#8b5cf6" />
          <stop offset="0.6" stopColor="#ec4899" />
          <stop offset="0.82" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const gradientBase = { ...base, stroke: `url(#${PRISM_GRADIENT_ID})` };

export function IconOverview(props) {
  return (
    <svg {...gradientBase} {...props}>
      <path d="M4 5.5h6a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2H4Z" />
      <path d="M20 5.5h-6a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2h6Z" />
    </svg>
  );
}

export function IconArticles(props) {
  return (
    <svg {...gradientBase} {...props}>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <line x1="8" y1="8.5" x2="16" y2="8.5" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="15.5" x2="13" y2="15.5" />
    </svg>
  );
}

export function IconVideos(props) {
  return (
    <svg {...gradientBase} {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <path d="M10.5 9.5 15 12l-4.5 2.5Z" />
    </svg>
  );
}

export function IconPodcasts(props) {
  return (
    <svg {...gradientBase} {...props}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <line x1="12" y1="18" x2="12" y2="21.5" />
    </svg>
  );
}

export function IconBooks(props) {
  return (
    <svg {...gradientBase} {...props}>
      <rect x="3" y="4" width="5.5" height="16" rx="1.2" />
      <rect x="9.5" y="4" width="5.5" height="16" rx="1.2" />
      <path d="m16.6 5.2 3.6 1 -3.1 13.4 -3.6-1z" />
    </svg>
  );
}

export function IconCode(props) {
  return (
    <svg {...gradientBase} {...props}>
      <path d="m8 8-4.5 4L8 16" />
      <path d="m16 8 4.5 4L16 16" />
    </svg>
  );
}

export function IconPapers(props) {
  return (
    <svg {...gradientBase} {...props}>
      <path d="M6 3.5h8L19 8v12.5H6Z" />
      <path d="M14 3.5V8h5" />
      <path d="m9 16.5 2-3 2 2 2.5-4" />
    </svg>
  );
}

export function IconQA(props) {
  return (
    <svg {...gradientBase} {...props}>
      <path d="M20.5 15a2 2 0 0 1-2 2H8l-4.5 3.5V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />
      <path d="M9.8 9.2a2.2 2.2 0 1 1 2.9 2.1v1.2" />
      <line x1="12.7" y1="15" x2="12.7" y2="15" />
    </svg>
  );
}

export function IconDiscussions(props) {
  return (
    <svg {...gradientBase} {...props}>
      <path d="M15.5 12.5a2 2 0 0 1-2 2H8L4.5 17V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2Z" />
      <path d="M18 8.5h.5a2 2 0 0 1 2 2V21l-3-2.5h-5" />
    </svg>
  );
}
