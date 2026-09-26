const { createHash } = require("node:crypto");
const { isIP } = require("node:net");
const { isPublicAddress } = require("../sources/reachable");
const { hostOf } = require("../sources/http");
const { isYouTubeUrl, hostRank, RANK } = require("../sources/quality");
const { VERSION } = require("./config");

const INTENTS = ["overview", "history", "practical", "research", "comparison", "custom"];
const CATEGORIES = ["articles", "websites", "videos", "papers", "code", "books", "podcasts", "discussions", "qa", "essays"];
const DEPTHS = ["beginner", "intermediate", "advanced"];
const hash = value => createHash("sha256").update(value).digest("hex");
const titleKey = value => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
// Control characters are intentionally stripped from all external/model text.
// eslint-disable-next-line no-control-regex
const clean = (value, max = 240) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
const strings = (value, max = 6) => Array.isArray(value) ? [...new Set(value.map(s => clean(s, 70)).filter(Boolean))].slice(0, max) : [];

function parseQuery(raw) {
  // eslint-disable-next-line no-control-regex
  if (typeof raw !== "string" || raw.length > 180 || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  const query = raw.normalize("NFKC").trim().replace(/\s+/g, " ").replace(/[?!.]+$/, "").toLowerCase();
  if (!query || !/^[\p{L}\p{N} ,.:+#'’&/()-]+$/u.test(query)) return null;
  let topic = query, intent = "overview";
  // Only exact, simple question shapes share a key. Qualifiers such as "without
  // calculus" or "since 2020" remain part of the key; intent must not be erased.
  if (/^(?:what is|what are|what's|what’s) /.test(query)) topic = query.replace(/^(?:what is|what are|what's|what’s) /, "");
  else if (query.startsWith("history of ")) { topic = query.slice(11); intent = "history"; }
  else if (query.endsWith(" over the years")) { topic = query.replace(/ over the years$/, ""); intent = "history"; }
  else if (/\b(build|implement|hands.on|project|tutorial)\b/.test(query)) intent = "practical";
  else if (/\b(latest|recent|research|advances|papers)\b/.test(query)) intent = "research";
  else if (/\b(vs|versus|compare|comparison)\b/.test(query)) intent = "comparison";
  else if (query.split(" ").length > 5) intent = "custom";
  return { query, topic, intent, key: hash(`${VERSION}:${intent}:${topic}`) };
}

function canonicalUrl(value) {
  try {
    const u = new URL(value);
    if (!["http:", "https:"].includes(u.protocol) || u.username || u.password || (u.port && !["80", "443"].includes(u.port))) return null;
    if (!u.hostname.includes(".") || /(^|\.)(localhost|local|internal)$/.test(u.hostname)) return null;
    if (isIP(u.hostname) && !isPublicAddress(u.hostname)) return null;
    u.hash = "";
    // Snapshot keys because deletion mutates this iterator.
    for (const key of Array.from(u.searchParams.keys())) if (/^(utm_.+|fbclid|gclid)$/i.test(key)) u.searchParams.delete(key);
    u.searchParams.sort();
    return u.href;
  } catch { return null; }
}

function normaliseItem(item, category = "articles") {
  const url = canonicalUrl(item?.url);
  const title = clean(item?.title, 240);
  if (!url || !title) return null;
  if (isYouTubeUrl(url)) category = "videos";
  if (!CATEGORIES.includes(category)) category = "articles";
  if (["articles", "essays", "websites"].includes(category) && hostRank(url) === RANK.drop) return null;
  if (/\b(careers?|job openings?|faculty directory|apply now|coupon code)\b/i.test(title)) return null;
  const types = { articles: "article", websites: "website", videos: "video", papers: "paper", code: "code", books: "book", podcasts: "podcast", discussions: "discussion", qa: "question", essays: "essay" };
  const out = { id: hash(url), title, url, category, type: types[category], source: clean(item.source || item.source_name || hostOf(url), 80) };
  for (const field of ["author", "published_at", "updated_at", "thumbnail", "venue", "doi", "source_name", "ebook_access", "access", "publisher", "language", "genre", "discussion_url"]) {
    if (typeof item[field] === "string") out[field] = clean(item[field], field.includes("url") || field === "thumbnail" ? 1500 : 180);
  }
  for (const field of ["signal", "duration", "year", "episode_count", "forks", "peer_reviewed", "accepted"]) {
    if (typeof item[field] === "boolean" || (typeof item[field] === "number" && Number.isFinite(item[field]))) out[field] = item[field];
  }
  out.snippet = clean(item.description || item.snippet, 1600);
  out.tags = strings(item.tags, 2).map(tag => tag.slice(0, 40));
  return out;
}

function assessedItem(item, assessment) {
  if (!assessment) return { ...item, snippet: clean(item.snippet, 400) };
  const { evidence: _evidence, relevance: _relevance, ...publicAssessment } = assessment;
  return { ...item, snippet: assessment.summary, description: assessment.summary,
    tags: strings(assessment.topics, 2).map(tag => tag.slice(0, 40)),
    depth_level: assessment.confidence >= 0.6 ? assessment.difficulty : undefined, ai: publicAssessment };
}

function validatePlan(value, request) {
  if (!value || typeof value.stem !== "boolean") throw new Error("Invalid search plan");
  const topic = clean(value.topic, 80);
  if (!topic || !INTENTS.includes(value.intent)) throw new Error("Invalid search plan");
  const queries = [...new Set((Array.isArray(value.queries) ? value.queries : []).map(q => clean(q, 240)))].filter(q => q.length >= 4).slice(0, 2);
  if (value.stem && !queries.length) throw new Error("Missing search queries");
  return { topic, intent: value.intent, stem: value.stem, goal: clean(value.goal, 240), queries, original: request.query };
}

function validateAssessments(value, candidates) {
  if (!Array.isArray(value?.items)) throw new Error("Invalid assessments");
  const byId = new Map(candidates.map(c => [c.id, c]));
  const seen = new Set();
  return value.items.flatMap(a => {
    const c = byId.get(a.id);
    if (!c || seen.has(a.id) || !DEPTHS.includes(a.difficulty)) return [];
    const scores = [a.quality, a.confidence, a.relevance];
    if (!scores.every(n => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1)) return [];
    if (c.basis !== "page") a = { ...a, confidence: Math.min(a.confidence, 0.5) };
    const evidence = clean(a.evidence, 350);
    const text = clean(c.text, 14000).toLowerCase();
    // Require a real supporting excerpt; a model cannot manufacture evidence.
    if (evidence.length < 15 || !text.includes(evidence.toLowerCase())) return [];
    const summary = clean(a.summary, 220);
    if (!summary) return [];
    seen.add(a.id);
    return [{ id: c.id, summary, difficulty: a.difficulty, quality: a.quality, confidence: a.confidence,
      relevance: a.relevance, topics: strings(a.topics), prerequisites: strings(a.prerequisites), intents: strings(a.intents).filter(x => INTENTS.includes(x)),
      evidence, basis: c.basis, reviewed_at: new Date().toISOString(), version: VERSION }];
  });
}

function validatePrism(value, candidates) {
  const byId = new Map(candidates.map(c => [c.id, c]));
  const seen = new Set();
  const hosts = new Map();
  const counts = new Map();
  const titles = new Set();
  const stages = (Array.isArray(value?.stages) ? value.stages : []).slice(0, 3).map((stage, index) => ({
    id: ["orient", "work", "source"][index], n: index + 1,
    label: clean(stage.label, 70), blurb: clean(stage.blurb, 220),
    hue: ["#3b82f6", "#8b5cf6", "#10b981"][index],
    items: (Array.isArray(stage.items) ? stage.items : []).slice(0, 4).flatMap(step => {
      const c = byId.get(step.id);
      if (!c || seen.has(c.id) || titles.has(titleKey(c.item.title)) || !c.assessment || c.assessment.confidence < 0.6 || c.assessment.quality < 0.6) return [];
      // Prerequisites expressed as resource IDs must occur before the item.
      if (!Array.isArray(step.after) || step.after.some(id => !seen.has(id))) return [];
      const host = hostOf(c.item.url);
      if ((hosts.get(host) || 0) >= 2 || (counts.get(c.category) || 0) >= 4) return [];
      hosts.set(host, (hosts.get(host) || 0) + 1);
      counts.set(c.category, (counts.get(c.category) || 0) + 1);
      seen.add(c.id);
      titles.add(titleKey(c.item.title));
      return [{ ...assessedItem(c.item, c.assessment), category: c.category, why: clean(step.why, 220) }];
    }),
  })).filter(s => s.label && s.items.length);
  const items = stages.flatMap(s => s.items);
  const readCount = items.filter(i => i.ai.basis === "page").length;
  if (!clean(value?.title) || !clean(value?.description) || items.length < 5 || stages.length < 2 || new Set(items.map(i => hostOf(i.url))).size < 2 || readCount < Math.ceil(items.length / 2)) return null;
  return { title: clean(value.title, 120), description: clean(value.description, 320), stages, items,
    curation: "ai", reviewed_at: new Date().toISOString() };
}

function groupItems(resources, intent, selectedIds = new Set()) {
  const categories = {};
  const perHost = new Map();
  const titles = new Set();
  const ranked = [...resources].sort((a, b) => {
    const score = r => (selectedIds.has(r.id) ? 3 : 0) + (r.assessment?.quality ?? 0.5) + (r.assessment?.intents?.includes(intent) ? 0.35 : 0) + (r.fit ?? 0);
    return score(b) - score(a);
  });
  for (const r of ranked) {
    // Unreadable pages are retained. Only evidence-backed irrelevance can drop one.
    if (r.assessment?.basis === "page" && r.assessment.confidence >= 0.8 && r.fit != null && r.fit < 0.25) continue;
    const key = `${r.category}:${titleKey(r.item.title)}`;
    if (titles.has(key)) continue;
    const hostKey = `${r.category}:${hostOf(r.url)}`;
    if ((perHost.get(hostKey) || 0) >= 2 || (categories[r.category]?.length || 0) >= 4) continue;
    perHost.set(hostKey, (perHost.get(hostKey) || 0) + 1);
    titles.add(key);
    (categories[r.category] ||= []).push(assessedItem(r.item, r.assessment));
  }
  return categories;
}

module.exports = { parseQuery, canonicalUrl, normaliseItem, validatePlan, validateAssessments, validatePrism, groupItems, hash, clean, CATEGORIES, DEPTHS, INTENTS };
