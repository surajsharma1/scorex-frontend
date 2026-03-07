 f# Live Scoring Full Implementation Plan

## Frontend Changes Required for TournamentDetail.tsx

### 1. Toss Modal
- Show when clicking "Live Score" if toss not recorded
- Select toss winner team
- Select decision (Bat/Bowl)
- Save to backend via `matchApi.saveToss()`

### 2. Player Selection Modal
- Show after toss is saved
- Select opening batsman (striker)
- Select non-striker  
- Select bowler
- Load players from team rosters
- Save to backend via `matchApi.savePlayerSelections()`

### 3. Enhanced Scoreboard
- Show current striker with running stats
- Show non-striker with running stats
- Show current bowler with stats
- Show complete batting lineup
- Manual change buttons for striker/non-striker/bowler

### 4. Bowler Change Prompt
- After every 6 balls, show modal to select new bowler
- Save via `matchApi.changeBowler()`

### 5. Statistics Tab
- Add "Statistics" tab to tournament view
- Show aggregated player stats from all matches
- Most runs, most wickets, best bowling, etc.
- Fetch via `matchApi.getTournamentStats()`

## Backend Already Implemented:
- ✅ PUT /:id/toss - Save toss
- ✅ PUT /:id/players - Save player selections  
- ✅ PUT /:id/bowler - Change bowler
- ✅ PUT /:id/striker - Update striker
- ✅ PUT /:id/nonstriker - Update non-striker
- ✅ GET /stats/:tournamentId - Tournament stats

