/* The aggregate view of progress — what you've covered, and what's waiting.
 *
 * Every one of these reads the same progress records the path writes. That is
 * the point of the ordering: paths produce the data, and the map and the
 * revisit prompt are two ways of reading it. Nothing here needs a model, a key
 * or a prerequisite graph — those make the map *smarter*, not possible.
 */

import { getAllProgress } from "./library";
import { CLUSTERS } from "./clusters";

/** Topics with a path started but not finished, most recent first. */
export function inProgress(limit = 6) {
  return getAllProgress()
    .filter((p) => p.total > 0 && p.done > 0 && p.done < p.total)
    .slice(0, limit);
}

/** Paths finished, most recent first. */
function completed() {
  return getAllProgress().filter((p) => p.total > 0 && p.done >= p.total);
}

/* A finished path is worth coming back to, but not immediately — the point is
   the gap. Two weeks is long enough that returning tells you something about
   what stuck, and short enough to still be worth re-reading rather than
   relearning. */
const REVISIT_AFTER_DAYS = 14;

export function worthRevisiting(limit = 4) {
  const cutoff = Date.now() - REVISIT_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return completed()
    .filter((p) => p.updated_at && Date.parse(p.updated_at) < cutoff)
    .slice(0, limit);
}

/* Domain coverage: which of the twenty-four bands you've actually been into.
 *
 * Matched by substring in both directions, because an explored topic is free
 * text — someone who searched "neural networks in vision" should light
 * Artificial Intelligence, and "stoicism" should light Philosophy. A topic
 * that matches nothing lights nothing, which is honest: the map says where
 * you have been, not everything you have ever typed. */
export function domainCoverage() {
  const touched = getAllProgress().filter((p) => p.done > 0);

  return CLUSTERS.map((cluster) => {
    const hits = cluster.topics.filter((topic) =>
      touched.some(
        (p) => p.topic.includes(topic) || topic.includes(p.topic),
      ),
    );
    return {
      id: cluster.id,
      label: cluster.label,
      hue: cluster.hue,
      icon: cluster.icon,
      covered: hits.length,
      of: cluster.topics.length,
    };
  });
}
