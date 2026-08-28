/* The Spectrum's map of everything worth looking into.
 *
 * Lives here rather than in the page because the command palette searches the
 * same list — `/spectrum` scopes a query to these topics, and a second copy
 * would drift the moment either one changed.
 *
 * Twenty-five domains, hand-grouped. The shape of the list is a claim about
 * who the product is for, so it is deliberately wider than the subjects a
 * discovery tool usually ships with: five lean technical, but philosophy,
 * music, food, sport and craft carry the same weight as machine learning, and
 * the subtopics reach past the Western canon on purpose — the Islamic Golden
 * Age and the Silk Road sit alongside Rome, world music alongside jazz.
 *
 * Hues cycle through the prism's six bands by position, so a domain's colour
 * is stable without anyone having to assign one.
 */
const BANDS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

const DOMAINS = [
  // --- the five that lean technical -------------------------------------
  {
    id: "software",
    icon: "ph:code-bold",
    label: "Software Engineering",
    blurb: "How systems are built, and why they fall over.",
    topics: ["systems design", "databases", "distributed systems", "compilers", "rust", "version control"],
  },
  {
    id: "ai",
    icon: "ph:cpu-bold",
    label: "Artificial Intelligence",
    blurb: "From the maths underneath to what actually ships.",
    topics: ["machine learning", "neural networks", "transformers", "computer vision", "reinforcement learning", "ai alignment"],
  },
  {
    id: "web",
    icon: "ph:browser-bold",
    label: "Web and Product",
    blurb: "The craft of things people actually use.",
    topics: ["react hooks", "typescript", "api design", "web accessibility", "design systems", "web performance"],
  },
  {
    id: "security",
    icon: "ph:shield-check-bold",
    label: "Security and Privacy",
    blurb: "Who can see what, and how that is decided.",
    topics: ["cryptography", "threat modelling", "authentication", "network security", "privacy engineering", "zero knowledge proofs"],
  },
  {
    id: "data",
    icon: "ph:chart-line-up-bold",
    label: "Data and Statistics",
    blurb: "Drawing conclusions that survive scrutiny.",
    topics: ["probability", "regression", "bayesian inference", "data visualisation", "causal inference", "experiment design"],
  },

  // --- the physical world ------------------------------------------------
  {
    id: "physics",
    icon: "ph:atom-bold",
    label: "Physics",
    blurb: "Matter and energy, from the very small to the very large.",
    topics: ["quantum mechanics", "general relativity", "thermodynamics", "particle physics", "optics", "string theory"],
  },
  {
    id: "space",
    icon: "ph:planet-bold",
    label: "Space and Astronomy",
    blurb: "What is out there, and how we know.",
    topics: ["astrophysics", "cosmology", "black holes", "exoplanets", "spaceflight", "the solar system"],
  },
  {
    id: "life",
    icon: "ph:dna-bold",
    label: "Life and Evolution",
    blurb: "How living things work, and how they got that way.",
    topics: ["evolution", "genetics", "cell biology", "the microbiome", "immunology", "photosynthesis"],
  },
  {
    id: "chemistry",
    icon: "ph:flask-bold",
    label: "Chemistry and Materials",
    blurb: "What things are made of, and what that lets them do.",
    topics: ["organic chemistry", "materials science", "catalysis", "polymers", "nanotechnology", "battery technology"],
  },
  {
    id: "earth",
    icon: "ph:globe-hemisphere-west-bold",
    label: "Earth and Climate",
    blurb: "The system we live inside and are changing.",
    topics: ["climate science", "geology", "oceanography", "ecology", "renewable energy", "extreme weather"],
  },
  {
    id: "maths",
    icon: "ph:math-operations-bold",
    label: "Mathematics",
    blurb: "The structures everything else is described with.",
    topics: ["calculus", "linear algebra", "number theory", "topology", "game theory", "graph theory"],
  },

  // --- mind and body ------------------------------------------------------
  {
    id: "mind",
    icon: "ph:brain-bold",
    label: "Mind and Brain",
    blurb: "Perception, memory, and the machinery of thought.",
    topics: ["neuroscience", "consciousness", "memory", "cognitive bias", "sleep", "perception"],
  },
  {
    id: "health",
    icon: "ph:heartbeat-bold",
    label: "Health and Medicine",
    blurb: "Bodies, evidence, and what actually helps.",
    topics: ["nutrition", "public health", "mental health", "exercise science", "vaccines", "ageing"],
  },

  // --- how people think and have lived ------------------------------------
  {
    id: "philosophy",
    icon: "ph:bank-bold",
    label: "Philosophy",
    blurb: "The questions that stay open, and why.",
    topics: ["stoicism", "ethics", "epistemology", "existentialism", "logic", "philosophy of mind"],
  },
  {
    id: "history",
    icon: "ph:scroll-bold",
    label: "History",
    blurb: "How the present got this shape.",
    topics: ["ancient rome", "the french revolution", "the silk road", "world war two", "decolonisation", "the islamic golden age"],
  },
  {
    id: "belief",
    icon: "ph:hands-praying-bold",
    label: "Religion and Belief",
    blurb: "What people hold sacred, and the arguments about it.",
    topics: ["comparative religion", "buddhism", "mythology", "secularism", "ritual", "religious art"],
  },
  {
    id: "language",
    icon: "ph:translate-bold",
    label: "Language and Linguistics",
    blurb: "How meaning is carried, and how it shifts.",
    topics: ["etymology", "syntax", "writing systems", "second language acquisition", "translation", "sign language"],
  },

  // --- what people make ---------------------------------------------------
  {
    id: "literature",
    icon: "ph:book-open-bold",
    label: "Literature and Writing",
    blurb: "Stories, and the machinery underneath them.",
    topics: ["narrative structure", "poetry", "science fiction", "literary criticism", "memoir", "world literature"],
  },
  {
    id: "art",
    icon: "ph:palette-bold",
    label: "Art and Design",
    blurb: "Made things, and the decisions behind them.",
    topics: ["typography", "colour theory", "architecture", "photography", "industrial design", "art history"],
  },
  {
    id: "music",
    icon: "ph:music-notes-bold",
    label: "Music",
    blurb: "Why it works on us, and how it is put together.",
    topics: ["music theory", "jazz", "sound design", "film scoring", "world music", "acoustics"],
  },
  {
    id: "film",
    icon: "ph:film-slate-bold",
    label: "Film and Media",
    blurb: "Moving pictures, and how to read them.",
    topics: ["cinematography", "film editing", "documentary", "animation", "screenwriting", "media literacy"],
  },

  // --- how people organise ------------------------------------------------
  {
    id: "economics",
    icon: "ph:coins-bold",
    label: "Economics and Money",
    blurb: "Scarcity, incentives, and who ends up with what.",
    topics: ["monetary policy", "behavioural economics", "inequality", "international trade", "personal finance", "market design"],
  },
  {
    id: "society",
    icon: "ph:users-three-bold",
    label: "Politics and Society",
    blurb: "How groups decide, and how they fall out.",
    topics: ["democracy", "geopolitics", "urban planning", "migration", "constitutional law", "social movements"],
  },
  {
    id: "work",
    icon: "ph:briefcase-bold",
    label: "Business and Work",
    blurb: "Building things with other people.",
    topics: ["entrepreneurship", "negotiation", "management", "marketing", "product strategy", "remote work"],
  },

  // --- and the everyday ---------------------------------------------------
  {
    id: "craft",
    icon: "ph:cooking-pot-bold",
    label: "Food, Sport and Craft",
    blurb: "The things people do with their hands and weekends.",
    topics: ["cooking science", "fermentation", "sports science", "chess", "gardening", "woodworking"],
  },
];

/** Hue by position, so a domain's colour is stable without assigning one. */
export const CLUSTERS = DOMAINS.map((domain, i) => ({
  ...domain,
  hue: BANDS[i % BANDS.length],
}));

/** Flattened for lookup: every topic with the cluster it belongs to. */
export const SPECTRUM_TOPICS = CLUSTERS.flatMap((cluster) =>
  cluster.topics.map((topic) => ({
    topic,
    cluster: cluster.label,
    hue: cluster.hue,
  })),
);
