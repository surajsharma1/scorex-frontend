# Live Scoring Enhancement - Implementation Plan

## Current State Analysis

### ✅ Already Fully Implemented (Backend):
1. **Match Model** (`scorex-backend/src/models/Match.ts`):
   - Toss fields (winner, decision: 'Bat' or 'Bowl')
   - Player selections (battingOrder, bowlingOrder arrays)
   - Innings with full player stats (striker, nonStriker, bowler objects)
   - Ball-by-ball tracking

2. **Backend Endpoints** (`scorex-backend/src/controllers/matchController.ts`):
   - `PUT /:id/toss` - Save toss winner and decision
   - `PUT /:id/players` - Save player selections
   - `PUT /:id/bowler` - Change bowler after each over
   - `PUT /:id/striker` - Update striker
   - `PUT /:id/nonstriker` - Update non-striker
   - `GET /stats/:tournamentId` - Tournament statistics

3. **Frontend API** (`scorex-frontend/src/services/matchApi.ts`):
   - All API methods: toss, playerSelection, updateBowler, updateStriker, updateNonStriker

4. **TournamentStats Component** (`scorex-frontend/src/components/TournamentStats.tsx`):
   - Statistics display

### ❌ What Needs Implementation (Frontend - TournamentDetail.tsx):

1. **Statistics Tab** - Add 'statistics' to the tabs array
2. **Toss Modal Flow** - When "Live Score" clicked, show toss selection (winner + bat/bowl)
3. **Player Selection** - After toss, select opening batsman, non-striker, and bowler
4. **Bowler Change** - After each over (6 balls), prompt for new bowler selection
5. **Scoreboard Updates** - Connect existing scoring UI to backend APIs

## Implementation Steps

### Step 1: Add Statistics Tab
- Add 'statistics' to activeTab tabs array
- Import TournamentStats component
- Add statistics tab content

### Step 2: Toss Modal
- When Live Score button clicked, check if toss is completed
- If not, show toss modal with winner and decision options
- Save toss to backend

### Step 3: Player Selection
- After toss, show player selection modal
- Select opening batsman, non-striker from batting team
- Select opening bowler from bowling team
- Save to backend

### Step 4: Scoreboard Integration
- Update scoreboard to show current striker, non-striker, bowler from backend
- Auto-save every ball to backend

### Step 5: Mandatory Bowler Change
- Track ball count
- After 6 balls, show bowler change modal
- Require new bowler selection before continuing

## Overlay Integration
- Overlays are linked to matches via the `match` field in Overlay model
- Users select match when creating/editing overlays
- Overlays receive live score data through socket updates

