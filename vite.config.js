import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  // Load environment variables from the project root
  const env = loadEnv(mode, process.cwd(), '')

  // Use LOCAL_API only when explicitly set; otherwise leave empty
  const localApi = env.LOCAL_API || ''
  const prodApi = env.VITE_API_URL || 'https://mech-shop-api.onrender.com'

  // Choose proxy target:
  // - production builds -> production API
  // - development -> LOCAL_API if provided, otherwise fall back to prodApi
  //   (this avoids proxying to an unstarted localhost backend)
  const proxyTarget = mode === 'production' ? prodApi : (localApi || prodApi)

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      // Bind to localhost only so Vite does not display the Network URL
      host: 'localhost',
      // Proxy /api to either a local API (set LOCAL_API env var) or the production API
      proxy: {
        '/api': {
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
          rewrite: (path) => path.replace(/^\/api/, ''),
          // Provide a configure hook to log connection errors (ECONNREFUSED) clearly
          configure: (proxy, options) => {
            // Log the chosen proxy target at startup
            // eslint-disable-next-line no-console
            console.log(`[vite] proxy target for /api => ${proxyTarget} (mode=${mode})`)
            if (mode !== 'production' && !localApi) {
              // eslint-disable-next-line no-console
              console.warn(`[vite] LOCAL_API not set; dev proxy will forward to production API (${proxyTarget}). Set LOCAL_API in .env to point to your local backend if you want to proxy locally.`)
            }

            proxy.on('error', (err, req, res) => {
              const target = proxyTarget
              // eslint-disable-next-line no-console
              console.error(
                `\n[Vite proxy] Error connecting to target ${target} for request ${req?.method} ${req?.url}\n` +
                `  Error: ${err && err.message ? err.message : err}\n` +
                `  Suggestion: ensure your backend is running at ${target} if you expect a local server, or set LOCAL_API to the correct URL.\n`
              )
            })
          }
        }
      }
    }
  })
}
