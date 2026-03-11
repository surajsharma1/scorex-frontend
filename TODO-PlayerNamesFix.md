# Player Names Not Showing - Fix Plan

## Issue
Player names are not showing in teams, matches, and tournaments. The data models are set up correctly but player population is failing or returning empty arrays.

## Root Causes Identified
1. Type mismatch: Backend stores `jerseyNumber` as string, frontend expects `number | string`
2. Population might fail silently when Player documents don't exist
3. Need fallback handling for empty player arrays

## Files Edited
1. `scorex-frontend/scorex-frontend/src/components/types.ts` - Fix Player interface
2. `scorex-backend/scorex-backend/src/controllers/tournamentController.ts` - Improve player population
3. `scorex-backend/scorex-backend/src/controllers/matchController.ts` - Ensure player population works
4. `scorex-backend/scorex-backend/src/controllers/teamController.ts` - Add fallback for empty players

## Implementation Steps - COMPLETED
- [x] 1. Fix frontend types - jerseyNumber should accept both string and number
- [x] 2. Add fallback in teamController when players don't exist
- [x] 3. Fix tournamentController getTournamentMatches to properly populate players
- [x] 4. Add debugging to identify exact failure points
- [x] 5. Fix getMatchById and getAllMatches to properly populate players

## Summary of Changes

### Frontend (types.ts)
- Changed `jerseyNumber` from `number | string` to `string` to match backend
- Added `image` and `team` optional fields
- Added additional stats fields

### Backend (teamController.ts)
- Added explicit field selection when populating players (name, role, jerseyNumber, image, stats)
- Added fallback handling to ensure teams have players array even if empty

### Backend (tournamentController.ts)
- Fixed getTournamentById to explicitly populate players with selected fields
- Fixed getTournamentMatches to properly populate team players
- Added debugging logs to trace player population

### Backend (matchController.ts)
- Added logger import
- Fixed getMatchById to explicitly populate team players with selected fields
- Fixed getAllMatches to use improved population pattern with explicit field selection
- Added debugging logs

