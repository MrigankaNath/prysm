import { CATEGORY_GRADIENTS } from "./categories";

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

        {Object.entries(CATEGORY_GRADIENTS).map(([key, [from, to]]) => (
          <linearGradient
            key={key}
            id={`cat-grad-${key}`}
            x1="0"
            y1="0"
            x2="24"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        ))}

        {/* The gradient above is sized in user units for 24x24 icons — anything
            larger clamps to its final stop. This one is bound to the element's
            own box, so it spans correctly at any size (the goal ring, etc.). */}
        <linearGradient
          id="prism-gradient-lg"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientUnits="objectBoundingBox"
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

/* --- UI + gamification icons ----------------------------------------------
   Same 24x24 / 1.8-stroke house style as the nav icons above, drawn with
   currentColor so they inherit whatever the surrounding element is coloured.
   Each is a single self-contained component — swap the paths inside any one of
   them for a designed asset later without touching a call site.
-------------------------------------------------------------------------- */

export function IconMenu(props) {
  return (
    <svg {...base} {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.5Z" />
    </svg>
  );
}



export function IconLogout(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8.5" />
      <path d="m17 15.5 3.5-3.5L17 8.5" />
      <line x1="20" y1="12" x2="10" y2="12" />
    </svg>
  );
}


// The streak marker. Deliberately a bolt rather than a flame — it ties to the
// light/prism motif the rest of the product runs on.



export function IconTarget(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function IconBookmark(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3.8h11a1 1 0 0 1 1 1v15.4l-6.5-4.3-6.5 4.3V4.8a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.2 1.9" />
    </svg>
  );
}


export function IconCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.8 4.4 4.2L19 7.4" />
    </svg>
  );
}


export function IconChevronRight(props) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}




/* Activity-type icons — currentColor twins of the gradient category icons, for
   places where the surrounding chip already carries the colour. */





export function IconPlay(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8.5 5.5 18 12l-9.5 6.5Z" />
    </svg>
  );
}


export function IconCompass(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.2 8.8-1.8 4.6-4.6 1.8 1.8-4.6z" />
    </svg>
  );
}

export function IconGrid(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  );
}

export function IconChevronDown(props) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function IconHistory(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5V9H8" />
      <path d="M12 7.6V12l3 1.8" />
    </svg>
  );
}

export function IconEye(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9.9 5.8A8.6 8.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-3 3.7" />
      <path d="M6.4 6.5A15.3 15.3 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.3 4-.9" />
      <line x1="4" y1="4" x2="20" y2="20" />
    </svg>
  );
}

/* Wikipedia's W, drawn rather than fetched — it attributes the definition, so
   it has to render even when an external image wouldn't. */
export function IconWikipedia(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22.9 6.3h-4.6v.7c.9.1 1.3.4 1.3.9 0 .3-.1.6-.3 1l-2.6 5.6-2.4-5.6c-.2-.4-.3-.7-.3-1 0-.6.4-.8 1.3-.9v-.7H9.6v.7c.8.1 1.2.4 1.6 1.3l.6 1.3-2.2 4.7-2.7-6c-.1-.3-.2-.5-.2-.7 0-.4.4-.6 1.3-.6v-.7H1.1v.7c.9.1 1.2.4 1.7 1.5l4.6 10.2h.8l3.1-6.5 2.9 6.5h.8L19.6 8c.6-1.2.9-1.4 1.9-1.5l1.4-.2z" />
    </svg>
  );
}

export function IconAlert(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <line x1="12" y1="7.8" x2="12" y2="12.6" />
      <line x1="12" y1="16.2" x2="12" y2="16.2" />
    </svg>
  );
}
