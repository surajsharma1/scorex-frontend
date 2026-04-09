#!/usr/bin/env node
/**
 * Pre-build script: Ensure overlays copied to dist/overlays for Vite
 * Run before vite build to guarantee static files in output
 */

const fs = require('fs');
const path = require('path');

const overlaysSrc = path.join(__dirname, '../public/overlays');
const overlaysDist = path.join(__dirname, '../dist/overlays');

// Ensure dist/overlays dir
if (!fs.existsSync(overlaysDist)) {
  fs.mkdirSync(overlaysDist, { recursive: true });
  console.log('📁 Created dist/overlays/');
}

// Copy if source exists
if (fs.existsSync(overlaysSrc)) {
  fs.readdirSync(overlaysSrc).forEach(file => {
    const src = path.join(overlaysSrc, file);
    const dst = path.join(overlaysDist, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dst);
      console.log(`📄 Copied ${file} to dist/overlays`);
    }
  });
  console.log('✅ Overlays copied to dist/overlays for Vite');
} else {
  console.log('⚠️ public/overlays source not found');
}

console.log('🎬 Pre-build copy complete');

