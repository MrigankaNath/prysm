-- Additive migration. The Express API and the scheduled worker use pg; these
-- tables are never directly readable through the public Supabase API.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
SET LOCAL search_path = public, extensions;

CREATE TABLE IF NOT EXISTS ai_resources (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  item JSONB NOT NULL,
  assessment JSONB,
  content_hash TEXT,
  embedding vector(384),
  search_text TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', search_text)) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_resources_search ON ai_resources USING gin(search_vector);
-- Exact vector search is adequate for the capped 5k-resource MVP. Avoid an
-- HNSW index's RAM/storage overhead until an actual query benchmark needs it.

CREATE TABLE IF NOT EXISTS ai_selections (
  key TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  intent TEXT NOT NULL,
  payload JSONB NOT NULL,
  publish_prism BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days'
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  key TEXT PRIMARY KEY,
  request JSONB NOT NULL,
  checkpoint JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lease_until TIMESTAMPTZ,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_jobs_pending ON ai_jobs(available_at) WHERE status IN ('queued','running');

CREATE TABLE IF NOT EXISTS ai_user_usage (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period)
);

CREATE TABLE IF NOT EXISTS ai_budget_events (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  units INTEGER NOT NULL CHECK (units > 0),
  tokens INTEGER NOT NULL DEFAULT 0 CHECK (tokens >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_budget_window ON ai_budget_events(provider, created_at);

CREATE TABLE IF NOT EXISTS ai_search_cache (
  key TEXT PRIMARY KEY,
  results JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE ai_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budget_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_search_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ai_resources, ai_selections, ai_jobs, ai_user_usage, ai_budget_events, ai_search_cache FROM anon, authenticated;
REVOKE ALL ON SEQUENCE ai_budget_events_id_seq FROM anon, authenticated;
