import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
  // Load environment variables from the project root
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), "");

  // Use LOCAL_API only when explicitly set
  const localApi = env.LOCAL_API || "";
  const prodApi = env.VITE_API_URL || "https://mech-shop-api.onrender.com";

  // VITE_USE_LOCAL can be set to "1" or "true" to force using local backend (even if LOCAL_API is empty)
  const useLocalEnv =
    String(env.VITE_USE_LOCAL || "").toLowerCase() === "1" ||
    String(env.VITE_USE_LOCAL || "").toLowerCase() === "true";

  // Choose proxy target:
  // - production builds -> production API
  // - development -> use local backend only if LOCAL_API provided or VITE_USE_LOCAL set; otherwise use prodApi to avoid proxying to an unstarted localhost.
  const proxyTarget =
    mode === "production"
      ? prodApi
      : useLocalEnv
      ? localApi || "http://localhost:5000"
      : localApi || prodApi;

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      // Bind to localhost only so Vite does not display the Network URL
      host: "localhost",
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          // Allow insecure local HTTPS targets (self-signed certs)
          secure: false,
          // Enable websocket proxying
          ws: true,
          // timeouts to fail faster and surface errors
          proxyTimeout: 10_000,
          timeout: 10_000,
          // Strip the /api prefix so the backend receives /mechanics/login (not /api/mechanics/login)
          rewrite: (path) => path.replace(/^\/api/, ""),
          // Provide a configure hook to log connection errors (ECONNREFUSED) clearly
          configure: (proxy) => {
            // Log the chosen proxy target at startup
            console.log(
              `[vite] proxy target for /api => ${proxyTarget} (mode=${mode})`
            );
            if (mode !== "production" && !useLocalEnv && !localApi) {
              console.warn(
                `[vite] LOCAL_API not set and VITE_USE_LOCAL is not enabled; dev proxy will forward to production API (${proxyTarget}).\n` +
                  `  If you want to proxy to a local backend, set LOCAL_API=http://localhost:5000 or set VITE_USE_LOCAL=1 in your .env.\n` +
                  `  Alternatively start your backend on the production API host/port or configure LOCAL_API to match your running backend.`
              );
            } else if (mode !== "production" && useLocalEnv && !localApi) {
              console.log(
                `[vite] VITE_USE_LOCAL enabled, defaulting local proxy target to http://localhost:5000`
              );
            }

            proxy.on("error", (err, req) => {
              const target = proxyTarget;
              console.error(
                `\n[Vite proxy] Error connecting to target ${target} for request ${req?.method} ${req?.url}\n` +
                  `  Error: ${err && err.message ? err.message : err}\n` +
                  `  Suggestion: ensure your backend is running at ${target} (e.g. 'flask run' or set LOCAL_API) and that the port is correct.\n`
              );
            });
          },
        },
      },
    },
  });
};
