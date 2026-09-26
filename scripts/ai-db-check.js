// Optional integration check against the configured database. Every fixture
// mutation is rolled back; no external provider is called and no secret is logged.
require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const pool = require("../db");
const store = require("../db/ai");
const { parseQuery, normaliseItem } = require("../ai/content");

async function check() {
  const client = await pool.connect();
  const originalQuery = pool.query;
  const originalConnect = pool.connect;
  try {
    await client.query("BEGIN");
    // Run the store's nested transactions on this single rollback-only
    // connection. Do not run this script inside the web/worker process.
    pool.query = client.query.bind(client);
    pool.connect = async () => ({ release() {}, query: (sql, args) =>
      ["BEGIN", "COMMIT", "ROLLBACK"].includes(sql) ? Promise.resolve({ rows: [] }) : client.query(sql, args) });
    const request = parseQuery(`prysm db fixture ${Date.now()}`);
    const item = normaliseItem({ title: request.topic, url: `https://example.org/${request.key}`, snippet: "A public robotics learning fixture." });
    await store.saveResource({ id: item.id, url: item.url, category: "articles", item }, Array(384).fill(0.01));
    assert.ok((await store.getResources([item.id]))[0].embedded);
    assert.ok((await store.searchResources(request.topic, Array(384).fill(0.01))).some(r => r.id === item.id));
    await store.saveSelection(request, { topic: request.topic, intent: "overview", categories: { articles: [item] }, prism: { title: "Fixture", items: [item] } }, true);
    assert.equal((await store.selection(request.key)).payload.prism, undefined);
    assert.equal((await store.selection(request.key, true)).payload.prism.title, "Fixture");
    assert.ok((await store.listPrisms(request.topic)).some(p => p.id === `ai-${request.key}`));
    assert.equal(await store.enqueue(request), "queued");
    assert.equal(await store.enqueue(request), "queued");
    assert.equal(Number((await client.query("SELECT count(*) FROM ai_jobs WHERE key=$1", [request.key])).rows[0].count), 1);
    await store.checkpoint(request.key, { plan: { topic: request.topic } });
    await store.finish(request.key);
    await store.reserve("tavily");
    const security = await client.query("SELECT bool_and(relrowsecurity AND NOT has_table_privilege('anon',oid,'SELECT') AND NOT has_table_privilege('authenticated',oid,'SELECT')) AS secure FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1)", [["ai_resources", "ai_selections", "ai_jobs", "ai_user_usage", "ai_budget_events", "ai_search_cache"]]);
    assert.equal(security.rows[0].secure, true);
    console.log("AI DB checks passed: vector search, resource/selection writes, duplicate queue, budget reservation, RLS. Fixtures rolled back.");
  } finally {
    pool.query = originalQuery;
    pool.connect = originalConnect;
    await client.query("ROLLBACK");
    client.release();
  }
}
check().catch(() => { console.error("AI DB check failed; fixtures rolled back. No provider calls were made."); process.exitCode = 1; }).finally(() => pool.end());
