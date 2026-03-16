# OverlayManager Improvements TODO

✅ 1. Dynamically load templates from public/overlays [DONE]
   - Created public/templates.json with full metadata
   - Updated OverlayManager.tsx to fetch and use dynamic templates + categories
   - Fixed TS errors, loading state

Status: In Progress - BLACKBOXAI

## 1. [ ] Dynamically load templates from public/overlays
   - Scan public/overlays/*.html files
   - Extract metadata (name, category, color) from HTML comments/attributes
   - Replace hardcoded LEVEL1/2_OVERLAYS with dynamic list
   - Fallback to hardcoded if files missing

✅ 2. [x] Add overlay config editor
   - Modal with color picker (backgroundColor), opacity slider, font family select
   - Position toggle (top/bottom), animation toggle, autoUpdate checkbox
   - Preview config changes in iframe
   - Save config to overlay creation payload

## 3. [ ] Add search/filter/sort to createdOverlays list
   - Search by name/template
   - Filter by status (active/expired), category, match
   - Sort by createdAt, name, expiresAt
   - Debounced search input

## 4. [ ] Integrate live updates via socket.io
   - Listen for match score updates
   - Auto-refresh overlay preview when scores change
   - Real-time expiry status updates
   - Use existing socket.ts service

## 5. [ ] Create missing overlay HTML template files
   - Generate all 28 templates from hardcoded list (basic HTML+CSS+JS structure)
   - Level 1: Simple scoreboards with cricket scores (team1/team2 runs/wickets/overs)
   - Level 2: Effects with animations (particles, glitch, neon)
   - Use engine.js for live data fetching via publicId

## 6. [ ] Improve error handling & UX
   - Error boundaries, toast notifications
   - Offline handling for publicUrls
   - Bulk select/delete
   - Export overlay config as JSON

## 7. [ ] Test & Deploy
   - Unit tests for new features
   - E2E test creation/preview flow
   - Verify backend compatibility
   - Production deployment check (URLs, auth)

**Next step after completion: attempt_completion**

