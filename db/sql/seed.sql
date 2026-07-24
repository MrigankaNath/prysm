INSERT INTO content_items (title, type, topic, url, depth_level, date_added, description, source_name) VALUES
('The Case for Space', 'podcast', 'astrophysics', 'https://example.com/case-for-space', 'beginner', '2026-07-01', 'A friendly introduction to why space exploration matters.', 'Ann Druyan'),
('Why We Don''t See Aliens', 'video', 'astrophysics', 'https://example.com/aliens', 'intermediate', '2026-07-08', 'A deep dive into the Fermi Paradox.', 'PBS Space Time'),
('Intro to General Relativity', 'article', 'astrophysics', 'https://example.com/general-relativity', 'beginner', '2026-07-05', 'The core ideas behind relativity, explained simply.', 'Veritasium'),
('Black Hole Thermodynamics Explained', 'article', 'astrophysics', 'https://example.com/black-hole-thermo', 'advanced', '2026-07-07', 'A rigorous look at black hole entropy and information.', 'Sean Carroll'),
('A Gentle Introduction to Neural Networks', 'video', 'machine-learning', 'https://example.com/neural-nets-intro', 'beginner', '2026-07-03', 'Visual, intuitive explanation of how neural nets work.', '3Blue1Brown'),
('The Transformer Architecture, Line by Line', 'article', 'machine-learning', 'https://example.com/transformers-explained', 'advanced', '2026-07-08', 'A detailed technical breakdown of transformers.', 'Jay Alammar'),
('Reinforcement Learning Weekly Roundup', 'newsletter', 'machine-learning', 'https://example.com/rl-roundup', 'intermediate', '2026-07-06', 'Curated weekly updates on RL research.', 'Import AI');

INSERT INTO bundles (title, topic, description) VALUES
('Getting Serious About Astrophysics', 'astrophysics', 'A beginner-to-advanced path for anyone starting from zero.'),
('Machine Learning Foundations', 'machine-learning', 'Start with the basics, then work up to real architecture.');

INSERT INTO bundle_items (bundle_id, content_item_id, position) VALUES
(1, 3, 1),
(1, 1, 2),
(1, 2, 3),
(1, 4, 4),
(2, 5, 1),
(2, 7, 2),
(2, 6, 3);
