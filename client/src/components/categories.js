import {
  IconOverview,
  IconArticles,
  IconEssays,
  IconVideos,
  IconPodcasts,
  IconBooks,
  IconCode,
  IconPapers,
  IconQA,
  IconDiscussions,
  IconWebsites,
} from "./Icons";

import articlesArt from "../assets/content-icons/articles.svg";
import booksArt from "../assets/content-icons/books.svg";
import codeArt from "../assets/content-icons/code.svg";
import discussionsArt from "../assets/content-icons/discussions.svg";
import essaysArt from "../assets/content-icons/essays.svg";
import overviewArt from "../assets/content-icons/overview.svg";
import papersArt from "../assets/content-icons/papers.svg";
import podcastsArt from "../assets/content-icons/podcasts.svg";
import qaArt from "../assets/content-icons/qa.svg";
import videosArt from "../assets/content-icons/videos.svg";
import websitesArt from "../assets/content-icons/websites.svg";

export const CATEGORY_ICONS = {
  overview: IconOverview,
  articles: IconArticles,
  essays: IconEssays,
  videos: IconVideos,
  podcasts: IconPodcasts,
  books: IconBooks,
  code: IconCode,
  papers: IconPapers,
  qa: IconQA,
  discussions: IconDiscussions,
  websites: IconWebsites,
  // Reddit and Quora, as the feed sees them — one cache row down from Tavily.
  community: IconDiscussions,
  answers: IconQA,
};

/* Glossy 3D artwork, one per lane, drawn at illustration scale.
 *
 * Kept separate from CATEGORY_ICONS rather than replacing it: these are
 * full-colour and fixed, and the feed card's kind chip draws at 13px, where an
 * extruded solid is a coloured blob rather than a glyph. That one keeps the
 * stroked icon; everything drawn at 28px or larger uses the art.
 *
 * Loaded as URLs (Vite's default for .svg) rather than inlined, so each file
 * stays its own document — the artwork carries its own gradient ids, and
 * inlining several copies would have them all resolve to whichever rendered
 * first. Covers every lane; the fallback is only for an unknown category. */
export const CATEGORY_ART = {
  overview: overviewArt,
  articles: articlesArt,
  essays: essaysArt,
  websites: websitesArt,
  videos: videosArt,
  podcasts: podcastsArt,
  books: booksArt,
  code: codeArt,
  papers: papersArt,
  qa: qaArt,
  discussions: discussionsArt,
  community: discussionsArt,
  answers: qaArt,
};

export const CATEGORY_LABELS = {
  overview: "Overview",
  articles: "Articles",
  essays: "Essays",
  videos: "Videos",
  podcasts: "Podcasts",
  books: "Books",
  code: "Code",
  papers: "Research Papers",
  qa: "Q&A",
  discussions: "Discussions",
  websites: "Websites",
  /* Never its own lane on the explore page — the server folds it into
     discussions. It surfaces here because the feed labels an item by the cache
     row it came from, and these are Reddit and Quora threads. */
  community: "Discussions",
  answers: "Q&A",
};

// Fallback only — the server ranks categories per topic and returns an order.
export const CATEGORY_ORDER = [
  "overview",
  "websites",
  "articles",
  "essays",
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
  /* Rose rather than another blue: essays sit beside Articles everywhere they
     appear, and the two lanes have to be told apart at 16px. */
  essays: ["#f43f5e", "#fda4af"],
  videos: ["#ec4899", "#f9a8d4"],
  podcasts: ["#f59e0b", "#fcd34d"],
  books: ["#10b981", "#6ee7b7"],
  code: ["#06b6d4", "#67e8f9"],
  papers: ["#6366f1", "#a5b4fc"],
  qa: ["#84cc16", "#bef264"],
  discussions: ["#14b8a6", "#5eead4"],
  websites: ["#f97316", "#fdba74"],
  community: ["#14b8a6", "#5eead4"],
  answers: ["#84cc16", "#bef264"],
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
