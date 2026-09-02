/* Outbound HTTP for the source adapters.
 *
 * Node's fetch has no default timeout, and eight of the eleven adapters set
 * none — so a single upstream hanging held a request, and its Tavily quota
 * check, open indefinitely.
 */

const TIMEOUT_MS = 8000;

/* Wikipedia rejects the default user agent of most HTTP clients outright, and
   several other APIs rate-limit it harder. */
const USER_AGENT = "Prysm/1.0 (+https://github.com/MrigankaNath/prysm)";

async function request(url, { method = "GET", headers, body, label = "Upstream" } = {}) {
  const res = await fetch(url, {
    method,
    headers: { "User-Agent": USER_AGENT, ...headers },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`${label} returned ${res.status}`);
  return res;
}

async function getJson(url, options) {
  return (await request(url, options)).json();
}

async function getText(url, options) {
  return (await request(url, options)).text();
}

async function postJson(url, payload, options = {}) {
  const res = await request(url, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

module.exports = { getJson, getText, postJson, hostOf, USER_AGENT };
