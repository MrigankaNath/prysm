/* Which lane leads, and which one is merely present.
 *
 * Lifted out of server.js so the editorial rules below are testable: they are
 * a set of judgements about what a topic is best entered through, and that is
 * exactly the kind of thing that regresses silently.
 *
 * `config` is server.js's LIVE_CATEGORIES — each lane's `expected` fill and
 * its `saturation` point, where it has one.
 */

// Sources without an engagement metric (arXiv, YouTube search, Tavily, Open
// Library) can't be scored on quality, so they sit at a fixed middling value:
// a category with genuinely strong engagement should outrank them, a weak one
// should fall below them.
const UNSCORED_BASELINE = 0.6;

/* Three tiers, then score inside each.
 *
 * Scoring alone kept getting the shape of a topic wrong, because engagement
 * measures how busy a lane is, not whether it is the right lane. A 58k-star
 * repo outranked the videos on "react hooks"; a well-cited paper leads on a
 * subject nobody exploring it wants a paper for.
 *
 * `START_HERE` is what almost any topic is best entered through, and websites
 * belongs with videos and articles: it is the one lane in this app with human
 * curation behind it — Wikipedia's editors — so on a topic where it has
 * anything, what it has is usually the best thing on the page.
 *
 * `SPECIALIST` is real content that is only right for some subjects. Both are
 * already gated at fetch time — code on `demandsCode`, arXiv on relevance —
 * but a lane surviving its gate still shouldn't outrank the general ones on a
 * topic where it merely happens to be busy.
 *
 * `TAIL` is books, always last: a book is the largest commitment on the page
 * and, since the lane opened past free scans, most of them are something you
 * have to buy. It stays in the app because a canonical book is often the best
 * thing on a subject — but it is never the first thing to offer.
 *
 * A lane with no results is skipped at every tier, so pinning a position never
 * produces an empty section. */
const START_HERE = ["videos", "articles", "websites"];
const SPECIALIST = ["papers", "code"];
const TAIL = ["books"];

// Not every topic is best served by the same medium: philosophy lives in
// podcasts and books, a JS library lives in code and Q&A. Rank categories per
// topic instead of showing one fixed order. Deterministic for now — the
// embedding/quality model in the AI phase replaces this.
function rankCategories(categories, config) {
  const scored = Object.entries(categories)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Boolean(value)))
    .map(([name, value]) => {
      const spec = config[name] || {};
      const items = Array.isArray(value) ? value : [value];
      const fill = Math.min(items.length / (spec.expected || 1), 1);

      let quality = UNSCORED_BASELINE;
      /* Only over the items that actually carry a number. Reddit and Quora
         arrive through Tavily with no vote count, so a discussions lane made
         entirely of them had a peak signal of 0 — which scores 0 and sinks the
         lane to the bottom of the page. Absent evidence is not evidence of a
         weak lane; it falls back to the neutral baseline, same as YouTube and
         arXiv, which have never carried one either. */
      const signals = items
        .map((item) => item.signal)
        .filter((n) => typeof n === "number" && n > 0);

      if (spec.saturation && signals.length) {
        const peak = Math.max(...signals);
        // Log-scaled so quality lifts a category without one outlier dominating:
        // 58k-star React repos score ~1, the 140-star repos a philosophy search
        // turns up score ~0.45, which drops Code below the neutral categories.
        quality = Math.min(Math.log10(peak + 1) / Math.log10(spec.saturation), 1);
      }

      return { name, score: fill * quality };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ name }) => name);

  const has = (name) => {
    const value = categories[name];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  };

  const lead = START_HERE.filter(has);
  const pinned = new Set([...lead, ...SPECIALIST, ...TAIL, "overview"]);

  // Score decides the order inside a tier, never across tiers.
  const middle = scored.filter((name) => !pinned.has(name));
  const specialist = scored.filter((name) => SPECIALIST.includes(name));
  const tail = TAIL.filter(has);

  // The overview is a primer, so it always leads regardless of score.
  return ["overview", ...lead, ...middle, ...specialist, ...tail].filter(
    (name) => (name === "overview" ? Boolean(categories.overview) : true),
  );
}

/* Lanes whose links point at the open web, where pages rot.
 *
 * Measured across three topics: books lost 6 of 19 (all of them the Amazon
 * guess, now replaced), and articles, websites and Hacker News each turned up
 * a dead one. The lanes left out are the ones whose URLs are built from a live
 * API record — a youtube.com/watch, a github.com repo, an arxiv.org/abs — and
 * those do not 404 while the record still exists, so checking them would be
 * forty HEAD requests a topic to confirm what the API already said.
 *
 * The check runs before the row is cached, so it costs one round per topic per
 * TTL rather than anything per page view. */
const ROT_PRONE = new Set([
  "articles",
  "essays",
  "community",
  "answers",
  "websites",
  "books",
  "discussions",
]);


module.exports = { rankCategories, START_HERE, SPECIALIST, TAIL, UNSCORED_BASELINE };
