/* The Spectrum's hand-grouped topics.
 *
 * Lives here rather than in the page because the command palette searches the
 * same list — `/spectrum` scopes a query to these topics, and a second copy
 * would drift the moment either one changed.
 */
/* The browsable half of discovery. Hand-grouped so the page reads as a map
   rather than a tag cloud — each cluster takes one band of the prism. */
export const CLUSTERS = [
  {
    id: "engineering",
    icon: "ph:wrench-bold",
    label: "Engineering",
    hue: "#3b82f6",
    blurb: "How things get built, and why they break.",
    topics: [
      "systems design",
      "rust",
      "databases",
      "distributed systems",
      "compilers",
      "react hooks",
    ],
  },
  {
    id: "intelligence",
    icon: "ph:brain-bold",
    label: "Machines that learn",
    hue: "#8b5cf6",
    blurb: "From the maths underneath to what actually ships.",
    topics: [
      "machine learning",
      "transformers",
      "reinforcement learning",
      "computer vision",
      "neural networks",
      "information theory",
    ],
  },
  {
    id: "science",
    icon: "ph:atom-bold",
    label: "The physical world",
    hue: "#ec4899",
    blurb: "Matter, energy, and the very large and very small.",
    topics: [
      "quantum computing",
      "astrophysics",
      "genetics",
      "climate science",
      "neuroscience",
      "materials science",
    ],
  },
  {
    id: "mind",
    icon: "ph:lightbulb-filament-bold",
    label: "Thinking clearly",
    hue: "#f59e0b",
    blurb: "Philosophy, reasoning, and how people decide.",
    topics: [
      "stoicism",
      "behavioural economics",
      "epistemology",
      "game theory",
      "cognitive bias",
      "rhetoric",
    ],
  },
  {
    id: "world",
    icon: "ph:globe-hemisphere-west-bold",
    label: "People and money",
    hue: "#10b981",
    blurb: "History, markets, and how societies organise.",
    topics: [
      "monetary policy",
      "urban planning",
      "history of rome",
      "supply chains",
      "geopolitics",
      "design history",
    ],
  },
];

/** Flattened for lookup: every topic with the cluster it belongs to. */
export const SPECTRUM_TOPICS = CLUSTERS.flatMap((cluster) =>
  cluster.topics.map((topic) => ({
    topic,
    cluster: cluster.label,
    hue: cluster.hue,
  })),
);
