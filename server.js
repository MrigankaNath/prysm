const express = require("express");
const rateLimit = require("express-rate-limit");

const cors = require("cors");
const pool = require("./db");
const { requireAuth, optionalAuth } = require("./db/supabase");
const { getCached, setCached } = require("./db/topicCache");
const { fetchHackerNews } = require("./sources/hackerNews");
const { fetchWikipedia } = require("./sources/wikipedia");
const { fetchArxiv } = require("./sources/arxiv");

const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(
  /\/$/,
  "",
);

const app = express();
app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const depthOrder = ["beginner", "intermediate", "advanced"];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ id: req.userId, email: req.userEmail });
});

app.get("/api/interests", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT topic, created_at FROM user_interests WHERE user_id = $1 ORDER BY created_at",
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching interests" });
  }
});

app.post("/api/interests", writeLimiter, requireAuth, async (req, res) => {
  const topic = typeof req.body.topic === "string" ? req.body.topic.trim() : "";

  if (!topic) {
    return res.status(400).json({ error: "topic is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_interests (user_id, topic) VALUES ($1, $2)
       ON CONFLICT (user_id, topic) DO NOTHING
       RETURNING topic, created_at`,
      [req.userId, topic],
    );
    res.status(201).json(result.rows[0] || { topic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong following that topic" });
  }
});

app.delete("/api/interests/:topic", writeLimiter, requireAuth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM user_interests WHERE user_id = $1 AND topic = $2",
      [req.userId, req.params.topic],
    );
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong unfollowing that topic" });
  }
});

app.get("/api/history", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT content_items.*, user_content_history.consumed_at
       FROM user_content_history
       JOIN content_items ON user_content_history.content_item_id = content_items.id
       WHERE user_content_history.user_id = $1
       ORDER BY user_content_history.consumed_at DESC`,
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching history" });
  }
});

app.post("/api/history", writeLimiter, requireAuth, async (req, res) => {
  const contentItemId = parseInt(req.body.content_item_id);

  if (!Number.isInteger(contentItemId)) {
    return res.status(400).json({ error: "content_item_id is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_content_history (user_id, content_item_id) VALUES ($1, $2)
       ON CONFLICT (user_id, content_item_id) DO NOTHING
       RETURNING content_item_id, consumed_at`,
      [req.userId, contentItemId],
    );
    res.status(201).json(result.rows[0] || { content_item_id: contentItemId });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(404).json({ error: "Content not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong recording history" });
  }
});

app.get("/api/feed", async (req, res) => {
  const { topic } = req.query;

  try {
    let result;
    if (topic) {
      result = await pool.query(
        "SELECT * FROM content_items WHERE topic = $1",
        [topic],
      );
    } else {
      result = await pool.query("SELECT * FROM content_items");
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching the feed" });
  }
});

app.get("/api/content/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid content id" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM content_items WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching content" });
  }
});

app.get("/api/feed/daily", async (req, res) => {
  const { topic, count } = req.query;
  let limit = parseInt(count);

  if (!Number.isInteger(limit) || limit <= 0) {
    limit = 3;
  }

  try {
    let result;
    if (topic) {
      result = await pool.query(
        "SELECT * FROM content_items WHERE topic = $1 ORDER BY date_added DESC LIMIT $2",
        [topic, limit],
      );
    } else {
      result = await pool.query(
        "SELECT * FROM content_items ORDER BY date_added DESC LIMIT $1",
        [limit],
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong fetching the daily feed" });
  }
});

app.get("/api/feed/personalized", optionalAuth, async (req, res) => {
  let limit = parseInt(req.query.count);
  if (!Number.isInteger(limit) || limit <= 0) {
    limit = 3;
  }

  try {
    if (!req.userId) {
      const result = await pool.query(
        "SELECT * FROM content_items ORDER BY date_added DESC LIMIT $1",
        [limit],
      );
      return res.json(result.rows);
    }

    const interestsResult = await pool.query(
      "SELECT topic FROM user_interests WHERE user_id = $1",
      [req.userId],
    );
    const interestTopics = interestsResult.rows.map((row) => row.topic);

    if (interestTopics.length === 0) {
      const result = await pool.query(
        "SELECT * FROM content_items ORDER BY date_added DESC LIMIT $1",
        [limit],
      );
      return res.json(result.rows);
    }

    const lastDepthResult = await pool.query(
      `SELECT DISTINCT ON (content_items.topic) content_items.topic, content_items.depth_level
       FROM user_content_history
       JOIN content_items ON user_content_history.content_item_id = content_items.id
       WHERE user_content_history.user_id = $1
       ORDER BY content_items.topic, user_content_history.consumed_at DESC`,
      [req.userId],
    );
    const lastDepthByTopic = Object.fromEntries(
      lastDepthResult.rows.map((row) => [row.topic, row.depth_level]),
    );

    const candidatesResult = await pool.query(
      `SELECT content_items.*
       FROM content_items
       WHERE NOT EXISTS (
         SELECT 1 FROM user_content_history
         WHERE user_content_history.user_id = $1
         AND user_content_history.content_item_id = content_items.id
       )`,
      [req.userId],
    );

    const scored = candidatesResult.rows.map((item) => {
      let score = 0;

      if (interestTopics.includes(item.topic)) {
        score += 3;
      }

      const daysSinceAdded =
        (Date.now() - new Date(item.date_added).getTime()) / 86400000;
      if (daysSinceAdded <= 7) {
        score += 1;
      }

      const lastDepth = lastDepthByTopic[item.topic];
      const nextDepth = lastDepth
        ? depthOrder[depthOrder.indexOf(lastDepth) + 1]
        : null;
      if (nextDepth && item.depth_level === nextDepth) {
        score += 2;
      }

      return { ...item, score };
    });

    scored.sort(
      (a, b) =>
        b.score - a.score || new Date(b.date_added) - new Date(a.date_added),
    );

    res.json(scored.slice(0, limit).map(({ score, ...item }) => item));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong building your feed" });
  }
});

app.get("/api/explore", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         topic,
         COUNT(*) AS item_count,
         ARRAY_AGG(DISTINCT type) AS types,
         ARRAY_AGG(DISTINCT depth_level) AS depth_levels
       FROM content_items
       GROUP BY topic
       ORDER BY topic`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching topics" });
  }
});

// Keyed by category, not by which API produced it — the point is that users
// see "what it is" (an article, a paper), never "where it came from."
const LIVE_CATEGORIES = {
  overview: { fetch: fetchWikipedia, empty: null },
  discussions: { fetch: fetchHackerNews, empty: [] },
  papers: { fetch: fetchArxiv, empty: [] },
};

async function loadLiveCategory(topic, category, fetchFn, emptyValue) {
  try {
    const cached = await getCached(topic, category);
    if (cached) return cached;

    const results = await fetchFn(topic);
    await setCached(topic, category, results);
    return results;
  } catch (err) {
    console.error(`live discovery: ${category} failed for topic "${topic}"`, err);
    return emptyValue;
  }
}

app.get("/api/explore/:topic/live", async (req, res) => {
  const topic = req.params.topic.trim().toLowerCase();

  if (!topic) {
    return res.status(400).json({ error: "topic is required" });
  }

  try {
    const names = Object.keys(LIVE_CATEGORIES);
    const results = await Promise.all(
      names.map((name) =>
        loadLiveCategory(
          topic,
          name,
          LIVE_CATEGORIES[name].fetch,
          LIVE_CATEGORIES[name].empty,
        ),
      ),
    );

    const categories = Object.fromEntries(names.map((name, i) => [name, results[i]]));
    res.json({ topic, categories });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong fetching live results" });
  }
});

app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q) {
    return res.json({ topics: [], bundles: [], content: [] });
  }

  try {
    const like = `%${q}%`;

    const [topicsResult, bundlesResult, contentResult] = await Promise.all([
      pool.query(
        "SELECT DISTINCT topic FROM content_items WHERE topic ILIKE $1 ORDER BY topic LIMIT 5",
        [like],
      ),
      pool.query(
        "SELECT id, title, topic FROM bundles WHERE title ILIKE $1 ORDER BY title LIMIT 5",
        [like],
      ),
      pool.query(
        "SELECT id, title, topic, url FROM content_items WHERE title ILIKE $1 ORDER BY title LIMIT 5",
        [like],
      ),
    ]);

    res.json({
      topics: topicsResult.rows.map((row) => row.topic),
      bundles: bundlesResult.rows,
      content: contentResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong searching" });
  }
});

app.get("/api/bundles", async (req, res) => {
  const { topic } = req.query;

  try {
    let result;
    if (topic) {
      result = await pool.query("SELECT * FROM bundles WHERE topic = $1", [
        topic,
      ]);
    } else {
      result = await pool.query("SELECT * FROM bundles");
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching bundles" });
  }
});

app.get("/api/bundles/recommended", requireAuth, async (req, res) => {
  try {
    const interestsResult = await pool.query(
      "SELECT topic FROM user_interests WHERE user_id = $1",
      [req.userId],
    );
    const interestTopics = interestsResult.rows.map((row) => row.topic);

    if (interestTopics.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT
         bundles.id,
         bundles.title,
         bundles.topic,
         bundles.description,
         COUNT(bundle_items.id) FILTER (
           WHERE NOT EXISTS (
             SELECT 1 FROM user_content_history
             WHERE user_content_history.user_id = $1
             AND user_content_history.content_item_id = bundle_items.content_item_id
           )
         ) AS unconsumed_count
       FROM bundles
       JOIN bundle_items ON bundle_items.bundle_id = bundles.id
       WHERE bundles.topic = ANY($2::text[])
       GROUP BY bundles.id
       ORDER BY unconsumed_count DESC`,
      [req.userId, interestTopics],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong fetching recommended bundles" });
  }
});

app.get("/api/bundles/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid bundle id" });
  }

  try {
    const bundleResult = await pool.query(
      "SELECT * FROM bundles WHERE id = $1",
      [id],
    );

    if (bundleResult.rows.length === 0) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    const itemsResult = await pool.query(
      `SELECT content_items.*
       FROM bundle_items
       JOIN content_items ON bundle_items.content_item_id = content_items.id
       WHERE bundle_items.bundle_id = $1
       ORDER BY bundle_items.position`,
      [id],
    );

    const bundle = bundleResult.rows[0];
    res.json({
      id: bundle.id,
      title: bundle.title,
      topic: bundle.topic,
      description: bundle.description,
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching the bundle" });
  }
});

app.get("/api/content/:id/next", async (req, res) => {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid content id" });
  }

  try {
    const currentResult = await pool.query(
      "SELECT * FROM content_items WHERE id = $1",
      [id],
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    const current = currentResult.rows[0];
    const currentDepthIndex = depthOrder.indexOf(current.depth_level);
    const nextDepth = depthOrder[currentDepthIndex + 1];

    if (!nextDepth) {
      return res.json({
        current: current.title,
        message: "You've reached the most advanced level for this topic.",
        next: [],
      });
    }

    const nextResult = await pool.query(
      "SELECT * FROM content_items WHERE topic = $1 AND depth_level = $2",
      [current.topic, nextDepth],
    );

    res.json({
      current: current.title,
      nextDepth,
      next: nextResult.rows,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong finding the next step" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`prysm running on port ${PORT}`));
