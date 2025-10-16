// Build API URLs and provide a resilient fetch helper that tries multiple bases.
// Priority:
// 1) VITE_API_URL (set in Vercel env vars for Vite projects)
// 2) REACT_APP_API_URL (legacy, for Create React App)
// 3) https://<VERCEL_URL> (if provided at build time)
// 4) window.location.origin (same origin)
// 5) window.location.origin + '/api'
// 6) http://localhost:8000 (local dev fallback)

const normalize = (u) => (u ? u.replace(/\/+$/, "") : "");

const getBaseCandidates = () => {
  const candidates = [];
  // Vite env variable (highest priority)
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
    candidates.push(normalize(import.meta.env.VITE_API_URL));
  }
  // Legacy CRA env variable
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) {
    candidates.push(normalize(process.env.REACT_APP_API_URL));
  } else if (typeof window !== "undefined" && window.REACT_APP_API_URL) {
    candidates.push(normalize(window.REACT_APP_API_URL));
  }
  // Vercel URL
  if (
    typeof process !== "undefined" &&
    process.env &&
    (process.env.VERCEL_URL || (typeof window !== "undefined" && window.VERCEL_URL))
  ) {
    const vercelUrl =
      process.env.VERCEL_URL ||
      (typeof window !== "undefined" ? window.VERCEL_URL : undefined);
    if (vercelUrl) {
      candidates.push(`https://${normalize(vercelUrl)}`);
    }
  }
  // Same origin and /api fallback
  if (typeof window !== "undefined" && window.location) {
    candidates.push(window.location.origin);
    candidates.push(`${window.location.origin}/api`);
  }
  candidates.push("http://localhost:8000");
  return [...new Set(candidates)]; // dedupe, keep order
};

export const apiUrl = (path = "") => {
  const candidates = getBaseCandidates();
  const base = candidates[0] || "";
  if (!path.startsWith("/")) path = `/${path}`;
  return `${normalize(base)}${path}`;
};

// Try each candidate until a non-404 response or network error that should abort.
// Returns the first successful Response (including 2xx/3xx/4xx/5xx except 404) or throws the last error.
export async function apiFetch(path = "", options = {}) {
  if (!path.startsWith("/")) path = `/${path}`;
  const candidates = getBaseCandidates();
  let lastError = null;

  for (const base of candidates) {
    const url = `${normalize(base)}${path}`;
    try {
      // debug log to help diagnose Vercel 404s
       
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
