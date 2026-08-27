-- What a user has actually cost this month.
--
-- The thing worth metering is not requests, it's *cache misses*. topic_cache
-- is keyed by topic and shared across everyone, so a user opening a topic
-- someone already explored costs nothing at all — only the first person to ask
-- for a topic pays for it. Counting requests would charge the cheap case and
-- the expensive one identically.
--
-- One row per user per calendar month. `period` is 'YYYY-MM' rather than a
-- date range because the quota resets on the same boundary Tavily's own does.
CREATE TABLE IF NOT EXISTS user_usage (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  fresh_topics INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);

-- The app-wide circuit breaker sums a whole period, so it reads by period.
CREATE INDEX IF NOT EXISTS user_usage_period ON user_usage (period);

ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON user_usage FROM anon, authenticated;

-- Which tier a user is on. Defaults to free; premium is a column update, so
-- whatever handles payment later only has to write this one field.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE public.users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'premium'));
