// Build API URLs and provide a resilient fetch helper that tries multiple bases.
// Priority:
// 1) REACT_APP_API_URL (recommended to set in Vercel env vars)
// 2) https://<VERCEL_URL> (if provided at build time)
// 3) window.location.origin (same origin)
// 4) window.location.origin + '/api'
// 5) http://localhost:8000 (local dev fallback)

const normalize = (u) => (u ? u.replace(/\/+$/, "") : "");

const getBaseCandidates = () => {
  const candidates = [];
  // Use environment variable if available (Create React App injects process.env at build time)
  // eslint-disable-next-line no-undef
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) {
    // eslint-disable-next-line no-undef
    candidates.push(normalize(process.env.REACT_APP_API_URL));
  } else if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.REACT_APP_API_URL) {
    candidates.push(normalize(import.meta.env.REACT_APP_API_URL));
  }
  // eslint-disable-next-line no-undef
  if (typeof process !== "undefined" && process.env && process.env.VERCEL_URL) {
    // eslint-disable-next-line no-undef
    candidates.push(`https://${normalize(process.env.VERCEL_URL)}`);
  }
  if (typeof window !== "undefined" && window.location) {
    candidates.push(window.location.origin);
    candidates.push(`${window.location.origin}/api`);
  }
  candidates.push("http://localhost:8000");
  // Dedupe while preserving order
  return [...new Set(candidates)];
};

export const apiUrl = (path = "") => {
  const candidates = getBaseCandidates();
  const base = candidates[0] || "";
  if (!path.startsWith("/")) path = `/${path}`;
  return `${normalize(base)}${path}`;
};

// Try each candidate until a non-404 response or network error that should abort.
// Returns the first successful Response (including 4xx/5xx other than 404) or throws the last error.
export async function apiFetch(path = "", options = {}) {
  if (!path.startsWith("/")) path = `/${path}`;
  const candidates = getBaseCandidates();
  let lastError = null;

  for (const base of candidates) {
    const url = `${normalize(base)}${path}`;
    try {
      // small debug log to help Vercel debugging
       
      console.debug(`[apiFetch] trying ${url}`);
      const resp = await fetch(url, options);
      if (resp.status === 404) {
        // try next candidate
         
        console.debug(`[apiFetch] 404 from ${url}, trying next candidate`);
        lastError = new Error(`404 from ${url}`);
        continue;
      }
      // return any other response (including 2xx/3xx/4xx/5xx except 404)
      return resp;
    } catch (err) {
      // network error - try next candidate
       
      console.debug(`[apiFetch] network error for ${url}:`, err);
      lastError = err;
      continue;
    }
  }

  // All candidates exhausted
  console.error(`[apiFetch] all base candidates failed for ${path}`, lastError);
  throw lastError || new Error("apiFetch: no base candidates available");
}

export default apiUrl;
