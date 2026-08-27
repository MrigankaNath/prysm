import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiJson } from "../lib/api";
import { IconPrism, IconChevronRight } from "../components/Icons";
import TopicIcon from "../components/TopicIcon";

/* One band of the spectrum per Prism. */
const BANDS = [
  ["#3b82f6", "#22d3ee"],
  ["#8b5cf6", "#c084fc"],
  ["#ec4899", "#fb7185"],
  ["#f59e0b", "#fbbf24"],
  ["#10b981", "#34d399"],
  ["#06b6d4", "#67e8f9"],
];

/* Two either side are mounted, though the CSS fades everything past one to
   nothing. The buffer is the point: with only the visible three in the DOM, a
   card entered on its final transform with no transition to run and simply
   popped into place — worst going backwards, where the arriving card is the
   one you are looking at. */
const VISIBLE_REACH = 2;
// How far you have to drag, as a fraction of one card step, before release
// advances instead of springing back.
const COMMIT = 0.22;

function PrismCard({ bundle, band, offset, active, onFocus, onOpen }) {
  return (
    <article
      className={`pdeck-card${active ? " active" : ""}`}
      style={{ "--from": band[0], "--to": band[1], "--o": offset }}
      aria-hidden={!active}
    >
      <button
        type="button"
        className="pdeck-hit"
        onClick={() => (active ? onOpen() : onFocus())}
        tabIndex={active ? 0 : -1}
      >
        <span className="pdeck-visual">
          {/*  ILLUSTRATION SLOT — one per Prism, ~300x170.
              Replace this span's contents; the gradient behind stays as
              backing so an empty slot still looks deliberate.  */}
          <span className="pdeck-illo">
            {/* White rather than the topic's own band: the tile already sits
                on a saturated gradient, so a second hue would fight it. */}
            <TopicIcon
              topic={bundle.topic}
              color="#ffffff"
              className="topic-icon-bare"
            />
          </span>
        </span>

        <span className="pdeck-body">
          <span className="pdeck-topic">{bundle.topic}</span>
          <span className="pdeck-title">{bundle.title}</span>
          {bundle.description && (
            <span className="pdeck-desc">
              {bundle.description.replace(/^\[curated\]\s*/, "")}
            </span>
          )}
          <span className="pdeck-go">
            Start the path <IconChevronRight />
          </span>
        </span>
      </button>
    </article>
  );
}

function Prisms({ session }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0); // fractional offset while swiping
  const [dragging, setDragging] = useState(false);
  /* The live drag value is also kept in a ref. The release handler needs to
     read it and then change the index — doing that inside a setDrag updater
     makes the updater impure, and React invokes those twice in StrictMode,
     which advanced the deck by two cards per swipe. */
  const dragRef = useRef(0);
  const navigate = useNavigate();
  const deckRef = useRef(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      apiJson("/api/bundles", []),
      session ? apiJson("/api/bundles/recommended", []) : Promise.resolve([]),
    ])
      .then(([everything, recommended]) => {
        if (!live) return;
        const list = Array.isArray(everything) ? everything : [];
        const top = new Set((recommended || []).map((b) => b.id));
        setAll([
          ...list.filter((b) => top.has(b.id)),
          ...list.filter((b) => !top.has(b.id)),
        ]);
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [session]);

  const count = all.length;
  const clamp = useCallback(
    (i) => Math.min(count - 1, Math.max(0, i)),
    [count],
  );
  const go = useCallback((d) => setIndex((i) => clamp(i + d)), [clamp]);

  /** One card step in px — read from CSS so the drag maths and the layout
   *  can never disagree about how far a card travels. */
  const step = () => {
    const el = deckRef.current;
    if (!el) return 300;
    const raw = getComputedStyle(el).getPropertyValue("--step");
    return parseFloat(raw) || 300;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Enter" && all[index]) navigate(`/prisms/${all[index].id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, all, index, navigate]);

  /* Pointer drag: the deck tracks the finger 1:1, then settles to the nearest
     card on release. Rubber-banding at the ends signals the edge instead of
     just refusing to move. */
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;

    let startX = 0;
    let active = false;
    let moved = 0;

    const down = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      /* The arrows live inside the deck, so without this a click on one starts
         a drag instead — and the pointer capture below used to redirect the
         pointer to the deck, so the button never got its click at all. */
      if (e.target.closest?.(".pdeck-nav")) return;

      active = true;
      moved = 0;
      startX = e.clientX;
      setDragging(true);
      /* Deliberately no setPointerCapture: move/up are bound to the window,
         which already handles the pointer leaving the deck, and capturing
         swallows clicks on anything inside. */
    };

    const move = (e) => {
      if (!active) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      let d = -dx / step();
      // Resist past the first and last card rather than sliding into nothing.
      const next = index + d;
      if (next < 0 || next > count - 1) d *= 0.32;
      const clamped = Math.max(-1, Math.min(1, d));
      dragRef.current = clamped;
      setDrag(clamped);
    };

    const up = () => {
      if (!active) return;
      active = false;
      setDragging(false);

      const d = dragRef.current;
      dragRef.current = 0;
      setDrag(0);
      if (Math.abs(d) > COMMIT) setIndex((i) => clamp(i + (d > 0 ? 1 : -1)));
      // Swallow the click that follows a real drag, so releasing over a card
      // doesn't also open it.
      if (moved > 6) {
        const swallow = (ev) => ev.stopPropagation();
        el.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(
          () => el.removeEventListener("click", swallow, { capture: true }),
          0,
        );
      }
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    // A pointerup that never arrives (tab switch, dropped event) would leave
    // the deck stuck mid-drag with transitions disabled.
    window.addEventListener("blur", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
    };
  }, [index, count, clamp]);

  /* Trackpad. Two things the first version got wrong: it ignored any swipe
     whose vertical drift exceeded its horizontal travel — which is most real
     two-finger swipes — and it hard-locked after one advance until the gesture
     went idle, so a long swipe moved a single card. */
  const STEP_DELTA = 42;

  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    let acc = 0;
    let idle;

    const onWheel = (e) => {
      // Horizontal intent, generously: a swipe that drifts is still a swipe.
      if (Math.abs(e.deltaX) < 2 || Math.abs(e.deltaX) * 1.6 < Math.abs(e.deltaY)) {
        return;
      }
      e.preventDefault();
      clearTimeout(idle);
      idle = setTimeout(() => {
        acc = 0;
      }, 160);

      acc += e.deltaX;
      // Subtract rather than reset, so a long swipe keeps advancing.
      while (Math.abs(acc) >= STEP_DELTA) {
        go(acc > 0 ? 1 : -1);
        acc -= Math.sign(acc) * STEP_DELTA;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(idle);
    };
  }, [go]);

  return (
    <div className="prisms-stage">
      {loading && (
        <div className="pdeck pdeck-skeleton" aria-hidden="true">
          <div className="pdeck-ghost" />
        </div>
      )}

      {!loading && count === 0 && (
        <p className="wl-empty">
          No Prisms yet.{" "}
          <Link to="/spectrum" className="inline-link">
            Explore live topics
          </Link>{" "}
          in the meantime.
        </p>
      )}

      {count > 0 && (
        <>
          <div
            className={`pdeck${dragging ? " dragging" : ""}`}
            ref={deckRef}
            style={{ "--drag": drag }}
          >
            {all.map((bundle, i) => {
              const offset = i - index;
              // Rendering only the neighbours keeps the stage uncluttered and
              // the compositor cheap; the rest never reach the DOM.
              if (Math.abs(offset - drag) > VISIBLE_REACH + 0.5) return null;
              return (
                <PrismCard
                  key={bundle.id}
                  bundle={bundle}
                  band={BANDS[i % BANDS.length]}
                  offset={offset}
                  active={i === index}
                  onFocus={() => setIndex(i)}
                  onOpen={() => navigate(`/prisms/${bundle.id}`)}
                />
              );
            })}

            <button
              type="button"
              className="pdeck-nav prev"
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Previous Prism"
            >
              <IconChevronRight />
            </button>
            <button
              type="button"
              className="pdeck-nav next"
              onClick={() => go(1)}
              disabled={index === count - 1}
              aria-label="Next Prism"
            >
              <IconChevronRight />
            </button>
          </div>

          <div className="pdeck-foot">
            <span className="prism-eyebrow pdeck-mark">
              <IconPrism className="prism-eyebrow-icon" />
              Prisms
            </span>

            <div className="pdeck-dots">
              {all.map((bundle, i) => (
                <button
                  key={bundle.id}
                  type="button"
                  aria-label={bundle.title}
                  aria-current={i === index}
                  className={`pdeck-dot${i === index ? " active" : ""}`}
                  style={{ "--from": BANDS[i % BANDS.length][0] }}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <span className="pdeck-counter">
              {String(index + 1).padStart(2, "0")}
              <span className="pdeck-counter-sep">/</span>
              {String(count).padStart(2, "0")}
            </span>
          </div>

        </>
      )}
    </div>
  );
}

export default Prisms;
