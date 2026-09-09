import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

import { buildPath, pathItems } from "../client/src/lib/path.js";
import { provenanceOf } from "../client/src/lib/provenance.js";

const require = createRequire(import.meta.url);
const { isRelevant } = require("../sources/relevance.js");
const { hostOf } = require("../sources/http.js");
const { laneOf } = require("../sources/tavily.js");

test("multi-word topics must match every term", () => {
  assert.ok(isRelevant("String theory and quantum gravity", "string theory"));
  assert.ok(!isRelevant("Java string comparison", "string theory"));
});

test("hostOf strips www and survives junk", () => {
  assert.equal(hostOf("https://www.britannica.com/x"), "britannica.com");
  assert.equal(hostOf("not a url"), null);
});

test("community platforms route out of articles, by host not substring", () => {
  assert.equal(laneOf("https://jaredhenderson.substack.com/p/stoicism"), "essays");
  assert.equal(laneOf("https://meganslo.medium.com/react-hooks"), "essays");
  assert.equal(laneOf("https://www.reddit.com/r/Stoicism/x"), "community");
  // Everything else is still an article.
  assert.equal(laneOf("https://plato.stanford.edu/entries/stoicism"), "articles");
  // A lookalike domain must not inherit the lane.
  assert.equal(laneOf("https://substack.com.phish.io/x"), "articles");
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

const { PRISMS } = require("../db/seed/prisms.data.js");
const DEPTHS = ["beginner", "intermediate", "advanced"];

/* The seed is the app's only curated surface and it is loaded straight into
 * production, so its shape is checked here rather than discovered in the UI.
 * Link liveness is a separate, networked job — db/seed/verify.js. */
test("every prism carries seven stops per depth level", () => {
  for (const prism of PRISMS) {
    const counts = DEPTHS.map(
      (d) => prism.items.filter((item) => item.d === d).length,
    );
    assert.deepEqual(counts, [7, 7, 7], `${prism.slug} is ${counts.join("/")}`);
  }
});

test("no prism lists the same url twice", () => {
  for (const prism of PRISMS) {
    const urls = prism.items.map((item) => item.u);
    assert.equal(new Set(urls).size, urls.length, `${prism.slug} repeats a url`);
  }
});

test("every stop has the fields the card renders", () => {
  for (const prism of PRISMS) {
    for (const item of prism.items) {
      for (const field of ["t", "u", "k", "d", "s"]) {
        assert.ok(item[field], `${prism.slug}: "${item.t}" is missing ${field}`);
      }
      assert.ok(DEPTHS.includes(item.d), `${prism.slug}: bad depth ${item.d}`);
      assert.ok(item.u.startsWith("https://") || item.u.startsWith("http://"));
    }
  }
});

test("prism topics are unique, so the loader updates rather than duplicates", () => {
  const topics = PRISMS.map((p) => p.topic);
  assert.equal(new Set(topics).size, topics.length);
});

const { decodeEntities } = require("../sources/youtube.js");

/* YouTube hands back escaped markup. React renders a text node literally, so
 * an entity that survives the adapter is an entity the reader sees. */
test("youtube titles arrive decoded", () => {
  assert.equal(decodeEntities("Doesn&#39;t Need"), "Doesn't Need");
  assert.equal(decodeEntities("Rock &amp; Roll &quot;live&quot;"), 'Rock & Roll "live"');
  assert.equal(decodeEntities("&#x1F600;"), "😀");
  // Not an entity we know: left alone rather than mangled or dropped.
  assert.equal(decodeEntities("&notreal; kept"), "&notreal; kept");
  assert.equal(decodeEntities(""), "");
  assert.equal(decodeEntities(null), "");
});
