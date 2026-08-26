-- Ten curated Prisms.
--
-- Every URL here returned HTTP 200 on a live check when this file was written.
-- Ordering inside each bundle is beginner -> advanced, which is what
-- bundle_items.position and depth_level together encode.
--
-- Rerunnable: the DELETEs at the top clear only rows this file inserts.

BEGIN;

DELETE FROM bundle_items
 WHERE bundle_id IN (SELECT id FROM bundles WHERE description LIKE '[curated]%');
DELETE FROM bundles WHERE description LIKE '[curated]%';
DELETE FROM content_items WHERE source_name = 'prysm-curated';

WITH new_items AS (
  INSERT INTO content_items (title, type, topic, url, depth_level, description, source_name)
  VALUES
  -- react hooks
  ('Learn React', 'article', 'react hooks', 'https://react.dev/learn', 'beginner', 'The official tutorial. Start here — it is genuinely the best React introduction that exists.', 'prysm-curated'),
  ('useState — API reference', 'article', 'react hooks', 'https://react.dev/reference/react/useState', 'beginner', 'The one hook everything else builds on, documented properly.', 'prysm-curated'),
  ('A Complete Guide to useEffect', 'article', 'react hooks', 'https://overreacted.io/a-complete-guide-to-useeffect/', 'intermediate', 'Dan Abramov on why useEffect confuses people, and the mental model that fixes it.', 'prysm-curated'),
  ('useMemo and useCallback', 'article', 'react hooks', 'https://kentcdodds.com/blog/usememo-and-usecallback', 'advanced', 'When memoisation helps, and when it quietly costs you more than it saves.', 'prysm-curated'),

  -- machine learning
  ('But what is a neural network?', 'video', 'machine learning', 'https://www.youtube.com/watch?v=aircAruvnKk', 'beginner', '3Blue1Brown builds the intuition visually before any of the maths.', 'prysm-curated'),
  ('Dive into Deep Learning', 'book', 'machine learning', 'https://d2l.ai/', 'intermediate', 'An interactive textbook — maths, figures and runnable code in the same page.', 'prysm-curated'),
  ('The Unreasonable Effectiveness of RNNs', 'article', 'machine learning', 'https://karpathy.github.io/2015/05/21/rnn-effectiveness/', 'intermediate', 'Karpathy''s classic. Still the clearest sense of what sequence models actually learn.', 'prysm-curated'),
  ('Attention Is All You Need', 'paper', 'machine learning', 'https://arxiv.org/abs/1706.03762', 'advanced', 'The transformer paper. Everything since is a footnote to this.', 'prysm-curated'),

  -- deep learning theory
  ('Deep Learning', 'book', 'deep learning', 'https://www.deeplearningbook.org/', 'intermediate', 'Goodfellow, Bengio and Courville — the standard reference, free to read online.', 'prysm-curated'),
  ('How to Use t-SNE Effectively', 'article', 'deep learning', 'https://distill.pub/2016/misread-tsne/', 'intermediate', 'A Distill piece on how easy it is to read structure into a plot that is not there.', 'prysm-curated'),
  ('Spinning Up in Deep RL', 'article', 'deep learning', 'https://spinningup.openai.com/en/latest/', 'advanced', 'The most approachable on-ramp to reinforcement learning that stays rigorous.', 'prysm-curated'),
  ('Language Models are Few-Shot Learners', 'paper', 'deep learning', 'https://arxiv.org/abs/2005.14165', 'advanced', 'The GPT-3 paper — where scaling stopped being an implementation detail.', 'prysm-curated'),

  -- quantum computing
  ('Quantum Computing for the Very Curious', 'article', 'quantum computing', 'https://quantum.country/qcvc', 'beginner', 'An essay with spaced repetition built in, so it actually sticks.', 'prysm-curated'),
  ('Quantum Algorithm Implementations for Beginners', 'paper', 'quantum computing', 'https://arxiv.org/abs/1804.03719', 'intermediate', 'A survey that walks through the standard algorithms one at a time.', 'prysm-curated'),

  -- stoicism
  ('Stoicism — Stanford Encyclopedia of Philosophy', 'article', 'stoicism', 'https://plato.stanford.edu/entries/stoicism/', 'beginner', 'What the Stoics actually argued, as opposed to what the internet says they argued.', 'prysm-curated'),
  ('Meditations', 'book', 'stoicism', 'https://standardebooks.org/ebooks/marcus-aurelius/meditations/george-long', 'beginner', 'A Roman emperor''s private notebook. Beautifully typeset, free, no introduction needed.', 'prysm-curated'),
  ('The Enchiridion', 'book', 'stoicism', 'https://www.gutenberg.org/ebooks/10661', 'intermediate', 'Epictetus, compressed to its sharpest form by his student Arrian.', 'prysm-curated'),

  -- systems design
  ('The System Design Primer', 'article', 'systems design', 'https://github.com/donnemartin/system-design-primer', 'beginner', 'The most complete free map of the territory, with worked examples.', 'prysm-curated'),
  ('Microservices', 'article', 'systems design', 'https://martinfowler.com/articles/microservices.html', 'intermediate', 'Fowler''s definition, written before the term lost all meaning.', 'prysm-curated'),
  ('CS168: The Modern Algorithmic Toolbox', 'article', 'systems design', 'https://web.stanford.edu/class/cs168/', 'advanced', 'Stanford''s course on the algorithms that actually show up at scale.', 'prysm-curated'),

  -- databases
  ('PostgreSQL Tutorial', 'article', 'databases', 'https://www.postgresql.org/docs/current/tutorial.html', 'beginner', 'Start with the official one. It is short and it is correct.', 'prysm-curated'),
  ('Use The Index, Luke', 'book', 'databases', 'https://use-the-index-luke.com/', 'intermediate', 'SQL indexing explained for developers rather than for DBAs. Free online.', 'prysm-curated'),
  ('Linux Performance', 'article', 'databases', 'https://www.brendangregg.com/linuxperf.html', 'advanced', 'Brendan Gregg''s toolkit for finding out why the machine underneath is slow.', 'prysm-curated'),

  -- computer science
  ('CS50: Introduction to Computer Science', 'article', 'computer science', 'https://cs50.harvard.edu/x/', 'beginner', 'Harvard''s intro course. Free, complete, and still the best first step.', 'prysm-curated'),
  ('The Missing Semester of Your CS Education', 'article', 'computer science', 'https://missing.csail.mit.edu/', 'beginner', 'The shell, version control and debugging — the tools nobody teaches you.', 'prysm-curated'),
  ('Nand to Tetris', 'article', 'computer science', 'https://www.nand2tetris.org/', 'intermediate', 'Build a working computer from a NAND gate up. Nothing else demystifies the stack like it.', 'prysm-curated'),
  ('Crafting Interpreters', 'book', 'computer science', 'https://craftinginterpreters.com/', 'advanced', 'Write a language twice — once as a tree-walker, once as a bytecode VM. Free online.', 'prysm-curated'),

  -- rust
  ('The Rust Programming Language', 'book', 'rust', 'https://doc.rust-lang.org/book/', 'beginner', '"The Book" — the canonical path in, and unusually well written.', 'prysm-curated'),
  ('Learn Rust With Entirely Too Many Linked Lists', 'book', 'rust', 'https://rust-unofficial.github.io/too-many-lists/', 'advanced', 'The fastest way to actually understand ownership: fight the borrow checker over one data structure.', 'prysm-curated'),

  -- thinking clearly
  ('Epistemology — Stanford Encyclopedia of Philosophy', 'article', 'epistemology', 'https://plato.stanford.edu/entries/epistemology/', 'intermediate', 'What it means to know something, taken seriously.', 'prysm-curated'),
  ('Prospect Theory', 'article', 'epistemology', 'https://en.wikipedia.org/wiki/Prospect_theory', 'beginner', 'Kahneman and Tversky''s account of how people really weigh risk.', 'prysm-curated'),
  ('Meditations on First Philosophy', 'book', 'epistemology', 'https://www.gutenberg.org/ebooks/61', 'advanced', 'Descartes tearing his own beliefs down to see what survives.', 'prysm-curated'),

  -- mathematics
  ('Essence of Linear Algebra', 'video', 'linear algebra', 'https://www.3blue1brown.com/topics/linear-algebra', 'beginner', 'The series that makes matrices mean something geometric instead of arithmetic.', 'prysm-curated'),
  ('Better Explained — Math', 'article', 'linear algebra', 'https://betterexplained.com/articles/category/math/', 'beginner', 'Intuition first, formalism second. The antidote to how maths is usually taught.', 'prysm-curated'),
  ('Bartosz Ciechanowski', 'article', 'linear algebra', 'https://ciechanow.ski/', 'intermediate', 'Interactive explanations of physical and mathematical systems. Unmatched craft.', 'prysm-curated'),

  -- physics
  ('Classical Mechanics — MIT OCW 8.01SC', 'article', 'physics', 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/', 'beginner', 'MIT''s full first-year mechanics course, lectures and problem sets included.', 'prysm-curated'),
  ('Introduction to Astrophysics', 'article', 'physics', 'https://www.astronomy.ohio-state.edu/pogge.1/Ast162/', 'intermediate', 'Richard Pogge''s lecture notes — readable, and free of hand-waving.', 'prysm-curated'),
  ('Inventing on Principle', 'video', 'computer science', 'https://www.youtube.com/watch?v=dpw9EHDh2bM', 'intermediate', 'Bret Victor on building tools where you can see what you are making respond immediately.', 'prysm-curated')
  RETURNING id, title, topic, depth_level
),
new_bundles AS (
  INSERT INTO bundles (title, topic, description)
  VALUES
  ('React Hooks, properly', 'react hooks', '[curated] From your first useState to knowing when memoisation is a false economy.'),
  ('Machine Learning from scratch', 'machine learning', '[curated] Intuition, then the maths, then the paper that changed everything.'),
  ('Deep Learning, seriously', 'deep learning', '[curated] Past the tutorials and into how these systems actually behave.'),
  ('Quantum Computing without the hype', 'quantum computing', '[curated] Two resources that respect your time and do not oversell the field.'),
  ('The Stoics, unabridged', 'stoicism', '[curated] The primary sources, plus the scholarship to read them against.'),
  ('Designing systems that hold', 'systems design', '[curated] The map, the vocabulary, and the algorithms underneath.'),
  ('Databases, from query to disk', 'databases', '[curated] Write SQL, then understand what the planner does with it.'),
  ('A computer science education', 'computer science', '[curated] Four free courses that together beat most degrees.'),
  ('Learning Rust', 'rust', '[curated] The Book, then the exercise that makes ownership click.'),
  ('Thinking clearly', 'epistemology', '[curated] Knowledge, risk, and doubt — from Descartes to Kahneman.')
  RETURNING id, topic
)
INSERT INTO bundle_items (bundle_id, content_item_id, position)
SELECT
  b.id,
  i.id,
  ROW_NUMBER() OVER (
    PARTITION BY b.id
    ORDER BY CASE i.depth_level
      WHEN 'beginner' THEN 1
      WHEN 'intermediate' THEN 2
      ELSE 3
    END,
    i.id
  )
FROM new_bundles b
JOIN new_items i ON i.topic = b.topic;

COMMIT;
