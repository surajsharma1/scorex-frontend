# TypeScript Build Errors Fix Plan

## Summary
55 TypeScript errors across 9 files in the cricket tournament backend.

## Error Breakdown by File

### 1. src/controllers/friendController.ts (16 errors)
**Root Cause**: Friend model has `requester` and `recipient` fields, but controller code uses `user` and `friend`
- Model: `requester`, `recipient`
- Controller expects: `user`, `friend`

**Fix**: Update controller to use correct field names (`requester`, `recipient`)

### 2. src/controllers/clubController.ts (2 errors)
**Root Cause**: String being pushed to ObjectId array
- Line 311: `club.members.push(userId)` 
- Line 355: `club.viceLeaders.push(userId)`

**Fix**: Already partially fixed - needs ObjectId casting like:
```typescript
club.members.push(new mongoose.Types.ObjectId(userId));
```

### 3. src/controllers/leaderboardController.ts (9 errors)
**Root Cause**: Using `match.scorecard` but Match model uses `scorerId` field
- Line 144: `match.scorecard` doesn't exist
- Line 200: `player.photo` may not exist on player type

**Fix**: Remove scorecard references OR add scorecard to Match model

### 4. src/controllers/matchController.ts (3 errors)
- Line 297: BallData `outType` is string but should be `OutType`
- Lines 531, 548: Static methods `getLiveMatches` and `getUpcoming` not defined on model

**Fix**: Add proper typing, ensure static methods are defined

### 5. src/controllers/overlayController.ts (11 errors)
**Root Cause**: Using properties not in IOverlay interface
- `template`, `publicId`, `urlExpiresAt`, `membershipAtCreation`, `config`, `match`

**Fix**: Add missing properties to Overlay model OR update controller

### 6. src/controllers/teamController.ts (3 errors)
- Line 284: `removePlayer` expects ObjectId but receives string
- Lines 334, 359: Static methods `getByOwner` and `search` not on model

**Fix**: Cast playerId to ObjectId, add static methods

### 7. src/controllers/tournamentController.ts (6 errors)
- Line 340: `removeTeam` expects ObjectId but receives string  
- Lines 57, 73, 90, 509, 534: Static methods not on model

**Fix**: Cast teamId to ObjectId, add static methods

### 8. src/routes/users.ts (4 errors)
- Lines 63, 78, 108, 120: Using `req.user?.id` but should use `req.user?._id`

**Fix**: Change to use `req.user?._id` for MongoDB queries

### 9. src/utils/cache.ts (1 error)
- Line 62: Return type mismatch

**Fix**: Ensure proper return type annotation

---

## Recommended Fixes (Priority Order)

### Priority 1: Quick Fixes
1. **routes/users.ts**: Change `req.user?.id` to `req.user?._id` (4 errors)

### Priority 2: Model/Controller Alignment
2. **friendController.ts**: Update to use `requester`/`recipient` instead of `user`/`friend` (16 errors)
3. **clubController.ts**: Ensure ObjectId casting (2 errors fixed already)

### Priority 3: Add Missing Static Methods
4. **Match model**: Add `getLiveMatches()`, `getUpcoming()` static methods
5. **Team model**: Add `getByOwner()`, `search()` static methods  
6. **Tournament model**: Add `getUpcoming()`, `getOngoing()`, `getFeatured()`, `getByOrganizer()`, `search()` static methods

### Priority 4: Remove/Update Invalid References
7. **leaderboardController.ts**: Remove `match.scorecard` references (or add scorecard to Match)
8. **overlayController.ts**: Add missing properties to IOverlay OR update controller
9. **matchController.ts**: Fix BallData type

---

## Files to Edit
1. `src/routes/users.ts` - Fix req.user?.id → req.user?._id
2. `src/controllers/friendController.ts` - Use requester/recipient
3. `src/models/Match.ts` - Add static methods
4. `src/models/Team.ts` - Add static methods  
5. `src/models/Tournament.ts` - Add static methods
6. `src/models/Overlay.ts` - Add missing properties
7. `src/controllers/leaderboardController.ts` - Remove scorecard refs
8. `src/controllers/overlayController.ts` - Update property refs
9. `src/controllers/matchController.ts` - Fix typing
10. `src/utils/cache.ts` - Fix return type

