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
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'lucide-vendor': ['lucide-react'],
          'i18n-vendor': ['i18next', 'react-i18next'],
          // Move axios to vendor
          'axios-vendor': ['axios'],
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
