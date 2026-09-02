import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

import { buildPath, pathItems } from "../client/src/lib/path.js";
import { provenanceOf } from "../client/src/lib/provenance.js";

const require = createRequire(import.meta.url);
const { isRelevant } = require("../sources/relevance.js");
const { hostOf } = require("../sources/http.js");

test("multi-word topics must match every term", () => {
  assert.ok(isRelevant("String theory and quantum gravity", "string theory"));
  assert.ok(!isRelevant("Java string comparison", "string theory"));
});

test("hostOf strips www and survives junk", () => {
  assert.equal(hostOf("https://www.britannica.com/x"), "britannica.com");
  assert.equal(hostOf("not a url"), null);
});

test("provenance ranks review above popularity", () => {
  assert.equal(
    provenanceOf({ peer_reviewed: true, venue: "Nature", signal: 3 }).tone,
    "reviewed",
  );
  assert.equal(
    provenanceOf({ url: "https://plato.stanford.edu/x" }).tone,
    "institutional",
  );
  assert.equal(provenanceOf({ url: "https://blog.example.com/x" }), null);
});

const CATEGORIES = {
  articles: [
    { title: "Intro", url: "https://mit.edu/a", depth_level: "beginner" },
    { title: "Deep", url: "https://ox.ac.uk/b", depth_level: "advanced" },
  ],
  videos: [
    { title: "Watched", url: "https://youtube.com/1", signal: 900_000 },
    { title: "Ignored", url: "https://youtube.com/2", signal: 12 },
  ],
  discussions: [{ title: "Quiet", url: "https://news.example/1", signal: 3 }],
};

test("stages are numbered by what rendered, not by position", () => {
  const path = buildPath({ articles: CATEGORIES.articles }, ["articles"]);
  assert.deepEqual(
    path.map((stage) => stage.n),
    path.map((_, i) => i + 1),
  );
});

test("lanes below their floor contribute nothing", () => {
  const urls = pathItems(buildPath(CATEGORIES, ["videos", "discussions"])).map(
    (item) => item.url,
  );
  assert.ok(urls.includes("https://youtube.com/1"));
  assert.ok(!urls.includes("https://youtube.com/2"));
  assert.ok(!urls.includes("https://news.example/1"));
});

test("one resource takes one stop", () => {
  const shared = "https://arxiv.org/abs/1";
  const urls = pathItems(
    buildPath(
      {
        discussions: [{ title: "Posted", url: shared, signal: 400 }],
        papers: [{ title: "Indexed", url: shared, source: "arxiv" }],
      },
      ["discussions", "papers"],
    ),
  ).map((item) => item.url);

  assert.equal(urls.filter((url) => url === shared).length, 1);
});
