import {
  IconOverview,
  IconArticles,
  IconVideos,
  IconPodcasts,
  IconBooks,
  IconCode,
  IconPapers,
  IconQA,
  IconDiscussions,
} from "./Icons";

export const CATEGORY_ICONS = {
  overview: IconOverview,
  articles: IconArticles,
  videos: IconVideos,
  podcasts: IconPodcasts,
  books: IconBooks,
  code: IconCode,
  papers: IconPapers,
  qa: IconQA,
  discussions: IconDiscussions,
};

export const CATEGORY_LABELS = {
  overview: "Overview",
  articles: "Articles",
  videos: "Videos",
  podcasts: "Podcasts",
  books: "Books",
  code: "Code",
  papers: "Research Papers",
  qa: "Q&A",
  discussions: "Discussions",
};

// Fallback only — the server ranks categories per topic and returns an order.
export const CATEGORY_ORDER = [
  "overview",
  "articles",
  "videos",
  "podcasts",
  "books",
  "code",
  "papers",
  "qa",
  "discussions",
];
