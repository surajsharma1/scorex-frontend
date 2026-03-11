# TypeScript Build Fixes

## Task 1: Fix TypeScript Build Errors (55 errors)

### Files to fix:
1. **clubController.ts** - 2 errors (string vs ObjectId)
2. **friendController.ts** - 16 errors (IFriend has wrong fields: user/friend vs requester/recipient)
3. **leaderboardController.ts** - 9 errors (scorecard doesn't exist)
4. **matchController.ts** - 3 errors (outType, static methods)
5. **overlayController.ts** - 11 errors (IOverlay missing fields)
6. **teamController.ts** - 3 errors (string vs ObjectId, static methods)
7. **tournamentController.ts** - 6 errors (static methods)
8. **routes/users.ts** - 4 errors (req.user.id)
9. **utils/cache.ts** - 1 error (return type)

## Task 2: Tournament Form API Errors

- Frontend updated to not send locationType/type fields
- Let backend use defaults

## Priority:
1. Fix Friend model (IFriend) - this affects 16 errors
2. Fix other controller/model mismatches

