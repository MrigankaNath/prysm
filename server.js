const express = require("express");
const contentItems = require("./data/contentItems");
const bundles = require("./data/bundles");
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

app.get("/api/bundles", (req, res) => {
  const { topic } = req.query;
  const results = topic ? bundles.filter((b) => b.topic === topic) : bundles;
  res.json(results);
});

app.get("/api/bundles/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const bundle = bundles.find((b) => b.id === id);

  if (!bundle) {
    return res.status(404).json({ error: "Bundle not found" });
  }

  const items = bundle.contentIds
    .map((contentId) => contentItems.find((item) => item.id === contentId))
    .filter(Boolean);

  res.json({
    id: bundle.id,
    title: bundle.title,
    topic: bundle.topic,
    description: bundle.description,
    items,
  });
});

app.get("/api/content/:id/next", (req, res) => {
  const id = parseInt(req.params.id);
  const current = contentItems.find((item) => item.id === id);

  if (!current) {
    return res.status(404).json({ error: "Content not found" });
  }

  const currentDepthIndex = depthOrder.indexOf(current.depthLevel);
  const nextDepth = depthOrder[currentDepthIndex + 1];

  if (!nextDepth) {
    return res.json({
      current: current.title,
      message: "You've reached the most advanced level for this topic.",
      next: [],
    });
  }

  const next = contentItems.filter(
    (item) => item.topic === current.topic && item.depthLevel === nextDepth,
  );

  res.json({
    current: current.title,
    nextDepth,
    next,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`prysm running on port ${PORT}`));
