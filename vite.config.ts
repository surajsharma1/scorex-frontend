import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable sourcemap for better debugging
    minify: 'terser',
    rollupOptions: {
      output: {
        // Simplified chunking - let Vite handle chunking automatically
        // This can help avoid issues with manual chunking causing import issues
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
