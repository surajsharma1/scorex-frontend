# Live Scoring Enhancement Plan

## Overview
This plan implements comprehensive live scoring features including toss, player selection, automatic bowler changes, player substitutions, and overlay integration.

## Phase 1: Toss and Player Selection Flow

### 1.1 Toss Modal (Before Scoreboard Opens)
- When "Live Score" button is clicked, show toss modal first
- Select toss winner team
- Select decision (Bat or Bowl)
- Save toss to database

### 1.2 Player Selection Setup
After toss, show player selection modal:
- Select Opening Batsman (Striker)
- Select Non-Striker
- Select Opening Bowler
- Allow selecting from team players or adding new players

## Phase 2: Enhanced Scoreboard

### 2.1 Full Scoreboard Display
- Current score, overs, wickets
- Striker/Non-striker with running stats (runs, balls, 4s, 6s)
- Current bowler with stats (overs, wickets, runs)
- Complete batting lineup with individual stats
- Bowling figures for all bowlers

### 2.2 Scoring Controls
- Run buttons (0, 1, 2, 3, 4, 6)
- Extras (WD, NB, Bye, LB)
- Wicket options with dismissal types

### 2.3 Automatic Bowler Change
- After each over (every 6 legal balls), prompt for new bowler
- Cannot proceed with scoring until new bowler is selected

### 2.4 Player Substitution
- Add "Change Player" button on scoreboard
- Can change striker, non-striker, or bowler at any time
- Save changes to database

## Phase 3: Data Persistence

### 3.1 Auto-Save
- Save every ball to database immediately
- Save all player stats (runs, balls, fours, sixes, wickets, overs, economy)

### 3.2 Player Statistics
- Track individual player performance across matches
- Store in database for tournament statistics

## Phase 4: Overlay Integration

### 4.1 Match-Overlay Linking
- When creating overlay, select which match it's for
- Store match ID in overlay record
- Overlays fetch data from their linked match

### 4.2 Score Display
- Overlays read live scores from database
- Display striker, non-striker, bowler
- Show run rate, current over, total score

## Implementation Steps

### Step 1: Update TournamentDetail.tsx
- Add toss modal state
- Add player selection modal state
- Add bowler change modal (after each over)
- Add player change functionality
- Integrate TournamentStats component in stats tab

### Step 2: Update Backend Match Model
- Add fields for player lineup
- Add fields for detailed player stats

### Step 3: Update API
- Add toss save endpoint
- Add player selection save endpoint
- Add ball-by-ball scoring with player stats
- Add player stats aggregation for tournament

### Step 4: Update Overlay System
- Add match selection when creating overlays
- Update overlay templates to read from linked match

## Files to Modify

1. **Frontend:**
   - `TournamentDetail.tsx` - Main scoring UI
   - `matchApi.ts` - API calls
   - `types.ts` - TypeScript types
   - `OverlayEditor.tsx` - Overlay creation with match selection

2. **Backend:**
   - `Match.ts` model - Add player tracking fields
   - `matchController.ts` - Add new endpoints
   - `matches.ts` routes - Add new routes

## Priority Order
1. Toss modal before scoreboard
2. Player selection
3. Full scoreboard display
4. Auto-save to database
5. Automatic bowler change after over
6. Player substitution
7. Tournament statistics
8. Overlay-match linking

