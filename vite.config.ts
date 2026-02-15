import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable sourcemap for better debugging
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for node_modules
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
                      }
            // Charts
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'chart-vendor';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'lucide-vendor';
            }
            // i18n
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n-vendor';
            }
            // Drag and drop
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor';
            }
            // WebSocket
            if (id.includes('socket.io-client')) {
              return 'socket-vendor';
            }
            // PWA/Workbox
            if (id.includes('workbox')) {
              return 'workbox-vendor';
            }
            // Analytics
            if (id.includes('@vercel/analytics')) {
              return 'analytics-vendor';
            }
            // Axios and other HTTP
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            // Other vendor code
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 3000
  },
  css: {
    devSourcemap: false,
  },
});
