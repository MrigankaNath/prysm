/** Adapt curated, live, and older saved results to one presentation contract. */
const KINDS = {
  article: "articles", essay: "essays", video: "videos", podcast: "podcasts",
  book: "books", paper: "papers", research: "papers", website: "websites",
  repository: "code", discussion: "discussions", community: "discussions",
  answer: "qa", answers: "qa", course: "courses",
};
const CATEGORIES = new Set(["articles", "essays", "videos", "podcasts", "books", "papers", "websites", "code", "discussions", "qa", "courses"]);
const SOURCES = { youtube: "videos", github: "code", arxiv: "papers", openalex: "papers", books: "books", podcasts: "podcasts", hackernews: "discussions", stackexchange: "qa" };
export function presentContent(item, { category, topic } = {}) {
  if (!item || typeof item.title !== "string") return null;
  try {
    if (!["https:", "http:"].includes(new URL(item.url).protocol)) return null;
  } catch { return null; }
  const kind = [category, item.category, item.type].map(value => KINDS[value] || value).find(value => CATEGORIES.has(value)) || SOURCES[item.source] || "articles";
  return { ...item, category: kind, topic: topic ?? item.topic ?? "", snippet: item.snippet || item.description || "" };
}
