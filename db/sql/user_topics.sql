-- Topics a user has explored, so the feed can rebuild from real searches
-- instead of device-local storage.
--
-- No FK into content_items: a searched topic is a string, not a curated row.
CREATE TABLE IF NOT EXISTS user_topics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  explored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic)
);

CREATE INDEX IF NOT EXISTS user_topics_recent
  ON user_topics (user_id, explored_at DESC);

ALTER TABLE user_topics ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON user_topics FROM anon, authenticated;
