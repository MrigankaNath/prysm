const pool = require("./index");

async function getCached(topic, source) {
  const result = await pool.query(
    "SELECT results FROM topic_cache WHERE topic = $1 AND source = $2 AND expires_at > now()",
    [topic, source],
  );
  return result.rows[0]?.results || null;
}

async function setCached(topic, source, results, ttlHours = 24) {
  await pool.query(
    `INSERT INTO topic_cache (topic, source, results, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' hours')::interval)
     ON CONFLICT (topic, source)
     DO UPDATE SET results = EXCLUDED.results, fetched_at = now(), expires_at = EXCLUDED.expires_at`,
    [topic, source, JSON.stringify(results), ttlHours],
  );
}

module.exports = { getCached, setCached };
