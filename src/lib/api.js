// Helper to choose API base depending on environment.
export function apiBase() {
  const prod = import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return '/api';
  return prod || '';
}

export function apiUrl(path) {
  const base = apiBase();
  if (!base) return path;
  if (base.endsWith('/') && path.startsWith('/')) return base.slice(0, -1) + path;
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
  return `${base}${path}`;
}
