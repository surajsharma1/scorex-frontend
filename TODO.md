# Tournament Mobile Responsiveness Fix
## Status: In Progress

### Steps:
- [x] 1. Add `isMobileTournamentOpen` state to TournamentView.tsx (default true)
- [x] 2. Update left tournament list panel classes: `fixed md:static inset-y-0 left-0 z-40 transform transition-transform w-full h-full md:w-72 md:h-auto ${isMobileTournamentOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`
- [x] 3. Add mobile backdrop div when `isMobileTournamentOpen`: fixed inset-0 z-30 bg-black/50 md:hidden onClick close
- [x] 4. Add hamburger toggle button in header visible md:hidden, controls `isMobileTournamentOpen`
- [x] 5. In tournament select onClick: if selected && window.innerWidth < 768, set isMobileTournamentOpen(false)
- [x] 6. Add back button to list when !selected or toggle to open list
- [ ] 7. Adjust header z-index/sticky: lower or conditional
- [ ] 8. Test mobile view: list collapses, no overlap, add tournament accessible
- [ ] 9. Mark complete
- [ ] 7. Adjust header z-index/sticky: lower or conditional
- [ ] 8. Test mobile view: list collapses, no overlap, add tournament accessible
- [ ] 9. Mark complete

Current task: Fix tournament name bar overlap on mobile by making tournament list collapsible like sidebar.

