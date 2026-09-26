const pool = require("./index");
const { config } = require("../ai/config");

class BudgetError extends Error {
  constructor(provider, delay = 3600) { super("Shared budget paused"); this.code = "budget"; this.provider = provider; this.delay = delay; }
}

async function transaction(fn, database = pool) {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

// Reservations commit BEFORE network calls. Failed/ambiguous attempts remain
// charged; an automatic retry cannot silently spend the same allowance twice.
async function reserve(provider, units = 1, tokens = 0, database = pool) {
  const limits = config().limits[provider];
  if (!limits || !Number.isInteger(units) || units < 1 || !Number.isInteger(tokens) || tokens < 0) throw new Error("Invalid budget reservation");
  return transaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`ai-budget:${provider}`]);
    const result = await client.query(
      `SELECT COALESCE(SUM(units) FILTER (WHERE created_at > now() - interval '24 hours'),0)::int AS daily,
              COALESCE(SUM(tokens) FILTER (WHERE created_at > now() - interval '24 hours'),0)::int AS tokens,
              COALESCE(SUM(units),0)::int AS monthly
       FROM ai_budget_events WHERE provider = $1 AND created_at > now() - interval '30 days'`, [provider]);
    const used = result.rows[0];
    // Migration/rollout must not forget the credits already bought by the
    // legacy three-search path earlier in this calendar month.
    const legacy = provider === "tavily" ? Number((await client.query(
      "SELECT COALESCE(SUM(fresh_topics),0)::int * 3 AS credits FROM user_usage WHERE period=to_char(now() AT TIME ZONE 'UTC','YYYY-MM')"
    )).rows[0]?.credits || 0) : 0;
    if (used.daily + units > limits.day || used.monthly + legacy + units > limits.month || (limits.tokens && used.tokens + tokens > limits.tokens)) throw new BudgetError(provider);
    await client.query("INSERT INTO ai_budget_events(provider,units,tokens) VALUES ($1,$2,$3)", [provider, units, tokens]);
  }, database);
}

async function quota(userId) {
  const result = await pool.query("SELECT requests FROM ai_user_usage WHERE user_id=$1 AND period=to_char(now() AT TIME ZONE 'UTC','YYYY-MM')", [userId]);
  return { used: result.rows[0]?.requests || 0, limit: config().userRequests, plan: "free" };
}

async function enqueue(request, userId = null, { refresh = false, publishPrism = false } = {}) {
  return transaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('ai-enqueue'))");
    const old = (await client.query("SELECT status, updated_at FROM ai_jobs WHERE key=$1", [request.key])).rows[0];
    if (old && ["queued", "running"].includes(old.status)) return "queued";
    if (old && !refresh && old.status !== "failed") return old.status;
    if (old && Date.now() - new Date(old.updated_at).getTime() < 3600000) return old.status;
    const counts = (await client.query(
      "SELECT COUNT(*) FILTER (WHERE status IN ('queued','running'))::int AS pending, COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS recent FROM ai_jobs")).rows[0];
    if (counts.pending >= config().queueLimit || (!old && counts.recent >= 300)) return "app";
    // Refreshes and duplicate requests are free to the user. All processing,
    // including prewarming, still passes through the same provider budgets.
    if (userId && !old) {
      const result = await client.query(
        `INSERT INTO ai_user_usage(user_id,period,requests)
         SELECT $1,to_char(now() AT TIME ZONE 'UTC','YYYY-MM'),1 WHERE $2 > 0
         ON CONFLICT(user_id,period) DO UPDATE SET requests=ai_user_usage.requests+1
         WHERE ai_user_usage.requests < $2 RETURNING requests`, [userId, config().userRequests]);
      if (!result.rowCount) return "plan";
    }
    await client.query(
      `INSERT INTO ai_jobs(key,request) VALUES($1,$2)
       ON CONFLICT(key) DO UPDATE SET status='queued', attempts=0, checkpoint='{}',
         available_at=now(), error_code=NULL, request=EXCLUDED.request, updated_at=now()`,
      [request.key, JSON.stringify({ ...request, publishPrism })]);
    return "queued";
  });
}

async function claim() {
  const result = await pool.query(
    `UPDATE ai_jobs SET status='running', lease_until=now()+interval '20 minutes', updated_at=now()
     WHERE key=(SELECT key FROM ai_jobs WHERE
       (status='queued' AND available_at<=now()) OR (status='running' AND lease_until<now())
       ORDER BY available_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`);
  return result.rows[0] || null;
}
async function checkpoint(key, data) {
  await pool.query("UPDATE ai_jobs SET checkpoint=$2,lease_until=now()+interval '20 minutes',updated_at=now() WHERE key=$1", [key, JSON.stringify(data)]);
}
async function finish(key) {
  await pool.query("UPDATE ai_jobs SET status='done', checkpoint='{}',lease_until=NULL,error_code=NULL,updated_at=now() WHERE key=$1", [key]);
}
async function retry(job, error) {
  const deferred = ["budget", "configuration", "rate_limit"].includes(error.code);
  const attempts = job.attempts + (deferred ? 0 : 1);
  const delay = error.delay || (deferred ? 3600 : Math.min(86400, 300 * 2 ** attempts));
  await pool.query(
    `UPDATE ai_jobs SET status=$2,attempts=$3,available_at=now()+($4*interval '1 second'),
     lease_until=NULL,error_code=$5,updated_at=now() WHERE key=$1`,
    [job.key, attempts >= 3 ? "failed" : "queued", attempts, delay, deferred ? error.code : "processing"]);
}
async function selection(key, includePrism = false) {
  return (await pool.query("SELECT key,topic,publish_prism,CASE WHEN $2 THEN payload ELSE payload-'prism' END AS payload, expires_at<=now() AS stale FROM ai_selections WHERE key=$1", [key, includePrism])).rows[0] || null;
}
async function saveSelection(request, payload, publish = false) {
  await pool.query(
    `INSERT INTO ai_selections(key,topic,intent,payload,publish_prism,expires_at) VALUES($1,$2,$3,$4,$5,now()+($6*interval '1 day'))
     ON CONFLICT(key) DO UPDATE SET topic=EXCLUDED.topic,intent=EXCLUDED.intent,payload=EXCLUDED.payload,
       publish_prism=EXCLUDED.publish_prism,updated_at=now(),expires_at=EXCLUDED.expires_at`,
    [request.key, payload.topic, payload.intent, JSON.stringify(payload), publish, payload.intent === "research" ? 7 : 30]);
}
async function cachedSearch(key) {
  return (await pool.query("SELECT results FROM ai_search_cache WHERE key=$1 AND expires_at>now()", [key])).rows[0]?.results || null;
}
async function saveSearch(key, data) {
  await pool.query("INSERT INTO ai_search_cache(key,results,expires_at) VALUES($1,$2,now()+interval '30 days') ON CONFLICT(key) DO UPDATE SET results=EXCLUDED.results,expires_at=EXCLUDED.expires_at", [key, JSON.stringify(data)]);
}
async function getResources(ids) {
  return (await pool.query("SELECT id,url,category,item,assessment,content_hash,updated_at,embedding IS NOT NULL AS embedded FROM ai_resources WHERE id=ANY($1)", [ids])).rows;
}
function vectorValue(vector) {
  if (!Array.isArray(vector) || vector.length !== 384 || !vector.every(n => typeof n === "number" && Number.isFinite(n))) throw new Error("Invalid embedding");
  return `[${vector.join(",")}]`;
}
async function saveResource(resource, embedding = null) {
  const text = [resource.item.title, resource.assessment?.summary || resource.item.snippet, ...(resource.assessment?.topics || []), ...(resource.assessment?.prerequisites || [])].join(" ").slice(0, 4000);
  await pool.query(
    `INSERT INTO ai_resources(id,url,category,item,assessment,content_hash,embedding,search_text)
     SELECT $1,$2,$3,$4,$5,$6,$7::vector,$8 WHERE
       EXISTS(SELECT 1 FROM ai_resources WHERE id=$1) OR (SELECT COUNT(*) FROM ai_resources)<$9
     ON CONFLICT(id) DO UPDATE SET item=EXCLUDED.item,assessment=COALESCE(EXCLUDED.assessment,ai_resources.assessment),
       category=EXCLUDED.category,content_hash=EXCLUDED.content_hash,
       embedding=COALESCE(EXCLUDED.embedding,ai_resources.embedding),search_text=EXCLUDED.search_text,updated_at=now()`,
    [resource.id, resource.url, resource.category, JSON.stringify(resource.item), resource.assessment ? JSON.stringify(resource.assessment) : null, resource.content_hash || null,
      embedding ? vectorValue(embedding) : null, text, config().catalogueLimit]);
}
async function searchResources(query, vector = null) {
  const lexical = (await pool.query(
    `SELECT id,url,category,item,assessment,ts_rank_cd(search_vector,websearch_to_tsquery('english',$1)) AS score
     FROM ai_resources WHERE search_vector @@ websearch_to_tsquery('english',$1)
     ORDER BY score DESC LIMIT 30`, [query])).rows;
  if (!vector) return lexical;
  const semantic = (await pool.query(
    `SELECT id,url,category,item,assessment,1-(embedding <=> $1::vector) AS score
     FROM ai_resources WHERE embedding IS NOT NULL AND 1-(embedding <=> $1::vector) > 0.45
     ORDER BY embedding <=> $1::vector LIMIT 30`, [vectorValue(vector)])).rows;
  const fused = new Map();
  for (const list of [lexical, semantic]) list.forEach((r, i) => {
    const prior = fused.get(r.id);
    fused.set(r.id, { ...r, score: (prior?.score || 0) + 1 / (60 + i + 1) });
  });
  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, 30);
}
async function listPrisms(topic) {
  const rows = (await pool.query(
    `SELECT key,topic,payload->'prism' AS prism FROM ai_selections WHERE publish_prism=true
     AND payload->'prism' IS NOT NULL AND ($1::text IS NULL OR topic=$1) ORDER BY updated_at DESC LIMIT 40`, [topic || null])).rows;
  return rows.filter(r => r.prism?.items?.length).map(r => ({ id: `ai-${r.key}`, topic: r.topic,
    title: r.prism.title, description: r.prism.description, curation: "ai", reviewed_at: r.prism.reviewed_at }));
}
async function status() {
  const [jobs, resources, budgets] = await Promise.all([
    pool.query("SELECT status,count(*)::int AS count FROM ai_jobs GROUP BY status"),
    pool.query("SELECT count(*)::int AS total,count(assessment)::int AS assessed,count(embedding)::int AS embedded FROM ai_resources"),
    pool.query("SELECT provider,SUM(units)::int AS units,SUM(tokens)::bigint AS tokens FROM ai_budget_events WHERE created_at>now()-interval '30 days' GROUP BY provider"),
  ]);
  return { jobs: jobs.rows, resources: resources.rows[0], budgets: budgets.rows, limits: config().limits };
}
async function prune() {
  await pool.query("DELETE FROM ai_budget_events WHERE created_at<now()-interval '35 days'");
  await pool.query("DELETE FROM ai_search_cache WHERE expires_at<now()-interval '7 days'");
  await pool.query("DELETE FROM ai_user_usage WHERE period<to_char(now()-interval '3 months','YYYY-MM')");
}

module.exports = { BudgetError, transaction, reserve, quota, enqueue, claim, checkpoint, finish, retry, selection, saveSelection,
  cachedSearch, saveSearch, getResources, saveResource, searchResources, listPrisms, status, prune, vectorValue };
