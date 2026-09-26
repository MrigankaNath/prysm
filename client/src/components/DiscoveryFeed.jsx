import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play, Globe, Star, GitFork, Check, Headphones, Eye, Clapperboard, ListMusic, FileText, BadgeCheck, CalendarDays, Quote } from "lucide-react";
import { BookmarkButton } from "./ResultCard";
import { CATEGORY_LABELS } from "./categories";
import { BookVisual } from "./BookCard";
import TopicIcon from "./TopicIcon";
import { recordVisit } from "../lib/library";
import { hostOf, effortOf, formatSignal, publishedOn } from "../lib/result";
import { topicColor, lighten } from "../lib/topicIcon";
import { presentContent } from "../lib/contentPresentation";
import { discussionLine, shortCardLine } from "../lib/cardCopy";
import researchArt from "../assets/research.svg";
import podcastMark from "../assets/podcast.svg";
import codeMark from "../assets/code-card.svg";
import "./DiscoveryFeed.css";

const ACTIONS = { courses: "View course", essays: "Read essay", videos: "Watch video", podcasts: "Listen to show", papers: "Read paper", code: "Explore repository", books: "Explore book", discussions: "Join discussion", community: "Join discussion", qa: "Read answer", answers: "Read answer" };
const BRANDS = { "youtube.com": "YouTube", "youtu.be": "YouTube", "github.com": "GitHub", "arxiv.org": "arXiv", "open.spotify.com": "Spotify", "podcasts.apple.com": "Apple Podcasts", "reddit.com": "Reddit", "en.wikipedia.org": "Wikipedia", "news.ycombinator.com": "Hacker News" };

function SourceTag({ host, showAddress = false }) {
  const [broken, setBroken] = useState(false);
  return <span className="discovery-tag discovery-source">
    {!broken && host ? <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`} alt="" onError={() => setBroken(true)} /> : <Globe size={16} />}
    <span>{(showAddress ? host : BRANDS[host] || host) || "Web"}</span>
  </span>;
}

function BookDestination({ item }) {
  const [broken, setBroken] = useState(false);
  const host = hostOf(item.url);
  const isPdf = new URL(item.url).pathname.toLowerCase().endsWith(".pdf");
  const destination = isPdf
    ? [host || "Document", "PDF file"]
    : host === "amazon.com" || host?.endsWith(".amazon.com")
    ? ["Amazon", "Product page"]
    : host === "archive.org"
      ? ["Internet Archive", item.access === "borrow" ? "Online borrowing page" : "Free scan page"]
      : host === "openlibrary.org"
        ? ["Open Library", item.access === "buy" ? "Book record · buying options" : "Book record"]
        : host === "gutenberg.org" || host === "www.gutenberg.org"
          ? ["Project Gutenberg", "Free ebook page"]
          : [host || "Website", "Book page · format may vary"];
  return <span className="discovery-book-destination" title={`Opens ${destination[0]}: ${destination[1]}`}>
    {!broken && host ? <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`} alt="" onError={() => setBroken(true)} /> : <Globe size={17} aria-hidden="true" />}
    <span><strong>{destination[0]}</strong><small>{destination[1]}</small></span>
  </span>;
}

// The object or publisher identifies the medium before the headline is read.
function CategoryIdentity({ item, category }) {
  const [broken, setBroken] = useState(false);
  const host = hostOf(item.url);
  const mark = item.thumbnail && ["code", "podcasts", "videos"].includes(category)
    ? item.thumbnail
    : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host || "")}&sz=128`;
  const logo = !broken ? <img src={mark} alt="" onError={() => setBroken(true)} /> : <span className="discovery-monogram">{(host || "W").slice(0, 1).toUpperCase()}</span>;
  if (category === "courses") return <div className="course-source"><SourceTag host={host} /></div>;
  if (category === "books") return <div className="discovery-book-stage" aria-hidden="true"><span className="book-object"><BookVisual item={item} /></span></div>;
  if (category === "podcasts") return <div className="discovery-audio">{item.thumbnail && !broken ? logo : <Headphones size={36} aria-hidden="true" />}<span><strong>Listen</strong><small>Podcast</small></span></div>;
  if (category === "videos") return <div className="discovery-screen">
    {item.thumbnail && !broken ? logo : <svg aria-hidden="true" className="discovery-video-art" viewBox="0 0 480 270" fill="none"><path d="M0 135H480M240 0V270" stroke="currentColor" opacity=".15"/><ellipse cx="240" cy="135" rx="170" ry="70" stroke="currentColor" transform="rotate(-25 240 135)"/><ellipse cx="240" cy="135" rx="170" ry="70" stroke="currentColor" transform="rotate(25 240 135)"/><circle cx="240" cy="135" r="91" stroke="currentColor" opacity=".35"/><circle cx="375" cy="72" r="4" fill="currentColor"/></svg>}
    <span className="discovery-screen-play" aria-hidden="true"><Play size={22} fill="currentColor" /></span>
    <span className="discovery-screen-caption">{effortOf(item, category) || "Video"}</span>
  </div>;
  if (["discussions", "community"].includes(category)) return <div className="discovery-conversation"><span className="discovery-publisher-mark">{logo}</span><span><strong>{BRANDS[host] || host}</strong><small>In the conversation</small></span><span className="discovery-reply-shape" /></div>;
  if (category === "papers") return <div className="discovery-journal"><span>RESEARCH / {item.source === "arxiv" ? "arXiv" : item.venue || host}</span><span className="discovery-page-fold" aria-hidden="true" /></div>;
  if (["qa", "answers"].includes(category)) return <div className="discovery-question"><span>Q<span> / A</span></span><small>{item.accepted ? "Accepted answer" : "Questions & perspectives"}</small></div>;
  return <div className={`discovery-editorial ${category === "essays" ? "is-essay" : ""}`}><span aria-hidden="true">{category === "essays" ? "“" : "READ /"}</span><span>{item.author || BRANDS[host] || host}</span></div>;
}

function PublisherMark({ host, thumbnail }) {
  const [broken, setBroken] = useState(false);
  return <span className="discovery-clean-mark" aria-hidden="true">{broken ? <Globe size={24} /> : <img src={thumbnail || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host || "")}&sz=128`} alt="" onError={() => setBroken(true)} />}</span>;
}

function WebsiteIdentity({ host }) {
  return <div className="discovery-site-identity">
    <span>Domain</span><strong>{host}</strong>
  </div>;
}

const count = (value) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function youtubeThumbnail(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const id = host === "youtu.be" ? parsed.pathname.split("/")[1]
      : parsed.searchParams.get("v") || parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
    return /^[\w-]{11}$/.test(id || "") ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  } catch { return null; }
}

function videoTitleParts(title) {
  if (title.length < 55) return [title, ""];
  const words = title.split(/\s+/);
  let first = "";
  let index = 0;
  while (index < words.length - 1 && first.length < title.length * .52) first += `${first ? " " : ""}${words[index++]}`;
  return [first, words.slice(index).join(" ")];
}

function VideoCard({ item, title, topic, preview, saved, onToggleSave, onVisit, done, onToggleDone, light, span }) {
  const thumbnail = item.thumbnail || youtubeThumbnail(item.url);
  const [titleLead, titleTail] = videoTitleParts(title);
  const views = typeof item.signal === "number" && item.signal > 0
    ? `${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(item.signal)} views`
    : null;
  const visit = () => {
    if (!preview) recordVisit(item, { topic, category: "videos" });
    onVisit?.();
  };
  return <article className="discovery-card discovery-videos" {...light} style={{ "--card-span": span }}>
    <div className="video-card-backing"><span><Play size={13} fill="currentColor" aria-hidden="true" /> YouTube</span></div>
    <svg className="video-card-surface" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><path d="M25 1H335C383 1 370 55 424 55H575Q599 55 599 80V375Q599 399 575 399H25Q1 399 1 375V25Q1 1 25 1Z" /></svg>
    <div className="video-card-light" aria-hidden="true" />
    <div className="video-card-content">
      <div className="video-card-main">
        <div className="video-card-thumbnail-frame">
          <div className="video-card-thumbnail">
            {thumbnail ? <img src={thumbnail} alt="" /> : <div className="video-card-fallback"><Clapperboard size={35} aria-hidden="true" /></div>}
          </div>
        </div>
        <div className="video-card-copy"><h4><a href={item.url} target="_blank" rel="noopener noreferrer" onClick={visit}><strong>{titleLead}</strong>{titleTail && <span> {titleTail}</span>}</a></h4></div>
      </div>
      <div className="video-card-meta" aria-label="Video details">
        {item.author && <span className="video-card-chip video-card-channel" title={item.author}><span className="video-card-avatar" aria-hidden="true">{item.author.charAt(0).toUpperCase()}</span><span className="video-card-channel-copy"><span className="video-card-chip-label">CHANNEL</span><span className="video-card-channel-name">{item.author}</span></span></span>}
        {views && <span className="video-card-chip" title={`${item.signal.toLocaleString()} views`}><Eye size={13} aria-hidden="true" />{views}</span>}
        {publishedOn(item) && <span className="video-card-chip" title={`Uploaded ${publishedOn(item)}`}><CalendarDays size={13} aria-hidden="true" />{publishedOn(item)}</span>}
        {onToggleDone && <button type="button" className="discovery-done" aria-pressed={!!done} onClick={() => onToggleDone(item)}><Check size={15} />{done ? "Watched" : "Mark watched"}</button>}
        {preview ? <button type="button" className={`bookmark-btn${saved ? " saved" : ""}`} aria-label={saved ? "Remove bookmark" : "Save for later"} aria-pressed={saved} onClick={() => onToggleSave(item.url)}><svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 4h12v17l-6-4-6 4z" /></svg></button> : <BookmarkButton item={item} topic={topic} category="videos" />}
      </div>
    </div>
  </article>;
}

function PodcastCard({ item, title, topic, preview, saved, onToggleSave, onVisit, done, onToggleDone, light, span }) {
  const description = item.description || (item.snippet && !item.snippet.includes(" · ") ? item.snippet : item.genre && item.author ? `A ${item.genre.toLowerCase()} show from ${item.author}.` : null);
  const visit = () => {
    if (!preview) recordVisit(item, { topic, category: "podcasts" });
    onVisit?.();
  };

  return <article className="discovery-card discovery-podcasts" {...light} style={{ "--card-span": span }}>
    <div className="podcast-card-backing"><span><Headphones size={14} aria-hidden="true" />Podcast</span></div>
    <svg className="podcast-card-surface" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><path d="M25 1H335C383 1 370 55 424 55H575Q599 55 599 80V375Q599 399 575 399H25Q1 399 1 375V25Q1 1 25 1Z" /></svg>
    <div className="podcast-card-light" aria-hidden="true" />
    <div className="podcast-card-content">
      <div className="podcast-card-main">
        <div className="podcast-card-cover-frame"><div className="podcast-card-cover">
          {item.thumbnail ? <img src={item.thumbnail} alt="" /> : <div className="podcast-card-cover-fallback"><Headphones size={54} aria-hidden="true" /></div>}
        </div></div>
        <div className="podcast-card-copy"><span className="podcast-card-kicker"><img className="podcast-card-mark" src={podcastMark} alt="" />{item.source === "spotify" ? "Spotify · " : ""}Audio series{topic ? ` · ${topic}` : ""}</span><h4><a href={item.url} target="_blank" rel="noopener noreferrer" onClick={visit}>{title}</a></h4>{description && <p className="podcast-card-description">{description}</p>}</div>
      </div>
      <div className="podcast-card-meta" aria-label="Podcast details">
        <span className="podcast-card-chip podcast-card-publisher" title={item.author || "Publisher unavailable"}><span className="podcast-card-avatar" aria-hidden="true">{(item.author || "?").charAt(0).toUpperCase()}</span><span className="podcast-card-publisher-copy"><span className="podcast-card-chip-label">PUBLISHER</span><span className="podcast-card-publisher-name">{item.author || "Unknown publisher"}</span></span></span>
        {item.signal > 0 && <span className="podcast-card-chip" title={`${item.signal.toLocaleString()} episodes`}><ListMusic size={14} aria-hidden="true" />{count(item.signal)} episodes</span>}
        {onToggleDone && <button type="button" className="discovery-done" aria-pressed={!!done} onClick={() => onToggleDone(item)}><Check size={15} />{done ? "Played" : "Mark played"}</button>}
        {preview ? <button type="button" className={`bookmark-btn${saved ? " saved" : ""}`} aria-label={saved ? "Remove bookmark" : "Save for later"} aria-pressed={saved} onClick={() => onToggleSave(item.url)}><svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 4h12v17l-6-4-6 4z" /></svg></button> : <BookmarkButton item={item} topic={topic} category="podcasts" />}
      </div>
    </div>
  </article>;
}

const LANGUAGE_COLORS = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572a5", Rust: "#dea584", Go: "#00add8", Ruby: "#701516", Java: "#b07219", "C++": "#f34b7d" };

function CodeRepository({ item, title, topic, preview, saved, onToggleSave, onVisit, done, onToggleDone }) {
  const [owner = "github", repository = title] = title.split("/");
  const visit = () => {
    if (!preview) recordVisit(item, { topic, category: "code" });
    onVisit?.();
  };

  return <div className="repo-panel">
    <div className="repo-panel-bar">
      <span className="repo-window-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="repo-panel-context" aria-hidden="true"><GitFork size={14} /></span>
      <span className="repo-header-actions">{onToggleDone && <button type="button" className="discovery-done" aria-pressed={!!done} onClick={() => onToggleDone(item)}><Check size={15} />{done ? "Read" : "Mark read"}</button>}{preview ? <button className={`bookmark-btn${saved ? " saved" : ""}`} aria-label={saved ? "Remove preview bookmark" : "Save preview item"} aria-pressed={saved} onClick={() => onToggleSave(item.url)}><svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 4h12v17l-6-4-6 4z" /></svg></button> : <BookmarkButton item={item} topic={topic} category="code" />}</span>
    </div>
    <div className="repo-panel-body">
      <div className="repo-identity">
        <PublisherMark host="github.com" thumbnail={item.thumbnail} />
        <div className="repo-name"><span>{owner}</span><h4><a href={item.url} target="_blank" rel="noopener noreferrer" onClick={visit}>{repository}</a></h4></div>
        <img className="repo-code-mark" src={codeMark} alt="" aria-hidden="true" />
      </div>
      {item.snippet && <p className="discovery-description">{item.snippet}</p>}
      <div className="repo-output" aria-label="Repository details">
        {typeof item.signal === "number" && <span title={`${item.signal.toLocaleString()} stars`}><Star size={15} /><small>stars</small><strong>{count(item.signal)}</strong></span>}
        {typeof item.forks === "number" && <span title={`${item.forks.toLocaleString()} forks`}><GitFork size={15} /><small>forks</small><strong>{count(item.forks)}</strong></span>}
        {item.language && <span title={`${item.language} is the primary language`}><i className="discovery-language-dot" style={{ background: LANGUAGE_COLORS[item.language] || "#aaa" }} /><small>primary</small><strong>{item.language}</strong></span>}
      </div>
      <div className="discovery-tags repo-tags">
        <span className="repo-github-tag"><GitFork size={16} /><strong>GitHub</strong><span>Repository</span></span>
        {topic && <Link className="discovery-tag discovery-topic" onClick={onVisit} to={`/explore/${encodeURIComponent(topic)}`}><TopicIcon topic={topic} /><span>{topic}</span></Link>}
      </div>
    </div>
  </div>;
}

function useCardLight() {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const move = (event) => {
    if (event.pointerType === "touch" || !window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
    const card = event.currentTarget;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    // Only the hovered surface updates, once per paint; no feed re-render.
    frame.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--light-x", `${Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100))}%`);
      card.style.setProperty("--light-y", `${Math.max(0, Math.min(100, (clientY - rect.top) / rect.height * 100))}%`);
      frame.current = 0;
    });
  };
  const leave = (event) => {
    cancelAnimationFrame(frame.current);
    event.currentTarget.style.removeProperty("--light-x");
    event.currentTarget.style.removeProperty("--light-y");
  };
  return { onPointerMove: move, onPointerLeave: leave };
}


export function DiscoveryCard({ item: rawItem, topic: contextTopic, preview, span, saved, onToggleSave, compact = false, onVisit, done, onToggleDone }) {
  const light = useCardLight();
  const item = presentContent(rawItem, { topic: contextTopic });
  if (!item) return null;
  const { category, title: itemTitle } = item;
  const topic = item.topic || "";
  const host = hostOf(item.url);
  const title = category === "code" && host === "github.com" ? new URL(item.url).pathname.replace(/^\/|\/$/g, "") : itemTitle;
  const band = topicColor(topic);
  const book = category === "books";
  const paper = category === "papers";
  const article = category === "articles";
  const discussion = ["discussions", "community"].includes(category);
  const clean = ["code", "websites"].includes(category);
  const kind = article ? "article" : discussion ? "discussion" : book ? "book" : paper ? "paper" : category === "websites" ? "website" : null;
  const editorial = ["articles", "essays", "courses"].includes(category);
  const normalizeTag = value => value.toLowerCase().replace(/[\s_-]+/g, " ").trim();
  const tags = Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === "string" && tag.trim() && tag.length <= 40 && normalizeTag(tag) !== normalizeTag(topic)).filter((tag, index, all) => all.findIndex(other => normalizeTag(other) === normalizeTag(tag)) === index) : [];
  const citationCount = paper && item.source === "openalex" && typeof item.signal === "number" && Number.isFinite(item.signal)
    ? item.signal.toLocaleString()
    : null;
  const discussionBlurb = discussion && title.length < 105 ? discussionLine(item) : null;
  const articleBlurb = article ? shortCardLine(item.description || item.snippet, title) : null;
  const websiteBlurb = category === "websites" ? shortCardLine(item.description || item.snippet, title) : null;
  const visit = () => { if (!preview) recordVisit(item, { topic, category }); onVisit?.(); };
  const props = { item, title, topic, preview, saved, onToggleSave, onVisit, done, onToggleDone, light, span };
  if (category === "videos") return <VideoCard {...props} />;
  if (category === "podcasts") return <PodcastCard {...props} />;
  const topicTag = (tag, extra = "") => <Link key={tag} className={`discovery-tag discovery-topic ${extra}`} onClick={onVisit} to={`/explore/${encodeURIComponent(tag)}`}><TopicIcon topic={tag} /><span>{tag}</span></Link>;
  return <article className={`discovery-card discovery-${category}${compact ? " is-compact" : ""}`} {...light} style={{ "--band": band, "--band-lit": lighten(band, .45), "--card-span": span }}>
    {kind && <>
      <div className={`${kind}-backing`}>{paper ? <><span>Research</span><span>Paper</span></> : <span>{kind}</span>}</div>
      <svg className={`${kind}-surface`} viewBox="0 0 560 400" preserveAspectRatio="none" aria-hidden="true"><path d="M25 1H306C350 1 339 55 392 55H535Q559 55 559 79V375Q559 399 535 399H25Q1 399 1 375V25Q1 1 25 1Z" /></svg>
      {(article || discussion || ["qa", "answers", "essays", "courses"].includes(category)) && <span className="article-texture" aria-hidden="true" />}
      {paper && <div className="paper-light" aria-hidden="true" />}
    </>}
    <div className="discovery-content">
      {category === "code" ? <CodeRepository {...props} /> : <>
        {article || discussion || paper ? <div className={`${kind}-masthead`}><SourceTag host={host} showAddress={discussion} /></div> : !clean && <CategoryIdentity item={item} category={category} />}
        {category === "websites" && <WebsiteIdentity host={host} />}
        <div className="discovery-summary">
          {!kind && !clean && <div className="discovery-eyebrow"><span>{category === "essays" ? "Essay" : category === "courses" ? "Course" : CATEGORY_LABELS[category]}</span></div>}
          {paper && <div className="paper-visual" aria-hidden="true"><img src={researchArt} alt="" /></div>}
          {category === "websites" && <div className="discovery-site-core"><PublisherMark host={host} /></div>}
          <div className={clean || book ? "discovery-clean-heading" : "discovery-heading"}><h4><a href={item.url} target="_blank" rel="noopener noreferrer" onClick={visit}>{title}</a></h4></div>
          {discussionBlurb && <p className="discussion-context">{discussionBlurb}</p>}
          {articleBlurb && <p className="discovery-card-line article-context">{articleBlurb}</p>}
          {paper && item.author && <p className="paper-author">{item.author}</p>}
          {paper && <p className="paper-citations"><Quote size={14} aria-hidden="true" />{citationCount === null ? "Citations unavailable" : `${citationCount} ${citationCount === "1" ? "citation" : "citations"}`}</p>}
          {book && <div className="discovery-book-meta">{item.author && <span>{item.author}</span>}{(publishedOn(item) || item.year) && <span>{publishedOn(item) || item.year}</span>}<BookDestination item={item} /></div>}
          {websiteBlurb && <p className="website-context">{websiteBlurb}</p>}
          {!book && !paper && !discussion && !article && category !== "websites" && item.snippet && <p className="discovery-description">{item.snippet}</p>}
          {!clean && !book && !paper && !discussion && <div className="discovery-details">{item.author && !editorial && <span>{item.author}</span>}{publishedOn(item) && <span>{publishedOn(item)}</span>}</div>}
        </div>
        {!article && category !== "websites" && <div className={`discovery-tags${discussion ? " discussion-tags" : ""}`}>
          {["qa", "answers"].includes(category) && <SourceTag host={host} />}
          {paper && typeof item.peer_reviewed === "boolean" && <span className="discovery-tag paper-status-tag">{item.peer_reviewed ? <BadgeCheck size={15} /> : <FileText size={15} />}<span>{item.peer_reviewed ? "Peer reviewed" : "Preprint"}</span></span>}
          {paper && publishedOn(item) && <span className="discovery-tag paper-date-tag"><CalendarDays size={15} /><span>{publishedOn(item)}</span></span>}
          {!book && !article && !discussion && topic && topicTag(topic)}
          {discussion && tags.slice(0, topic ? 1 : 2).map(tag => topicTag(tag, "discussion-related-tag"))}
          {discussion && topic && topicTag(topic, "discussion-related-tag")}
          {discussion && !topic && tags.length < 2 && publishedOn(item) && <span className="discovery-tag discussion-date-tag"><CalendarDays size={15} aria-hidden="true" /><span>{publishedOn(item)}</span></span>}
          {["qa", "answers"].includes(category) && tags[0] && topicTag(tags[0], "discovery-detail-tag")}
          {discussion && onToggleDone && <button type="button" className="discovery-done" aria-pressed={!!done} onClick={() => onToggleDone(item)}><Check size={15} />{done ? "Read" : "Mark read"}</button>}
          {discussion && (preview ? <button type="button" className={`bookmark-btn${saved ? " saved" : ""}`} aria-label={saved ? "Remove bookmark" : "Save for later"} aria-pressed={saved} onClick={() => onToggleSave(item.url)}><svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 4h12v17l-6-4-6 4z" /></svg></button> : <BookmarkButton item={item} topic={topic} category={category} />)}
        </div>}
        {!discussion && <footer className={article || category === "websites" ? "discovery-meta-footer" : ""}>
          {(article || category === "websites") ? <div className="discovery-tags discovery-inline-tags">
            {topic && topicTag(topic)}
            {article && tags.slice(0, topic ? 1 : 2).map(tag => topicTag(tag, "discovery-detail-tag"))}
            {article && !tags.length && publishedOn(item) && <span className="discovery-tag discovery-detail-tag"><CalendarDays size={15} aria-hidden="true" /><span>{publishedOn(item)}</span></span>}
            {category === "websites" && tags[0] && topicTag(tags[0], "discovery-detail-tag")}
          </div> : <span>{paper || clean ? "" : effortOf(item, category) || formatSignal(item) || ""}</span>}
          <span className="discovery-footer-actions">
            {!book && !paper && !article && category !== "websites" && !["essays", "courses"].includes(category) && <span className="discovery-action">{ACTIONS[category] || "Open"}<ArrowUpRight size={17} /></span>}
            {onToggleDone && <button type="button" className="discovery-done" aria-pressed={!!done} onClick={() => onToggleDone(item)}><Check size={15} />{done ? "Read" : "Mark read"}</button>}
            {preview ? <button type="button" className={`bookmark-btn${saved ? " saved" : ""}`} aria-label={saved ? "Remove bookmark" : "Save for later"} aria-pressed={saved} onClick={() => onToggleSave(item.url)}><svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 4h12v17l-6-4-6 4z" /></svg></button> : <BookmarkButton item={item} topic={topic} category={category} />}
          </span>
        </footer>}
      </>}
    </div>
  </article>;
}

const FORMATS = [
  { id: "all", label: "All formats" },
  { id: "articles", label: "Articles", categories: ["articles"] },
  { id: "discussions", label: "Discussions", categories: ["discussions"] },
  { id: "videos", label: "YouTube", categories: ["videos"] },
  { id: "podcasts", label: "Podcasts", categories: ["podcasts"] },
  { id: "books", label: "Books", categories: ["books"] },
  { id: "papers", label: "Research papers", categories: ["papers"] },
  { id: "websites", label: "Websites", categories: ["websites"] },
];

export default function DiscoveryFeed({ items, preview = false, topic, category, filters = true, compact = false, limit, onVisit, doneUrls, onToggleDone }) {
  const [format, setFormat] = useState("all");
  const [previewBookmarks, setPreviewBookmarks] = useState(() => new Set());
  const togglePreviewBookmark = (url) => setPreviewBookmarks((previous) => {
    const next = new Set(previous);
    if (next.has(url)) next.delete(url); else next.add(url);
    return next;
  });
  const available = items.map(item => presentContent(item, { topic, category })).filter(Boolean);
  const selected = (filters && FORMATS.find((entry) => entry.id === format)) || FORMATS[0];
  const matching = available.filter((item) => !selected.categories || selected.categories.includes(item.category || "articles"));
  const visible = selected.id === "all" && Number.isInteger(limit) ? matching.slice(0, limit) : matching;
  const codeFeed = visible.length > 0 && visible.every((item) => item.category === "code");
  const uniform = visible.length > 0 && visible.every((item) => item.category === visible[0].category);
  const mixed = !compact && !uniform && selected.id === "all";
  const compactKinds = new Set(["websites", "books", "podcasts", "papers", "code"]);
  const spanFor = (item, index) => {
    if (!mixed) return 6;
    const pair = visible[index % 2 === 0 ? index + 1 : index - 1];
    if (!pair || compactKinds.has(item.category) === compactKinds.has(pair.category)) return 6;
    return compactKinds.has(item.category) ? 5 : 7;
  };
  return <div className={`discovery-feed${codeFeed ? " is-code-feed" : ""}`}>
    {filters && <div className="discovery-formats" role="group" aria-label="Filter discoveries by format">{FORMATS.map((entry) => {
      const count = entry.categories ? available.filter((item) => entry.categories.includes(item.category)).length : available.length;
      return <button key={entry.id} type="button" aria-pressed={selected.id === entry.id} disabled={count === 0} onClick={() => setFormat(entry.id)}>{entry.label}<span>{count}</span></button>;
    })}</div>}
    {filters && <span className="discovery-result-count" role="status">{visible.length < matching.length ? `${visible.length} of ${matching.length}` : matching.length} {matching.length === 1 ? "discovery" : "discoveries"}</span>}
    <div className={`discovery-grid${compact ? " is-compact" : ""}${uniform ? " is-uniform" : ""}${mixed ? " is-mixed" : ""}`}>{visible.map((item, index) => {
      return <DiscoveryCard key={item.url} item={item} compact={compact} onVisit={onVisit} done={doneUrls?.has(item.url)} onToggleDone={onToggleDone} preview={preview} saved={previewBookmarks.has(item.url)} onToggleSave={togglePreviewBookmark} span={spanFor(item, index)} />;
    })}</div>
  </div>;
}
