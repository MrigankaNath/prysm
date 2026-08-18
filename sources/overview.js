// Replaces the old Wikipedia summary: Tavily synthesises an answer across the
// best sources it finds, which reads as a real primer rather than an
// encyclopaedia stub, and stays useful for topics Wikipedia covers thinly.
async function fetchOverview(topic) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: `What is ${topic}? Give a clear, well-sourced overview.`,
      include_answer: "advanced",
      max_results: 3,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily API returned ${res.status}`);
  }

  const data = await res.json();
  if (!data.answer) return null;

  const top = data.results?.[0];

  return {
    title: `What is ${topic}?`,
    url: top?.url || null,
    source: "overview",
    type: "overview",
    snippet: data.answer,
    published_at: null,
    thumbnail: null,
  };
}

module.exports = { fetchOverview };
