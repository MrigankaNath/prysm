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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`prysm running on port ${PORT}`));
