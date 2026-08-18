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
