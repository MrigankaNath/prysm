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

CREATE TABLE bundles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT
);

CREATE TABLE bundle_items (
  id SERIAL PRIMARY KEY,
  bundle_id INTEGER NOT NULL REFERENCES bundles(id),
  content_item_id INTEGER NOT NULL REFERENCES content_items(id),
  position INTEGER NOT NULL
);
