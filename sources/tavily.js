const TAVILY_QUERIES = [
  { suffix: "beginner introduction", depth_level: "beginner" },
  { suffix: "in-depth guide", depth_level: "intermediate" },
  { suffix: "expert analysis", depth_level: "advanced" },
];

async function runTavilyQuery(apiKey, topic, suffix, depthLevel) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${topic} ${suffix}`,
      max_results: 3,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily API returned ${res.status}`);
  }

  const data = await res.json();

  return (data.results || []).map((item) => ({
    title: item.title,
    url: item.url,
    source: "tavily",
    type: "article",
    snippet: (item.content || "").slice(0, 280),
    published_at: item.published_date || null,
    thumbnail: null,
    depth_level: depthLevel,
  }));
}

async function fetchTavily(topic) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const results = await Promise.all(
    TAVILY_QUERIES.map(({ suffix, depth_level }) =>
      runTavilyQuery(apiKey, topic, suffix, depth_level),
    ),
  );

  return results.flat();
}

module.exports = { fetchTavily };
