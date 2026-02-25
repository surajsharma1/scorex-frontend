# Overlay System - Complete Data Flow Documentation

## Overview
This document details all data that gets called in the overlay system and how they are called. Use this as a reference to understand and update overlays.

---

## 1. BACKEND DATA MODELS

### 1.1 Overlay Model (`scorex-backend/src/models/Overlay.ts`)
| Field | Type | Description | How It's Used |
|-------|------|-------------|---------------|
| `_id` | ObjectId | Unique identifier | Internal reference |
| `name` | String | Overlay display name | Shown in overlay |
| `tournament` | ObjectId (ref: Tournament) | Associated tournament | Links overlay to tournament |
| `match` | ObjectId (ref: Match) | Associated match (optional) | Links overlay to specific match |
| `template` | String | Template filename (e.g., "vintage.html") | Determines which HTML template to load |
| `config` | Mixed | Custom configuration | Background color, opacity, font, position |
| `elements` | Array | Custom elements array | Overlay-specific UI elements |
| `publicId` | String (unique) | Public identifier for sharing | Used in public URL |
| `createdBy` | ObjectId (ref: User) | Creator user | Ownership tracking |

**How to call:** 
```
javascript
// Create overlay
POST /api/v1/overlays
{
  name: "My Overlay",
  template: "vintage.html", 
  tournament: "tournament_id",
  match: "match_id",
  config: { backgroundColor: "#16a34a", opacity: 90 }
}

// Get overlays
GET /api/v1/overlays

// Get single overlay
GET /api/v1/overlays/:id
```

---

### 1.2 Match Model (`scorex-backend/src/models/Match.ts`)
| Field | Type | Description | How It's Used |
|-------|------|-------------|---------------|
| `tournament` | ObjectId | Tournament reference | Links match to tournament |
| `team1` | ObjectId (ref: Team) | First team | Display team 1 info |
| `team2` | ObjectId (ref: Team) | Second team | Display team 2 info |
| `date` | Date | Match date | Scheduling |
| `venue` | String | Match venue | Display venue |
| `status` | Enum: scheduled/ongoing/completed | Match status | Determines if live |
| `score1` | Number | Team 1 runs | Display score |
| `score2` | Number | Team 2 runs | Display score |
| `wickets1` | Number | Team 1 wickets | Display wickets |
| `wickets2` | Number | Team 2 wickets | Display wickets |
| `overs1` | Number | Team 1 overs | Display overs |
| `overs2` | Number | Team 2 overs | Display overs |
| `strikerName` | String | Current striker name | Display batsman |
| `strikerRuns` | Number | Striker runs | Display batsman stats |
| `strikerBalls` | Number | Striker balls faced | Display batsman stats |
| `nonStrikerName` | String | Non-striker name | Display batsman |
| `nonStrikerRuns` | Number | Non-striker runs | Display batsman stats |
| `nonStrikerBalls` | Number | Non-striker balls | Display batsman stats |
| `bowlerName` | String | Current bowler name | Display bowler |
| `bowlerOvers` | Number | Bowler overs | Display bowler stats |
| `bowlerRuns` | Number | Bowler runs conceded | Display bowler stats |
| `bowlerWickets` | Number | Bowler wickets | Display bowler stats |
| `currentRunRate` | Number | Current run rate | Display CRR |
| `requiredRunRate` | Number | Required run rate | Display RRR |
| `target` | Number | Target score | Display target |
| `lastFiveOvers` | String | Last 5 overs scores | Display recent form |

**How to call:**
```
javascript
// Get all matches
GET /api/v1/matches

// Get matches by tournament
GET /api/v1/matches?tournament=id

// Get single match with full details
GET /api/v1/matches/:id

// Update match score (triggers socket emit)
PUT /api/v1/matches/:id/score
{
  score2: 150,
  wickets2: 3,
  overs2: 15.4,
  strikerRuns: 45,
  strikerBalls: 32
}
```

---

### 1.3 Tournament Model (`scorex-backend/src/models/Tournament.ts`)
| Field | Type | Description | How It's Used |
|-------|------|-------------|---------------|
| `name` | String | Tournament name | Display tournament name |
| `format` | String | Format (T20, ODI, etc.) | Display format |
| `startDate` | Date | Start date | Scheduling |
| `numberOfTeams` | Number | Number of teams | Tournament info |
| `status` | Enum: upcoming/active/completed | Tournament status | Determine state |
| `isLive` | Boolean | Is tournament live | Enable live features |
| `liveScores` | Object | Live score data | Displayed when live |
| `liveScores.team1` | Object | Team 1 live data | {name, score, wickets, overs} |
| `liveScores.team2` | Object | Team 2 live data | {name, score, wickets, overs} |
| `liveScores.currentRunRate` | Number | Current run rate | CRR display |
| `liveScores.requiredRunRate` | Number | Required run rate | RRR display |
| `liveScores.target` | Number | Target score | Target display |
| `liveScores.lastFiveOvers` | String | Last 5 overs | Recent form |

**How to call:**
```
javascript
// Get all tournaments
GET /api/v1/tournaments

// Get tournament
GET /api/v1/tournaments/:id

// Update live scores
PUT /api/v1/tournaments/:id/scores
{
  scores: {
    team1: { name: "India", score: 180, wickets: 3, overs: 20 },
    team2: { name: "Australia", score: 120, wickets: 5, overs: 15 },
    currentRunRate: 9.0,
    requiredRunRate: 12.0,
    target: 181,
    lastFiveOvers: "4,6,1,4,2"
  }
}
```

---

## 2. API ENDPOINTS

### 2.1 Overlay Endpoints (`scorex-backend/src/routes/overlays.ts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/overlays` | Protected | Get all overlays for user |
| GET | `/overlays/:id` | Protected | Get single overlay |
| POST | `/overlays` | Protected | Create new overlay |
| PUT | `/overlays/:id` | Protected | Update overlay |
| DELETE | `/overlays/:id` | Protected | Delete overlay |
| GET | `/overlays/public/:id` | Public | Serve overlay (with template param) |

**Public URL format:**
```
GET /api/v1/overlays/public/{publicId}?template={templateName}
```

Example: `https://scorex-backend.onrender.com/api/v1/overlays/public/abc-123?template=vintage.html`

---

### 2.2 Match Endpoints (`scorex-backend/src/routes/matches.ts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/matches` | Public | Get all matches |
| GET | `/matches/:id` | Public | Get match details |
| POST | `/matches` | Protected | Create match |
| PUT | `/matches/:id` | Protected | Update match |
| PUT | `/matches/:id/score` | Protected | Update score (triggers live update) |
| DELETE | `/matches/:id` | Protected | Delete match |

---

## 3. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Admin Panel)                           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│  │  OverlayForm    │    │  TournamentView │    │  LiveTournament     │  │
│  │  (Create)       │    │  (Manage)       │    │  (Live Scoring)     │  │
│  └────────┬────────┘    └────────┬────────┘    └──────────┬──────────┘  │
│           │                      │                       │              │
│           ▼                      ▼                       ▼              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     API Service (api.ts)                            │  │
│  │  overlayAPI.createOverlay()                                         │  │
│  │  tournamentAPI.updateLiveScores()                                  │  │
│  │  matchAPI.updateMatchScore()                                        │  │
│  └────────────────────────────────┬────────────────────────────────────┘  │
└───────────────────────────────────┼───────────────────────────────────────┘
                                    │ HTTP Requests
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API                                    │
│  ┌───────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ overlayController │  │ matchController  │  │ tournamentController │  │
│  │ - createOverlay   │  │ - getMatch       │  │ - updateLiveScores   │  │
│  │ - serveOverlay    │  │ - updateMatch    │  │ - goLive            │  │
│  │                   │  │ - updateMatchScore│ │                     │  │
│  └─────────┬─────────┘  └────────┬─────────┘  └──────────┬────────────┘  │
│            │                      │                       │               │
│            ▼                      ▼                       ▼               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Socket.IO (io.emit)                            │   │
│  │  io.emit('scoreUpdate', { matchId, match })                      │   │
│  │  io.emit('commentaryUpdate', { matchId, commentary })            │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
└───────────────────────────────────┼───────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER (MongoDB)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │     Overlay     │  │      Match       │  │      Tournament        │   │
│  │  Collection     │  │    Collection    │  │     Collection         │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼ (Polling/Socket for live updates)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OVERLAYS (OBS/Browser Sources)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              HTML Overlay Files (30+ templates)                     │   │
│  │  - vintage.html     - fire-win-predictor.html  - broadcast-score  │   │
│  │  - minimalist-split-bar.html  - neon-vector-replay.html          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  overlay-utils.js                                   │   │
│  │  - initOverlay()        - handleScoreUpdate()                      │   │
│  │  - BroadcastChannel     - postScoreUpdate()                       │   │
│  │  - fetchMatchData()     - updateScoreDisplay()                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │               Backend Match Data API                                │   │
│  │  GET /api/v1/matches/{matchId}                                     │   │
│  │  Returns: { team1, team2, score, wickets, overs, striker, etc. } │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. OVERLAY DATA STRUCTURE

### 4.1 Match API Response Format
When an overlay calls `GET /api/v1/matches/:id`, it receives:

```
javascript
{
  // Tournament Info
  tournament: {
    _id: "tournament_id",
    name: "Indian Premier League 2024"
  },
  
  // Team 1 Info
  team1: {
    _id: "team1_id",
    name: "Mumbai Indians",
    shortName: "MI",
    players: []
  },
  
  // Team 2 Info  
  team2: {
    _id: "team2_id",
    name: "Chennai Super Kings",
    shortName: "CSK",
    players: []
  },
  
  // Team 1 Score (1st Innings)
  score1: 180,
  wickets1: 5,
  overs1: 20,
  
  // Team 2 Score (2nd Innings - chasing)
  score2: 150,
  wickets2: 3,
  overs2: 15.4,
  
  // Striker Info
  striker_name: "Rohit Sharma",
  striker_runs: 45,
  striker_balls: 32,
  
  // Non-Striker Info
  nonstriker_name: "Hardik Pandya",
  nonstriker_runs: 12,
  nonstriker_balls: 8,
  
  // Bowler Info
  bowler_name: "Ravindra Jadeja",
  bowler_overs: 3.4,
  bowler_maidens: 0,
  bowler_runs: 25,
  bowler_wickets: 1,
  
  // Calculated Stats
  crr: "9.00",           // Current Run Rate (score2/overs2)
  rrr: "12.00",         // Required Run Rate
  target: "181",        // Target (score1 + 1)
  last5Overs: "4,6,1,4,2",
  
  // Match Info
  status: "ongoing",
  date: "2024-05-15T14:00:00Z",
  venue: "Wankhede Stadium"
}
```

### 4.2 Overlay Config Injected (window.OVERLAY_CONFIG)
When an overlay is served, the backend injects:

```
javascript
window.OVERLAY_CONFIG = {
  matchId: "match_id_from_database",
  apiBaseUrl: "https://scorex-backend.onrender.com/api/v1",
  overlayName: "My Overlay",
  publicId: "uuid-public-id"
};
```

---

## 5. HOW OVERLAYS FETCH DATA

### 5.1 Overlay HTML Template Structure
Each overlay HTML file should include:

```
html
<!DOCTYPE html>
<html>
<head>
  <!-- Config injection happens BEFORE overlay-utils.js loads -->
  <script>
    window.OVERLAY_CONFIG = window.OVERLAY_CONFIG || {};
    // Backend injects: matchId, apiBaseUrl, overlayName, publicId
  </script>
</head>
<body>
  <!-- Overlay HTML with element IDs -->
  <div id="team1-name"></div>
  <div id="team1-score"></div>
  <div id="team1-overs"></div>
  <div id="team2-name"></div>
  <div id="team2-score"></div>
  <div id="team2-overs"></div>
  
  <!-- Utilities for real-time updates -->
  <script src="overlay-utils.js"></script>
  
  <!-- Your overlay's custom script -->
  <script>
    // Use the utilities or fetch directly
    async function fetchMatchData() {
      const matchId = window.OVERLAY_CONFIG?.matchId;
      const apiBaseUrl = window.OVERLAY_CONFIG?.apiBaseUrl;
      
      if (!matchId) return;
      
      const response = await fetch(`${apiBaseUrl}/matches/${matchId}`);
      const data = await response.json();
      
      // Update your overlay elements
      document.getElementById('team1-name').textContent = data.team1.name;
      document.getElementById('team1-score').textContent = `${data.score2}/${data.wickets2}`;
      document.getElementById('team1-overs').textContent = `(${data.overs2})`;
      
      // More elements...
    }
    
    // Initial fetch
    fetchMatchData();
    
    // Auto-refresh every 3 seconds
    setInterval(fetchMatchData, 3000);
  </script>
</body>
</html>
```

---

## 6. ELEMENT IDs EXPECTED BY OVERLAYS

Based on `overlay-utils.js` and overlay templates, these are the common element IDs:

### Team Score Elements
| Element ID | Description | Example Value |
|------------|-------------|---------------|
| `team1-name` | Team 1 full name | "Mumbai Indians" |
| `team1-score` | Team 1 score string | "180/5" |
| `team1-overs` | Team 1 overs string | "(20.0)" |
| `team2-name` | Team 2 full name | "Chennai Super Kings" |
| `team2-score` | Team 2 score string | "150/3" |
| `team2-overs` | Team 2 overs string | "(15.4)" |

### Player Elements
| Element ID | Description |
|------------|-------------|
| `striker-name` | Current striker name |
| `striker-stat` | Striker runs/balls format "45(32)*" |
| `nonstriker-name` | Non-striker name |
| `nonstriker-stat` | Non-striker runs/balls |

### Tournament/Match Info
| Element ID | Description |
|------------|-------------|
| `tournament-name` | Tournament name |
| `match-info` | Match format/info |

### Stats Elements
| Element ID | Description |
|------------|-------------|
| `crr` | Current Run Rate |
| `rrr` | Required Run Rate |
| `target` | Target score |
| `last5-overs` | Last 5 overs |

---

## 7. AVAILABLE TEMPLATES

### Free Templates (4)
1. `vintage.html` - Old-school cricket board with classic newspaper aesthetics
2. `gate-minimal-dark.html` - Ultra-minimal dark theme with subtle neon highlights
3. `slate-gold-ashes.html` - Dark slate with gold accents for premium look
4. `minimalist-split-bar.html` - Ultra-clean split bar design

### Premium Basic (10)
5. `gradient-monolith.html` - Smooth gradient backgrounds
6. `neon-vector-replay.html` - Vibrant neon vector style
7. `circuit-node-neon.html` - Futuristic circuit board design
8. `cyber-shield.html` - Futuristic cyberpunk shield design
9. `hex-perimeter.html` - Hexagonal pattern
10. `grid-sunset-red.html` - Warm sunset colors with grid
11. `titan-perimeter.html` - Bold titan design
12. `prism-pop-desert.html` - Colorful prism effect
13. `modern-monolith-slab.html` - Modern slab design
14. `broadcast-score-bug.html` - Professional broadcast score bug

### Premium Designer (17)
15. `apex-cradle-gold.html` - Premium apex design with gold accents
16. `aurora-glass-bbl.html` - Aurora borealis with glass morphism
17. `mono-cyberpunk.html` - Monochrome cyberpunk style
18. `storm-flare-rail.html` - Dramatic storm clouds with flare
19. `titanium-dark-ribbon.html` - Premium titanium finish
20. `retro-glitch-hud.html` - Retro arcade with glitch effects
21. `wooden2.html` - Classic wooden scoreboard
22. `interceptor-orange.html` - Bold orange interceptor
23. `metallic-eclipse-lens.html` - Metallic eclipse lens effect
24. `red-spine-replay.html` - Bold red spine for replays
25. `Double-Rail-Broadcast.html` - Professional broadcast with dual rails
26. `rail-world-broadcast.html` - World broadcast rail design
27. `news-ticker-broadcast.html` - News ticker style
28. `vertical-slice-ashes.html` - Vertical slice for Ashes series
29. `velocity-frame-v2.html` - Velocity frame v2
30. `velocity-frame.html` - Velocity frame
31. `fire-win-predictor.html` - Fiery win predictor

---

## 8. REAL-TIME UPDATES

### Socket Events (from Backend)
```
javascript
// When match score is updated
io.emit('scoreUpdate', { 
  matchId: "match_id", 
  match: { /* full match object */ }
});

// When commentary is added
io.emit('commentaryUpdate', { 
  matchId: "match_id", 
  commentary: ["6 runs!"] 
});
```

### BroadcastChannel (Client-side)
```
javascript
// In overlay-utils.js
const channel = new BroadcastChannel('cricket_score_updates');
channel.onmessage = function(event) {
  const data = event.data;
  if (data.type === 'WICKET') {
    window.triggerPush(data.message, 'W');
  }
  handleScoreUpdate(data);
};

// Post updates from frontend
window.postScoreUpdate({ team1: { score: 180 } });
window.postWicketEvent("OUT!");
window.postPushEvent("FOUR", "Great shot!");
```

---

## 9. SUMMARY: How to Update Overlays

To make your overlay work with live data:

1. **Include config script** (injected by backend automatically):
   
```
html
   <script src="overlay-utils.js"></script>
   
```

2. **Add element IDs** to your HTML:
   
```
html
   <span id="team1-name">Team 1</span>
   <span id="team1-score">0/0</span>
   <span id="team1-overs">(0.0)</span>
   
```

3. **Fetch and display data** in your script:
   
```
javascript
   async function updateScore() {
     const matchId = window.OVERLAY_CONFIG?.matchId;
     const api = window.OVERLAY_CONFIG?.apiBaseUrl;
     const data = await fetch(`${api}/matches/${matchId}`).then(r => r.json());
     
     document.getElementById('team1-name').textContent = data.team1.name;
     document.getElementById('team1-score').textContent = `${data.score2}/${data.wickets2}`;
     document.getElementById('team1-overs').textContent = `(${data.overs2})`;
   }
   
   setInterval(updateScore, 3000);  // Update every 3 seconds
   
```

4. **Optional: Handle real-time events**:
   
```
javascript
   window.addEventListener('scoreUpdated', (e) => {
     console.log('New score data:', e.detail);
     updateScore();
   });
   
```

---

## 10. FILES TO EDIT FOR OVERLAY UPDATES

| File | Purpose |
|------|---------|
| `scorex-backend/src/models/Overlay.ts` | Overlay data model |
| `scorex-backend/src/models/Match.ts` | Match data model |
| `scorex-backend/src/models/Tournament.ts` | Tournament/live scores |
| `scorex-backend/src/controllers/overlayController.ts` | Overlay CRUD + serve |
| `scorex-backend/src/controllers/matchController.ts` | Match score updates |
| `scorex-backend/src/routes/overlays.ts` | Overlay API routes |
| `scorex-backend/src/routes/matches.ts` | Match API routes |
| `scorex-frontend/scorex-frontend/src/services/api.ts` | Frontend API calls |
| `scorex-frontend/scorex-frontend/src/components/OverlayForm.tsx` | Create overlay UI |
| `scorex-frontend/scorex-frontend/public/overlays/*.html` | All 31 overlay templates |
| `scorex-frontend/scorex-frontend/public/overlays/overlay-utils.js` | Shared utilities |

---

*Last Updated: Based on current codebase analysis*
*For questions or updates, refer to the actual source files listed above.*
