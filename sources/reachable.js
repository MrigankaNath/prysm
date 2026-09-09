/* Drop links that are gone, and only those.
 *
 * Every lane that carries a link off this app has some rot in it. Measured
 * across three topics: 6 of 19 book links 404ed, and articles, websites and
 * Hacker News each turned up a dead one. A result you cannot open is worse
 * than one that was never shown — it spends the reader's click and their
 * trust.
 *
 * The whole difficulty is that "did not answer 200" and "is broken" are very
 * different claims. In the same measurement, 403 came back from ai.stanford.edu,
 * dl.acm.org and newstoicism.org — all live pages that simply refuse a request
 * without a browser behind it. Dropping those would quietly delete the most
 * institutional half of the websites lane, which is the one lane in the app
 * with human curation in it.
 *
 * So the rule is narrow on purpose: a link is dropped only when the server
 * says the document is not there (404/410) or the host does not resolve at
 * all. Everything else — 401, 403, 405, 202, a redirect, a timeout — is kept.
 * A timeout in particular is as likely to be this machine's network as the
 * other end's.
 *
 * It runs once per topic per cache fill, not per page view, so the cost is one
 * round of HEAD requests against a fetch that already takes seconds.
 *
 * What it cannot catch is a soft 404 — a page that answers 200 and then says
 * "we couldn't find that". Amazon does exactly this, and inconsistently:
 * the same dead ASIN answered 404 on one run and 200 on the next. Catching
 * those means reading the body and guessing at wording, which is a large and
 * fragile thing to bolt on. The case that motivated this was fixed at the
 * source instead — the books lane no longer guesses Amazon URLs at all.
 */

const DEAD_STATUS = new Set([404, 410]);

/* Hosts that answer differently to a HEAD than to a GET are common enough to
   plan for: 405 means "method not allowed", not "gone", so it is retried once
   as a GET before any conclusion is drawn. */
const RETRY_AS_GET = new Set([405, 501]);

/* A real browser's UA. Not to evade anything — the check follows whatever the
   server says either way — but because a default Node agent gets a different
   answer from the same page, which would make the measurement about us. */
const AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** The verdict for a status code, as a pure function so the rule is testable.
 *  True means "provably gone". Everything ambiguous is false. */
function isDeadStatus(status) {
  return DEAD_STATUS.has(status);
}

async function probe(url, method, timeoutMs) {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: control.signal,
      headers: { "user-agent": AGENT, accept: "*/*" },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * False only when the link is provably gone. Anything ambiguous is true.
 *
 * Fails open by design: a checker having a bad afternoon must not be able to
 * empty a lane.
 */
async function isReachable(url, { timeoutMs = 6000 } = {}) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  try {
    let res = await probe(url, "HEAD", timeoutMs);
    if (RETRY_AS_GET.has(res.status)) res = await probe(url, "GET", timeoutMs);
    return !isDeadStatus(res.status);
  } catch (err) {
    /* A name that doesn't resolve is gone; a socket that timed out or reset
       may be anything, including this machine. Only the first is a verdict. */
    const cause = err?.cause?.code || err?.code || "";
    if (cause === "ENOTFOUND" || cause === "EAI_AGAIN") return false;
    return true;
  }
}

/**
 * Filter a lane's items down to the ones that still resolve.
 *
 * Bounded concurrency because a lane is up to forty links and firing them at
 * once is rude to whoever is on the other end.
 */
async function keepReachable(items, { concurrency = 8, timeoutMs = 6000 } = {}) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return list;

  const verdicts = new Array(list.length);
  let cursor = 0;

  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= list.length) return;
      const url = list[i]?.url;
      verdicts[i] = url ? await isReachable(url, { timeoutMs }) : false;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, list.length) }, worker),
  );

  return list.filter((_, i) => verdicts[i]);
}

module.exports = { isReachable, keepReachable, isDeadStatus, DEAD_STATUS };
