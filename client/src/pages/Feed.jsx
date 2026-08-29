import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBookmarks, getHistory, getTopics, subscribe } from "../lib/library";
import { inProgress, worthRevisiting, domainCoverage } from "../lib/journey";
import { IconCheck } from "../components/Icons";
import FeedCard from "../components/FeedCard";
import TopicIcon from "../components/TopicIcon";
import { lighten, topicColor } from "../lib/topicIcon";
import { apiJson } from "../lib/api";
import {
  IconBookmark,
  IconHistory,
  IconCompass,
  IconChevronRight,
  IconGrid,
} from "../components/Icons";

/* Every topic card carries its own band of the spectrum: the base hue drives
   the stroke and the glow, the lightened one fills the button — a solid fill
   at full saturation would be amber under white text on some topics and
   violet under white on others, and only one of those is readable. */
function bandStyle(topic) {
  const band = topicColor(topic);
  return { "--band": band, "--band-lit": lighten(band, 0.34) };
}

/* The lead card is the answer to the section's own promise. "Continue
   exploring" implies there is one thing you'd continue, so it gets the hero
   slot, the only filled button on the page, and twice the width. */
function LeadTopic({ topic, total }) {
  return (
    <Link
      to={`/explore/${encodeURIComponent(topic)}`}
      className="feed-topic-card feed-topic-lead"
      style={bandStyle(topic)}
    >
      <span className="feed-lead-top">
        <TopicIcon topic={topic} />
        <span className="feed-lead-chip">Pick up here</span>
      </span>
      <span className="feed-lead-body">
        <span className="feed-topic-name">{topic}</span>
        <span className="feed-lead-meta">
          {total !== null ? `${total} results waiting` : "Ready when you are"}
        </span>
      </span>
      <span className="feed-lead-cta">
        Continue
        <IconChevronRight />
      </span>
    </Link>
  );
}

function TopicCard({ topic, total }) {
  return (
    <Link
      to={`/explore/${encodeURIComponent(topic)}`}
      className="feed-topic-card"
      style={bandStyle(topic)}
    >
      <TopicIcon topic={topic} />
      <span className="feed-topic-name">{topic}</span>
      <span className="feed-topic-foot">
        {total !== null ? `${total} results` : "Open"}
        <IconChevronRight />
      </span>
    </Link>
  );
}

function Feed({ session }) {
  const [discover, setDiscover] = useState({ topics: [], items: [] });
  /* Without this the empty state renders for a beat before the fetch resolves,
     so every visit flashes "Nothing here yet" at someone who has plenty. */
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [library, setLibrary] = useState(() => ({
    bookmarks: getBookmarks(),
    history: getHistory(),
    topics: getTopics(),
    started: inProgress(),
    revisit: worthRevisiting(),
    coverage: domainCoverage(),
  }));

  useEffect(
    () =>
      subscribe(() =>
        setLibrary({
          bookmarks: getBookmarks(),
          history: getHistory(),
          topics: getTopics(),
          started: inProgress(),
          revisit: worthRevisiting(),
          coverage: domainCoverage(),
        }),
      ),
    [],
  );

  useEffect(() => {
    apiJson("/api/feed/discover", { topics: [], items: [] })
      .then((data) =>
        setDiscover({
          topics: data?.topics || [],
          items: Array.isArray(data?.items) ? data.items : [],
        }),
      )
      .finally(() => setLoading(false));
  }, [session]);

  const { bookmarks, history, topics, started, revisit, coverage } = library;
  const touchedDomains = coverage.filter((d) => d.covered > 0);
  const isEmpty =
    !loading &&
    bookmarks.length === 0 &&
    history.length === 0 &&
    discover.items.length === 0 &&
    topics.length === 0;

  // Topics come from the account when it has them, falling back to whatever
  // this device recorded — so the section is never empty on a fresh browser
  // that has an account, or on a signed-out one that has local history.
  const topicList = discover.topics.length
    ? discover.topics.map((topic) => ({ topic, total: null }))
    : topics.map(({ topic, total }) => ({ topic, total }));

  const [lead, ...restTopics] = topicList.slice(0, 9);
  const visibleItems = showAll ? discover.items : discover.items.slice(0, 8);

  return (
    <div className="page page-wide feed">
      <header className="feed-head">
        <div className="feed-head-copy">
          <h1 className="feed-title">Your feed</h1>
          <p className="feed-sub">
            Built from what you&rsquo;ve saved and searched — not from what&rsquo;s
            trending.
          </p>
        </div>

        {/*  ILLUSTRATION SLOT — "feed mark", ~220x160.  */}
        <div className="illo-slot illo-slot-head" aria-hidden="true">
          <span className="illo-hint">illustration</span>
        </div>
      </header>

      {isEmpty && (
        <div className="feed-empty">
          <p className="feed-empty-title">Nothing here yet</p>
          <p className="feed-empty-copy">
            Search any topic and it starts filling in. Press{" "}
            <kbd className="inline-kbd">⌘K</kbd> to search from anywhere.
          </p>
          <Link to="/spectrum" className="btn-bounce">
            Browse the Spectrum
            <IconChevronRight />
          </Link>
        </div>
      )}

      {/* The loop. A half-finished path is the one thing on this page that is
          genuinely waiting for you — so it goes first, above anything the app
          merely thinks you might like. */}
      {started.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconCompass className="feed-section-icon" />
            Pick up where you left off
          </h3>
          <div className="resume-row">
            {started.map(({ topic, done, total }) => (
              <Link
                key={topic}
                to={`/explore/${encodeURIComponent(topic)}`}
                className="resume"
                style={bandStyle(topic)}
              >
                <TopicIcon topic={topic} />
                <span className="resume-body">
                  <span className="resume-name">{topic}</span>
                  <span className="resume-count">
                    {done} of {total} done
                  </span>
                </span>
                <span className="resume-bar" aria-hidden="true">
                  <span
                    className="resume-bar-fill"
                    style={{ width: `${(done / total) * 100}%` }}
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* The map. Not a prerequisite graph — that needs the AI layer — but a
          true one: which bands you have actually been into. It reads the same
          progress records the paths write. */}
      {touchedDomains.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconGrid className="feed-section-icon" />
            Where you&rsquo;ve been
            <Link to="/spectrum" className="feed-section-link">
              {touchedDomains.length} of {coverage.length} domains
            </Link>
          </h3>
          <div className="cover-row">
            {touchedDomains.map((d) => (
              <Link
                key={d.id}
                to={`/spectrum#domain-${d.id}`}
                className="cover"
                style={{ "--hue": d.hue }}
              >
                <span className="cover-name">{d.label}</span>
                <span className="cover-count">
                  {d.covered}/{d.of}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recall, in the form the app can honestly offer without generated
          questions: a finished path, surfaced again after a fortnight. The gap
          is the point — coming back tells you what stuck. */}
      {revisit.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconHistory className="feed-section-icon" />
            Worth revisiting
          </h3>
          <div className="feed-topic-row">
            {revisit.map(({ topic, total }) => (
              <Link
                key={topic}
                to={`/explore/${encodeURIComponent(topic)}`}
                className="feed-topic-card"
                style={bandStyle(topic)}
              >
                <TopicIcon topic={topic} />
                <span className="feed-topic-name">{topic}</span>
                <span className="feed-topic-foot">
                  <span className="revisit-done">
                    <IconCheck /> {total} done
                  </span>
                  <IconChevronRight />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {lead && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconCompass className="feed-section-icon" />
            Continue exploring
            <Link to="/spectrum" className="feed-section-link">
              All topics
            </Link>
          </h3>
          <div className="feed-topic-row">
            <LeadTopic topic={lead.topic} total={lead.total} />
            {restTopics.map(({ topic, total }) => (
              <TopicCard key={topic} topic={topic} total={total} />
            ))}
          </div>
        </section>
      )}

      {discover.items.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconCompass className="feed-section-icon" />
            Because you searched
          </h3>
          <div className="fcard-grid">
            {visibleItems.map((item) => (
              <FeedCard
                key={item.url}
                item={item}
                topic={item.topic || ""}
                category={item.category || "articles"}
              />
            ))}
          </div>
          {discover.items.length > 8 && (
            <button
              type="button"
              className="cat-expand"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? "Show less"
                : `Show ${discover.items.length - 8} more`}
            </button>
          )}
        </section>
      )}

      {bookmarks.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconBookmark className="feed-section-icon" />
            Saved for later
            <Link to="/wavelength" className="feed-section-link">
              All {bookmarks.length}
            </Link>
          </h3>
          <div className="fcard-grid is-compact">
            {bookmarks.slice(0, 4).map((item) => (
              <FeedCard
                key={item.url}
                item={item}
                topic={item.topic || ""}
                category={item.category || "articles"}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="feed-section">
          <h3 className="feed-section-head">
            <IconHistory className="feed-section-icon" />
            Recently opened
            <Link to="/wavelength" className="feed-section-link">
              All {history.length}
            </Link>
          </h3>
          <div className="fcard-grid is-compact">
            {history.slice(0, 4).map((item) => (
              <FeedCard
                key={item.url}
                item={item}
                topic={item.topic || ""}
                category={item.category || "articles"}
                compact
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Feed;
