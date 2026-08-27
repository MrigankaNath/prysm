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
function TopicIcon({ topic, color, icon: fixed, className = "" }) {
  const [icon, setIcon] = useState(() => fixed || conceptIcon(topic));
  // Each topic keeps its own band of the spectrum unless a caller overrides it.
  const base = color || topicColor(topic);
  /* The glyph sits on a plate of its own hue, so it is lifted well clear of it
     rather than tinted the same value and disappearing into the background. */
  const tint = lighten(base);

  useEffect(() => {
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
      <img src={iconUrl(icon, tint)} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

export default TopicIcon;
