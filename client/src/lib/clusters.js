/* The Spectrum's map of everything worth looking into.
 *
 * Lives here rather than in the page because the command palette searches the
 * same list — `/spectrum` scopes a query to these topics, and a second copy
 * would drift the moment either one changed.
 *
 * Thirty-three domains, hand-grouped. The shape of the list is a claim about
 * who the product is for, so it is deliberately wider than the subjects a
 * discovery tool usually ships with: six lean technical, but philosophy,
 * music, food, sport and craft carry the same weight as machine learning, and
 * the subtopics reach past the Western canon on purpose — the Islamic Golden
 * Age and the Silk Road sit alongside Rome, world music alongside jazz.
 *
 * Topics are sized to roughly a university course. That band is where this
 * app's sources actually answer: too broad and Wikipedia's External links are
 * generic, too narrow and lanes empty — measured, "bernoulli's theorem"
 * returns zero podcasts and "typescript" nearly empties books.
 *
 * The ids are the icon pack's slugs, so a domain's folder, its `_category.svg`
 * and its anchor are all the same string. `topics` stays a flat list of plain
 * strings: journey.js matches explored topics against it by substring, and
 * lib/spectrumIcons.js resolves the artwork by slugifying the label — verified
 * against the manifest, 248 of 248 and 33 of 33 slugs agree.
 *
 * Hues cycle through the prism's six bands by position, so a domain's colour
 * is stable without anyone having to assign one.
 */
const BANDS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

const DOMAINS = [
  {
    id: "software-engineering",
    label: "Software Engineering",
    blurb: "How systems are built, and why they fall over.",
    topics: ["systems design", "databases", "distributed systems", "compilers", "operating systems", "version control", "software testing", "rust"],
  },
  {
    id: "artificial-intelligence",
    label: "Artificial Intelligence",
    blurb: "From the maths underneath to what actually ships.",
    topics: ["machine learning", "neural networks", "transformers", "computer vision", "reinforcement learning", "natural language processing", "ai alignment", "generative models"],
  },
  {
    id: "web-and-product",
    label: "Web and Product",
    blurb: "The craft of things people actually use.",
    topics: ["react", "typescript", "api design", "web accessibility", "design systems", "web performance", "browser engines", "caching"],
  },
  {
    id: "security-and-privacy",
    label: "Security and Privacy",
    blurb: "Who can see what, and how that is decided.",
    topics: ["cryptography", "threat modelling", "authentication", "network security", "privacy engineering", "zero knowledge proofs", "malware analysis", "digital forensics"],
  },
  {
    id: "hardware-and-chips",
    label: "Hardware and Chips",
    blurb: "The physical machine the rest of it runs on.",
    topics: ["semiconductors", "computer architecture", "embedded systems", "quantum computing", "photonics", "chip fabrication", "signal processing"],
  },
  {
    id: "robotics-and-automation",
    label: "Robotics and Automation",
    blurb: "Machines that act on the world, and the control behind them.",
    topics: ["robotics", "control theory", "autonomous vehicles", "drones", "industrial automation", "prosthetics", "sensors"],
  },
  {
    id: "physics",
    label: "Physics",
    blurb: "Matter and energy, from the very small to the very large.",
    topics: ["quantum mechanics", "general relativity", "thermodynamics", "particle physics", "optics", "string theory", "fluid dynamics", "condensed matter"],
  },
  {
    id: "space-and-astronomy",
    label: "Space and Astronomy",
    blurb: "What is out there, and how we know.",
    topics: ["astrophysics", "cosmology", "black holes", "exoplanets", "spaceflight", "the solar system", "telescopes", "astrobiology"],
  },
  {
    id: "life-and-evolution",
    label: "Life and Evolution",
    blurb: "How living things work, and how they got that way.",
    topics: ["evolution", "genetics", "cell biology", "the microbiome", "immunology", "photosynthesis", "crispr", "molecular biology"],
  },
  {
    id: "chemistry-and-materials",
    label: "Chemistry and Materials",
    blurb: "What things are made of, and what that lets them do.",
    topics: ["organic chemistry", "materials science", "catalysis", "polymers", "nanotechnology", "battery technology", "electrochemistry", "crystallography"],
  },
  {
    id: "earth-and-climate",
    label: "Earth and Climate",
    blurb: "The system we live inside and are changing.",
    topics: ["climate science", "geology", "oceanography", "ecology", "renewable energy", "extreme weather", "volcanology", "hydrology"],
  },
  {
    id: "mathematics",
    label: "Mathematics",
    blurb: "The structures everything else is described with.",
    topics: ["calculus", "linear algebra", "number theory", "topology", "game theory", "graph theory", "chaos theory", "cryptography maths"],
  },
  {
    id: "data-and-statistics",
    label: "Data and Statistics",
    blurb: "Drawing conclusions that survive scrutiny.",
    topics: ["probability", "bayesian inference", "data visualisation", "causal inference", "experiment design", "regression", "time series", "information theory"],
  },
  {
    id: "mind-and-brain",
    label: "Mind and Brain",
    blurb: "Perception, memory, and the machinery of thought.",
    topics: ["neuroscience", "consciousness", "memory", "cognitive bias", "sleep", "perception", "attention", "neuroplasticity"],
  },
  {
    id: "psychology",
    label: "Psychology",
    blurb: "Why people do what they do, and how that is studied.",
    topics: ["developmental psychology", "social psychology", "personality", "motivation", "trauma", "behaviour change", "psychometrics"],
  },
  {
    id: "health-and-medicine",
    label: "Health and Medicine",
    blurb: "Bodies, evidence, and what actually helps.",
    topics: ["nutrition", "public health", "mental health", "exercise science", "vaccines", "ageing", "epidemiology", "pharmacology"],
  },
  {
    id: "philosophy",
    label: "Philosophy",
    blurb: "The questions that stay open, and why.",
    topics: ["stoicism", "ethics", "epistemology", "existentialism", "logic", "philosophy of mind", "political philosophy", "phenomenology"],
  },
  {
    id: "history",
    label: "History",
    blurb: "How the present got this shape.",
    topics: ["ancient rome", "the french revolution", "the silk road", "world war two", "decolonisation", "the islamic golden age", "the bronze age collapse", "the industrial revolution"],
  },
  {
    id: "archaeology-and-anthropology",
    label: "Archaeology and Anthropology",
    blurb: "What people left behind, and what it says about them.",
    topics: ["archaeology", "human origins", "ancient egypt", "mesoamerica", "ethnography", "historical linguistics", "cave art"],
  },
  {
    id: "religion-and-belief",
    label: "Religion and Belief",
    blurb: "What people hold sacred, and the arguments about it.",
    topics: ["comparative religion", "buddhism", "mythology", "secularism", "ritual", "religious art", "islamic philosophy"],
  },
  {
    id: "language-and-linguistics",
    label: "Language and Linguistics",
    blurb: "How meaning is carried, and how it shifts.",
    topics: ["etymology", "syntax", "writing systems", "second language acquisition", "translation", "sign language", "phonetics"],
  },
  {
    id: "literature-and-writing",
    label: "Literature and Writing",
    blurb: "Stories, and the machinery underneath them.",
    topics: ["narrative structure", "poetry", "science fiction", "literary criticism", "memoir", "world literature", "rhetoric"],
  },
  {
    id: "art-and-design",
    label: "Art and Design",
    blurb: "Made things, and the decisions behind them.",
    topics: ["typography", "colour theory", "architecture", "photography", "industrial design", "art history", "illustration", "printmaking"],
  },
  {
    id: "music",
    label: "Music",
    blurb: "Why it works on us, and how it is put together.",
    topics: ["music theory", "jazz", "sound design", "film scoring", "world music", "acoustics", "music production", "opera"],
  },
  {
    id: "film-games-and-media",
    label: "Film, Games and Media",
    blurb: "Moving pictures, play, and how attention is held.",
    topics: ["film history", "cinematography", "game design", "animation", "documentary", "screenwriting", "visual effects"],
  },
  {
    id: "economics-and-money",
    label: "Economics and Money",
    blurb: "Scarcity, incentives, and who ends up with what.",
    topics: ["monetary policy", "behavioural economics", "inequality", "international trade", "personal finance", "market design", "development economics", "economic history"],
  },
  {
    id: "politics-and-society",
    label: "Politics and Society",
    blurb: "How groups decide, and how they fall out.",
    topics: ["democracy", "geopolitics", "migration", "constitutional law", "social movements", "public policy", "propaganda", "electoral systems"],
  },
  {
    id: "cities-and-infrastructure",
    label: "Cities and Infrastructure",
    blurb: "The systems a place needs before anything else works.",
    topics: ["urban planning", "transport", "housing", "water systems", "the electrical grid", "logistics", "civil engineering"],
  },
  {
    id: "law-and-justice",
    label: "Law and Justice",
    blurb: "The rules we agree to, and who they end up serving.",
    topics: ["criminal justice", "human rights", "intellectual property", "international law", "contract law", "privacy law"],
  },
  {
    id: "business-and-work",
    label: "Business and Work",
    blurb: "Building things with other people.",
    topics: ["entrepreneurship", "negotiation", "management", "marketing", "product strategy", "remote work", "operations"],
  },
  {
    id: "education-and-learning",
    label: "Education and Learning",
    blurb: "How understanding is actually built.",
    topics: ["learning science", "pedagogy", "memory techniques", "curriculum design", "educational technology", "literacy"],
  },
  {
    id: "sport-and-movement",
    label: "Sport and Movement",
    blurb: "What bodies can be trained to do.",
    topics: ["sports science", "strength training", "endurance", "biomechanics", "chess", "martial arts", "climbing"],
  },
  {
    id: "food-and-craft",
    label: "Food and Craft",
    blurb: "The things people do with their hands and weekends.",
    topics: ["cooking science", "fermentation", "coffee", "bread baking", "gardening", "woodworking", "textiles"],
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
