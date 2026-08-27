const pool = require("./index");

/* What a fresh topic costs, and therefore how many exist to give away.
 *
 * Tavily is the binding constraint: 1000 credits a month against 3 per new
 * topic, so the app can afford ~333 in total. The ceiling is set below that
 * so a month never ends with live discovery hard-failing at the provider —
 * it degrades here, where the reason can be explained, instead. */
const APP_TOPICS_PER_MONTH = 300;

/* Per user.
 *
 * Forty rather than twenty because the overview/articles TTL went from a week
 * to a month: a topic used to be re-bought roughly four times a month if
 * anyone kept visiting it, and now it is bought once. That is where the extra
 * twenty came from — not from raising the budget.
 *
 * The per-user cap is there to stop one account draining the month, not to
 * ration a large userbase; APP_TOPICS_PER_MONTH is what actually protects the
 * budget. So it is set high enough that a real user never meets it. If sign-ups
 * ever outgrow the ceiling, this is the number to lower. */
const PLAN_LIMITS = {
  free: 40,
  premium: 400,
};

/** Calendar month, matching the boundary the upstream quotas reset on. */
function currentPeriod(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

function limitFor(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * What this user has spent this month, and what remains.
 * Reads only — safe to call on any request.
 */
async function getQuota(userId) {
  const period = currentPeriod();
  /* The plan is read here rather than carried on the request: requireAuth
     already costs a Supabase round-trip per request, and the plan is only
     needed on the one route that meters. */
  const [mine, app] = await Promise.all([
    pool.query(
      `SELECT COALESCE(u.fresh_topics, 0) AS fresh_topics,
              COALESCE(p.plan, 'free')    AS plan
         FROM public.users p
         LEFT JOIN user_usage u ON u.user_id = p.id AND u.period = $2
        WHERE p.id = $1`,
      [userId, period],
    ),
    pool.query(
      "SELECT COALESCE(SUM(fresh_topics), 0)::int AS total FROM user_usage WHERE period = $1",
      [period],
    ),
  ]);

  const row = mine.rows[0] || {};
  const plan = row.plan || "free";
  const used = row.fresh_topics || 0;
  const limit = limitFor(plan);

  return {
    plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    period,
    /* Distinguished from the personal cap on purpose: "you have used your
       twenty" and "the whole app is out until the first" need different
       wording, and only one of them is fixed by upgrading. */
    appExhausted: (app.rows[0]?.total || 0) >= APP_TOPICS_PER_MONTH,
  };
}

/**
 * Charge one fresh topic to a user.
 *
 * Not transactional with the check that precedes it: two requests racing can
 * both pass and both increment, so a user can exceed the cap by the number of
 * topics they can open simultaneously. That is bounded by the per-IP burst
 * limiter and costs a few credits at worst, which is cheaper than holding a
 * row lock across three external API calls.
 */
async function consumeTopic(userId) {
  await pool.query(
    `INSERT INTO user_usage (user_id, period, fresh_topics)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, period)
     DO UPDATE SET fresh_topics = user_usage.fresh_topics + 1, updated_at = now()`,
    [userId, currentPeriod()],
  );
}

module.exports = {
  getQuota,
  consumeTopic,
  currentPeriod,
  PLAN_LIMITS,
  APP_TOPICS_PER_MONTH,
};
