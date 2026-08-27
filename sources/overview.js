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
      /* Two sentences, definition first. The page sets this at display scale
         and clamps it to three lines, so an answer that runs to a paragraph is
         mostly hidden behind "Read more" — and the part that shows is a
         fragment rather than a statement. */
      query:
        `What is ${topic}? Answer in at most two short sentences: ` +
        `the first a plain one-line definition, the second why it matters.`,
      /* "advanced" returns a multi-paragraph essay. Same credit cost either
         way — search_depth is what's metered, not the answer length. */
      include_answer: "basic",
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
