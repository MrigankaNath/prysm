/* Turning a topic's results into an ordered path.
 *
 * This is the difference between Prysm and a search engine. A search engine
 * hands you forty links ranked by relevance and has no opinion about the order
 * you should meet them in — because it has no idea whether you already know
 * the subject, and no reason to care whether you finish.
 *
 * The ordering already exists in the data and was being thrown away: the
 * Tavily adapter fires three depth-tagged queries per topic, so a dozen of the
 * articles arrive labelled beginner, intermediate or advanced. Those labels
 * are the spine. Everything else attaches to a stage by what it *is* — an
 * introduction is a video, the primary sources are papers and books — which is
 * a rule, not a guess about difficulty.
 *
 * Nothing here fetches anything. It is a re-reading of what the explore page
 * already has.
 */

import { provenanceOf } from "./provenance";

/* Stages carry no number of their own. An empty stage is dropped — a thin
   topic has nothing to orient with — and a hardcoded `n` then survived the
   drop, so a path missing its first stage opened at "2". The number is a
   position in what actually rendered, so it is assigned after the filter. */
const STAGES = [
  {
    id: "orient",
    label: "Get oriented",
    blurb: "What it is, and why it matters.",
    hue: "#3b82f6",
  },
  {
    id: "work",
    label: "Work through it",
    blurb: "How it actually works, and where people get stuck.",
    hue: "#8b5cf6",
  },
  {
    id: "source",
    label: "Go to the source",
    blurb: "The primary material, once the ground is solid.",
    hue: "#10b981",
  },
];

/* Which stage a lane belongs to when its items carry no depth of their own.
 *
 * Only the Tavily articles are depth-tagged; a paper, a repo or a thread
 * arrives with nothing to sort it by. Rather than invent a difficulty score,
 * each lane sits where its *kind* belongs: a video is how most people start, a
 * thread is where people compare notes halfway through, a paper is what you
 * read once the ground is solid. Q&A leads stage two because a question is
 * usually asked from exactly that position. */
const LANE_STAGE = {
  videos: "orient",
  qa: "work",
  discussions: "work",
  code: "work",
  papers: "source",
  books: "source",
};

/* How many of a lane's items a stage takes. A path is a sequence, not the
   whole shelf — the full lane is still one click away under "everything". */
const LANE_TAKE = {
  videos: 2,
  qa: 3,
  discussions: 3,
  code: 2,
  papers: 3,
  books: 3,
};

/* Per depth tier, not per topic — articles are the spine and appear in all
   three stages, so this is three of each. */
const ARTICLE_TAKE = 3;

/* What earns a place on the path.
 *
 * "Everything" is the shelf: whatever the adapters returned. The path is a
 * stronger claim — that these are the things worth your time on this topic and
 * this is the order to meet them — and it gets read by people actually
 * researching something. Taking the first two or three of each lane made that
 * claim about whatever happened to sort highest, which on a topic with a
 * popular homonym meant a match report and a gardening blog.
 *
 * These are admission floors, not badges. They sit deliberately below the
 * thresholds in provenance.js, which mark the exceptional — this only asks
 * whether an item is substantial enough to be worth someone's research time.
 *
 * A lane where nothing clears the bar contributes nothing, and that is the
 * right outcome. A short honest path beats a padded one, everything dropped is
 * still one click away, and the same reasoning already governs the podcast
 * lane on the server: no result is a fact, three wrong ones is a lie.
 */
const ADMITS = {
  // Either someone with the problem marked it solved, or the site voted it up.
  qa: (item) => item.accepted === true || (item.signal || 0) >= 15,
  // This lane exists because people argued about it. No replies, no lane.
  discussions: (item) => (item.signal || 0) >= 40,
  // A repo nobody uses is a reference for nothing.
  code: (item) => (item.signal || 0) >= 300,
  videos: (item) => (item.signal || 0) >= 15000,
  /* arXiv is already relevance-gated and is a research index in its own right,
     so a preprint is admitted on being indexed there. Everything else in this
     lane comes from OpenAlex, which covers all of publishing — including a lot
     that was never reviewed and never cited. */
  papers: (item) =>
    item.source === "arxiv" || item.peer_reviewed === true || (item.signal || 0) >= 10,
};

/* Articles, books and podcasts carry no floor. Articles are the depth-tagged
   spine and have no signal to floor; books are already gated on catalogued
   subjects and are readable in full; podcasts are already relevance-gated at
   the source. */

const DEPTH_STAGE = {
  beginner: "orient",
  intermediate: "work",
  advanced: "source",
};

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

/**
 * Build the three stages for a topic from its live-discovery categories.
 *
 * Returns `[{ ...stage, items }]` with empty stages dropped, so a thin topic
 * shows two honest stages rather than three with a hole in the middle.
 */
export function buildPath(categories, order = []) {
  if (!categories) return [];

  const byStage = { orient: [], work: [], source: [] };

  /* Articles first, so the depth-tagged spine claims its places before the
     lanes attach around it.
     Capped and sorted per tier like every other lane. They used to go in
     whole, which meant a stage could be four articles deep and that the
     weakest of them was in the path purely for having a depth tag — the
     gardening blog that "cosmos" returns outranked nothing, it was simply
     never asked to compete. */
  const byDepth = { orient: [], work: [], source: [] };
  for (const item of asArray(categories.articles)) {
    const stage = DEPTH_STAGE[item.depth_level];
    if (stage) byDepth[stage].push({ ...item, category: "articles" });
  }
  for (const stage of Object.keys(byDepth)) {
    byStage[stage].push(
      ...byDepth[stage].sort(byStrength).slice(0, ARTICLE_TAKE),
    );
  }

  /* Lanes in the server's own ranked order, so a topic where videos are the
     strongest lane leads its stage with them. */
  const lanes = order.length ? order : Object.keys(categories);
  for (const lane of lanes) {
    const stage = LANE_STAGE[lane];
    if (!stage) continue;

    const admits = ADMITS[lane];

    /* Sorted before it is sliced, which is the whole difference between the
       best few of a lane and the first few. The adapters rank by their own
       relevance, which answers "is this about the topic" and says nothing
       about whether it is any good. */
    const picked = asArray(categories[lane])
      .map((item) => ({ ...item, category: lane }))
      .filter((item) => !admits || admits(item))
      .sort(byStrength)
      .slice(0, LANE_TAKE[lane] || 2);

    byStage[stage].push(...picked);
  }

  return STAGES.map((stage) => ({
    ...stage,
    items: rankStageItems(byStage[stage.id]),
  }))
    .filter((stage) => stage.items.length > 0)
    .map((stage, i) => ({ ...stage, n: i + 1 }));
}

/* Ordering inside a stage, and the order of these two keys is the point.
 *
 * A stage is a ramp, not a bag. Sorting a stage by badge strength alone put a
 * cited paper above the video that explains it — both correctly inside "go to
 * the source", but the wrong way round to actually read. Kind settles the
 * ramp, because effort is a property of the medium: you watch before you read,
 * and you read a thread before you read the paper it argues about.
 *
 * Provenance then decides which of two videos leads, which is the question it
 * can answer. It was never a difficulty measure — "widely cited" says a paper
 * matters, not that it is a good third thing to open. */
const KIND_ORDER = {
  videos: 0,
  articles: 1,
  qa: 2,
  discussions: 3,
  podcasts: 4,
  code: 5,
  books: 6,
  papers: 7,
};

/* Reviewed and institutional work above popularity, popularity above the
   unverifiable. Raw signal only breaks ties inside a band. */
const RANK = {
  reviewed: 0,
  institutional: 1,
  answered: 2,
  cited: 3,
  used: 4,
  discussed: 5,
  watched: 6,
  running: 7,
  free: 8,
  preprint: 9,
};

/** How strong an item's claim on a place is, ignoring what kind of thing it
 *  is. Lower is stronger. */
function strengthOf(item) {
  return RANK[provenanceOf(item)?.tone] ?? 10;
}

/** Strongest first, raw signal only breaking ties inside a band. */
function byStrength(a, b) {
  return strengthOf(a) - strengthOf(b) || (b.signal || 0) - (a.signal || 0);
}

function rankStageItems(items) {
  return [...items].sort((a, b) => {
    const ka = KIND_ORDER[a.category] ?? 8;
    const kb = KIND_ORDER[b.category] ?? 8;
    if (ka !== kb) return ka - kb;

    return byStrength(a, b);
  });
}

/** Every item in a path, in order — what progress is counted against. */

export function pathItems(path) {
  return path.flatMap((stage) => stage.items);
}
