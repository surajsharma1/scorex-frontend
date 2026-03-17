# TournamentView Fixes

## Status: In Progress

### 1. [ ] Fix TS17001 Duplicate className attributes
   - Line 367: Find and remove duplicate className
   - Line 423: Find and remove duplicate className

### 2. [ ] Add proper TypeScript types
   - Import Tournament, Match, Team from './types'
   - Type states: tournaments, selected, matches, teams

### 3. [ ] Fix overs display crash
   - Change `(match.team1Overs || 0).toFixed(1)` to `Number(match.team1Overs || 0).toFixed(1)`

### 4. [ ] Fix useEffect dependency array
   - loadDetails useEffect: deps `[selected?._id]` instead of `[selected, activeTab]`

### 5. [ ] Add error handling
   - PointsTable loading/error states
   - Matches load errors

### 6. [ ] Test
   - Load tournaments
   - Switch tabs without re-fetch
   - View matches with overs display
   - Points table
   - Create match modal

**Updated:** [timestamp]
