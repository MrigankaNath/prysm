import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play, Globe, Star, GitFork, Check, Headphones } from "lucide-react";
import { BookmarkButton } from "./ResultCard";
import { CATEGORY_LABELS } from "./categories";
import { BookVisual } from "./BookCard";
import TopicIcon from "./TopicIcon";
import { recordVisit } from "../lib/library";
import { hostOf, effortOf, formatSignal, publishedOn, venueChip } from "../lib/result";
import { topicColor, lighten } from "../lib/topicIcon";
import { presentContent } from "../lib/contentPresentation";
import "./DiscoveryFeed.css";

const ACTIONS = { courses: "View course", articles: "Read article", essays: "Read essay", videos: "Watch video", podcasts: "Listen to show", papers: "Read paper", code: "Explore repository", books: "Explore book", discussions: "Join discussion", community: "Join discussion", websites: "Visit website", qa: "Read answer", answers: "Read answer" };
const BRANDS = { "youtube.com": "YouTube", "youtu.be": "YouTube", "github.com": "GitHub", "arxiv.org": "arXiv", "podcasts.apple.com": "Apple Podcasts", "reddit.com": "Reddit", "en.wikipedia.org": "Wikipedia", "news.ycombinator.com": "Hacker News" };

function SourceTag({ host }) {
  const [broken, setBroken] = useState(false);
  return <span className="discovery-tag discovery-source">
    {!broken && host ? <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`} alt="" onError={() => setBroken(true)} /> : <Globe size={16} />}
    <span>{BRANDS[host] || host || "Web"}</span>
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
    <PublisherMark host={host} />
    <div className="discovery-site-address"><span>Website</span><p>{host}</p></div>
    <svg className="discovery-site-globe" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle className="discovery-globe-rim" cx="40" cy="40" r="33" /><ellipse cx="40" cy="40" rx="15" ry="33" />
      <path d="M7 40h66M12 23h56M12 57h56M40 7v66" />
    </svg>
  </div>;
}

function updatedLabel(value) {
  const stamp = new Date(value).valueOf();
  if (!value || !Number.isFinite(stamp)) return null;
  const days = Math.max(0, Math.floor((Date.now() - stamp) / 86400000));
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return days < 30 ? `Updated ${days} days ago` : `Updated ${new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}
const count = (value) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const LANGUAGE_COLORS = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572a5", Rust: "#dea584", Go: "#00add8", Ruby: "#701516", Java: "#b07219", "C++": "#f34b7d" };

function CodeRepository({ item, title, topic, updated, preview, saved, onToggleSave, onVisit, done, onToggleDone }) {
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
        <ArrowUpRight className="discovery-open-indicator" size={20} aria-hidden="true" />
      </div>
      {item.snippet && <p className="discovery-description">{item.snippet}</p>}
      <div className="repo-output" aria-label="Repository details">
        {typeof item.signal === "number" && <span title={`${item.signal.toLocaleString()} stars`}><Star size={15} /><small>stars</small><strong>{count(item.signal)}</strong></span>}
        {typeof item.forks === "number" && <span title={`${item.forks.toLocaleString()} forks`}><GitFork size={15} /><small>forks</small><strong>{count(item.forks)}</strong></span>}
        {item.language && <span><i className="discovery-language-dot" style={{ background: LANGUAGE_COLORS[item.language] || "#aaa" }} /><small>language</small><strong>{item.language}</strong></span>}
      </div>
      <div className="repo-meta-line"><span aria-hidden="true">✓</span><span>{updated || "Repository available on GitHub"}</span></div>
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
  const category = item.category;
  const topic = item.topic || "";
  const band = topicColor(topic);
  const venue = venueChip(item);
  const effort = category === "videos" ? formatSignal(item) : effortOf(item, category) || formatSignal(item);
  const action = ACTIONS[category] || "Read article";
  const book = category === "books";
  const clean = category === "code" || category === "websites";
  const host = hostOf(item.url);
  const title = category === "code" && host === "github.com" ? new URL(item.url).pathname.replace(/^\/|\/$/g, "") : item.title;
  const updated = updatedLabel(item.updated_at);
  const editorial = ["articles", "essays"].includes(category);
  const normalizeTag = (value) => value.toLowerCase().replace(/[\s_-]+/g, " ").trim();
  const questionTag = ["qa", "answers"].includes(category) && Array.isArray(item.tags)
    ? item.tags.find((tag) => typeof tag === "string" && tag.trim() && tag.length <= 40 && normalizeTag(tag) !== normalizeTag(topic))
    : null;

  return <article className={`discovery-card discovery-${category}${compact ? " is-compact" : ""}`} {...light} style={{ "--band": band, "--band-lit": lighten(band, 0.45), "--card-span": span }}>
    <div className="discovery-content">
      {category === "code" ? <CodeRepository item={item} title={title} topic={topic} updated={updated} preview={preview} saved={saved} onToggleSave={onToggleSave} onVisit={onVisit} done={done} onToggleDone={onToggleDone} /> : <>
      {!clean && <CategoryIdentity item={item} category={category} />}
      {category === "websites" && <WebsiteIdentity host={host} />}
      <div className="discovery-summary">
      {!clean && <div className="discovery-eyebrow"><span>{CATEGORY_LABELS[category] || (category === "courses" ? "Courses" : "Articles")}</span></div>}
      <div className={clean || book ? "discovery-clean-heading" : "discovery-heading"}><h4><a aria-label={book ? `Open book: ${title}` : undefined} href={item.url} target="_blank" rel="noopener noreferrer" onClick={() => { if (!preview) recordVisit(item, { topic, category }); onVisit?.(); }}>{title}</a></h4>{(category === "code" || book) && <ArrowUpRight className="discovery-open-indicator" size={20} aria-hidden="true" />}</div>
      {item.snippet && category === "papers" && <span className="discovery-abstract-label">Abstract</span>}
      {!book && item.snippet && <p className="discovery-description">{item.snippet}</p>}
      {!clean && <div className="discovery-details">{item.author && !editorial && <span>{item.author}</span>}{publishedOn(item) && <span>{publishedOn(item)}</span>}{book && !publishedOn(item) && item.year && <span>{item.year}</span>}{book && item.access && <span className="discovery-book-access">{({ free: "Free to read", borrow: "Borrow free", buy: "Buy book" })[item.access]}</span>}{venue && <span className={`discovery-venue${venue.reviewed ? " is-reviewed" : ""}`}>{venue.reviewed ? "Peer reviewed" : "Preprint"}</span>}</div>}
      </div>
      <div className="discovery-tags">
        {["videos", "podcasts", "qa", "answers"].includes(category) && <SourceTag host={host} />}
        {!clean && !book && topic && <Link className="discovery-tag discovery-topic" onClick={onVisit} to={`/explore/${encodeURIComponent(topic)}`}><TopicIcon topic={topic} /><span>{topic}</span></Link>}
        {category === "websites" && topic && <Link className="discovery-tag discovery-topic" onClick={onVisit} to={`/explore/${encodeURIComponent(topic)}`}><TopicIcon topic={topic} /><span>{topic}</span></Link>}
        {questionTag && <Link className="discovery-tag discovery-topic discovery-detail-tag" title="Question topic" onClick={onVisit} to={`/explore/${encodeURIComponent(questionTag.replace(/-/g, " "))}`}><span aria-hidden="true">#</span><span>{questionTag.replace(/-/g, " ")}</span></Link>}
      </div>
      <footer><span>{category === "code" ? updated || "" : clean ? "" : effort || ""}</span><span className="discovery-footer-actions">{!book && category !== "code" && <span className={`discovery-action${category === "websites" ? " discovery-site-action" : ""}`}>{action}<ArrowUpRight size={17} /></span>}        {onToggleDone && <button type="button" className="discovery-done" aria-pressed={!!done} onClick={() => onToggleDone(item)}><Check size={15} />{done ? "Read" : "Mark read"}</button>}{preview ? <button className={`bookmark-btn${saved ? " saved" : ""}`} aria-label={saved ? "Remove preview bookmark" : "Save preview item"} aria-pressed={saved} onClick={() => onToggleSave(item.url)}><svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 4h12v17l-6-4-6 4z" /></svg></button> : <BookmarkButton item={item} topic={topic} category={category} />}</span></footer>
      </>}
    </div>

  </article>;
}

const FORMATS = [
  { id: "all", label: "All formats" },
  { id: "reading", label: "Read", categories: ["articles", "essays"] },
  { id: "websites", label: "Websites", categories: ["websites"] },
  { id: "videos", label: "Watch", categories: ["videos"] },
  { id: "podcasts", label: "Listen", categories: ["podcasts"] },
  { id: "courses", label: "Courses", categories: ["courses"] },
  { id: "books", label: "Books", categories: ["books"] },
  { id: "papers", label: "Research", categories: ["papers"] },
  { id: "code", label: "Code", categories: ["code"] },
  { id: "discussion", label: "Discuss", categories: ["discussions", "community", "qa", "answers"] },
];

export default function DiscoveryFeed({ items, preview = false, topic, category, filters = true, compact = false, onVisit, doneUrls, onToggleDone }) {
  const [format, setFormat] = useState("all");
  const [previewBookmarks, setPreviewBookmarks] = useState(() => new Set());
  const togglePreviewBookmark = (url) => setPreviewBookmarks((previous) => {
    const next = new Set(previous);
    if (next.has(url)) next.delete(url); else next.add(url);
    return next;
  });
  const available = items.map(item => presentContent(item, { topic, category })).filter(Boolean);
  const formats = FORMATS.filter((entry) => !entry.categories || available.some((item) => entry.categories.includes(item.category || "articles")));
  const selected = (filters && formats.find((entry) => entry.id === format)) || FORMATS[0];
  const visible = available.filter((item) => !selected.categories || selected.categories.includes(item.category || "articles"));
  const codeFeed = visible.length > 0 && visible.every((item) => item.category === "code");
  return <div className={`discovery-feed${codeFeed ? " is-code-feed" : ""}`}>
    {filters && formats.length > 2 && <div className="discovery-formats" role="group" aria-label="Filter discoveries by format">{formats.map((entry) => <button key={entry.id} type="button" aria-pressed={selected.id === entry.id} onClick={() => setFormat(entry.id)}>{entry.label}</button>)}</div>}
    {filters && formats.length > 2 && <span className="discovery-result-count" role="status">{visible.length} {visible.length === 1 ? "discovery" : "discoveries"}</span>}
    <div className={`discovery-grid${compact ? " is-compact" : ""}`}>{visible.map((item, index) => {
      // Keep source and keyboard order; allocate width to the visual medium in each pair.
      const first = visible[index - index % 2];
      const second = visible[index - index % 2 + 1];
      const isVisual = (entry) => ["books", "videos"].includes(entry?.category);
      const firstSpan = first.category === second?.category ? 6 : isVisual(first) ? 7 : isVisual(second) || first.category === "papers" ? 5 : Math.floor(index / 2) % 2 ? 7 : 5;
      return <DiscoveryCard key={item.url} item={item} compact={compact} onVisit={onVisit} done={doneUrls?.has(item.url)} onToggleDone={onToggleDone} preview={preview} saved={previewBookmarks.has(item.url)} onToggleSave={togglePreviewBookmark} span={index % 2 ? 12 - firstSpan : firstSpan} />;
    })}</div>
  </div>;
}
