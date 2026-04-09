# Fix Vercel Frontend Build Failure (prebuild script ESM error)

**Status**: Planned → Implementation

## Problem
Vercel `npm run build` fails at `prebuild: node scripts/copy-overlays.js`:
```
ReferenceError: require is not defined in ES module scope
```
- package.json has `"type": "module"`
- Script uses CommonJS `require('fs')`

## Plan (Approved ✅)
1. [x] **Edit package.json**: Updated `prebuild` to no-op echo, kept `build` chain (safe migration)

   - Vite auto-copies `public/overlays/` → `dist/overlays/`
2. [ ] **Test local build**: `npm run build` → verify `dist/public/overlays/` populated
3. [ ] **Test preview**: `npm run preview` → `/overlays/lvl1-classic-test.html` loads
4. [ ] **Push to main** → Vercel redeploys (use vercel.json headers)
5. [ ] **Verify deployment**: https://scorex-frontend.vercel.app/overlays/... no-cache works

## Why Remove Script?
- Redundant: Vite handles public/ assets.
- Timing: `dist/` doesn't exist pre-vite build.
- vercel.json expects `/overlays/` from `dist/`.

**Next**: package.json edit → mark [x]

