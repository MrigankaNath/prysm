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

export const STAGES = [
  {
    id: "orient",
    n: 1,
    label: "Get oriented",
    blurb: "What it is, and why it matters.",
    hue: "#3b82f6",
  },
  {
    id: "work",
    n: 2,
    label: "Work through it",
    blurb: "How it actually works, and where people get stuck.",
    hue: "#8b5cf6",
  },
  {
    id: "source",
    n: 3,
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
     lanes attach around it. */
  for (const item of asArray(categories.articles)) {
    const stage = DEPTH_STAGE[item.depth_level];
    if (stage) byStage[stage].push({ ...item, category: "articles" });
  }

  /* Lanes in the server's own ranked order, so a topic where videos are the
     strongest lane leads its stage with them. */
  const lanes = order.length ? order : Object.keys(categories);
  for (const lane of lanes) {
    const stage = LANE_STAGE[lane];
    if (!stage) continue;
    for (const item of asArray(categories[lane]).slice(0, LANE_TAKE[lane] || 2)) {
      byStage[stage].push({ ...item, category: lane });
    }
  }

  return STAGES.map((stage) => ({ ...stage, items: byStage[stage.id] })).filter(
    (stage) => stage.items.length > 0,
  );
}

/** Every item in a path, in order — what progress is counted against. */
export function pathItems(path) {
  return path.flatMap((stage) => stage.items);
}
