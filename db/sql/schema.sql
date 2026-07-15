CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  topic TEXT NOT NULL,
  url TEXT NOT NULL,
  depth_level TEXT NOT NULL,
  date_added DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  source_name TEXT
);
