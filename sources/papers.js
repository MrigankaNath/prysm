/* The papers lane: arXiv and OpenAlex, merged.
 *
 * Neither is sufficient alone. arXiv has real abstracts, is fast, and is where
 * the current state of the art in ML and physics actually appears — but it
 * indexes only physics, maths, CS, quantitative bio/finance, statistics and
 * economics. For medicine, wet-lab biology, chemistry, psychology or history
 * it has nothing, and its `all:` OR-match returns noise rather than admitting
 * that.
 *
 * OpenAlex covers every discipline, carries citation counts, and knows whether
 * a work was published in a journal or posted as a preprint — which is what
 * lets the page label an unreviewed paper instead of hiding it. What it does
 * not have is a real abstract: it ships an inverted index that has to be
 * rebuilt, and the result reads less well than arXiv's own text.
 *
 * So: both, deduplicated, with whichever record says more about a given paper
 * winning the tie.
 */

const { fetchArxiv } = require("./arxiv");
const { fetchOpenAlex } = require("./openalex");

const MAX_RESULTS = 8;

/** Titles differ by punctuation and case across indexes; the words don't. */
function titleKey(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* Round-robin rather than concatenate. Appending one to the other makes the
   lane read as two blocks — every journal article, then every preprint — and
   buries whichever source went second. */
function interleave(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

function merge(openalex, arxiv) {
  const byKey = new Map();
  for (const item of openalex) {
    const key = titleKey(item.title);
    if (key && !byKey.has(key)) byKey.set(key, item);
  }

  const keptArxiv = [];
  /* arXiv returns the same paper more than once on some queries — different
     entry ids for what is really one work — so the list has to be deduplicated
     against itself, not only against OpenAlex. */
  const seen = new Set();

  for (const item of arxiv) {
    const key = titleKey(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const twin = byKey.get(key);

    /* No twin, or the twin is OpenAlex's record of this same preprint — in
       which case arXiv's copy wins, because its abstract is the author's text
       rather than one rebuilt from an index. A published twin wins instead: it
       carries the journal and the citation count. */
    if (!twin) {
      keptArxiv.push(item);
    } else if (twin.peer_reviewed !== true) {
      byKey.delete(key);
      keptArxiv.push(item);
    }
  }

  return interleave([...byKey.values()], keptArxiv).slice(0, MAX_RESULTS);
}

async function fetchPapers(topic) {
  /* allSettled, not all: arXiv going down should not empty the lane for a
     medicine topic that never needed it, and vice versa. */
  const [openalex, arxiv] = await Promise.allSettled([
    fetchOpenAlex(topic),
    fetchArxiv(topic),
  ]);

  if (openalex.status === "rejected" && arxiv.status === "rejected") {
    throw openalex.reason;
  }

  const log = (name, outcome) => {
    if (outcome.status === "rejected") {
      console.error(`papers: ${name} failed for topic "${topic}"`, outcome.reason);
    }
  };
  log("openalex", openalex);
  log("arxiv", arxiv);

  return merge(
    openalex.status === "fulfilled" ? openalex.value : [],
    arxiv.status === "fulfilled" ? arxiv.value : [],
  );
}

module.exports = { fetchPapers };
