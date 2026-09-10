import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

import { buildPath, pathItems } from "../client/src/lib/path.js";
import { provenanceOf } from "../client/src/lib/provenance.js";

const require = createRequire(import.meta.url);
const { isRelevant } = require("../sources/relevance.js");
const { hostOf } = require("../sources/http.js");
const { isServed, isPublicAddress } = require("../sources/reachable.js");
const { urlFor: bookUrl } = require("../sources/books.js");
const { rankCategories } = require("../sources/rank.js");
const { laneOf } = require("../sources/tavily.js");
const { hostRank, RANK } = require("../sources/quality.js");
const { isRelevant: bookIsRelevant } = require("../sources/books.js");

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

test("articles are ordered by what the site is, and storefronts are dropped", () => {
  assert.equal(hostRank("https://plato.stanford.edu/entries/stoicism"), RANK.institutional);
  assert.equal(hostRank("https://blog.cloudflare.com/x"), RANK.written);
  assert.equal(hostRank("https://netflixtechblog.com/a"), RANK.written);
  assert.equal(hostRank("https://stripe.com/blog/x"), RANK.written);
  assert.equal(hostRank("https://www.cedars-sinai.org/health-library/x"), RANK.ordinary);
  // Observed on "stoicism" and "sleep deprivation", outscoring real writing.
  assert.equal(hostRank("https://custommapposter.com/x"), RANK.drop);
  assert.equal(hostRank("https://www.midlandbookshop.com/x"), RANK.drop);
  assert.equal(hostRank("https://www.scribd.com/doc/x"), RANK.drop);
  // The bounded words must not eat ordinary hosts.
  assert.equal(hostRank("https://www.restoration-hardware.com/x"), RANK.ordinary);
  assert.equal(hostRank("https://buyer-guide.org/x"), RANK.ordinary);
});

test("a book must match every topic term, not any one of them", () => {
  const timeMachine = { title: "The Time Machine", subject: ["Machine", "Fiction"] };
  const geron = {
    title: "Hands-On Machine Learning",
    subject: ["Machine learning", "Python (Computer program language)"],
  };
  const tokens = ["machine", "learning"];

  // 1,917 readers — ranked by popularity it leads the lane if this gate leaks.
  assert.ok(!bookIsRelevant(timeMachine, tokens, "machine learning"));
  assert.ok(bookIsRelevant(geron, tokens, "machine learning"));

  // Tokens may be spread across separate subjects.
  assert.ok(
    bookIsRelevant(
      { title: "x", subject: ["Machine theory", "Learning, Psychology of"] },
      tokens,
      "machine learning",
    ),
  );
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

/* A result you cannot open is worse than one that was never shown, so a page
   that refuses us is dropped along with a page that is missing. `fetch` has
   followed redirects by the time a status is seen, so a 3xx here is a
   redirect that went nowhere. */
test("only a page the server actually serves is kept", () => {
  for (const ok of [200, 201, 204, 299]) {
    assert.ok(isServed(ok), `${ok} is served`);
  }
  for (const no of [301, 302, 401, 403, 404, 410, 429, 500, 503]) {
    assert.ok(!isServed(no), `${no} must not count as served`);
  }
});

/* An ISBN-10 is only an Amazon ASIN for the edition Amazon stocks, and Open
   Library's isbn array spans every edition ever catalogued. Measured, 6 of 19
   book links 404ed and all six were this guess. */
test("a book to buy links its record, never a guessed Amazon ASIN", () => {
  const url = bookUrl({
    key: "/works/OL2W",
    isbn: ["0262305240"],
    ebook_access: "no_ebook",
  });
  assert.equal(url, "https://openlibrary.org/works/OL2W");
  assert.ok(!/amazon\./.test(url));
});

test("a readable book still goes to the scan", () => {
  assert.equal(
    bookUrl({ ia: ["somescan"], ebook_access: "public" }),
    "https://archive.org/details/somescan",
  );
});

/* Tiers beat scores. The whole reason this is not a pure ranking is that
   engagement measures how busy a lane is, not whether it is the right one. */
const RANK_CONFIG = {
  overview: { expected: 1 },
  videos: { expected: 5 },
  articles: { expected: 9 },
  websites: { expected: 5 },
  discussions: { expected: 20, saturation: 1000 },
  podcasts: { expected: 5, saturation: 2000 },
  papers: { expected: 6 },
  code: { expected: 5, saturation: 50000 },
  books: { expected: 5, saturation: 500 },
};

const FULL_LANES = {
  overview: { text: "x" },
  books: [{ signal: 500 }],
  code: [{ signal: 58000 }],
  papers: [{}, {}],
  videos: [{}],
  websites: [{}],
  discussions: [{ signal: 900 }],
  articles: [{}, {}],
  podcasts: [{ signal: 1900 }],
};

test("videos, articles and websites lead every topic that has them", () => {
  const order = rankCategories(FULL_LANES, RANK_CONFIG);
  assert.deepEqual(order.slice(0, 4), ["overview", "videos", "articles", "websites"]);
});

test("a 58k-star repo still ranks below the general lanes", () => {
  const order = rankCategories(FULL_LANES, RANK_CONFIG);
  assert.ok(order.indexOf("code") > order.indexOf("podcasts"));
  assert.ok(order.indexOf("papers") > order.indexOf("discussions"));
});

test("books rank last even with a canonical book in the lane", () => {
  const order = rankCategories(FULL_LANES, RANK_CONFIG);
  assert.equal(order[order.length - 1], "books");
});

test("a pinned lane with no results is skipped, not left empty", () => {
  const order = rankCategories(
    { overview: { text: "x" }, articles: [{}], books: [] },
    RANK_CONFIG,
  );
  assert.deepEqual(order, ["overview", "articles"]);
});

/* The link checker fetches URLs that strangers put into other people's indexes
   — a Hacker News submission is whatever someone posted — so an address it will
   probe must be public. Before this guard, isReachable("http://127.0.0.1:3000/")
   returned true against a live local server. */
test("the reachability checker refuses private and internal addresses", () => {
  for (const ip of [
    "127.0.0.1", "10.0.0.1", "192.168.1.1", "172.16.0.1", "172.31.255.255",
    "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "fd00::1", "fe80::1",
    "::ffff:127.0.0.1",
  ]) {
    assert.equal(isPublicAddress(ip), false, `${ip} must be blocked`);
  }

  for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "192.169.0.1", "2606:4700::1111"]) {
    assert.equal(isPublicAddress(ip), true, `${ip} must be allowed`);
  }

  assert.equal(isPublicAddress("not-an-ip"), false);
});
