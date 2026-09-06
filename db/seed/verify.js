/* Link check for the curated Prisms.
 *
 * A curated path claims these are the best free resources on a topic. A dead
 * link is the one failure that makes the claim worthless, so every URL is
 * fetched before the set is loaded.
 *
 *   node db/seed/verify.js            check every prism
 *   node db/seed/verify.js react      check the ones whose slug matches
 */

const { PRISMS } = require("./prisms.data");

const TIMEOUT_MS = 15000;
const CONCURRENCY = 12;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function check(url) {
  /* HEAD first: it is cheaper and most hosts answer it. Several of these
     sites 403 or 405 a HEAD and serve a GET fine, so a failure retries. */
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        headers: { "User-Agent": UA, Accept: "*/*" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return { ok: true, status: res.status };
      if (method === "GET") return { ok: false, status: res.status };
    } catch (err) {
      if (method === "GET") return { ok: false, status: err.name || "ERR" };
    }
  }
  return { ok: false, status: "ERR" };
}

async function pool(jobs, limit) {
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, jobs.length) }, async () => {
      while (next < jobs.length) {
        const i = next++;
        results[i] = await jobs[i]();
      }
    }),
  );
  return results;
}

async function main() {
  const filter = process.argv[2];
  const prisms = filter
    ? PRISMS.filter((p) => p.slug.includes(filter))
    : PRISMS;

  const rows = prisms.flatMap((p) =>
    p.items.map((item) => ({ slug: p.slug, url: item.u, title: item.t })),
  );

  console.log(`checking ${rows.length} urls across ${prisms.length} prisms\n`);

  const results = await pool(
    rows.map((row) => async () => ({ ...row, ...(await check(row.url)) })),
    CONCURRENCY,
  );

  const bad = results.filter((r) => !r.ok);
  for (const r of bad) console.log(`  ${String(r.status).padEnd(6)} ${r.slug}  ${r.url}`);

  const dupes = new Map();
  for (const r of results) dupes.set(r.url, (dupes.get(r.url) || 0) + 1);
  const repeated = [...dupes].filter(([, n]) => n > 1);
  for (const [url, n] of repeated) console.log(`  DUPE×${n} ${url}`);

  console.log(
    `\n${results.length - bad.length}/${results.length} ok` +
      (bad.length ? `, ${bad.length} failed` : "") +
      (repeated.length ? `, ${repeated.length} duplicated` : ""),
  );
  process.exit(bad.length || repeated.length ? 1 : 0);
}

main();
