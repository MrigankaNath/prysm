const { isRelevant } = require("./relevance");

async function fetchGithub(topic) {
  /* No `sort=stars`. Sorting by stars asks for "the most-starred repo
     containing any of these words", which is not the same question: measured,
     it ranked rust-lang/rust *fifth* for "rust" behind claw-code and
     cc-switch, and returned supabase, prometheus and coolify for "databases" —
     none of them about databases as a subject. GitHub's default relevance
     ordering is the one that answers the question actually being asked.
     Forks and archived repos are excluded because neither is somewhere to
     send a reader. */
  const q = `${topic} fork:false archived:false`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=8`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Prysm/1.0",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items
    .filter((repo) =>
      isRelevant(`${repo.full_name} ${repo.description || ""}`, topic),
    )
    .slice(0, 5)
    .map((repo) => ({
      title: repo.full_name,
      url: repo.html_url,
      source: "github",
      type: "code",
      signal: repo.stargazers_count || 0,
      snippet: repo.description || `${repo.stargazers_count} stars`,
      published_at: repo.updated_at,
      thumbnail: repo.owner?.avatar_url || null,
    }));
}

module.exports = { fetchGithub };
