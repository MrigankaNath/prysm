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

/* One stop on a curated Prism, drawn as a marker on a route.
 *
 * What kind of thing a stop is does the work the index number used to: a
 * curated path mixes a docs site, a lecture and a paper, and knowing which is
 * which before you click is the difference between opening it now and saving
 * it for a train. */
const TYPE_ICON = {
  article: IconArticles,
  video: IconVideos,
  book: IconBooks,
  paper: IconPapers,
  website: IconWebsites,
  code: IconCode,
  course: IconTarget,
};

function PrismStep({ item, side, topic, done, onToggle }) {
  const host = hostOf(item.url);
  const TypeIcon = TYPE_ICON[item.type] || IconArticles;

  return (
    <li className={`proad-stop side-${side} pstep-${item.depth_level}${done ? " done" : ""}`}>
      <a
        className="proad-node"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.title}
      >
        <span className="proad-face">
          {done ? <IconCheck /> : <TypeIcon stroke="currentColor" />}
        </span>
      </a>

      <div className="proad-body">
        <a
          className="proad-title"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.title}
        </a>

        {item.description && <p className="proad-desc">{item.description}</p>}

        <div className="proad-meta">
          <span className="proad-type">{item.type}</span>
          {host && <span className="proad-host">{host}</span>}

          <button
            type="button"
            className="proad-tick"
            aria-pressed={done}
            aria-label={done ? "Mark as unread" : "Mark as done"}
            onClick={onToggle}
          >
            <IconCheck />
            {done ? "Done" : "Mark done"}
          </button>

          <BookmarkButton item={item} topic={topic} category="curated" />
        </div>
      </div>
    </li>
  );
}

export default PrismStep;
