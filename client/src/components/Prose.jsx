import { useState, useRef, useEffect } from "react";
import { IconChevronDown } from "./Icons";

/* The overview, set as a landing-page statement rather than a paragraph.
 *
 * The full text is always in the DOM; the collapse is purely visual (a CSS
 * line-clamp), so "Read more" reveals real content rather than re-fetching or
 * re-truncating. That also means the clamp can change without touching any of
 * the text handling below.
 *
 * Hierarchy comes from weight and colour, not scale: the opening clause is
 * white and bold, everything after it steps down to grey.
 */

const BANDS = [
  "--hl-blue",
  "--hl-violet",
  "--hl-pink",
  "--hl-amber",
  "--hl-emerald",
  "--hl-cyan",
];

const COLLAPSED_LINES = 7;
const MAX_MARKS = 9;
/* Minimum characters between plates. Small enough that the opening carries a
   couple of marks straight away — the first line is what most people read —
   but not so small they run together. */
const MARK_GAP = 42;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Stable colour per term — same word, same band, every time. */
function bandFor(term) {
  const key = term.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 997;
  }
  return BANDS[hash % BANDS.length];
}

/* Emphasis is woven through the whole summary rather than front-loaded.
   A single bold opening followed by an all-grey tail reads as two blocks;
   alternating shorter runs keeps the eye moving and the block feeling light.
   Clauses are the unit because Tavily usually returns one long sentence. */
const CLAUSE_SPLIT = /(?<=[.;:—])\s+|(?<=,)\s+(?=(?:and|but|which|while|using|such|so|to|from|where)\b)/;

function toClauses(text) {
  const parts = text.split(CLAUSE_SPLIT).filter(Boolean);
  if (parts.length < 2) return [text];

  // Merge runts into their neighbour so no clause is a stray word or two.
  const merged = [];
  for (const part of parts) {
    if (merged.length && merged[merged.length - 1].length < 28) {
      merged[merged.length - 1] += " " + part;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

/** Strong on the opening, then every third clause — enough rhythm to read as a
 *  mixture, regular enough not to look random. */
function isStrong(index) {
  return index === 0 || index % 3 === 0;
}

/* Long words are almost always the domain terms worth marking —
   "superposition", "entanglement" — while the long words that aren't are
   nearly all adverbs and connectives, so those are listed out. */
const LONG_WORD_MIN = 11;
const NOT_TERMS = new Set([
  "particularly", "unfortunately", "additionally", "consequently",
  "specifically", "significantly", "increasingly", "traditionally",
  "approximately", "essentially", "furthermore", "nevertheless",
  "respectively", "simultaneously", "immediately", "information",
  "development", "understanding", "differently", "effectively",
]);

function longTerms(text) {
  const found = [];
  for (const raw of text.split(/[^A-Za-z-]+/)) {
    const word = raw.toLowerCase();
    if (
      word.length >= LONG_WORD_MIN &&
      !NOT_TERMS.has(word) &&
      !found.includes(word)
    ) {
      found.push(word);
    }
  }
  return found;
}

/** Proper nouns carry the specific information; sentence-initial capitals are
 *  just grammar, so those are skipped. */
function properNouns(text) {
  const found = [];
  const pattern = /(?<![.!?]\s|^)\b([A-Z][a-z]{2,}(?:'s)?)\b/g;
  let match;
  while ((match = pattern.exec(text)) !== null && found.length < 6) {
    const word = match[1];
    if (!found.some((w) => w.toLowerCase() === word.toLowerCase())) {
      found.push(word);
    }
  }
  return found;
}

/* `state` is shared across every clause so the gap and cap apply to the whole
   summary, not per-clause. */
function markUp(text, terms, state, keyPrefix) {
  if (!text) return null;
  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");

  return text.split(pattern).map((chunk, i) => {
    if (!chunk) return null;
    const key = chunk.toLowerCase();
    const at = state.offset;
    state.offset += chunk.length;

    // Substring-aware: once "quantum computing" is plated, "quantum" alone
    // isn't — stacked plates on one phrase read as a mistake.
    const overlaps = [...state.seen].some(
      (prev) => prev.includes(key) || key.includes(prev),
    );
    const farEnough = at - state.lastAt >= MARK_GAP || state.seen.size === 0;

    if (
      i % 2 === 1 &&
      !overlaps &&
      farEnough &&
      state.seen.size < MAX_MARKS
    ) {
      state.seen.add(key);
      state.lastAt = at;
      return (
        <mark
          key={`${keyPrefix}-${i}`}
          className="prose-mark"
          style={{ "--band": `var(${bandFor(chunk)})` }}
        >
          {chunk}
        </mark>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{chunk}</span>;
  });
}

function Prose({ text, topic }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);

  const clean = String(text || "").replace(/\s+/g, " ").trim();

  /* Only offer "Read more" when the clamp is actually hiding something.
     Measured rather than guessed at, because how many lines a given summary
     takes depends on the viewport and the font's own metrics. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      if (expanded) return;
      setOverflows(el.scrollHeight - el.clientHeight > 4);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // Web fonts land after first paint and change the line count.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => observer.disconnect();
  }, [clean, expanded]);

  if (!clean) return null;

  const clauses = toClauses(clean);
  const terms = [
    ...new Set([
      String(topic || "").trim(),
      ...String(topic || "").split(/\s+/).filter((w) => w.length > 3),
      ...properNouns(clean),
      ...longTerms(clean),
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const state = { seen: new Set(), lastAt: -MARK_GAP, offset: 0 };

  return (
    <div className="prose-wrap">
      <p
        ref={ref}
        className={`prose${expanded ? " expanded" : ""}`}
        style={{ "--delay": "80ms", "--lines": COLLAPSED_LINES }}
      >
        {clauses.map((clause, i) => (
          <span
            key={i}
            className={isStrong(i) ? "prose-strong" : "prose-soft"}
          >
            {markUp(clause, terms, state, `c${i}`)}{" "}
          </span>
        ))}
      </p>

      {(overflows || expanded) && (
        <button
          type="button"
          className="prose-more"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
          <IconChevronDown className={`prose-more-icon${expanded ? " up" : ""}`} />
        </button>
      )}
    </div>
  );
}

export default Prose;
