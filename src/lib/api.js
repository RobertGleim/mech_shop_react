/* eslint-disable no-undef */
const normalize = (u) => (u ? u.replace(/\/+$/, "") : "");

const getBaseCandidates = () => {
  const candidates = [];

  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL
  ) {
    candidates.push(normalize(import.meta.env.VITE_API_URL));
  }

  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL
  ) {
    candidates.push(normalize(process.env.REACT_APP_API_URL));
  } else if (typeof window !== "undefined" && window.REACT_APP_API_URL) {
    candidates.push(normalize(window.REACT_APP_API_URL));
  }

  if (
    typeof process !== "undefined" &&
    process.env &&
    (process.env.VERCEL_URL ||
      (typeof window !== "undefined" && window.VERCEL_URL))
  ) {
    const vercelUrl =
      process.env.VERCEL_URL ||
      (typeof window !== "undefined" ? window.VERCEL_URL : undefined);
    if (vercelUrl) {
      candidates.push(`https://${normalize(vercelUrl)}`);
    }
  }

  if (typeof window !== "undefined" && window.location) {
    candidates.push(window.location.origin);
    candidates.push(`${window.location.origin}/api`);
  }
  candidates.push("http://localhost:8000");
  return [...new Set(candidates)];
};

export const apiUrl = (path = "") => {
  const candidates = getBaseCandidates();
  const base = candidates[0] || "";
  if (!path.startsWith("/")) path = `/${path}`;
  return `${normalize(base)}${path}`;
};

export async function apiFetch(path = "", options = {}) {
  if (!path.startsWith("/")) path = `/${path}`;
  const candidates = getBaseCandidates();
  let lastError = null;

  for (const base of candidates) {
    const url = `${normalize(base)}${path}`;
    try {
      const resp = await fetch(url, options);
      if (resp.status === 404) {
        // try next candidate
        lastError = new Error(`404 from ${url}`);
        continue;
      }
      // return any other response (including 2xx/3xx/4xx/5xx except 404)
      return resp;
    } catch (err) {
      // network error - try next candidate
      lastError = err;
      continue;
    }
  }

  // All candidates exhausted
  throw lastError || new Error("apiFetch: no base candidates available");
}

export default apiUrl;
