const FORMAT_ORDER = [
  "videos", "articles", "websites", "essays", "papers", "discussions",
  "community", "qa", "answers", "podcasts", "books", "code",
];
const { hostRank, RANK, isYouTubeUrl } = require("./quality");

/* The first screen should represent the formats a person actually has, not
   whichever topic_cache rows Postgres happened to return first. Within each
   format, keep adapter ranking and round-robin across the user's topics. */
function mixDiscoveryRows(topics, rows, limit = 40) {
  const bySource = new Map();
  for (const row of [...rows].sort((a, b) => Number(b.source === "videos") - Number(a.source === "videos"))) {
    if (row.source === "overview") continue;
    const list = Array.isArray(row.results) ? row.results : [];
    for (const item of list) {
      if (!item?.url || !item?.title) continue;
      const source = row.source === "articles" && isYouTubeUrl(item.url) ? "videos" : row.source;
      if (source === "articles" && hostRank(item.url) === RANK.drop) continue;
      if (!bySource.has(source)) bySource.set(source, new Map());
      if (!bySource.get(source).has(row.topic)) bySource.get(source).set(row.topic, []);
      bySource.get(source).get(row.topic).push({ ...item, topic: row.topic, category: source });
    }
  }

  const sourceOrder = [
    ...FORMAT_ORDER.filter((source) => bySource.has(source)),
    ...[...bySource.keys()].filter((source) => !FORMAT_ORDER.includes(source)),
  ];
  const buckets = sourceOrder.map((source) => {
    const topicBuckets = topics.map((topic) => bySource.get(source).get(topic) || []);
    const depth = Math.max(0, ...topicBuckets.map((bucket) => bucket.length));
    const ordered = [];
    for (let i = 0; i < depth; i += 1) {
      for (const bucket of topicBuckets) if (bucket[i]) ordered.push(bucket[i]);
    }
    return ordered;
  });

  const seen = new Set();
  const items = [];
  const depth = Math.max(0, ...buckets.map((bucket) => bucket.length));
  for (let i = 0; i < depth && items.length < limit; i += 1) {
    for (const bucket of buckets) {
      const item = bucket[i];
      if (!item || seen.has(item.url)) continue;
      seen.add(item.url);
      items.push(item);
      if (items.length === limit) break;
    }
  }
  return items;
}

module.exports = { mixDiscoveryRows };
