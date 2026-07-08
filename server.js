const express = require("express");
const contentItems = require("./data/contentItems");
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`prysm running on port ${PORT}`));
