import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { apiFetch } from "../lib/api";
import { getProgress, subscribe, toggleDone } from "../lib/library";
import { presentContent } from "../lib/contentPresentation";
import { CATEGORY_ART, CATEGORY_LABELS } from "./categories";
import TopicIcon from "./TopicIcon";
import DiscoveryFeed from "./DiscoveryFeed";
import "./PrismFolder.css";

const STAGES = [{ id: "beginner", label: "Foundations" }, { id: "intermediate", label: "Go deeper" }, { id: "advanced", label: "At the frontier" }];
const number = value => String(value).padStart(2, "0");

function FolderSurface({ front = false }) {
  const id = useId().replace(/:/g, "");
  const shape = front
    ? "M38 154Q38 136 60 136H202Q223 136 237 123L264 100Q277 88 298 88H496Q522 88 522 116V333Q522 361 494 365L65 391Q38 393 38 365Z"
    : "M22 75Q22 47 50 44L177 27Q195 24 210 37L248 69Q258 78 274 76L479 48Q508 44 508 74V309Q508 339 480 343L51 379Q22 382 22 352Z";
  return <svg className={`pf-shell ${front ? "pf-shell-front" : "pf-shell-back"}`} viewBox="0 0 560 420" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-edge`} x1="45" y1="40" x2="485" y2="375" gradientUnits="userSpaceOnUse"><stop stopColor="#1c1e20"/><stop offset=".14" stopColor="#e7eaed"/><stop offset=".2" stopColor="#484d52"/><stop offset=".38" stopColor="#d6d9dc"/><stop offset=".47" stopColor="#121416"/><stop offset=".84" stopColor="#555b60"/><stop offset="1" stopColor="#101214"/></linearGradient>
      <linearGradient id={`${id}-face`} x1="200" y1="100" x2="350" y2="370" gradientUnits="userSpaceOnUse"><stop stopColor={front ? "#34383b" : "#1c1f21"}/><stop offset=".26" stopColor="#151719"/><stop offset=".68" stopColor="#08090a"/><stop offset="1" stopColor="#020303"/></linearGradient>
      <linearGradient id={`${id}-rim`} x1="150" y1="72" x2="240" y2="365" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset=".2" stopColor="#c5c9cd"/><stop offset=".31" stopColor="#454a50"/><stop offset=".64" stopColor="#0b0c0d"/><stop offset="1" stopColor="#52585d"/></linearGradient>
    </defs>
    <path d={shape} transform="translate(7 9)" fill="#050606" stroke="#282c2f" strokeWidth="8"/>
    <path d={shape} fill={`url(#${id}-face)`} stroke={`url(#${id}-edge)`} strokeWidth="10"/>
    <path d={shape} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2"/>
    {front && <path d="M56 156H204Q227 156 249 136L273 114Q283 105 301 105H494" stroke="#fff" strokeOpacity=".46" strokeWidth="1.5" strokeLinecap="round"/>}
  </svg>;
}

const FolderObject = forwardRef(function FolderObject({ bundle, items, expanded, onToggle, order, busy }, ref) {
  const presented = items.map(item => presentContent(item)).filter(Boolean);
  const formats = [...new Set(presented.map(item => item.category))];
  const preferred = ["articles", "videos", "books", "papers", "code", "websites", "courses"];
  const ordered = [...preferred.filter(category => formats.includes(category)), ...formats.filter(category => !preferred.includes(category))];
  const previewItems = ordered.slice(0, 4).map(category => presented.find(item => item.category === category));
  return <button ref={ref} type="button" className={`pf-folder-button${expanded ? " is-open" : ""}`} onClick={onToggle} aria-label={`${expanded ? "Close" : "Open"} ${bundle.title}`} aria-expanded={expanded} aria-controls="prism-folder-contents">
    <span className="pf-floor" aria-hidden="true"/>
    <span className="pf-object" aria-hidden="true">
      <FolderSurface />
      <span className="pf-sheets">{previewItems.length ? previewItems.map((item, index) => <span key={item.url} className={`pf-sheet pf-sheet-${item.category}`} style={{ "--sheet": index, "--fan": index - (previewItems.length - 1) / 2 }}>
        <span className="pf-sheet-masthead"><img src={CATEGORY_ART[item.category] || CATEGORY_ART.articles} alt=""/><span>{CATEGORY_LABELS[item.category] || "Course"}</span><span>{number(index + 1)}</span></span>
        {item.category === "videos" && <span className="pf-sheet-video">{item.thumbnail && <img src={item.thumbnail} alt="" loading="lazy"/>}<Play size={23} fill="currentColor"/></span>}
        <strong>{item.title}</strong><span className="pf-sheet-rule"/><small>{STAGES.find(stage => stage.id === item.depth_level)?.label || "In this Prism"}</small>
      </span>) : <span className="pf-sheet pf-sheet-placeholder" style={{ "--sheet": 1 }}><span>{busy ? "Loading contents…" : "Curated collection"}</span><strong>{bundle.topic}</strong></span>}</span>
      <span className="pf-front"><FolderSurface front/>
        <span className="pf-folder-label"><TopicIcon topic={bundle.topic}/><span><small>PRISM {number(order + 1)}</small><strong>{bundle.topic}</strong></span></span>
        <span className="pf-folder-details"><span>{busy ? "Gathering contents" : `${items.length} resources${bundle.curation === "ai" ? " · AI-selected" : ""}`}</span><span className="pf-format-marks">{ordered.slice(0, 5).map(category => <img key={category} src={CATEGORY_ART[category] || CATEGORY_ART.articles} alt=""/>)}</span></span>
      </span>
    </span>
  </button>;
});

export default function PrismFolder({ bundles, preview = false }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState("all");
  const [cache, setCache] = useState({});
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [transition, setTransition] = useState(null);
  const [, setRevision] = useState(0);
  const contentRef = useRef(null);
  const openRef = useRef(null);
  const switchTimers = useRef([]);
  const swipeStart = useRef(null);
  const didSwipe = useRef(false);
  const showcaseRef = useRef(null);
  const navigationLocked = useRef(false);
  const wheelGesture = useRef({ last: 0, total: 0, used: false });
  const bundle = bundles[index] || bundles[0];
  const detail = bundle?.items ? bundle : cache[bundle?.id];
  const busy = !!bundle && !detail && error !== bundle.id;
  const items = detail?.items || [];
  const stages = detail?.stages?.length ? detail.stages : STAGES.map(entry => ({ ...entry, items: items.filter(item => item.depth_level === entry.id) }));
  const key = `prism:${preview ? "folder-preview:" : ""}${bundle?.id}`;
  const done = new Set(getProgress(key));
  useEffect(() => subscribe(() => setRevision(value => value + 1)), []);
  useEffect(() => () => switchTimers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!bundle || detail || preview) return undefined;
    const controller = new AbortController();
    apiFetch(`/api/bundles/${bundle.id}`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error("Unable to load Prism");
      return response.json();
    }).then(value => { if (!controller.signal.aborted) setCache(previous => ({ ...previous, [bundle.id]: value })); })
      .catch(() => { if (!controller.signal.aborted) setError(bundle.id); });
    return () => controller.abort();
  }, [bundle, detail, preview, retry]);
  function choose(next, requestedDirection) {
    if (navigationLocked.current || bundles.length < 2) return;
    const target = (next + bundles.length) % bundles.length;
    if (target === index) return;
    const direction = requestedDirection || (target > index ? "next" : "previous");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndex(target); setExpanded(false); setStage("all"); setError(null);
      return;
    }
    navigationLocked.current = true;
    setTransition({ direction, phase: "out" });
    switchTimers.current.forEach(clearTimeout);
    switchTimers.current = [setTimeout(() => {
      setIndex(target); setExpanded(false); setStage("all"); setError(null);
      setTransition({ direction, phase: "in" });
      switchTimers.current = [setTimeout(() => {setTransition(null); navigationLocked.current = false;}, 660)];
    }, 260)];
  }
  // Consume one vertical wheel gesture, including its trackpad momentum, per Prism.
  useEffect(() => {
    const element = showcaseRef.current;
    if (!element || expanded) return undefined;
    function onWheel(event) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = performance.now();
      const gesture = wheelGesture.current;
      if (now - gesture.last > 220) {gesture.total = 0; gesture.used = false;}
      gesture.last = now;
      if (gesture.used || navigationLocked.current) return;
      gesture.total += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
      if (Math.abs(gesture.total) < 45) return;
      gesture.used = true;
      choose(index + (gesture.total > 0 ? 1 : -1), gesture.total > 0 ? "next" : "previous");
    }
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  });
  function closeCollection() {
    setExpanded(false);
    requestAnimationFrame(() => {
      openRef.current?.focus({ preventScroll: true });
      showcaseRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    });
  }
  function toggle() {
    if (didSwipe.current) { didSwipe.current = false; return; }
    if (navigationLocked.current) return;
    if (expanded) closeCollection();
    else setExpanded(true);
  }
  useEffect(() => {
    if (!expanded) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      contentRef.current?.focus({ preventScroll: true });
      contentRef.current?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
    }, reducedMotion ? 0 : 850);
    return () => clearTimeout(timer);
  }, [expanded]);
  if (!bundle) return <main className="page pf-empty"><h1>Your next perspective is on its way.</h1><p>No Prisms are available yet. Check back soon.</p></main>;
  const shown = stage === "all" ? items : stages.find(entry => entry.id === stage)?.items || [];
  const motionClass = transition ? ` is-${transition.phase}-${transition.direction}` : "";
  return <main className={`page page-wide pf-page${expanded ? " pf-expanded" : ""}`}>
    <section ref={showcaseRef} className="pf-showcase" aria-label="Prisms. Swipe up or down, scroll, or use the up and down arrow keys to browse." onKeyDown={event => {
      if (expanded) return;
      if (event.key === "ArrowDown") {event.preventDefault(); choose(index + 1, "next");}
      if (event.key === "ArrowUp") {event.preventDefault(); choose(index - 1, "previous");}
    }} onPointerDown={event => {
      if (expanded || event.button !== 0) return;
      swipeStart.current = { x: event.clientX, y: event.clientY };
      didSwipe.current = false;
    }}
      onPointerMove={event => {
        if (!swipeStart.current) return;
        const dy = event.clientY - swipeStart.current.y;
        if (Math.abs(dy) > 10) {didSwipe.current = true; event.currentTarget.setPointerCapture?.(event.pointerId);}
      }}
      onPointerCancel={() => {swipeStart.current = null; didSwipe.current = false;}}
      onPointerUp={event => {
        if (!swipeStart.current) return;
        const dx = event.clientX - swipeStart.current.x;
        const dy = event.clientY - swipeStart.current.y;
        swipeStart.current = null;
        if (Math.abs(dy) > 48 && Math.abs(dy) > Math.abs(dx) * 1.15) {
          didSwipe.current = true; event.preventDefault();
          choose(index + (dy < 0 ? 1 : -1), dy < 0 ? "next" : "previous");
        }
      }} tabIndex={0}>
      <div className={`pf-focus-frame${motionClass}`}>
        <div className="pf-stage" key={`folder-${bundle.id}`}>
          <FolderObject ref={openRef} bundle={bundle} items={items} order={index} expanded={expanded} onToggle={toggle} busy={busy}/>
        </div>
      </div>
      <span className="pf-position" aria-live="polite" aria-atomic="true"><span className="pf-sr-only">{bundle.title}, Prism </span>{number(index + 1)}<span> / {number(bundles.length)}</span></span>
      <div className="pf-swipe-cue" aria-hidden="true"><span><i/></span><small>Scroll to explore</small></div>
    </section>
    <section id="prism-folder-contents" className={`pf-contents${expanded ? " is-visible" : ""}`} hidden={!expanded} aria-labelledby="pf-contents-heading" onKeyDown={event => {if(event.key === "Escape") closeCollection();}}>
      {expanded && <>
      <header><h2 id="pf-contents-heading" ref={contentRef} tabIndex={-1}><em>{bundle.topic}.</em></h2><button className="pf-close" aria-label="Close collection" onClick={closeCollection}><X size={20}/></button></header>
      {busy ? <p className="pf-feedback" role="status">Loading this collection…</p> : error === bundle.id ? <div className="pf-feedback" role="alert"><p>We couldn’t load this Prism.</p><button onClick={() => {setError(null);setRetry(value => value + 1);}}>Try again</button></div> : <>
        {detail?.curation === "ai" && <p className="pf-feedback">AI-selected from source excerpts · not human-verified</p>}
        <div className="pf-depths" role="group" aria-label="Filter contents by stage"><button aria-pressed={stage === "all"} onClick={() => setStage("all")}>The whole path <span>{items.length}</span></button>{stages.map(entry => <button key={entry.id} aria-pressed={stage === entry.id} onClick={() => setStage(entry.id)}>{entry.label}<span>{entry.items.length}</span></button>)}</div>
        {shown.length ? <div className="pf-emerging-content" key={`${bundle.id}-${stage}`}><DiscoveryFeed items={shown} topic={bundle.topic} filters={false} preview={preview} doneUrls={done} onToggleDone={item => toggleDone(key, item.url)}/></div> : <p className="pf-feedback">No resources in this stage yet.</p>}
      </>}
      </>}
    </section>
  </main>;
}
