// Helper to choose API base depending on environment.
export function apiBase() {
  const prod = import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return '/api';
  return prod || '';
}

export function apiUrl(path) {
  const base = apiBase();
  let finalUrl;
  if (!base) {
    finalUrl = path;
  } else if (base.endsWith('/') && path.startsWith('/')) {
    finalUrl = base.slice(0, -1) + path;
  } else if (!base.endsWith('/') && !path.startsWith('/')) {
    finalUrl = `${base}/${path}`;
  } else {
    finalUrl = `${base}${path}`;
  }
  
  return finalUrl;
}
