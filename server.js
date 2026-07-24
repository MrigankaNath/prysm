const express = require("express");
const pool = require("./db");

const app = express();

const depthOrder = ["beginner", "intermediate", "advanced"];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
