# Live Scoring Enhancement Plan

## Current State Analysis

### Existing Components:
1. **TournamentDetail.tsx** - Has basic scoring with toss, player selection, scoreboard
2. **LiveScoring.tsx** - Dedicated live scoring page at `/live-scoring/:id`
3. **Match Model** - Has ball-by-ball data, toss, innings structure
4. **Overlay System** - Overlays can be created and linked to matches via OverlayEditor
5. **OverlayEditor** - Currently syncs data every 2 seconds via polling

### Issues to Fix:
1. Data not fully persisted (player stats not saved per ball)
2. Overlays get limited data (only basic scores)
3. No automatic bowler change after over
4. No player change options from scoreboard
5. No tournament-wide statistics

---

## Implementation Plan

### Phase 1: Toss & Player Selection Flow (Frontend Enhancement)

**Files to modify:**
- `TournamentDetail.tsx` - Enhance toss modal and player selection

**Features:**
- [ ] Toss Modal: Select toss winner team + decision (Bat/Bowl)
- [ ] After toss: Player selection screen for:
  - Opening batsmen (Striker + Non-striker)
  - Opening bowler
- [ ] Save toss data to database immediately

### Phase 2: Enhanced Scoreboard with Player Management

**Files to modify:**
- `TournamentDetail.tsx` - Full scoreboard redesign
- `LiveScoring.tsx` - Keep in sync

**Features:**
- [ ] Full batting lineup display with individual stats
- [ ] Complete bowling figures display
- [ ] "Change Player" buttons for:
  - Striker (new batsman)
  - Non-striker (new batsman)
  - Bowler (new bowler)
- [ ] Current over display with all 6 balls
- [ ] Fall of wickets display
- [ ] Partnership display

### Phase 3: Automatic Bowler Change After Over

**Files to modify:**
- `TournamentDetail.tsx` - Add over completion detection
- `Match Model` - Ensure proper tracking
- `matchController.ts` - Backend support

**Features:**
- [ ] Track over completion (every 6 valid balls)
- [ ] Show bowler change modal automatically after over
- [ ] Save bowler change to database

### Phase 4: Full Data Persistence & Real-time Sync

**Files to modify:**
- `matchController.ts` - Add player statistics endpoints
- `Match Model` - Add player stats arrays
- `LiveScoring.tsx` - Proper initialization from DB
- `TournamentDetail.tsx` - Save all ball data

**Features:**
- [ ] Save every ball with full player data to MongoDB
- [ ] Track individual batting stats (runs, balls, fours, sixes)
- [ ] Track individual bowling stats (overs, maidens, runs, wickets)
- [ ] Switch from polling to Socket.io for real-time updates (optional enhancement)

### Phase 5: Tournament Statistics Page

**Files to modify:**
- `TournamentDetail.tsx` - Add Statistics tab
- New component: `TournamentStats.tsx` (optional)
- Backend: Add stats aggregation endpoint

**Features:**
- [ ] Add "Statistics" tab in tournament view
- [ ] Display aggregated stats for all players in tournament:
  - Most Runs
  - Most Wickets
  - Best Bowling
  - Highest Individual Score
  - Best Strike Rate
  - Best Economy
- [ ] Stats calculated from all matches in tournament

### Phase 6: Enhanced Overlay Data Integration

**Files to modify:**
- `OverlayEditor.tsx` - Improve data payload
- Overlay HTML files - Update to receive full data
- Backend: Ensure full match data is returned

**Features:**
- [ ] Enhance `pushDataToOverlay` to send:
  - Full batting lineup with all player stats
  - Complete bowling figures
  - Current ball in over (e.g., "4.3" means 4th over, 3rd ball)
  - Run rate and required run rate
  - Target score (if chasing)
  - Fall of wickets
  - Last 6 balls of current over
- [ ] Overlays receive richer data and display properly

---

## Data Flow Diagram

```
User clicks "Live Score" on Match
         │
         ▼
┌─────────────────┐
│  Toss Done?    │──No──► Show Toss Modal
└─────────────────┘        (Select Winner + Bat/Bowl)
         │                 │
        Yes                │
         │                 ▼
         ▼          Save Toss to DB
┌─────────────────┐
│ Players Set?    │──No──► Show Player Selection
└─────────────────┘        (Select Batsmen + Bowler)
         │                 │
        Yes                │
         │                 ▼
         ▼          Save Players to DB
┌─────────────────┐
│  Show Scoreboard│◄──────────────┐
└─────────────────┘               │
         │                        │
    Ball Scored                   │
         │                        │
         ▼                        │
┌─────────────────┐               │
│ Save Ball to DB │               │
│ (runs, wicket,  │               │
│  extras, etc.)  │               │
└─────────────────┘               │
         │                        │
         ▼                        │
┌─────────────────┐               │
│ Over Complete?  │──Yes──► Show Bowler Change Modal
└─────────────────┘               │
         │                        │
        No                        │
         │                        │
         ▼                        │
┌─────────────────┐               │
│ Push to Overlay │◄──────────────┘
│ (BroadcastChan)│
└─────────────────┘
```

---

## Key API Endpoints Needed

1. **POST /api/matches/:id/toss** - Save toss winner and decision
2. **POST /api/matches/:id/players** - Save player selections (striker, non-striker, bowler)
3. **POST /api/matches/:id/ball** - Save ball data with player stats
4. **POST /api/matches/:id/change-bowler** - Change bowler after over
5. **GET /api/tournaments/:id/stats** - Get aggregated tournament statistics

---

## File Changes Summary

### Backend (scorex-backend)
1. `src/models/Match.ts` - Add player stats arrays
2. `src/controllers/matchController.ts` - Add new endpoints
3. `src/routes/matches.ts` - Add new routes

### Frontend (scorex-frontend)
1. `src/components/TournamentDetail.tsx` - Major overhaul
2. `src/components/LiveScoring.tsx` - Enhance with full data
3. `src/components/types.ts` - Add new types
4. New: `src/components/TournamentStats.tsx` - Statistics page

---

## Implementation Priority

1. **High Priority**: Fix data saving (Phase 1-2)
2. **High Priority**: Enhanced scoreboard (Phase 2)
3. **Medium Priority**: Bowler change automation (Phase 3)
4. **Medium Priority**: Tournament statistics (Phase 5)
5. **Low Priority**: Overlay data enhancement (Phase 6)

---

## Testing Checklist

- [ ] Toss can be saved and persists
- [ ] Player selections save and load correctly
- [ ] Ball scoring saves all data to DB
- [ ] Scoreboard shows correct player stats
- [ ] Bowler change modal appears after 6 balls
- [ ] Player changes work from scoreboard
- [ ] Statistics tab shows correct aggregated data
- [ ] Overlays receive and display full data
- [ ] All data persists across page refreshes

