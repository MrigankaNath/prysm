const express = require("express");
const contentItems = require("./data/contentItems");
const bundles = require("./data/bundles");
const depthOrder = ["beginner", "intermediate", "advanced"];

const app = express();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/feed", (req, res) => {
  const { topic } = req.query;
  const results = topic
    ? contentItems.filter((item) => item.topic === topic)
    : contentItems;
  res.json(results);
});

app.get("/api/content/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const item = contentItems.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: "Content not found" });
  }
  res.json(item);
});

app.get("/api/feed/daily", (req, res) => {
  const { topic, count } = req.query;
  let limit = parseInt(count);

  if (!Number.isInteger(limit) || limit <= 0) {
    limit = 3;
  }

  let results = topic
    ? contentItems.filter((item) => item.topic === topic)
    : contentItems;

  results = [...results].sort(
    (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded),
  );

  results = results.slice(0, limit);

  res.json(results);
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
