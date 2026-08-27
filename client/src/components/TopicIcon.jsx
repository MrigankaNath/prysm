import { useState, useEffect } from "react";
import {
  conceptIcon,
  iconUrl,
  isBrandIcon,
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
function TopicIcon({ topic, color, className = "" }) {
  const [icon, setIcon] = useState(() => conceptIcon(topic));
  // Each topic keeps its own band of the spectrum unless a caller overrides it.
  const tint = color || topicColor(topic);

  useEffect(() => {
    let live = true;
    setIcon(conceptIcon(topic));
    resolveTopicIcon(topic).then((resolved) => {
      if (live && resolved) setIcon(resolved);
    });
    return () => {
      live = false;
    };
  }, [topic]);

  return (
    <span
      className={`topic-icon${isBrandIcon(icon) ? " is-brand" : ""} ${className}`.trim()}
      style={{ "--tint": tint }}
      aria-hidden="true"
    >
      <img src={iconUrl(icon, tint)} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

export default TopicIcon;
