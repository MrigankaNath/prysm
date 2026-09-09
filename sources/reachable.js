/* Drop links that are gone, and only those.
 *
 * Every lane that carries a link off this app has some rot in it. Measured
 * across three topics: 6 of 19 book links 404ed, and articles, websites and
 * Hacker News each turned up a dead one. A result you cannot open is worse
 * than one that was never shown — it spends the reader's click and their
 * trust.
 *
 * The rule is: a link is kept only if the server actually serves the page.
 *
 * An earlier version kept anything that wasn't a hard 404, on the grounds that
 * a 403 usually means "no bots" rather than "gone" — ai.stanford.edu and
 * dl.acm.org both answer 403 to a request without a browser behind it. That
 * reasoning is sound about the *server* and wrong about the *reader*: a page
 * that refuses us will usually refuse them too, and a result you cannot open
 * is worse than one that was never shown. So a blocked page is dropped along
 * with a missing one.
 *
 * The cost of that is real and is paid in the websites lane, which is the one
 * with human curation behind it — see the note on GET retries below, which is
 * there to keep the cost as small as possible.
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

/* A HEAD is cheap and a good number of servers handle it badly — 405, or a
   bare 403 from a CDN rule that a real GET passes. So nothing is dropped on a
   HEAD alone: any failure is retried once as a GET, and only that verdict
   counts. It costs a second request on the minority of links that fail the
   first, and it is the difference between "this server dislikes HEAD" and
   "this page is not available". */

/* A real browser's UA. Not to evade anything — the check follows whatever the
   server says either way — but because a default Node agent gets a different
   answer from the same page, which would make the measurement about us. */
const AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** The verdict for a status code, as a pure function so the rule is testable.
 *  A page counts as served only on 2xx; `fetch` has already followed any
 *  redirects by the time this sees a status, so a 3xx here is a redirect that
 *  went nowhere. */
function isServed(status) {
  return status >= 200 && status < 300;
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
    const head = await probe(url, "HEAD", timeoutMs);
    if (isServed(head.status)) return true;
  } catch {
    /* Fall through to the GET. A HEAD that threw is not a verdict either. */
  }

  try {
    const res = await probe(url, "GET", timeoutMs);
    return isServed(res.status);
  } catch {
    return false;
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

module.exports = { isReachable, keepReachable, isServed };
