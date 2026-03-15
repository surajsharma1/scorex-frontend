# Fix TypeScript Build Errors - npm run build (53 errors)

## Plan Progress Tracker
- [x] **Step 1: Create this TODO.md** (Complete)

## Detailed Steps (Approved Plan)

### Phase 1: Core Fixes (High Impact)
- [ ] **Step 2: Update src/services/api.ts** - Add missing clubAPI/friendAPI methods + teamAPI.getTeams(tournamentId?: string)
- [ ] **Step 3: Update src/components/types.ts** - Extend Friend.from/to (User|string), LeaderboardEntry.stats, CreatedOverlay (publicId/urlExpiresAt/createdAt), Message.read, status unions (+'ongoing')

### Phase 2: Component Fixes (Batch by Error Type)
- [ ] **Step 4: Fix API response shapes** - LiveMatches.tsx, OverlayEditor.tsx, OverlayForm.tsx, TournamentStats.tsx (data.matches → (data.data || data)?.matches || [])
- [ ] **Step 5: Fix FriendList.tsx** - getOtherUser handle string|User, user?. props safe
- [ ] **Step 6: Fix type accesses** - Leaderboard.entry?.stats||{}, TournamentDetail startDate, Register res.data.token/user
- [ ] **Step 7: Fix status/args** - MatchDetails/TournamentList 'ongoing'→'live', TeamManagement/TournamentView teamAPI calls
- [ ] **Step 8: Minor** - MessageChat read:false (now typed), TournamentView Team.tournament→tournamentId

### Phase 3: Verify
- [ ] **Step 9: Run `cd scorex-frontend/scorex-frontend && npm run build`** - Confirm 0 errors
- [ ] **Step 10: attempt_completion** - Task complete!

**Next Action:** Update TODO after each step. Expected: Clean build after Phase 2.

**Files Impacted:** api.ts, types.ts + 14 components (minimal diffs).

