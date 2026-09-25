const FORMAT_ORDER = [
  "videos", "articles", "websites", "essays", "papers", "discussions",
  "community", "qa", "answers", "podcasts", "books", "code",
];
const { hostRank, RANK } = require("./quality");

/* The first screen should represent the formats a person actually has, not
   whichever topic_cache rows Postgres happened to return first. Within each
   format, keep adapter ranking and round-robin across the user's topics. */
function mixDiscoveryRows(topics, rows, limit = 40) {
  const bySource = new Map();
  for (const row of rows) {
    if (row.source === "overview") continue;
    const list = Array.isArray(row.results) ? row.results : [];
    if (!bySource.has(row.source)) bySource.set(row.source, new Map());
    bySource.get(row.source).set(row.topic, list
      .filter((item) => item?.url && item?.title && (row.source !== "articles" || hostRank(item.url) !== RANK.drop))
      .map((item) => ({ ...item, topic: row.topic, category: row.source })));
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
