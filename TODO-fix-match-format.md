# TODO: Fix Match ID Format Error

## Issue
- Request to `/api/v1/matches/undefined/score` returns 400 "Invalid ID format"
- Frontend sends undefined match ID in the URL when matchId is not available
- Backend route mismatch: frontend calls PUT /:id/score, backend only has POST /:id/score
- Later error: "Cast to ObjectId failed for value 'b1'" - player IDs were being sent as placeholder strings

## Task List
- [x] 1. Analyze network request and codebase to understand the issue
- [x] 2. Add validateMatchId middleware to check for undefined/invalid IDs
- [x] 3. Add auto-start logic in scoreBall to automatically start match when first ball is scored
- [x] 4. Remove broken updateMatchScore function (non-existent fields)
- [x] 5. Fix TypeScript compilation errors
- [x] 6. Fix ObjectId validation for player fields (bowler, striker, nonStriker)

## Completed Changes

### Backend (matchController.ts)
- Removed broken `updateMatchScore` function that used non-existent fields
- Added auto-start logic in `scoreBall` - automatically starts match with Team A batting first when first ball is scored

### Backend (matches.ts)
- Added validateMatchId middleware to check for undefined/null/invalid MongoDB ObjectIds
- Removed PUT /:id/score route (the broken function)
- Kept only POST /:id/score for ball-by-ball scoring

### Backend (Match.ts model)
- Changed bowler, striker, nonStriker fields from ObjectId to Mixed type
- Now accepts both MongoDB ObjectIds and string names (e.g., "b1", "p1", "p2")
- Updated IBall interface to accept Types.ObjectId | string

### How it works now:
1. User creates a match → Status is "Scheduled"
2. User navigates to live scoring → Uses POST /api/v1/matches/:id/score
3. First ball scored → Backend auto-starts the match (Team A bats first)
4. Subsequent balls work normally

## Error Handling
- Missing/undefined match IDs → Returns 400 "Match ID is required and cannot be undefined"
- Invalid MongoDB ObjectId format → Returns 400 "Invalid Match ID format"
- Match not found → Returns 404 "Match not found"
- Invalid player IDs → Now accepts string names as fallback

## DEPLOYMENT REQUIRED
The fix requires deploying the backend to Render for the changes to take effect.

