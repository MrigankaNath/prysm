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

/* One stop on a curated Prism.
 *
 * A Prism is ordered by a person, not by a ranking, so the position is the
 * content: the index is set at display scale and carries the slab rather than
 * sitting in the meta line as an afterthought.
 *
 * Done mutes rather than brightens. A finished step that lit up would be the
 * loudest thing on a page whose whole job is to point at the next one. */
/* What kind of thing a stop is. A curated path mixes a docs site, a lecture
   and a paper, and knowing which is which before you click is the difference
   between opening it now and saving it for a train. */
const TYPE_ICON = {
  article: IconArticles,
  video: IconVideos,
  book: IconBooks,
  paper: IconPapers,
  website: IconWebsites,
  code: IconCode,
  course: IconTarget,
};

function PrismStep({ item, index, topic, done, onToggle }) {
  const host = hostOf(item.url);
  const TypeIcon = TYPE_ICON[item.type] || IconArticles;

  return (
    <article className={`pstep pstep-${item.depth_level}${done ? " done" : ""}`}>
      <span className="pstep-rail">
        <span className="pstep-n" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        {/* The category icons default to the fixed prism gradient. Here the
            glyph has to carry the stage's band and mute when the step is
            done, so it is told to inherit instead. */}
        <span className="pstep-type" title={item.type}>
          <TypeIcon stroke="currentColor" />
          <span className="sr-only">{item.type}</span>
        </span>
      </span>

      <div className="pstep-body">
        <a
          className="pstep-title"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.title}
        </a>

        {item.description && <p className="pstep-desc">{item.description}</p>}

        <div className="pstep-meta">
          {host && <span className="pstep-host">{host}</span>}
          <span className="pstep-depth">{item.depth_level}</span>
        </div>
      </div>

      <div className="pstep-controls">
        <BookmarkButton item={item} topic={topic} category="curated" />
        <button
          type="button"
          className="pstep-tick"
          aria-pressed={done}
          aria-label={done ? "Mark as unread" : "Mark as done"}
          onClick={onToggle}
        >
          <IconCheck />
        </button>
      </div>
    </article>
  );
}

export default PrismStep;
