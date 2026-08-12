const express = require("express");

const cors = require("cors");
const pool = require("./db");
const { requireAuth } = require("./db/supabase");

const app = express();
app.use(cors());
app.use(express.json());

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

app.post("/api/interests", requireAuth, async (req, res) => {
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

app.delete("/api/interests/:topic", requireAuth, async (req, res) => {
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

app.post("/api/history", requireAuth, async (req, res) => {
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
