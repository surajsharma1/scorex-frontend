# Live Scoring Implementation Plan

## Phase 1: Toss Flow
- [ ] Add toss modal when "Live Score" button is clicked
- [ ] Select toss winner team and decision (Bat/Bowl)
- [ ] Save toss to database via `PUT /:id/toss`

## Phase 2: Player Selection
- [ ] Show player selection screen after toss
- [ ] Select: Opening Batsman, Non-Striker, Bowler
- [ ] Save player selections via `PUT /:id/players`

## Phase 3: Enhanced Scoreboard
- [ ] Full scoreboard with player stats
- [ ] Mandatory bowler change after 6 balls (over completion)
- [ ] Direct player change from scoreboard
- [ ] Save changes via `PUT /:id/bowler`, `PUT /:id/striker`, `PUT /:id/nonstriker`

## Phase 4: Data Persistence
- [ ] Auto-save every ball to database
- [ ] Track all player stats (runs, balls, fours, sixes, wickets, overs, economy)

## Phase 5: Tournament Statistics
- [ ] Add Statistics tab in tournament
- [ ] Aggregate player stats across matches
- [ ] Show: Most Runs, Most Wickets, Best Bowling, etc.

## Phase 6: Overlay Integration
- [ ] Link overlays to matches
- [ ] Overlays fetch live data from linked match
- [ ] Show: score, overs, wickets, striker, non-striker, bowler, run rate

