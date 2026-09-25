import assert from "node:assert/strict";
import { test } from "node:test";
import { presentContent } from "../client/src/lib/contentPresentation.js";
import { discussionLine, shortCardLine } from "../client/src/lib/cardCopy.js";

test("a YouTube destination overrides a stale article category", () => {
  const item = presentContent({ title: "Neural Networks", url: "https://www.youtube.com/watch?v=abcdefghijk", category: "articles" });
  assert.equal(item.category, "videos");
});

test("card copy keeps one useful sentence instead of scraped markdown or vote counts", () => {
  assert.equal(shortCardLine("## Basics Core concepts to get started with system design. Then more text."),
    "Basics Core concepts to get started with system design.");
  assert.equal(shortCardLine("230 points, 172 comments"), null);
  assert.equal(discussionLine({ title: "Gemini Robotics", url: "https://deepmind.google/discover/gemini-robotics/", snippet: "540 points, 220 comments" }),
    "Gemini Robotics brings AI into the physical world — Carolina Parada.");
});
