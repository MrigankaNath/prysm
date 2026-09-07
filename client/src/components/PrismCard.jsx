import {
  IconCheck,
  IconArticles,
  IconVideos,
  IconBooks,
  IconPapers,
  IconWebsites,
  IconCode,
  IconTarget,
} from "./Icons";
import { BookmarkButton } from "./ResultCard";
import { hostOf } from "../lib/result";

/* One thing to read on a curated Prism.
 *
 * A Prism is a shelf someone assembled, not a route with gates — the order is
 * a recommendation and every item opens on its own. So these are tiles you
 * browse rather than markers you walk, and the depth stages do the sequencing
 * that a drawn path was doing badly.
 */
const TYPE_LABEL = {
  article: "Article",
  video: "Video",
  book: "Free book",
  paper: "Paper",
  website: "Reference",
  code: "Repository",
  course: "Course",
};

const TYPE_ICON = {
  article: IconArticles,
  video: IconVideos,
  book: IconBooks,
  paper: IconPapers,
  website: IconWebsites,
  code: IconCode,
  course: IconTarget,
};

function PrismCard({ item, topic, done, onToggle }) {
  const host = hostOf(item.url);
  const TypeIcon = TYPE_ICON[item.type] || IconArticles;
  const kind = TYPE_LABEL[item.type] || item.type;

  return (
    <article className={`ptile${done ? " done" : ""}`}>
      <a
        className="ptile-face"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="ptile-head">
          <span className="ptile-glyph">
            <TypeIcon stroke="currentColor" />
          </span>
          <span className="ptile-kind">{kind}</span>
        </span>

        <h4 className="ptile-title">{item.title}</h4>
        {item.description && <p className="ptile-desc">{item.description}</p>}
      </a>

      <div className="ptile-foot">
        {host && <span className="ptile-host">{host}</span>}

        <button
          type="button"
          className="ptile-tick"
          aria-pressed={done}
          aria-label={done ? "Mark as unread" : "Mark as done"}
          onClick={onToggle}
        >
          <IconCheck />
          {done ? "Done" : "Mark done"}
        </button>

        <BookmarkButton item={item} topic={topic} category="curated" />
      </div>
    </article>
  );
}

export default PrismCard;
