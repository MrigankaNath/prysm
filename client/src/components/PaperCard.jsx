import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { hostOf, formatSignal, venueChip } from "../lib/result";

/* A paper is a document with a provenance, and the lane says so.
 *
 * As plain rows the two things that decide whether a paper is worth opening —
 * where it was published and how often it has been cited — were the smallest
 * text on the row. Here the citation count is the figure it deserves to be,
 * and the venue sits in the header rule where a journal's masthead would.
 */
function PaperCard({ item, topic, category = "papers" }) {
  const host = hostOf(item.url);
  const signal = formatSignal(item);
  const venue = venueChip(item);
  const cites = typeof item.signal === "number" && item.signal > 0 ? item.signal : null;

  return (
    <article className="paper">
      <header className="paper-head">
        {venue && (
          <span className={`venue-chip${venue.reviewed ? " reviewed" : ""}`}>
            {venue.label}
          </span>
        )}
        <BookmarkButton item={item} topic={topic} category={category} />
      </header>

      <a
        className="paper-title"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordVisit(item, { topic, category })}
      >
        {item.title}
      </a>

      {/* Labelled, because that is how a paper presents its own summary — and
          it tells the reader the grey block is the author's abstract rather
          than something the app wrote about it. */}
      {item.snippet && (
        <div className="paper-abstract">
          <span className="paper-abstract-label">Abstract</span>
          <p>{item.snippet}</p>
        </div>
      )}

      <footer className="paper-foot">
        {cites !== null ? (
          <span className="paper-cites">
            <span className="paper-cites-n">{cites.toLocaleString()}</span>
            <span className="paper-cites-label">
              cited&nbsp;by
            </span>
          </span>
        ) : (
          signal && <span className="paper-cites-label">{signal}</span>
        )}
        {host && <span className="paper-host">{host}</span>}
      </footer>
    </article>
  );
}

export default PaperCard;
