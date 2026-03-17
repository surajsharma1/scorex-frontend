# TournamentView.tsx Build Fix TODO

## Plan Breakdown:
1. ✅ **Create TODO.md** - Track progress
2. 🔄 **Read file again** - Confirm current state around error lines
3. ✏️ **Edit 1: Remove duplicate Tournament selector modal JSX** (lines ~320-400)
4. ✏️ **Edit 2: Fix statusMenu dropdown in matches.map** (lines ~750-760) - balance braces
5. ✏️ **Edit 3: Move outer click handler** inside main return JSX, before final div close
6. ✏️ **Edit 4: Balance all tab conditionals** and div tags
7. ✅ **Test**: `cd scorex-frontend/scorex-frontend && npm run build`
8. 🔄 **If passes**: `npm run preview`
9. ✅ **attempt_completion** with success message

**Current Step: 2/9 - Re-read file for precise edit strings**

Progress: 5/9 complete - Applied initial structural edits. Build still failing at tab content and map closure. Next: precise JSX balancing.
