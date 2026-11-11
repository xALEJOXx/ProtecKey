import { monitorProxy } from "./monitor-proxy.js";
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'serve' ? [monitorProxy()] : [])],

  server: {
    host: '0.0.0.0',
    port: 5173,

    proxy: {
      '/ws': {
        target: process.env.API_GATEWAY_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
      },

      '/api/ml/stats': {
        target: process.env.API_GATEWAY_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const token = process.env.LIVE_HISTORY_TOKEN;
            if (token) {
              proxyReq.setHeader('X-History-Token', token);
            }
          });
        },
      },

      '/api/ml/predictions': {
        target: process.env.API_GATEWAY_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const token = process.env.LIVE_HISTORY_TOKEN;
            if (token) {
              proxyReq.setHeader('X-History-Token', token);
            }
          });
        },
      },
'/api/ml/history': {
        target: process.env.API_GATEWAY_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const token = process.env.LIVE_HISTORY_TOKEN;
            if (token) {
              proxyReq.setHeader('X-History-Token', token);
            }
          });
        },
      },
      '/api/live/history': {
        target: process.env.API_GATEWAY_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,

        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const token = process.env.LIVE_HISTORY_TOKEN

            if (token) {
              proxyReq.setHeader('X-History-Token', token)
            }
          })
        },
      },

      '/api': {
        target: process.env.API_GATEWAY_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
}))
