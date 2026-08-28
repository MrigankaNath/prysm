import { useState, useEffect } from "react";
import {
  conceptIcon,
  iconUrl,
  isBrandIcon,
  lighten,
  resolveTopicIcon,
  topicColor,
} from "../lib/topicIcon";

/**
 * An icon for a topic, served by Iconify.
 *
 * Renders the concept match immediately and only swaps if the async lookup
 * finds something better, so there is never an empty slot waiting on the
 * network — and if Iconify is unreachable the icon is simply the concept one.
 */
/* Last resort. Every topic has a concept match, but a resolved brand icon can
   404 — Iconify's search indexes names that its own API doesn't always serve,
   and a cached id from an earlier session can go stale. Without a handler the
   browser draws its broken-image glyph, which looks like the app is broken
   rather than like an icon is missing. */
const FALLBACK_ICON = "ph:compass-bold";

function TopicIcon({ topic, color, icon: fixed, className = "" }) {
  const [icon, setIcon] = useState(() => fixed || conceptIcon(topic));
  const [failed, setFailed] = useState(false);
  // Each topic keeps its own band of the spectrum unless a caller overrides it.
  const base = color || topicColor(topic);
  /* The glyph sits on a plate of its own hue, so it is lifted well clear of it
     rather than tinted the same value and disappearing into the background.
     0.8 rather than the default 0.62: at 62% the warm bands produced a glyph
     close enough in value to the plate's own radial highlight that it read as
     an empty tile at the sizes it is actually drawn. */
  const tint = lighten(base, 0.8);

  useEffect(() => {
    setFailed(false);
    if (fixed) {
      setIcon(fixed);
      return undefined;
    }
    let live = true;
    setIcon(conceptIcon(topic));
    resolveTopicIcon(topic).then((resolved) => {
      if (live && resolved) setIcon(resolved);
    });
    return () => {
      live = false;
    };
  }, [topic, fixed]);

  return (
    <span
      className={`topic-icon${isBrandIcon(icon) ? " is-brand" : ""} ${className}`.trim()}
      style={{ "--tint": base }}
      aria-hidden="true"
    >
      {/* Same feTurbulence grain the auth card uses, so the texture reads as
          one system rather than a one-off. */}
      <span className="topic-icon-grain" aria-hidden="true" />
      <img
        src={iconUrl(failed ? FALLBACK_ICON : icon, tint)}
        alt=""
        loading="lazy"
        decoding="async"
        /* Step down once — to the concept glyph if a resolved logo failed,
           then to the compass — rather than looping on a URL that won't load. */
        onError={() => {
          if (failed) return;
          const concept = conceptIcon(topic);
          if (icon !== concept) setIcon(concept);
          else setFailed(true);
        }}
      />
    </span>
  );
}

export default TopicIcon;
