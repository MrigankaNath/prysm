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
  [["space", "astro", "astronomy", "astrophysics", "cosmology", "cosmos", "planet", "galaxy", "star", "orbit", "universe", "nasa", "nebula", "supernova", "comet", "asteroid", "meteor", "telescope", "exoplanet", "black hole", "milky way", "solar system", "celestial"], "ph:planet-bold"],
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
  [["robot", "robotics", "automation", "drone", "actuator", "kinematics"], "ph:robot-bold"],
  [["engineering", "mechanical", "electrical", "circuit", "semiconductor", "manufacturing", "materials"], "ph:gear-bold"],
  [["energy", "climate", "solar", "nuclear", "renewable", "battery", "carbon", "weather"], "ph:lightning-bold"],
  [["economics", "economy", "market", "finance", "monetary", "trade", "inflation", "investment", "supply chain"], "ph:chart-line-bold"],
  [["music", "sound", "audio", "acoustic", "harmony", "composition"], "ph:music-notes-bold"],
  [["art", "design", "typography", "architecture", "painting", "photography"], "ph:palette-bold"],
  [["language", "linguistics", "grammar", "etymology", "translation", "writing", "rhetoric"], "ph:translate-bold"],
  [["law", "legal", "constitution", "justice", "rights", "policy", "governance", "geopolitics"], "ph:gavel-bold"],
  [["philosophy", "stoicism", "ethics", "epistemology", "metaphysics", "logic", "existentialism", "aristotle", "plato", "socrates", "kant"], "ph:bank-bold"],
  [["history", "historical", "ancient", "rome", "roman", "greece", "greek", "egypt", "medieval", "empire", "war", "revolution", "dynasty", "renaissance", "colonial", "civilisation", "civilization", "archaeology", "prehistoric", "silk road"], "ph:scroll-bold"],
  [["economics", "economy", "finance", "market", "monetary", "trade", "investment", "inflation", "money", "game theory", "supply chain"], "ph:currency-circle-dollar-bold"],
  [["law", "legal", "constitution", "politics", "government", "democracy", "geopolitics"], "ph:gavel-bold"],
  [["music", "audio", "sound", "acoustic", "instrument", "composition", "jazz", "classical music"], "ph:music-notes-bold"],
  [["art", "painting", "design", "drawing", "sculpture", "sculptures", "typography", "colour", "color", "ceramics", "pottery", "craft", "illustration", "printmaking"], "ph:palette-bold"],
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

/** Mix a hex toward white. Done in JS because the result becomes an Iconify
 *  query parameter, where a CSS color-mix() would arrive as literal text. */
export function lighten(hex, amount = 0.62) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

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
const MULTICOLOUR =
  /^(logos|skill-icons|vscode-icons|flat-color-icons|devicon|fluent-emoji-flat|noto|openmoji|twemoji):/;

/* Two different questions, and conflating them was a bug: "does this icon
   carry its own colours" is not the same as "does it need a light plate".
   The concept icons are vivid and read fine on dark; brand marks are often
   solid black (Express, Next.js, Flask) and disappear without one. */
const NEEDS_LIGHT_PLATE = /^(logos|simple-icons|skill-icons|devicon):/;

/** True only for brand marks that need something light to sit on. */
export function isBrandIcon(icon) {
  return NEEDS_LIGHT_PLATE.test(String(icon || ""));
}

/**
 * Full URL for an icon. An <img> can't inherit currentColor, so monotone icons
 * are tinted server-side; multicolour sets are served untouched.
 */
export function iconUrl(icon, color) {
  const base = `${API}/${icon.replace(":", "/")}.svg`;
  // Iconify tints server-side, so the colour has to be a literal value in the
  // query string — a CSS function like color-mix() would arrive as text.
  if (!color || MULTICOLOUR.test(icon) || !/^#[0-9a-f]{3,8}$/i.test(color)) {
    return base;
  }
  return `${base}?color=${encodeURIComponent(color)}`;
}

/* --- the second tier: a real object, when the concept map has no word for it
 *
 * Iconify's search is usable here, but only under two restrictions that were
 * measured rather than assumed.
 *
 * Restriction one: concept sets only. Unrestricted, the search answers a topic
 * with whatever brand happens to share its name — "nebula" returns the Nebula
 * streaming service, "portal" and "cosmos" return crypto token logos. A logo
 * for the wrong thing is worse than an honest generic glyph.
 *
 * Restriction two: the icon's own name must *be* one of the topic's words, not
 * merely contain one. Without it "portal" resolves to `captive-portal`, a wifi
 * icon, and "ocean" to `digital-ocean`. With it, the lane is exact: telescope,
 * volcano, galaxy and pyramid all resolve to an icon of that thing, and
 * anything else falls through to the fallback rather than guessing.
 *
 * What this cannot do is abstract topics. No icon set has a drawing of
 * stoicism, philosophy or cell biology — all measured at zero across eight
 * sets — so those stay the concept map's job. */
const CONCEPT_SETS = ["ph", "mdi", "material-symbols", "solar", "tabler", "lucide", "carbon"];

/* Style suffixes stack (`solar:telescope-bold-duotone`), so this strips until
   it stops changing. */
const STYLE_SUFFIX = /-(bold|fill|filled|duotone|outline|outlined|rounded|sharp|light|thin|twotone|two-tone|linear|broken|line-duotone)$/;

function baseName(id) {
  let name = id.slice(id.indexOf(":") + 1);
  let prev;
  do {
    prev = name;
    name = name.replace(STYLE_SUFFIX, "");
  } while (name !== prev);
  return name;
}

async function searchConceptSets(query) {
  const url =
    `${API}/search?query=${encodeURIComponent(query)}` +
    `&prefixes=${CONCEPT_SETS.join(",")}&limit=32`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const { icons = [] } = await res.json();
    return icons;
  } catch {
    return [];
  }
}

/** An icon actually *of* the thing, or nothing. */
async function objectIcon(topic) {
  const words = topic.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  /* The whole topic first — "black hole" should beat "hole" — then the longest
     word, which is the one most likely to name a thing. */
  const longest = [...words].sort((a, b) => b.length - a.length)[0];
  const queries = [topic, longest].filter(Boolean).filter((q, i, a) => a.indexOf(q) === i);
  const terms = new Set([topic.replace(/\s+/g, "-"), ...words]);

  for (const query of queries) {
    const icons = await searchConceptSets(query);
    // Set order is preference, so the glyphs stay visually of a piece.
    for (const set of CONCEPT_SETS) {
      const hit = icons.find(
        (id) => id.startsWith(`${set}:`) && terms.has(baseName(id)),
      );
      if (hit) return hit;
    }
  }
  return null;
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
    /* The map's answer wins whenever it has one — it maps a topic to a idea,
       which is the harder half. The search only covers what the map has no
       word for, and only when it can name the thing exactly. */
    const answer = concept === FALLBACK ? (await objectIcon(key)) || FALLBACK : concept;
    cache[key] = answer;
    writeCache(cache);
    return answer;
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
