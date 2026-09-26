function integer(name, fallback, maximum = fallback) {
  if (!process.env[name]?.trim()) return fallback;
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= 0 ? Math.min(value, maximum) : fallback;
}

function config() {
  return {
    enabled: process.env.AI_ENABLED === "true",
    liteModel: process.env.AI_LITE_MODEL || "gemini-3.5-flash-lite",
    curatorModel: process.env.AI_CURATOR_MODEL || "gemini-3.8-flash",
    userRequests: integer("AI_USER_NEW_REQUESTS_MONTH", 2, 20),
    queueLimit: integer("AI_QUEUE_LIMIT", 100, 500),
    catalogueLimit: integer("AI_CATALOGUE_LIMIT", 5000, 10000),
    limits: {
      lite: { day: integer("AI_LITE_REQUESTS_DAY", 18, 100), month: 500, tokens: 1000000 },
      curator: { day: integer("AI_CURATOR_REQUESTS_DAY", 8, 50), month: 220, tokens: 160000 },
      tavily: { day: integer("AI_TAVILY_CREDITS_DAY", 30, 100), month: integer("AI_TAVILY_CREDITS_MONTH", 800, 900) },
      embeddings: { day: 5000, month: 60000, tokens: 1000000 },
      youtube: { day: 40, month: 600 },
    },
  };
}

const VERSION = 1;
const EMBEDDING_MODEL = "@cf/baai/bge-small-en-v1.5";
const SEED_TOPICS = [
  "robotics", "machine learning", "system design", "python", "computer vision",
  "linear algebra", "probability", "data structures", "algorithms", "neural networks",
  "control theory", "electronics", "databases", "operating systems", "computer networks",
  "cybersecurity", "quantum computing", "calculus", "statistics", "distributed systems",
];

module.exports = { config, VERSION, EMBEDDING_MODEL, SEED_TOPICS };
