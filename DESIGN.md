# Prysm — design system

The visual rules the app already follows. Written down so a change doesn't
quietly reinvent something that was decided for a reason. Where a rule exists
because something looked wrong, the reason is kept — those are the ones most
likely to be undone by accident.

## The motif

A prism splits one beam into a spectrum. That is the product (one search →
many kinds of result) and it is the only decorative idea the UI uses. Colour
arrives as *bands of a spectrum*, never as arbitrary accent picks.

**The palette.** Six bands, used everywhere colour is assigned:

```
#3b82f6  blue      #8b5cf6  violet    #ec4899  pink
#f59e0b  amber     #10b981  emerald   #06b6d4  cyan
```

Lightened variants (`#60a5fa #a78bfa #f472b6 #fbbf24 #34d399 #22d3ee`) are used
where the colour sits on dark and needs to carry.

**Assignment is deterministic, never random.** A topic hashes to a band
(`topicColor`), a Prism takes a band by position, a category keeps its own.
The same subject is the same colour everywhere it appears — stable beats
varied, because the colour becomes a way to recognise something.

**The animated ring** — a `conic-gradient` border cycling `--rainbow-angle` —
means *"this is the active thing"*. Nav's current page, the selected category
chip, the auth button once the form is submittable. It should stay rare; it
stops meaning anything if everything glows.

## Surfaces

```
--bg            #000      page
--surface       #0b0b0e   cards, plates
--surface-raised #101015  hover
--line          #1c1c20   hairlines
--line-strong   #303038   hover hairlines
--text          #e4e4e7
--text-dim      #a1a1aa
--text-faint    #6f6f7a
```

Radii: `--radius-md 14px` for plates and inputs, `--radius-lg 20px` for cards,
`999px` for pills, `24px` for the Prism deck cards.

## Typography

Two families as tokens.

- `--font-display` — **Bricolage Grotesque**. Anything large: page titles, the
  topic overview, result links, Prism card titles.
- `--font-ui` — **Space Grotesk**. UI, body copy, metadata, buttons.

Display sizes are `clamp()`-based so they scale between breakpoints rather than
stepping at them.

**Result links use the display face.** At UI-face 1rem they read as a footnote
to a display-scale summary; at 1.22rem in Bricolage the two halves of the page
share a voice.

## Motion

One easing for anything that settles: `cubic-bezier(0.32, 0.72, 0, 1)`.
Entrances use `cubic-bezier(0.16, 1, 0.3, 1)`.

- page/section entrance — 0.5s, staggered by index
- deck transitions — 0.58s
- hover states — 0.14–0.22s

Durations past ~0.7s read as lag as soon as an interaction is repeated. Every
animation is disabled under `prefers-reduced-motion`.

**A dragged element must track the pointer 1:1 with no transition.** Any easing
during a drag reads as the interface lagging behind the finger; the easing
belongs on release.

## Topic icons

Iconify delivers them, but **the matching is a local concept map** — Iconify's
search is keyword-based and returns nothing for most real topics (measured:
five of six feed topics had zero matches). Search is consulted only for topics
that look like a named tool, where a real logo beats a generic glyph.

Two distinct treatments, and conflating them is a bug that has happened once:

| | Artwork | Plate |
|---|---|---|
| **Concept** (Phosphor glyph) | monotone, lightened toward white | gradient in the topic's band, grained, inset highlight |
| **Brand** (`logos:` etc.) | own colours, untouched | light — many marks are solid black and vanish on dark |

The grain is the same `feTurbulence` texture the auth card uses. It is the
thing that stops a coloured chip reading as generic neon-on-dark: flat colour
behind a flat glyph is exactly the look every dark-mode template has.

`lighten()` runs in **JS, not `color-mix()`** — the value becomes an Iconify
query parameter, where a CSS function arrives as literal text and the icon
silently falls back to black. `iconUrl` guards on a hex pattern for that reason.

## Result presentation

**Rows, not cards.** No borders or backgrounds around a result. The title *is*
the link; on hover it takes colour, an underline, and weight via
`-webkit-text-stroke` rather than `font-weight`, because changing weight
reflows the line under the cursor.

Hover draws a band of spectral light across the row and drifts the text 5px —
refraction, not a rule.

**Videos and podcasts are tiles**, because both ship a real image and a
thumbnail reads better leading a card than sitting beside text. Thumbnails sit
in a padded plate so the image never touches the type, and each category keeps
its own aspect (16:9 video stills, square podcast art, 2:3 book covers) —
one crop mangles the others.

**Three per category** behind an expander, with a category picker above so a
lane can be chosen rather than scrolled to.

## The overview

Set as type, not boxed. One size, hard-capped at five lines with a Read more.
Hierarchy comes from **weight and colour, not scale**: emphasis is woven
through in clauses rather than a bold block over a grey one, which reads as two
slabs.

Key terms get a colour-plated background — first mention only, substring-aware
(once "quantum computing" is plated, "quantum" alone is not), and spaced at
least 90 characters apart so they distribute rather than cluster in line one.

## Layout

`#root` is a flex column owning the viewport height; `nav` is `flex-shrink: 0`.
Pages that fill the screen use `flex: 1`. **Never subtract a hardcoded nav
height** — it broke once when the nav's padding changed at a breakpoint.

`.page` needs an explicit `width: 100%`. Its `margin: 0 auto` is a cross-axis
auto margin in that flex column, which disables the default stretch; without a
width every page shrink-to-fits its content and the same layout comes out a
different measure on each route.

Breakpoints: **1080 / 860 / 620**, plus height-based ones for the Prism deck.

## Illustration slots

Deliberate dashed placeholders, searchable by `illo-slot`: Hero centrepiece,
Spectrum banner, Feed and Wavelength headers, and the per-card header in the
Prism deck. They are meant to look intentional while empty — leave them until
real artwork exists rather than filling them with stock.

## Copy

Sentence case. No exclamation marks. Errors say what to do next, in the words
of the person who hit them — Supabase's `Invalid login credentials` becomes
*"That email and password don't match. Check both and try again."*

A disabled control always says what it is waiting for. A dead button with no
explanation is the thing that makes a form feel broken.
