const { test } = require('node:test');
const assert = require('node:assert/strict');

test('curated, live and legacy saved content retain their medium', async () => {
  const { presentContent } = await import('../client/src/lib/contentPresentation.js');
  const base = { title: 'A resource', url: 'https://example.com/resource' };
  for (const [type, category] of Object.entries({ article: 'articles', video: 'videos', book: 'books', paper: 'papers', website: 'websites', code: 'code', course: 'courses' })) {
    assert.equal(presentContent({ ...base, type, category: 'curated' }).category, category);
  }
  assert.equal(presentContent({ ...base, source: 'github' }).category, 'code');
  assert.equal(presentContent({ ...base, type: 'article' }, { category: 'websites' }).category, 'websites');
  assert.equal(presentContent({ ...base, description: 'Curated description' }).snippet, 'Curated description');
  assert.equal(presentContent(base).access, undefined, 'missing access must not imply a free book');
  assert.equal(presentContent({ ...base, peer_reviewed: false }).peer_reviewed, false);
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'not a URL', undefined]) {
    assert.equal(presentContent({ ...base, url }), null);
  }
});

test('saved cards and history preserve source metadata, including zero and false', async () => {
  const values = new Map();
  const previous = global.localStorage;
  global.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  try {
    const library = await import('../client/src/lib/library.js');
    const fixtures = [
      { title: 'Repo', url: 'https://github.com/example/repo', category: 'code', source: 'github', signal: 15, forks: 0, language: 'TypeScript', updated_at: '2026-09-12T00:00:00Z' },
      { title: 'Book', url: 'https://example.com/book', category: 'books', author: 'Author', year: 2024, access: 'buy' },
      { title: 'Paper', url: 'https://example.com/paper', category: 'papers', peer_reviewed: false, venue: 'arXiv' },
      { title: 'Answer', url: 'https://example.com/answer', category: 'qa', accepted: false, score: 0, tags: ['physics'] },
    ];
    for (const item of fixtures) {
      library.toggleBookmark(item);
      library.recordVisit(item);
      for (const record of [library.getBookmarks()[0], library.getHistory()[0]]) {
        for (const [key, value] of Object.entries(item)) assert.deepEqual(record[key], value, key);
      }
    }
    library.recordVisit(fixtures[0]);
    assert.equal(library.getHistory().length, fixtures.length, 'reopening does not duplicate history');
    library.toggleBookmark(fixtures[0]);
    assert.equal(library.isBookmarked(fixtures[0].url), false);
  } finally { global.localStorage = previous; }
});
