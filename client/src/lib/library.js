/* Your library: bookmarks, what you've opened, and which topics you've explored.
 *
 * This is localStorage-backed for the same reason the rest of live discovery
 * can't be: `user_content_history` foreign-keys into `content_items`, and a
 * YouTube video or arXiv paper has no row there. Persisting these server-side
 * needs a table keyed by URL rather than by content_item_id.
 *
 * Every export returns the shape a REST route would, so that migration is a
 * rewrite of this file and nothing else.
 */

const KEYS = {
  bookmarks: "prysm.bookmarks.v1",
  history: "prysm.history.v1",
  topics: "prysm.topics.v1",
};

const listeners = new Set();

/** Components subscribe so a bookmark toggled in one card updates every other
 *  view of the same item without threading state through the tree. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn());
}

function read(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota — the in-memory result still renders */
  }
  emit();
}

/** Trim an adapter result down to what a saved card needs to render. */
function toRecord(item, extra = {}) {
  return {
    url: item.url,
    title: item.title,
    type: item.type || null,
    source: item.source || null,
    snippet: item.snippet || null,
    thumbnail: item.thumbnail || null,
    published_at: item.published_at || null,
    signal: typeof item.signal === "number" ? item.signal : null,
    ...extra,
  };
}

/* --- bookmarks ---------------------------------------------------------- */

export function getBookmarks() {
  return read(KEYS.bookmarks);
}

export function isBookmarked(url) {
  return read(KEYS.bookmarks).some((b) => b.url === url);
}

export function toggleBookmark(item, context = {}) {
  const bookmarks = read(KEYS.bookmarks);
  const existing = bookmarks.findIndex((b) => b.url === item.url);

  if (existing !== -1) {
    bookmarks.splice(existing, 1);
    write(KEYS.bookmarks, bookmarks);
    return false;
  }

  bookmarks.unshift(
    toRecord(item, {
      topic: context.topic || null,
      category: context.category || null,
      saved_at: new Date().toISOString(),
    }),
  );
  write(KEYS.bookmarks, bookmarks.slice(0, 300));
  return true;
}

export function removeBookmark(url) {
  write(
    KEYS.bookmarks,
    read(KEYS.bookmarks).filter((b) => b.url !== url),
  );
}

/* --- history ------------------------------------------------------------ */

export function getHistory() {
  return read(KEYS.history);
}

/** Called when a result is actually opened. Re-opening moves it to the top
 *  rather than adding a duplicate row. */
export function recordVisit(item, context = {}) {
  const history = read(KEYS.history).filter((h) => h.url !== item.url);
  history.unshift(
    toRecord(item, {
      topic: context.topic || null,
      category: context.category || null,
      opened_at: new Date().toISOString(),
    }),
  );
  write(KEYS.history, history.slice(0, 200));
}

/* --- explored topics ---------------------------------------------------- */

export function getTopics() {
  return read(KEYS.topics);
}

/** Every explored topic is remembered so the feed has something to rebuild
 *  from — this is what makes a search worth anything after you leave the page. */
export function recordTopic(topic, categories) {
  const clean = String(topic || "").trim().toLowerCase();
  if (!clean) return;

  const counts = categories
    ? Object.fromEntries(
        Object.entries(categories).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.length : value ? 1 : 0,
        ]),
      )
    : {};

  const topics = read(KEYS.topics).filter((t) => t.topic !== clean);
  topics.unshift({
    topic: clean,
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    explored_at: new Date().toISOString(),
  });
  write(KEYS.topics, topics.slice(0, 60));
}

export function clearLibrary() {
  Object.values(KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nothing useful to do */
    }
  });
  emit();
}

export function getStats() {
  return {
    bookmarks: read(KEYS.bookmarks).length,
    history: read(KEYS.history).length,
    topics: read(KEYS.topics).length,
  };
}
