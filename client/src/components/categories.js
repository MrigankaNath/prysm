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

/* One gradient per content type.
 *
 * Every category icon used to stroke itself with the single prism gradient,
 * which meant Research Papers, Discussions and Podcasts were all the same
 * pink-violet-amber sweep — nine icons that could not be told apart at the
 * size they are actually drawn. Each now leads with a hue of its own, and the
 * second stop is a lighter tint of it rather than a different colour, so the
 * identity survives at 16px where a two-hue blend just muddies.
 * The defs live in PrismGradientDefs (components/Icons.jsx). */
export const CATEGORY_GRADIENTS = {
  overview: ["#8b5cf6", "#c4b5fd"],
  articles: ["#3b82f6", "#93c5fd"],
  videos: ["#ec4899", "#f9a8d4"],
  podcasts: ["#f59e0b", "#fcd34d"],
  books: ["#10b981", "#6ee7b7"],
  code: ["#06b6d4", "#67e8f9"],
  papers: ["#6366f1", "#a5b4fc"],
  qa: ["#84cc16", "#bef264"],
  discussions: ["#14b8a6", "#5eead4"],
};

/** The `stroke` a category icon should be given. Pass it as a prop — the icon
 *  components spread props after their defaults, so it wins.
 *
 *  Never returns undefined. Props are spread *after* the icon's own defaults,
 *  so `stroke={undefined}` doesn't fall through to the default — it overwrites
 *  it, React drops the attribute, and SVG's initial `stroke: none` draws
 *  nothing. That is what emptied the "Everything" tile, which has no category
 *  of its own. */
export function categoryStroke(key) {
  return CATEGORY_GRADIENTS[key]
    ? `url(#cat-grad-${key})`
    : `url(#${ALL_GRADIENT_ID})`;
}

/** The lane that isn't a category. Keeps the full prism sweep, since
 *  "Everything" is exactly what the whole spectrum stands for. */
const ALL_GRADIENT_ID = "prism-gradient";
