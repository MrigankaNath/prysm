import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, MessageSquare, Newspaper, HelpCircle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "@/components/ResultCard";
import { recordVisit } from "@/lib/library";
import { hostOf, formatSignal } from "@/lib/result";
import { provenanceOf } from "@/lib/provenance";

/* Articles, discussions, Q&A and websites — the lanes that are text and a link.
 *
 * Adapted from a glass blog card, which leads with an image. None of these
 * lanes have one: Tavily returns a snippet, Hacker News a thread, Stack
 * Exchange a question. So the card leads on what it actually has — the source
 * it came from, the claim it makes, and how many people engaged with it — and
 * keeps the glass, the badge row and the ruled footer that made the original
 * read as a considered object rather than a list item.
 */
const KIND = {
  articles: { Icon: Newspaper, label: "Article" },
  discussions: { Icon: MessageSquare, label: "Discussion" },
  qa: { Icon: HelpCircle, label: "Question" },
  websites: { Icon: Globe, label: "Website" },
};

/* The conversation adapters put their engagement line in `snippet` ("784
   points, 237 comments"), which the footer already states properly. A snippet
   that is only those numbers is dropped rather than printed twice. */
const NUMERIC_ONLY =
  /^[\d\s,.·k+]*(points?|comments?|votes?|answers?|accepted)[\s\S]{0,40}$/i;

export function ResultTile({ item, topic, category, index = 0, className }) {
  /* Results are the content, not decoration. Fading them in from zero means
     they are invisible until JS has run and rAF has ticked — so anyone who has
     asked for less motion gets them immediately and in full, rather than a
     shorter version of the same wait. */
  const still = useReducedMotion();
  const { Icon, label } = KIND[category] || KIND.articles;
  /* The site's own mark, where the lane carries one. It is as close to a
     preview as this is worth: measured on the sites this lane returns, only
     one page in five ships an og:image — academic and museum sites almost
     never do — and the free screenshot renderers answer 403. A favicon
     identifies the destination, which is what a preview is for. */
  const [markBroken, setMarkBroken] = useState(false);
  const favicon = category === "websites" && !markBroken ? item.thumbnail : null;
  const host = hostOf(item.url);
  const signal = formatSignal(item);
  const mark = provenanceOf(item);
  const blurb =
    item.snippet && !NUMERIC_ONLY.test(item.snippet) ? item.snippet : null;

  return (
    <motion.article
      initial={still ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      /* Staggered, but capped: past about half a second the last card in a
         long lane is still arriving after the reader has got there. */
      transition={
        still ? { duration: 0 } : { duration: 0.35, delay: Math.min(index, 7) * 0.04 }
      }
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl",
        "border border-border/70 bg-card/40 backdrop-blur-xl",
        "transition-[transform,border-color,box-shadow] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-[color:var(--tint)]/60",
        className,
      )}
      style={{ "--tint": "var(--cat, #a78bfa)" }}
    >
      {/* A wash of the lane's own colour, lit on hover. The card is glass, so
          the light sits in it rather than on it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(120% 90% at 12% 0%, color-mix(in srgb, var(--tint) 16%, transparent), transparent 62%)",
        }}
      />

      {/* Stretched over the card, with the bookmark lifted above it — one
          link and one button, nothing interactive nested inside anything. */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordVisit(item, { topic, category })}
        aria-label={item.title}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tint)]"
      />

      <div className="relative flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em]"
            style={{
              color: "var(--tint)",
              background: "color-mix(in srgb, var(--tint) 12%, transparent)",
              boxShadow:
                "inset 0 0 0 1px color-mix(in srgb, var(--tint) 26%, transparent)",
            }}
          >
            {favicon ? (
              <img
                src={favicon}
                alt=""
                width="12"
                height="12"
                className="h-3 w-3 rounded-[2px]"
                onError={() => setMarkBroken(true)}
              />
            ) : (
              <Icon className="h-3 w-3" strokeWidth={2.2} />
            )}
            {label}
          </span>
          {mark ? (
            <span className={`mark mark-${mark.tone}`}>{mark.label}</span>
          ) : (
            item.depth_level && (
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-zinc-400">
                {item.depth_level}
              </span>
            )
          )}
          <div className="relative z-20 ml-auto">
            <BookmarkButton item={item} topic={topic} category={category} />
          </div>
        </div>

        <h4 className="line-clamp-3 font-[family-name:var(--font-display)] text-[1.06rem] font-semibold leading-snug tracking-[-0.022em] text-zinc-100 transition-colors group-hover:text-white">
          {item.title}
        </h4>

        {blurb && (
          <p className="line-clamp-2 text-[0.85rem] leading-relaxed text-zinc-500">
            {blurb}
          </p>
        )}

        <div className="mt-auto flex items-center gap-3 border-t border-white/[0.07] pt-3.5">
          {signal && (
            <span
              className="font-[family-name:var(--font-display)] text-[0.92rem] font-bold tabular-nums tracking-tight"
              style={{ color: "color-mix(in srgb, var(--tint) 38%, #fafafa)" }}
            >
              {signal}
            </span>
          )}
          {host && (
            <span className="min-w-0 truncate text-[0.73rem] text-zinc-600">
              {host}
            </span>
          )}
          <ArrowUpRight
            className="ml-auto h-4 w-4 shrink-0 text-zinc-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-300"
            strokeWidth={2}
          />
        </div>
      </div>
    </motion.article>
  );
}

export default ResultTile;
