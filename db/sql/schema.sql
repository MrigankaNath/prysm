CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  topic TEXT NOT NULL,
  url TEXT NOT NULL,
  depth_level TEXT NOT NULL CHECK (depth_level IN ('beginner', 'intermediate', 'advanced')),
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

-- Mirrors auth.users so app tables can FK without touching Supabase's internal schema.
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE user_interests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic)
);

CREATE TABLE user_content_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_item_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_item_id)
);
