import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    target: 'es2022'
  },
    server: {
    headers: [{
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://scorex-backend.onrender.com https://cdn.jsdelivr.net https://fonts.googleapis.com http://localhost:5000; connect-src 'self' https://scorex-backend.onrender.com wss://scorex-backend.onrender.com http://localhost:5000 ws://localhost:5000; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; frame-src 'self' https://www.youtube.com https://player.twitch.tv;"
    }],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios', 'socket.io-client'],
          ui: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 800
  },
  vercel: {
    headers: [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://scorex-backend.onrender.com https://cdn.jsdelivr.net https://fonts.googleapis.com; connect-src 'self' https://scorex-backend.onrender.com wss://scorex-backend.onrender.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; frame-src 'self' https://www.youtube.com https://player.twitch.tv;"
          }
        ]
      }
    ]
  }
})

