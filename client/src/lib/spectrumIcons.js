/* The Spectrum icon pack, resolved by name.
 *
 * 248 topic icons and 33 category icons, one folder per domain. They are
 * bundled rather than served from `public/` so each gets a content-hashed URL
 * — they are immutable artwork and should be cached forever — and so a missing
 * file is a build-time hole rather than a 404 in front of a reader.
 *
 * `import.meta.glob` with `eager` collects the URLs at build time, so this
 * costs one small map in the bundle and no runtime import. The SVGs themselves
 * are never inlined: they load through `<img>`, which means only the icons
 * actually on screen are fetched, and each one isolates its own gradient ids.
 * That last part matters — the pack's README warns that inlining several
 * copies would make every instance resolve to whichever rendered first.
 *
 * Lookup is by slug, and the slugs are not hand-maintained: every label in
 * clusters.js runs through the same `slugify` the pack used, verified against
 * its manifest at 248 of 248 topics and 33 of 33 categories. A label edited
 * without its file being renamed simply resolves to nothing, which the
 * caller draws as a fallback rather than as a broken image.
 */
const FILES = import.meta.glob("../assets/spectrum-icons/**/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

/** The pack's own slug rule. Must stay in step with its `render_collection.py`. */
export function slugify(label) {
  return String(label)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const TOPICS = new Map();
const DOMAINS = new Map();

for (const [path, url] of Object.entries(FILES)) {
  const match = path.match(/spectrum-icons\/([^/]+)\/([^/]+)\.svg$/);
  if (!match) continue;
  const [, domain, file] = match;
  if (file === "_category") DOMAINS.set(domain, url);
  else TOPICS.set(file, url);
}

/** The artwork for a topic, or null when the pack has none for it. */
export function topicArt(topic) {
  return TOPICS.get(slugify(topic)) || null;
}

/** The artwork for a domain, keyed by the cluster id (which is its slug). */
export function domainArt(id) {
  return DOMAINS.get(id) || null;
}

/** Counts, so a test can assert the pack arrived intact. */
export const ART_COUNTS = { topics: TOPICS.size, domains: DOMAINS.size };
