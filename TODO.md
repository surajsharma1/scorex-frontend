# Tournament Dashboard Redesign TODO

## Plan Overview
- Remove second sidebar (left TournamentList panel) from TournamentView.tsx
- Add compact top tournament selector (dropdown/button for mobile)
- Restyle all 5 tabs (overview, matches, teams, overlays, leaderboard) to match Dashboard's glassmorphism/gradient card style
- Ensure mobile-friendly, simple sidebar only (main Sidebar.tsx)

## Steps
- [x] 1. Confirm App.tsx layout ✅ (Sidebar + Outlet confirmed)
- [x] 2. Review TeamManagement/OverlayManager styling ✅

- [ ] 3. Edit TournamentView.tsx: remove left panel, add selector, restyle tabs
- [ ] 4. Update embedded components for consistency
- [ ] 5. Test mobile/desktop (`npm run dev`)
- [ ] 6. Complete

**Progress: Starting step 1**
