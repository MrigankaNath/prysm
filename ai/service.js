const pool = require("../db");
const store = require("../db/ai");
const { parseQuery, normaliseItem, groupItems } = require("./content");
const { rankCategories } = require("../sources/rank");
const warmSelections = new Map();

async function sharedSelection(key) {
  const warm = warmSelections.get(key);
  if (warm && warm.until > Date.now()) return warm.value;
  const value = await store.selection(key);
  if (value && !value.stale) {
    if (warmSelections.size >= 100) warmSelections.delete(warmSelections.keys().next().value);
    warmSelections.set(key, { value, until: Date.now() + 120000 });
  } else warmSelections.delete(key);
  return value;
}

// No LLM, web search, page fetching, or embedding call occurs on this path.
// Stale selections remain available while the worker refreshes them.
async function discover(raw, userId) {
  const request = parseQuery(raw);
  if (!request) return { error: "Use a topic or learning question of up to 180 characters", status: 400 };
  const cached = await sharedSelection(request.key);
  const queue = (!cached || cached.stale) ? await store.enqueue(request, userId, { refresh: Boolean(cached) }) : null;
  const usage = { ...await store.quota(userId), withheld: ["plan", "app"].includes(queue) ? queue : null };
  if (cached) {
    const { prism: _prism, ...payload } = cached.payload;
    return { ...payload, usage, ai: { ...payload.ai, stale: cached.stale, refreshing: queue === "queued" } };
  }
  const resources = await store.searchResources(request.topic);
  const legacy = await pool.query("SELECT source,results FROM topic_cache WHERE topic=$1 AND fetched_at>now()-interval '90 days'", [request.topic]);
  const seen = new Set(resources.map(r => r.id));
  let overview = null;
  for (const row of legacy.rows) {
    if (row.source === "overview") { overview = row.results; continue; }
    const category = ({ community: "discussions", answers: "qa" })[row.source] || row.source;
    for (const item of Array.isArray(row.results) ? row.results : []) {
      const normalized = normaliseItem(item, category);
      if (!normalized || seen.has(normalized.id)) continue;
      seen.add(normalized.id);
      resources.push({ id: normalized.id, url: normalized.url, category: normalized.category, item: normalized });
    }
  }
  const categories = groupItems(resources, request.intent);
  if (overview) categories.overview = overview;
  return { topic: request.topic, categories, order: rankCategories(categories, {}), usage,
    ai: { status: queue === "queued" ? "queued" : queue === "failed" ? "unavailable" : queue || "unavailable", provisional: true } };
}

module.exports = { discover };
