// Build a full API URL for fetch calls.
// Priority:
// 1) REACT_APP_API_URL (set in Vercel env / .env)
// 2) VERCEL_URL (build-time Vercel hostname) -> assumes API is at https://VERCEL_URL/api
// 3) window.location.origin + '/api' (same-origin /api path)
// 4) fallback to http://localhost:8000
const normalize = (u) => (u ? u.replace(/\/+$/, "") : u);

const getBase = () => {
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) {
    return normalize(process.env.REACT_APP_API_URL);
  }
  // Vercel provides VERCEL_URL at build time (example: "my-app.vercel.app")
  if (typeof process !== "undefined" && process.env && process.env.VERCEL_URL) {
    return `https://${normalize(process.env.VERCEL_URL)}/api`;
  }
  if (typeof window !== "undefined" && window.location) {
    // Default to same-origin under /api so frontend and backend can be colocated
    return `${window.location.origin}/api`;
  }
  return "http://localhost:8000";
};

export const apiUrl = (path = "") => {
  const base = getBase();
  if (!path.startsWith("/")) path = `/${path}`;
  return `${normalize(base)}${path}`;
};

export default apiUrl;
