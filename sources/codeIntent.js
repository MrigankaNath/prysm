/* Repos are only useful when the topic is something you'd actually write or
   read code for. "quantum computing" and "astrophysics" profile as technical,
   but nobody exploring those wants a repo list — they want the explanation.
   So Code is gated on the topic naming a language, tool, or software practice.

   Matching is whole-word, not substring: "cli" inside "climate science" and
   "java" inside "javascript" both false-positived when this used includes().
   Extending either list is a one-line edit. */
const CODE_WORDS = new Set([
  // languages
  "python", "javascript", "typescript", "js", "ts", "rust", "go", "golang",
  "java", "kotlin", "swift", "ruby", "php", "scala", "haskell", "elixir",
  "clojure", "lua", "c", "c++", "c#", "perl", "dart", "zig", "ocaml",
  "erlang", "solidity", "sql", "bash", "shell",
  // runtimes, frameworks, libraries
  "react", "vue", "angular", "svelte", "nextjs", "next.js", "nuxt", "node",
  "nodejs", "deno", "bun", "django", "flask", "rails", "laravel", "spring",
  "express", "fastapi", "pytorch", "tensorflow", "numpy", "pandas", "jax",
  "keras", "langchain", "tailwind", "webpack", "vite", "graphql", "prisma",
  "postgres", "postgresql", "mysql", "sqlite", "redis", "mongodb",
  // tools and practice
  "git", "docker", "kubernetes", "k8s", "terraform", "ansible", "linux",
  "regex", "api", "apis", "sdk", "cli", "compiler", "compilers",
  "interpreter", "debugging", "devops", "microservices", "webassembly",
  "wasm", "kernel", "database", "databases",
  // the craft itself
  "programming", "coding", "code", "software", "developer", "development",
  "frontend", "backend", "fullstack", "algorithm", "algorithms", "hooks",
  "refactoring", "scripting", "testing",
]);

/* Multi-word topics where the artifact people want really is a repo. */
const CODE_PHRASES = [
  "system design",
  "data structure",
  "design pattern",
  "machine learning",
  "deep learning",
  "neural network",
  "computer vision",
  "web dev",
  "open source",
  "unit test",
  "code review",
  "operating system",
  "distributed system",
];

function demandsCode(topic) {
  const lower = topic.toLowerCase();
  if (CODE_PHRASES.some((phrase) => lower.includes(phrase))) return true;

  return lower
    .split(/[\s,/]+/)
    .some((token) => CODE_WORDS.has(token.replace(/^[^a-z0-9+#.]+|[^a-z0-9+#.]+$/g, "")));
}

module.exports = { demandsCode };
