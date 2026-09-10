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
const dns = require("node:dns").promises;
const net = require("node:net");

/* Only public addresses may be probed.
 *
 * This checker fetches URLs that arrive from other people's search indexes, and
 * one of the lanes it guards is Hacker News, where the URL is whatever a
 * stranger submitted. Without this it was a server-side request forgery
 * primitive: `isReachable("http://169.254.169.254/latest/meta-data/")` — or any
 * localhost port — returned an honest `true`, which is an internal port scanner
 * with the result leaking one bit at a time. Verified against a live local
 * server before the fix: 127.0.0.1, localhost and [::1] all returned true.
 *
 * Blocking by hostname is not enough (a public name can resolve to 127.0.0.1,
 * and a redirect can land anywhere), so the host is resolved and every address
 * checked, and redirects are followed by hand with the same check on each hop. */
function v4Blocked(ip) {
  const [a, b] = ip.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;            // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16/12
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;              // 192.0.0/24 protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true;  // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true;                          // multicast + reserved
  return false;
}

function v6Blocked(ip) {
  const low = ip.toLowerCase();
  if (low === "::" || low === "::1") return true;
  if (low.startsWith("fc") || low.startsWith("fd")) return true; // unique-local
  if (low.startsWith("fe8") || low.startsWith("fe9") ||
      low.startsWith("fea") || low.startsWith("feb")) return true; // link-local
  // IPv4-mapped (::ffff:127.0.0.1) — judge the embedded address.
  const mapped = low.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? v4Blocked(mapped[1]) : false;
}

function isPublicAddress(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) return !v4Blocked(ip);
  if (kind === 6) return !v6Blocked(ip);
  return false;
}

/** Every address the host resolves to must be public. Fails closed: a host that
 *  cannot be resolved is not probed. */
async function hostIsPublic(hostname) {
  if (net.isIP(hostname)) return isPublicAddress(hostname);
  try {
    const records = await dns.lookup(hostname, { all: true });
    return records.length > 0 && records.every((r) => isPublicAddress(r.address));
  } catch {
    return false;
  }
}

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

const MAX_HOPS = 4;

/* Redirects are followed by hand, because `redirect: "follow"` would land on
   whatever the last hop names without the address check ever seeing it — which
   is the easiest way to walk a public URL into a private one. */
async function probe(url, method, timeoutMs) {
  let current = url;

  for (let hop = 0; hop < MAX_HOPS; hop += 1) {
    const parsed = new URL(current);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!(await hostIsPublic(parsed.hostname))) return null;

    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(current, {
        method,
        redirect: "manual",
        signal: control.signal,
        headers: { "user-agent": AGENT, accept: "*/*" },
      });
    } finally {
      clearTimeout(timer);
    }

    const location = res.status >= 300 && res.status < 400 && res.headers.get("location");
    if (!location) return res;
    current = new URL(location, current).toString();
  }

  return null; // redirect loop, or too many hops
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
    if (head && isServed(head.status)) return true;
  } catch {
    /* Fall through to the GET. A HEAD that threw is not a verdict either. */
  }

  try {
    const res = await probe(url, "GET", timeoutMs);
    return Boolean(res) && isServed(res.status);
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

  const verdicts = Array.from({ length: list.length });
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

module.exports = { isReachable, keepReachable, isServed, isPublicAddress, ROT_PRONE };
