# ScoreX Frontend UI Fixes TODO

## Plan Overview
Fix profile theme consistency, improve match sections arrangement/selection, add mobile horizontal scrolling to tabs/features, polish tournament selection flow, rearrange admin tab for responsiveness.

**Current Step: 1/7**

## Steps
- [x] 1. Update Profile.tsx to use CSS theme vars, add blur/shadows/responsiveness
- [ ] 2. Test: cd scorex-frontend/scorex-frontend && npm run dev; check /profile

- [ ] 3. Enhance TournamentView.tsx matches tab: better card grid, mobile layout, selection preview
- [ ] 4. Add mobile horizontal scroll to TournamentView tabs (overflow-x-auto snap-x)
- [ ] 5. Update Dashboard.tsx live matches: horizontal mobile scroll, consistent cards
- [ ] 6. Polish AdminPanel.tsx: responsive grids, mobile tab scroll, spacing/shadows
- [ ] 7. Global: Sidebar/App mobile tabs scroll if needed; final test all pages mobile/desktop
- [ ] 8. Complete: attempt_completion

**Notes**
- Theme: Use var(--bg-card), --text-primary, backdrop-blur-xl, rounded-3xl everywhere
- Mobile scroll: flex overflow-x-auto snap-mandatory scrollbar-thin pb-2
- Matches: Ensure team names, score, status, venue prominent; hover select glow
- Test command: cd scorex-frontend/scorex-frontend && npm run dev

