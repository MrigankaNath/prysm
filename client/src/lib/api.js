import { supabase } from "../supabaseClient";

/* Every /api route except /api/health now requires a verified bearer token, so
 * the token is attached here rather than at ~10 call sites — one place to get
 * right, and no page can forget it.
 *
 * getSession() reads the cached session and refreshes it if it has expired, so
 * a long-lived tab doesn't start 401ing mid-use.
 */
export async function apiFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = { ...(options.headers || {}) };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return fetch(`${import.meta.env.VITE_API_URL}${path}`, { ...options, headers });
}

/** Convenience for the common read: resolves to `fallback` on any non-2xx. */
export async function apiJson(path, fallback = null, options = {}) {
  try {
    const res = await apiFetch(path, options);
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}
