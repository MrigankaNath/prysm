const pool = require("../db");
const { parseQuery } = require("./content");

// Cache only public topic data, never account identity, interests or progress.
// Per-topic keys let two users with overlapping interests reuse the same read.
const cache = new Map();
async function feedRows(topics) {
  const names = [...new Set(topics)].slice(0, 8);
  const missing = names.filter(topic => !cache.has(topic) || cache.get(topic).until <= Date.now());
  if (missing.length) {
    const keys = new Map(missing.map(topic => [topic, parseQuery(topic)?.key]));
    const selections = await pool.query("SELECT key,payload->'categories' AS categories FROM ai_selections WHERE key=ANY($1) AND updated_at>now()-interval '90 days'", [[...keys.values()].filter(Boolean)]);
    const byKey = new Map(selections.rows.map(row => [row.key, row.categories || {}]));
    const found = new Map(missing.filter(topic => byKey.has(keys.get(topic))).map(topic => [topic, Object.entries(byKey.get(keys.get(topic)))
      .filter(([, results]) => Array.isArray(results)).map(([source, results]) => ({ topic, source, results }))]));
    const fallback = missing.filter(topic => !found.has(topic));
    const legacy = fallback.length ? await pool.query("SELECT topic,source,results FROM topic_cache WHERE topic=ANY($1) AND fetched_at>now()-interval '90 days'", [fallback]) : { rows: [] };
    for (const topic of missing) {
      if (cache.size >= 100 && !cache.has(topic)) cache.delete(cache.keys().next().value);
      cache.set(topic, { until: Date.now() + 300000, rows: found.get(topic) || legacy.rows.filter(row => row.topic === topic) });
    }
  }
  return names.flatMap(topic => cache.get(topic)?.rows || []);
}

module.exports = { feedRows };
