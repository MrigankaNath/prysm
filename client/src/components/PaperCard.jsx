import { BookmarkButton } from "./ResultCard";
import { recordVisit } from "../lib/library";
import { hostOf, formatSignal, venueChip } from "../lib/result";

/* A paper is a document with a provenance, and the lane says so.
 *
 * As plain rows the two things that decide whether a paper is worth opening —
 * where it was published and how often it has been cited — were the smallest
 * text on the row. Here the citation count is the figure it deserves to be,
 * and the venue sits in the header rule where a journal's masthead would.
 *
 * The sheet beside it is a *rendering* of the paper's first page, not a
 * screenshot of one. Fetching the real thing is possible — arXiv serves PDFs
 * with open CORS and honours range requests — and it was measured and
 * rejected: only the arXiv half of this lane has a reachable PDF (OpenAlex
 * records point at publisher pages that mostly don't allow it), the files run
 * 0.7–9.3MB, pdf.js is another ~400kB of bundle, and at this size a real first
 * page is an unreadable grey rectangle. The title is the part you can actually
 * read at 108px, so the title is the part that is real.
 */

/* Papers are dated by their record, and only the year survives at this size. */
function yearOf(item) {
  const raw = item.published_at;
  if (!raw) return null;
  const year = new Date(raw).getFullYear();
  return Number.isFinite(year) ? year : null;
}

function PaperCard({ item, topic, category = "papers" }) {
  const host = hostOf(item.url);
  const signal = formatSignal(item);
  const venue = venueChip(item);
  const cites = typeof item.signal === "number" && item.signal > 0 ? item.signal : null;
  const year = yearOf(item);

  return (
    <article className="paper">
      {/* Decorative: every word on it appears in the card proper, so a screen
          reader that announced it would read the paper twice. */}
      <span className="paper-page" aria-hidden="true">
        <span className="paper-page-sheet">
          <span className="paper-page-title">{item.title}</span>
          {(year || venue) && (
            <span className="paper-page-meta">
              {[venue?.label, year].filter(Boolean).join(" · ")}
            </span>
          )}
          {/* Ruled rather than set in type: a real abstract at this scale
              lands under a pixel a line, which browsers round to mush. Lines
              are crisp at any size and read as body text, which is all the
              page has to say from here. */}
          <span className="paper-page-body">
            <span className="paper-page-col" />
            <span className="paper-page-col" />
          </span>
        </span>
      </span>

      <div className="paper-main">
        <header className="paper-head">
          {venue && (
            <span className={`venue-chip${venue.reviewed ? " reviewed" : ""}`}>
              {venue.label}
            </span>
          )}
          <BookmarkButton item={item} topic={topic} category={category} />
        </header>

        {/* The anchor stretches over the whole card, so the sheet and the
            abstract are part of the click target rather than dead space
            beside one. The bookmark is lifted back above it. */}
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
      </div>
    </article>
  );
}

export default PaperCard;
