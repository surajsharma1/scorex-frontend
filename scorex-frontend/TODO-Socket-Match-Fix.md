# Socket and Match Fixes TODO

## Issues Identified:
1. **Socket Room Inconsistency**: Backend broadcasts to room `matchId`, but `joinMatch` joins room `match:${matchId}`
2. **Data Model Mismatch**: Backend returns `teamA`/`teamB` but frontend expects `team1`/`team2`
3. **LiveScoring Player IDs**: Frontend sends string IDs but backend expects ObjectId references
4. **Response Parsing**: Inconsistent handling of API responses

## Fix Plan:

### Step 1: Fix Backend server.ts ✅
- [x] Fix socket broadcast to use consistent room naming
- [x] Add fallback for both room formats

### Step 2: Fix Backend matchController.ts ✅
- [x] Add response transformation to match frontend expectations
- [x] Include all required fields in response

### Step 3: Fix Frontend socket.ts ✅
- [x] Ensure consistent room joining with both formats

### Step 4: Fix Frontend LiveMatchPage.tsx ✅
- [x] Fix response data parsing
- [x] Handle both response formats

### Step 5: Fix Frontend LiveScoring.tsx ✅
- [x] Fix player ID handling
- [x] Add proper data transformation
- [x] Add socket listener for real-time updates

## Changes Made:

### Backend (server.ts):
- Added `leave_match` and `leaveMatch` handlers for proper room cleanup
- Made `join_match` and `joinMatch` both join both room formats for compatibility
- Updated logging to show which room format is being joined

### Backend (matchController.ts):
- Updated `scoreBall` to broadcast to both `matchId` and `match:${matchId}` rooms
- Updated `undoLastBall` to broadcast to both room formats

### Frontend (socket.ts):
- Added `leave_match` event to ClientToServerEvents interface
- Added `join_match` and `leave_match` to event types

### Frontend (LiveMatchPage.tsx):
- Improved response parsing to handle multiple response formats
- Added data transformation to map backend fields to frontend expectations
- Added support for innings data (score1, wickets1, overs1, etc.)

### Frontend (LiveScoring.tsx):
- Added socket listener for real-time match updates
- Added `join_match` and `leave_match` socket events
- Fixed player ID handling with fallback values
- Improved match loading from API

