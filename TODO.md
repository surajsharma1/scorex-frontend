# ScoreX Frontend UI Fixes TODO

## Plan Overview
Fix profile theme consistency, improve match sections arrangement/selection, add mobile horizontal scrolling to tabs/features, polish tournament selection flow, rearrange admin tab for responsiveness.

**Current Step: 7/9**

## Steps
- [x] 1. Update Profile.tsx to use CSS theme vars, add blur/shadows/responsiveness  
- [x] 2. Test Profile
- [x] 3. Enhance TournamentView.tsx matches tab: better card grid, mobile layout, selection preview
- [x] 4. Add mobile horizontal scroll to TournamentView tabs
- [x] 5. Update Dashboard.tsx live matches: horizontal mobile scroll, consistent cards
- [x] 6. Polish AdminPanel.tsx: responsive grids, mobile tab scroll, spacing/shadows
- [ ] 7. Test all pages mobile/desktop (npm run dev)
- [x] 8. Fix TournamentView mobile header overlap (collapsible/select hide)

- [ ] 9. Complete


**Notes**
- Theme: Use var(--bg-card), --text-primary, backdrop-blur-xl, rounded-3xl everywhere
- Mobile scroll: flex overflow-x-auto snap-mandatory scrollbar-thin pb-2
- Matches: Ensure team names, score, status, venue prominent; hover select glow
- Test command: cd scorex-frontend/scorex-frontend && npm run dev

