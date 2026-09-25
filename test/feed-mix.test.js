const test = require("node:test");
const assert = require("node:assert/strict");
const { mixDiscoveryRows } = require("../sources/feedMix");

const item = (title, url) => ({ title, url });

test("feed gives cached videos and articles a place before later lanes", () => {
  const rows = [
    { topic: "space", source: "papers", results: [item("Paper", "https://a.test/p")] },
    { topic: "space", source: "discussions", results: [item("Thread", "https://a.test/d")] },
    { topic: "space", source: "articles", results: [item("Article", "https://a.test/a")] },
    { topic: "space", source: "videos", results: [item("Video", "https://a.test/v")] },
  ];
  assert.deepEqual(mixDiscoveryRows(["space"], rows).map((entry) => entry.category),
    ["videos", "articles", "papers", "discussions"]);
});

test("feed preserves within-lane ranking, rotates topics, and deduplicates URLs", () => {
  const rows = [
    { topic: "new", source: "articles", results: [item("First", "https://a.test/1"), item("Second", "https://a.test/2")] },
    { topic: "old", source: "articles", results: [item("Other", "https://a.test/3")] },
    { topic: "new", source: "websites", results: [item("Same", "https://a.test/1")] },
    { topic: "new", source: "overview", results: [item("Summary", "https://a.test/4")] },
  ];
  assert.deepEqual(mixDiscoveryRows(["new", "old"], rows).map((entry) => entry.title),
    ["First", "Other", "Second"]);
});

test("old cached retail pages do not return as articles", () => {
  const rows = [{
    topic: "quantum computing", source: "articles", results: [
      item("Book listing", "https://www.amazon.com/dp/example"),
      item("Actual article", "https://university.edu/articles/quantum"),
    ],
  }];
  assert.deepEqual(mixDiscoveryRows(["quantum computing"], rows).map((entry) => entry.title),
    ["Actual article"]);
});
