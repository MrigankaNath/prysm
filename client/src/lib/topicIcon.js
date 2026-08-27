/* Picks an Iconify icon for a topic.
 *
 * Iconify's own search is not usable as the primary matcher: it is keyword
 * based, and on real topics it mostly returns nothing. Measured against the
 * topics actually in the feed, five of six came back empty — "string theory",
 * "quarks", "bernoulli", "stoicism" and "photosynthesis" all had no matches,
 * while "express js" correctly found the Express logo.
 *
 * So the matching is done by concept, and Iconify does two jobs it is good at:
 * serving the icons, and finding logos for named tools and languages.
 */

const API = "https://api.iconify.design";
const CACHE_KEY = "prysm.topicIcons.v1";
const FALLBACK = "ph:compass-bold";

/* Tech topics where Iconify's search genuinely shines — it has logos for
   basically every language, framework and tool. Only these go to the network. */
const TECH_HINT =
  /\b(js|css|html|sql|api|framework|library|language|runtime)\b|^(react|vue|angular|svelte|node|deno|bun|rust|python|golang|java|kotlin|swift|ruby|php|scala|haskell|elixir|docker|kubernetes|git|linux|postgres|mongodb|redis|graphql|typescript|javascript|express|django|flask|rails|laravel|tailwind|vite|webpack|next\.?js|nuxt)\b/i;

/* Concept map. First match wins, so the more specific entries lead.
   Keys are matched as whole words against the topic. */
const CONCEPTS = [
  [["quantum", "particle", "quark", "atom", "atomic", "physics", "relativity", "string theory", "boson", "fermion", "thermodynamics"], "ph:atom-bold"],
  [["space", "astro", "astrophysics", "cosmology", "cosmos", "planet", "galaxy", "star", "orbit", "universe", "nasa"], "ph:planet-bold"],
  [["rocket", "spaceflight", "propulsion", "aerospace"], "ph:rocket-launch-bold"],
  [["chemistry", "chemical", "molecule", "molecular", "reaction", "compound", "polymer"], "ph:flask-bold"],
  [["biology", "genetics", "gene", "dna", "genome", "evolution", "cell", "microbiology", "virus", "bacteria"], "ph:dna-bold"],
  [["plant", "photosynthesis", "botany", "agriculture", "forest", "ecology"], "ph:plant-bold"],
  [["brain", "neuroscience", "neural", "cognition", "cognitive", "psychology", "consciousness", "memory"], "ph:brain-bold"],
  [["medicine", "medical", "health", "disease", "anatomy", "immune", "cancer", "nutrition"], "ph:heartbeat-bold"],
  [["math", "mathematics", "theorem", "algebra", "calculus", "geometry", "topology", "proof", "equation", "bernoulli", "fourier", "linear"], "ph:math-operations-bold"],
  [["statistics", "probability", "regression", "bayesian", "stochastic"], "ph:chart-line-up-bold"],
  [["machine learning", "deep learning", "neural network", "ai", "artificial intelligence", "transformer", "llm", "reinforcement"], "ph:cpu-bold"],
  [["computer science", "systems design", "system design", "distributed systems", "operating system", "programming", "code", "coding", "software", "developer", "api", "database", "algorithm", "compiler", "devops", "backend", "frontend", "framework"], "ph:code-bold"],
  [["debug", "debugging", "testing", "bug"], "ph:bug-bold"],
  [["philosophy", "stoicism", "ethics", "epistemology", "metaphysics", "logic", "existentialism", "aristotle", "plato", "socrates", "kant"], "ph:bank-bold"],
  [["history", "ancient", "rome", "roman", "greece", "medieval", "empire", "war", "civilisation", "civilization", "archaeology"], "ph:scroll-bold"],
  [["economics", "economy", "finance", "market", "monetary", "trade", "investment", "inflation", "money", "game theory", "supply chain"], "ph:currency-circle-dollar-bold"],
  [["law", "legal", "constitution", "politics", "government", "democracy", "geopolitics"], "ph:gavel-bold"],
  [["music", "audio", "sound", "acoustic", "instrument", "composition", "jazz", "classical music"], "ph:music-notes-bold"],
  [["art", "painting", "design", "architecture", "drawing", "sculpture", "typography", "colour", "color"], "ph:palette-bold"],
  [["film", "cinema", "movie", "video", "photography", "animation"], "ph:film-slate-bold"],
  [["climate", "weather", "environment", "earth", "geography", "sustainability", "carbon"], "ph:globe-hemisphere-west-bold"],
  [["ocean", "marine", "water", "fluid", "wave", "hydro"], "ph:waves-bold"],
  [["geology", "rock", "volcano", "mountain", "mineral", "earthquake"], "ph:mountains-bold"],
  [["energy", "electricity", "electric", "power", "battery", "nuclear", "solar"], "ph:lightning-bold"],
  [["engineering", "mechanical", "machine", "robotics", "manufacturing", "systems"], "ph:gear-bold"],
  [["language", "writing", "literature", "poetry", "linguistics", "grammar", "rhetoric", "book"], "ph:book-open-text-bold"],
  [["urban", "city", "architecture", "planning", "infrastructure", "housing"], "ph:buildings-bold"],
  [["experiment", "research", "method", "science"], "ph:test-tube-bold"],
];

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCache(map) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — icons just resolve again next time */
  }
}

/** Whole-word match, so "cli" inside "climate" can't match a CLI icon — the
 *  same substring trap that once classified climate science as a code topic. */
function hasWord(haystack, needle) {
  if (needle.includes(" ")) return haystack.includes(needle);
  return new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i").test(
    haystack,
  );
}

/** The synchronous answer: always returns something sensible, no network. */
export function conceptIcon(topic) {
  const text = String(topic || "").toLowerCase();
  for (const [words, icon] of CONCEPTS) {
    if (words.some((w) => hasWord(text, w))) return icon;
  }
  // A named tool with no concept match is still code, not a compass. This is
  // also the offline answer for tech topics whose logo lookup fails.
  return TECH_HINT.test(text) ? "ph:code-bold" : FALLBACK;
}

/* One band of the prism per topic, picked by hash so a given topic always
   gets the same colour. Stable beats random: the same subject looks the same
   everywhere it appears. */
const BANDS = [
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#34d399",
  "#22d3ee",
];

/** Deterministic colour for a topic. */
export function topicColor(topic) {
  const key = String(topic || "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 997;
  }
  return BANDS[hash % BANDS.length];
}

/* Icon sets that draw in their own colours. Tinting these would flatten a
   multicolour logo to a single hue, so they are left alone. */
const MULTICOLOUR = /^(logos|skill-icons|vscode-icons|flat-color-icons|devicon):/;

/** True for icons that draw in their own colours — they need a light plate,
 *  because plenty of brand marks (Express, Next.js, Flask) are solid black and
 *  disappear against a dark background. */
export function isBrandIcon(icon) {
  return MULTICOLOUR.test(String(icon || ""));
}

/**
 * Full URL for an icon. An <img> can't inherit currentColor, so monotone icons
 * are tinted server-side; multicolour sets are served untouched.
 */
export function iconUrl(icon, color) {
  const base = `${API}/${icon.replace(":", "/")}.svg`;
  if (!color || MULTICOLOUR.test(icon)) return base;
  return `${base}?color=${encodeURIComponent(color)}`;
}

/**
 * Resolves a topic to an icon id, consulting Iconify's search only for topics
 * that look like a named tool — where a real logo beats a generic glyph.
 * Results are cached per topic so a given feed only ever asks once.
 */
export async function resolveTopicIcon(topic) {
  const key = String(topic || "").toLowerCase().trim();
  if (!key) return FALLBACK;

  const cache = readCache();
  if (cache[key]) return cache[key];

  const concept = conceptIcon(key);

  if (!TECH_HINT.test(key)) {
    cache[key] = concept;
    writeCache(cache);
    return concept;
  }

  /* `logos:` first — a real brand mark in its own colours beats a monotone
     glyph. The others are fallbacks for tools it doesn't carry. */
  const SETS = ["logos:", "skill-icons:", "simple-icons:", "lineicons:"];

  /* Two queries, because the full topic often misses: "express js" finds
     nothing in logos:, while "express" finds logos:express. The first
     significant word is the one that matches a product name. */
  const firstWord = key.split(/\s+/).find((w) => w.length > 2) || key;
  const queries = firstWord === key ? [key] : [key, firstWord];

  /* Both queries are gathered before choosing, so set preference applies
     across the union. Picking per query meant a lower-preference hit on the
     full topic beat a `logos:` hit on the single word — "express js" chose a
     skill-icons variant while logos:express existed. */
  const found = [];
  for (const q of queries) {
    try {
      const res = await fetch(`${API}/search?query=${encodeURIComponent(q)}&limit=24`);
      if (!res.ok) continue;
      const { icons = [] } = await res.json();
      found.push(...icons);
    } catch {
      /* offline or blocked — the concept icon is already a good answer */
    }
  }

  for (const set of SETS) {
    // skill-icons ships -light/-dark pairs; -dark is the one drawn for dark UIs.
    const hit =
      found.find((i) => i.startsWith(set) && !i.endsWith("-light")) ||
      found.find((i) => i.startsWith(set));
    if (hit) {
      cache[key] = hit;
      writeCache(cache);
      return hit;
    }
  }

  cache[key] = concept;
  writeCache(cache);
  return concept;
}
