async function fetchGithub(topic) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(topic)}&sort=stars&order=desc&per_page=5`;
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

  return items.map((repo) => ({
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
