import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  // Load environment variables for this mode
  const env = loadEnv(mode, __dirname, '')
  const localApi = env.LOCAL_API
  const prodApi = env.VITE_API_URL || 'https://mech-shop-api.onrender.com'

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      // Make the dev server listen on all network interfaces
      host: true,
      // Proxy /api to either a local API (set LOCAL_API env var) or the production API
      proxy: {
        '/api': {
          target: localApi || prodApi,
          changeOrigin: true,
          // Allow insecure local HTTPS targets (self-signed certs)
          secure: false,
          // Strip the /api prefix so the backend receives /mechanics/login (not /api/mechanics/login)
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  })
}
