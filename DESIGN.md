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
means *"this is the active thing"*. Nav's current page, the auth button once
the form is submittable, and a feed bookmark **once it is saved**. It should
stay rare; it stops meaning anything if everything glows — which is why the
bookmark carries it in its saved state rather than at rest. A ring on every
bookmark would spend the signal on a control instead of a state.

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
`--radius-xl 26px` for the feed's bold-stroked cards and panels, `999px` for
pills, `24px` for the Prism deck cards.

**Cards have a bottom edge.** Sides and top are 1.5px; the bottom is **4px in
a lighter tone** (`#3d3d49`), so the card reads as a slab with thickness rather
than a flat outline. Darkening the bottom instead — the usual way to fake
depth — is invisible here, because the page behind it is already black. On
hover the bottom edge takes the item's band.

**Two stroke weights, and they are not interchangeable.** `--line` is a
hairline — correct around a 32px icon plate, invisible around a 300px card,
which then reads as a floating block of slightly-lighter black. Containers at
card scale use `--line-bold #31313c` at **1.5px**, which is an edge you can
actually see. Hairlines stay for dividers *inside* a container.

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

One easing for anything that settles: `--ease-settle`,
`cubic-bezier(0.32, 0.72, 0, 1)`. Entrances use `cubic-bezier(0.16, 1, 0.3, 1)`.

`--ease-bounce`, `cubic-bezier(0.34, 1.56, 0.64, 1)`, overshoots, and is only
for **controls that should feel struck rather than faded** — a filled button,
a card lifting under the cursor, an arrow nudging forward. Press goes the other
way: `scale(0.965)` at **0.09s with no overshoot**, because an overshoot on the
way down reads as a control that didn't register the click.

- page/section entrance — 0.5s, staggered by index
- deck transitions — 0.58s
- hover states — 0.14–0.22s

Durations past ~0.7s read as lag as soon as an interaction is repeated. Every
animation is disabled under `prefers-reduced-motion`.

**The exception is a loader, which is watched rather than triggered.** The
falling prism on the Prisms page is a 4s loop in three scenes — Descend,
Refract, Dissolve — and the long duration is the point: it drifts instead of
pulsing, and the loop restarts from black so the seam never shows. It is the
only sustained looping animation in the app, and it is still cut under reduced
motion, where it holds one lit frame.

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
| **Concept** (Phosphor glyph) | monotone, `lighten(band, 0.8)` | gradient in the topic's band, grained, inset highlight |
| **Brand** (`logos:` etc.) | own colours, untouched | light — many marks are solid black and vanish on dark |

The grain is the same `feTurbulence` texture the auth card uses. It is the
thing that stops a coloured chip reading as generic neon-on-dark: flat colour
behind a flat glyph is exactly the look every dark-mode template has.

**0.8, not the 0.62 default**: on the warm bands a 62% glyph sat close enough
in value to the plate's own radial highlight that the tile read as empty at the
size it is actually drawn.

**Every icon has an `onError`.** A resolved brand id can 404 — Iconify's search
indexes names its API doesn't always serve, and a cached id from an earlier
session goes stale — and without a handler the browser draws its broken-image
glyph, which looks like the app is broken rather than like an icon is missing.
It steps down once to the concept glyph, then to a compass.

`lighten()` runs in **JS, not `color-mix()`** — the value becomes an Iconify
query parameter, where a CSS function arrives as literal text and the icon
silently falls back to black. `iconUrl` guards on a hex pattern for that reason.

## Result presentation

Two presentations, and which one applies is decided by the job the screen is
doing — not by preference.

**The two-column lane is a grid, not `column-count`.** `column-count` balances
by *height*, so three results put one tall item on the left and two on the
right — which is what made "From Prysm" look lopsided. A grid fills row-major,
so the sides stay level however many there are.

**Explore: rows, not cards.** No borders or backgrounds around a result. The
title *is* the link; on hover it takes colour, an underline, and weight via
`-webkit-text-stroke` rather than `font-weight`, because changing weight
reflows the line under the cursor. Explore shows ~27 results across nine lanes;
a border on each is noise, and the row's own hover is the affordance.

**The whole card is the link.** A stretched `::after` on the title anchor
covers the card, with the bookmark lifted back above it on `z-index: 2`. The
overlay belongs to the anchor, so this stays one link and one button — no
interactive element nested inside another, which is what a card-shaped `<a>`
wrapping a `<button>` would be.

**Feed: cards.** Eight items, mixed categories, drawn from up to eight
different searches. A row list gives them identical weight and shows neither
*which topic this came from* nor *what kind of thing it is* — the two facts
that decide whether an item is worth a click. The card spends its extra space
on exactly those, as a single eyebrow line: category glyph and label, then the
topic in its own band.

**Only videos get a thumbnail on the feed.** A 16:9 still is the shape of a
full-bleed band, so it crops to nothing; square podcast art and 2:3 book covers
have to be cut in half to fit one. The grid is `align-items: start` for the
same reason — with the default stretch, one card carrying an image gives its
whole row that height, and a card whose interior is half empty reads as broken
where a shorter card with space beneath it reads as a staggered grid.

Hover draws a band of spectral light across the row and drifts the text 5px —
refraction, not a rule.

**A paper says how it was published.** A chip in the meta row — emerald with
the journal name when the work was peer reviewed, amber reading *Preprint* when
it wasn't. Amber is a caution, not a warning: most of the strongest work in ML
appears on arXiv before it appears anywhere else, so the point is to let the
reader judge, not to bury it. A paper whose status the index doesn't record
gets no chip rather than a guess.

**Books are a shelf and papers are documents.** Two lanes hold objects rather
than links, so they are drawn as objects.

*Books:* a **banded cover** on a slab. A panel of the topic's colour over a
dark plate that carries the type, with a fore-edge panel stood on end
(`rotateY(90deg)`) and a back board at `translateZ(-29cqw)`. **The front board
is the reference plane and the depth runs behind it**, so the book opens away
from the reader rather than swinging through them. It turns about its own
centre, `0deg` to `-24deg` over 0.5s; an earlier version pivoted on the
binding, which foreshortened the cover into itself and read as a squeeze.

**The whole cover is drawn in `cqw`** against a `container-type: inline-size`
slab — type, padding, the mark and the board's own thickness. A 148px book on
mobile and a 196px one on the shelf are the same cover at two scales rather
than two designs, with no breakpoint in between.

**The band is a fixed 38%, not `flex: 1`.** A flex item won't shrink below its
own content, so with both halves flexible the plate grew to fit the longest
title and the band shrank to suit — a different split on every book, which is
the one thing a shelf can't have. The title clamps at 3 lines and the author at
1 for the same reason: 4 pushed the author and the mark past the bottom edge.

**Every book is exactly `--book-w` wide**, and the shelf is flex-wrap rather
than an auto-fill grid. A grid stretches its columns to fill the row, so a
shelf of four and a shelf of five drew books at different sizes — and a book is
a physical object, so two of them being different widths reads as a mistake.

**Every cover is typeset; none are photographed.** Open Library has an image
for roughly half of what it returns, and most of those are scans of a *title
page* — a sheet of cream paper with a paragraph of 8pt type in the middle of
it. At shelf size that is unreadable, and beside a real jacket it looks broken.
Designing all of them is the only way the shelf is consistent, and it means the
title and author are set at a size you can actually read: a book mark, the
title in the display face (`text-wrap: balance`, four lines), the author under
it at 66% white.

The cloth is the topic's band under the same `feTurbulence` grain the topic
plates and the auth card use — flat colour is exactly what makes a drawn book
look like a coloured rectangle. The fore edge is ruled rather than solid, since
a plain white strip reads as card rather than paper.

**The cover carries the title, so the line under the shelf doesn't.** Repeating
it would print the same words twice at two sizes; that line is only what the
cover can't say — whether it's free to read, its year, and the bookmark. The
bookmark sits in that flow rather than floating over the board, where on a
turned book it hung in mid-air belonging to neither the cover nor the page.

**`?default=false` on the cover URL is load-bearing.** Without it Open Library
answers a missing cover with a blank 1px image and **HTTP 200** — measured — so
the `<img>` "loads", `onError` never fires, and the board comes up empty instead
of falling back. An `onLoad` check on `naturalWidth` backs it up for rows cached
before that shipped.

*Papers:* the two facts that decide whether one is worth opening — where it was
published and how often it has been cited — were the smallest text on the row.
The venue sits under a hairline where a masthead would, the abstract is labelled
as one (so the grey block reads as the author's words, not the app's), and the
citation count is set as a figure. A bound left edge in the category's colour,
not a full border, so the lane doesn't read like the feed. Stretched, not
start-aligned: each sheet closes with a foot rule, and a row of rules at four
heights reads as misalignment.

*Videos and podcasts:* artwork leads, each at the aspect it was made in — 16:9
for a still, 1:1 for cover art. Letterboxing one into the other throws away the
part worth showing. Podcast art gets a border the way a record sleeve would; a
video still is a frame and doesn't.

**Videos and podcasts are tiles**, because both ship a real image and a
thumbnail reads better leading a card than sitting beside text. Thumbnails sit
in a padded plate so the image never touches the type, and each category keeps
its own aspect (16:9 video stills, square podcast art, 2:3 book covers) —
one crop mangles the others.

**Four per category** behind an expander, with a category rail above so a lane
can be chosen rather than scrolled to. Four rather than three because the lanes
render in two columns, and an odd number always leaves a dangling row with a gap
beside it. The expander can reveal an odd remainder — that only happens once, at
the bottom.

**`categoryStroke()` never returns undefined.** Props are spread *after* an
icon's own defaults, so `stroke={undefined}` doesn't fall through to the
default — it overwrites it, React drops the attribute, and SVG's initial
`stroke: none` draws nothing. That is what emptied the "Everything" tile, which
has no category of its own; it takes the full prism sweep instead.

**Each content type strokes its icon with its own gradient**
(`CATEGORY_GRADIENTS`). They all shared the single prism gradient, which made
Research Papers, Discussions and Podcasts the same pink-violet-amber sweep —
nine icons that couldn't be told apart at the size they're drawn. Each now leads
with a hue of its own, and the second stop is a lighter tint of that hue rather
than a different colour, because a two-hue blend just muddies at 16px.

## The overview

**Wikipedia writes it; Tavily is the fallback.** Not to save credits — the
Tavily answer rides along on a search already being made, so both are free —
but because a definition can then be *cited*. It is the first thing anyone
reads, and a linked encyclopaedia entry earns trust where an unattributed
paragraph only asks for it. The source line renders **only** for Wikipedia: a
synthesised answer has no single page to point at, and inventing one would be
worse than none.

Trimmed to ~240 characters server-side, which is what three lines of display
type holds. A second sentence is kept only if it fits — otherwise the clamp
cuts it mid-word and "read more" reveals a fragment rather than a thought.

Set as type, not boxed. One size, hard-capped at five lines with a Read more.
Hierarchy comes from **weight and colour, not scale**: emphasis is woven
through in clauses rather than a bold block over a grey one, which reads as two
slabs.

**The break lands on sentences, not clauses.** Emphasis used to alternate every
third clause. On a two-sentence definition that changes weight at commas, where
the meaning doesn't — which is what read as random. The first sentence carries
the definition and is set in white; everything after it steps down to grey.

Key terms get a colour-plated background — **the topic's own words**, first
mention only, substring-aware (once "quantum computing" is plated, "quantum"
alone is not), and **at most two**. Plating whatever happened to be long
("environments", "interactions") put marks on words with no claim to the
reader's attention, and nine of them across three lines is confetti, not
emphasis.

## The feed

The app's most-visited screen, and the one set with the most air. Three rules
carry it:

**Sections are separated by whitespace alone** — no rules, no alternating
backgrounds, `clamp(56px, 7vw, 104px)` between them. The eyebrow heading and
the gap above it are the entire structural device.

**One lead card, then a rail.** "Continue exploring" promises there is a thing
to continue, so the most recent topic takes a card **two columns wide and two
grid rows tall**, and the rest pack around it. The two-row span is not
cosmetic: a one-row lead stretches its neighbours to a height they have nothing
to fill, which reads as three half-empty cards beside a full one.

**Colour is spent in exactly one place per section.** The lead card takes its
topic's own band — a tinted radial wash, a bold outlined chip, and the page's only filled
button. Every other card is a neutral bold stroke that picks up its band only
on hover. Filling all of them turns a spectrum into neon-on-dark.

The filled button is `lighten(band, 0.34)` under **near-black text**. Six bands
under white text is not a legible set — amber at full saturation is 2.1:1 —
and lightening every band lets one text colour work across all of them.

Result cards carry their band as a **2px spectral edge** along the top —
`linear-gradient(90deg, band-lit, band 38%, transparent 78%)`, one beam
entering from the left and dispersing. It is the card's only decoration, and it
doubles as the topic's colour key. Dim at rest, full opacity on hover.

Sections are **not** boxed. An earlier pass wrapped the result lists in a
bold-stroked panel; a box around boxes is redundant, and the panel clipped the
first row's hover glow square against its own rounded corner.

## Explore

**A banner, not a bare title.** The topic's icon, its name, and what was found
sit in one bold-stroked band tinted with the topic's own colour, so the page
states its subject before any result does.

**Categories ride the rail.** See below. Each item keeps its category's hue
(`PICKER_HUES`), so the strip doubles as the colour key the results below use.

## Spectrum

**Twenty-four domains: an index, then all of them.** The index is a compact
grid of names that **jumps** to a section; it does not swap one in.

An earlier version made it a tab bar — one domain open, twenty-three hidden.
That is the wrong trade for a page whose only job is browsing. It put 138 of
the 144 topics behind a click, so the page showed categories rather than
content; the panel opened below the whole grid rather than where the click
was; and seeing everything took twenty-four clicks. Length is not a fault on a
catalogue page — every large one scrolls — but hiding the catalogue is.

Rows rather than illustrated cards in the index, because at this count the
names *are* the content and artwork would bury them. Section headers are
compact for the same reason: twenty-four of them stack, so a header states the
domain and gets out of the way rather than repeating the explore banner.

**The topic grid wraps rather than scrolls.** The rail scrolled because
connected tiles cannot wrap — the first tile on a second line draws a connector
into the gutter with nothing on the other end. The connectors are gone, so the
reason went with them, and a horizontal scroller would only hide topics behind
a gesture nobody knows is available.

Hues cycle through the six bands by position, so a domain's colour is stable
without anyone assigning one.

**A band per cluster.** The cluster's icon, how many topics it holds, its name
and its blurb, in the same bold-stroked block the explore banner uses — so a
band on Spectrum and a topic on Explore are recognisably the same thing. The
icon is named explicitly per cluster in `CLUSTERS`, not resolved: "Machines
that learn" is not a topic and the concept map has nothing to match it to.
`TopicIcon` takes an `icon` prop for exactly this.

**Topics ride the rail**, at `is-lg`.

## The rail

One row of tiles, each with its name underneath, joined left to right by a
hairline so the row reads as one instrument rather than a handful of loose
buttons. **Explore uses it for categories, Spectrum for topics** — the same
strip at two sizes, which is most of what makes the two pages look like one
product.

**It scrolls rather than wraps**, and that is structural, not taste: a wrapped
row cannot be connected. The first tile on the second line is not
`:first-child`, so it draws a connector into the gutter to its left with
nothing on the other end.

**No connectors between tiles.** They read as a sequence the row isn't; the
spacing carries the grouping on its own.

**The right edge is masked** — the last 34px fade out, so a tile the rail has
run out of room for trails off instead of being sliced. When the row fits, that
band falls on empty space and nothing shows. The mask clips to the rail's box,
which is why the rail carries vertical padding: without it the active tile's
glow is sliced flat top and bottom.

## Articles, discussions and Q&A

One tile, in Tailwind (`components/ui/result-tile.jsx`), adapted from a glass
blog card. The original leads with an image; **none of these three lanes have
one** — Tavily returns a snippet, Hacker News a thread, Stack Exchange a
question — so the card leads on what it does have: the source, the claim, and
how many people engaged. The glass, the badge row and the ruled footer are what
carried over.

Each lane keeps its own hue through a `--cat` custom property, so one component
serves three lanes without three variants.

**Entrance animation is content, so it degrades.** `initial={{ opacity: 0 }}`
means results are invisible until JS has run and rAF has ticked; under
`useReducedMotion` the tile passes `initial={false}` and renders at full opacity
immediately rather than serving a shorter version of the same wait.

## The topic figure

Wikipedia's lead image for the article, framed beside the definition. It is
already in the summary response the overview comes from, so it costs nothing —
and unlike a stock photo it is *of the topic*: "speed cubing" returns a
competitor mid-solve rather than a generic desk.

**Conditional, never reserved.** Plenty of articles have no lead image (game
theory doesn't), so the second column only exists when there is something to
put in it; an empty frame beside the definition is worse than a full-width
definition. A dead URL removes the column at runtime for the same reason.

**Wikimedia only serves a fixed set of pre-rendered widths per file.** Measured
on one image: 330 and 500 return 200, while 400, 640 and 800 all return 400 —
even though the original is 1600px. So the URL is used exactly as the API gave
it, and the frame is sized to suit rather than the width being rewritten.

## The path

The one thing here a search engine structurally cannot do. It hands you forty
links ranked by relevance, has no idea whether you already know the subject,
and no reason to care whether you finish. All three are the point of this view.

**The ordering already existed and was being thrown away.** The Tavily adapter
fires three depth-tagged queries per topic, so a dozen articles arrive labelled
beginner / intermediate / advanced. Those labels are the spine. Everything else
attaches to a stage by *what it is* — a video is how most people start, a
thread is where people compare notes halfway, a paper is what you read once the
ground is solid — which is a rule about kind, not a guess about difficulty.
`lib/path.js` fetches nothing; it is a re-reading of data the page already has.

**The trail carries almost nothing.** A stop is a marker, its content type and
a name clamped to two lines. Not the description, not the host, not the badge —
those answer questions you have not asked yet, and putting all of them on every
row at once buried the only question the view exists for: what do I open next.
Density is the failure mode here, not sparseness.

**The marker is the way in.** Clicking it opens that stop's detail — what it
is, where it's from, what can be verified about it, an Open button and the
tick. Information on request, in one place, instead of permanently on display.
Only one can be open at a time; two popovers on a trail is the clutter this is
escaping.

**The tick is still the product**, it has just moved into the detail. Every
other surface is a link you follow and forget. Marking something read and
opening it stay different controls, because they are different intentions —
you tick off what you read yesterday. Read stops step back in colour rather
than grey out: a record of what you read, not a list to dismiss. Filled at
full saturation they became the brightest things on the page, which puts the
loudest marker on the one stop that needs nothing from you.

**Markers are struck, not drawn.** A solid bottom edge in a deeper tone of the
marker's own hue, so it reads as something with thickness; hover lifts it and
the edge grows, press drops it and the edge shrinks. Darkening the underside —
the usual way to fake depth — is invisible on a black page.

**Two colour questions, kept separate.** A marker takes its *content type's*
hue and the level plate takes its *stage's*. Which stage you are in and what
kind of thing you are looking at are different facts, and one palette answering
both would collapse them.

**An unread marker is unlit, not absent.** Drawn in two near-blacks it became a
hole in the page rather than an object sitting on it, and the type label under
it was the dimmest text anywhere. Quiet is a step down from lit, not a step
toward the background.

**The weave leaves a hollow, and it is held rather than left over.** The stops
lean right, which opens a void down the left of every run; a prism turns slowly
in it. That is a placeholder — real artwork goes there — but the space is part
of the layout either way, and it closes on narrow screens where the trail needs
it back.

**Numbered markers, and this is the one place they belong.** Stages are a
sequence; the number states something true rather than decorating a list. It
is a position in what rendered, never a constant — an empty stage is dropped,
and a stage that kept its own number opened the path at "Stage 2".

**One lit stop.** The next unread item glows; everything else is quiet. A
single marker is a direction, and a page of them is the list this view exists
to replace.

**Nothing is locked, and the styling may not imply otherwise.** A dimmed stop
means unread, not unavailable — every one of them opens, in any order. The
games this layout borrows from grey a node to mean gated; the path is coverage,
not a prerequisite graph, and claiming that ordering would be a lie about what
the app knows.

**A stage is a ramp.** Within one stage, order is by medium before merit: you
watch before you read, and read a thread before the paper it argues about.
Provenance decides between two of the same kind — it was never a difficulty
measure. "Widely cited" says a paper matters, not that it is a good third
thing to open.

**Everything is still one click away.** The path is the default view, not the
only one — someone who knows what they want should get the shelf, not a route.

## The loop

Progress is what makes visit twenty better than visit one, and the three feed
sections above the fold are three readings of the same records:

- **Pick up where you left off** — a half-finished path is the only thing on
  the feed genuinely waiting for you, so it outranks anything the app merely
  thinks you might like.
- **Where you've been** — domain coverage across the twenty-four bands. Not a
  prerequisite graph; that needs the AI layer. Matched by substring both ways,
  because an explored topic is free text.
- **Worth revisiting** — a finished path, after a fortnight. The gap is the
  point: returning tells you what stuck. This is recall in the form the app can
  honestly offer without generated questions.

## Provenance, not ratings

The tempting version is a number: score everything 0–100 and sort. It doesn't
survive contact with the data. A paper cited four thousand times, a video with
two million views and an accepted Stack Overflow answer are **not
commensurable**, and any single figure claiming they are has invented a
comparison rather than made one. Worse, a score hides its reasoning exactly
where the reasoning is the point.

So: **one badge per item, naming the strongest verifiable fact about it.** A
content farm can fake a headline; it cannot fake a DOI, a citation count or a
university domain.

**The badge is a category, never a number.** "1,827 points" is not information
at a glance — the reader has no idea whether that is a lot, and the answer
differs by source and community. "Much discussed" is the claim the number was
standing in for, and it means the same thing everywhere. Counts stay in the
meta line, where a number is what you actually want.

Order matters — peer review outranks citation count, because one is a
judgement by people qualified to make it and the other is a popularity measure
a wrong paper can also score well on. Colour follows the same logic: green for
review, blue for a named institution, neutral grey for counts (real
information, weaker claim), amber for a preprint, which is a caution and not a
warning.

**Every lane carries one.** Peer-reviewed venue, institution, citations, stars,
accepted answer, points, views, episodes, full text — and *no badge is a
meaningful state*, not a gap. It says the item is relevant and nothing stronger
can be verified about it, which is the honest thing to say about most of the
open web and the reason the badges elsewhere mean anything.

**Q&A uses acceptance, not votes.** A hundred votes is routine on Stack
Overflow and exceptional on philosophy.stackexchange, so one threshold flatters
the busy sites and buries good answers on the quiet ones. Acceptance is a
judgement by the person who asked and means the same thing everywhere.

**It costs nothing** (except the 1-unit YouTube stats call). Every field is already in the payload; `lib/provenance.js`
is a re-reading of what the adapters return, not a request. Thresholds are
deliberately high — a badge most items earn is decoration, not a signal.

## What's where

| lane | component | treatment |
|---|---|---|
| books | `BookCard` | turned 3D board, typeset cover, cloth grain |
| papers | `PaperCard` | sheet with masthead, labelled abstract, citation figure |
| videos, podcasts | `MediaCard` | artwork leads, native aspect per kind |
| articles, discussions, Q&A | `ui/result-tile` | Tailwind glass card |
| code, curated, everything else | `ResultCard` | rows — the title is the link |
| the path | `PathStage` | numbered stages, tick per item, five with an expander |

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
