import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxyTarget = process.env.VITE_PROXY_API_TARGET || 'http://127.0.0.1:5000'

const apiProxy = {
  '/api': {
    target: apiProxyTarget,
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Keep local dev root (`/`) unchanged; use repository base path only for production builds.
  base: command === 'build' ? '/skill-exchange-platform/' : '/',
  plugins: [react(), tailwindcss()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
}))
