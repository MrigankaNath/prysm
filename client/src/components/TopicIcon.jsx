import { useState, useEffect } from "react";
import { conceptIcon, iconUrl, resolveTopicIcon } from "../lib/topicIcon";

/**
 * An icon for a topic, served by Iconify.
 *
 * Renders the concept match immediately and only swaps if the async lookup
 * finds something better, so there is never an empty slot waiting on the
 * network — and if Iconify is unreachable the icon is simply the concept one.
 */
function TopicIcon({ topic, color = "#a1a1aa", className = "" }) {
  const [icon, setIcon] = useState(() => conceptIcon(topic));

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
    <span className={`topic-icon ${className}`.trim()} aria-hidden="true">
      <img src={iconUrl(icon, color)} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

export default TopicIcon;
