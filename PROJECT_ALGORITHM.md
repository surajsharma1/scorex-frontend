# ScoreX Project - Complete Algorithm & Architecture

## Table of Contents
1. [Project Overview](#project-overview)
2. [Feature Specifications](#feature-specifications)
3. [High-Level Architecture](#high-level-architecture)
4. [Data Flow & Algorithms](#data-flow--algorithms)
5. [API Endpoints & Routes](#api-endpoints--routes)
6. [Real-Time Communication (Socket.IO)](#real-time-communication-socketio)
7. [Frontend Application Flow](#frontend-application-flow)
8. [Database Schema Relationships](#database-schema-relationships)
9. [Cricket Scoring System](#cricket-scoring-system)
10. [Membership & Payments](#membership--payments)
11. [Known Issues & Bugs](#known-issues--bugs)
12. [Development Workflow](#development-workflow)

---

## Project Overview

**ScoreX** is a comprehensive tournament management and live scoring platform with:
- **Backend**: Node.js + Express + MongoDB (Mongoose) + Socket.IO
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Sports Supported**: Cricket (T10, T20, Test, etc.)
- **Key Features**: Tournament management, live cricket scoring, broadcast overlays, clubs, friends, memberships

---

## Feature Specifications

### 1. Landing/Main Page (Frontpage)

**Flow**: User visits website → Redirected to Live Matches Section first

**Sections**:
```
┌─────────────────────────────────────────────────┐
│              HEADER / NAVIGATION                │
├─────────────────────────────────────────────────┤
│              LIVE MATCHES CAROUSEL              │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐        │
│  │Match 1│ │Match 2│ │Match 3│ │Match 4│        │
│  │ LIVE  │ │ LIVE  │ │ UP    │ │ UP    │        │
│  └───────┘ └───────┘ └───────┘ └───────┘        │
├─────────────────────────────────────────────────┤
│           UPCOMING MATCHES SECTION              │
│  List of all upcoming matches with dates        │
├─────────────────────────────────────────────────┤
│              FEATURES SECTION                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │Tournament│ │Live     │ │Broadcast│           │
│  │Management│ │Scoring  │ │Overlays │           │
│  └─────────┘ └─────────┘ └─────────┘            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │Clubs    │ │Leader-  │ │Member-  │            │
│  │         │ │board    │ │ship     │            │
│  └─────────┘ └─────────┘ └─────────┘            │
├─────────────────────────────────────────────────┤
│           OVERLAY DESIGNS PREVIEW               │
│  Show all available overlays (by membership)    │
│  - Basic overlays (Free)                        │
│  - Premium overlays (Membership required)       │
├─────────────────────────────────────────────────┤
│              FEEDBACK SECTION                   │
│  User testimonials/reviews displayed here       │
├─────────────────────────────────────────────────┤
│              FOOTER                             │
│  - Owner details                                │
│  - Developer name                               │
│  - Contact number                               │
│  - Support number                               │
│  - Social links                                 │
└─────────────────────────────────────────────────┘
```

**Algorithm: Frontpage Load**
```
1. On page load, redirect to Live Matches section (auto-scroll)
2. Fetch all matches with status 'live' → Display in carousel
3. Fetch upcoming matches → Display in upcoming section
4. Fetch features from API → Display in features grid
5. Fetch overlays based on user membership → Display previews
6. Fetch feedback messages → Display in feedback section
7. Load footer with static content (owner, dev, contact)
```

---

### 2. Authentication System

**Login Methods**:
1. **Email/Password Login** - Uses real email (validated)
2. **Google OAuth** - Login via Google account
3. **Registration** - Direct registration (no OTP)

**Registration Requirements**:
- Real email validation (no fake/random emails)
- Username, email, password fields
- No OTP/verification required
- Direct account creation

**Algorithm: Email Validation**
```
FUNCTION validateEmail(email):
  // Check for valid email format
  IF NOT matchesRegex(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/):
    RETURN false
  
  // Check against known disposable email domains
  disposableDomains = getDisposableDomainsList()
  domain = extractDomain(email)
  IF domain IN disposableDomains:
    RETURN false
  
  // Verify email format is proper
  RETURN true
```

**Auth Flow**:
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────►│  Login/  │────►│ Backend  │────►│ Validate │
│          │     │ Register │     │  API     │     │ Email    │
└──────────┘     └──────────┘     └────┬─────┘     └────┬─────┘
                                       │                │
                                       ▼                ▼
                                ┌──────────┐     ┌──────────┐
                                │ MongoDB  │◄────│ Valid?   │
                                │ (User)   │     │          │
                                └────┬─────┘     └──────────┘
                                     │
                                     ▼
                                ┌──────────┐
                                │ JWT Token│
                                │ Generated│
                                └────┬─────┘
                                     │
                                     ▼
                                ┌──────────┐
                                │ Dashboard│
                                │ (Redirect)│
                                └──────────┘
```

---

### 3. Dashboard (Personal Space)

**Sections**:
```
┌─────────────────────────────────────────────────┐
│           USER STATISTICS DASHBOARD             │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Total        │  │ Tournaments  │             │
│  │ Tournaments  │  │ Won          │             │
│  │ Created: 15  │  │: 8           │             │
│  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Total        │  │ Matches      │             │
│  │ Teams        │  │ Played       │             │
│  │: 5           │  │: 42          │             │
│  └──────────────┘  └──────────────┘             │
├─────────────────────────────────────────────────┤
│              STATISTICS GRAPHS                  │
│  - Match performance over time                  │
│  - Tournament participation chart               │
│  - Win/Loss ratio pie chart                     │
│  - Player statistics trends                     │
└─────────────────────────────────────────────────┘
```

**Algorithm: Dashboard Data**
```
FUNCTION loadDashboard(userId):
  user = findUserById(userId)
  
  // Get actual statistics from database
  tournamentsCreated = countTournamentsByCreator(userId)
  tournamentsWon = countTournamentsWonByUser(userId)
  teamsOwned = countTeamsByOwner(userId)
  matchesPlayed = countMatchesByPlayer(userId)
  
  // Calculate win rate
  matchesWon = countMatchesWonByPlayer(userId)
  winRate = (matchesWon / matchesPlayed) * 100
  
  // Get recent activity
  recentMatches = getRecentMatches(userId, limit=10)
  recentTournaments = getRecentTournaments(userId, limit=5)
  
  RETURN {
    tournamentsCreated,
    tournamentsWon,
    teamsOwned,
    matchesPlayed,
    matchesWon,
    winRate,
    recentMatches,
    recentTournaments
  }
```

---

### 4. Tournament Management

**Tournament Sections Flow**:
```
Tournament List → Tournament Detail
                        │
                        ├─► Details Section
                        │   - Name, organizer, dates, location
                        │   - Tournament type (Round Robin, Knockout, etc.)
                        │   - Status (Upcoming, Ongoing, Completed)
                        │
                        ├─► Teams Section
                        │   - Create new team
                        │   - Add existing team to tournament
                        │   - Team details (players, captain)
                        │
                        ├─► Team Detail
                        │   - Team information
                        │   - Players list
                        │   - Player points (from matches)
                        │   - Points table (auto-calculated from scoreboard)
                        │
                        ├─► Matches Section
                        │   - List all matches
                        │   - Match status (Upcoming/Live/Completed)
                        │   - Match details
                        │
                        ├─► Match Detail
                        │   - Match name (Semi-final, Final, etc.)
                        │   - Venue, date, time
                        │   - Match format (T10, T20, Test, etc.)
                        │   - Overlay selection
                        │   - URL generator for OBS
                        │   - Scoring board
                        │
                        └─► Stats Section
                            - Team statistics
                            - Player leaderboard
                            - Match statistics
                            - MVP awards
```

**Algorithm: Tournament Creation**
```
FUNCTION createTournament(data):
  // Validate required fields
  validate(data.name, data.startDate, data.type, data.createdBy)
  
  // Create tournament document
  tournament = new Tournament({
    name: data.name,
    organizer: data.organizer,
    startDate: data.startDate,
    endDate: data.endDate,
    location: data.location,
    locationType: data.locationType,
    type: data.type,  // Round Robin, Knockout, Double Elimination, etc.
    status: 'Upcoming',
    createdBy: data.createdBy,
    teams: [],
    matches: []
  })
  
  // Save tournament
  tournament.save()
  
  // Generate bracket/matches based on type
  matches = generateBracket(data.teams, data.type)
  
  // Save matches
  FOR each match IN matches:
    match.tournamentId = tournament._id
    match.save()
    tournament.matches.push(match._id)
  
  tournament.save()
  
  RETURN tournament
```

---

### 5. Team Management

**Team Sections**:
```
┌─────────────────────────────────────────────────┐
│                 TEAM SECTION                    │
├─────────────────────────────────────────────────┤
│  CREATE TEAM BUTTON                             │
│  [+ Create New Team] [+ Add Existing Team]      │
├─────────────────────────────────────────────────┤
│  TEAMS LIST                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Team A  │ │ Team B  │ │ Team C  │            │
│  └────┬────┘ └────┬────┘ └────┬────┘            │
│       │           │           │                 │
│       └───────────┴───────────┘                 │
│               │                                 │
│               ▼                                 │
│        TEAM DETAIL                              │
│        ├─ Team Name, Logo                       │
│        ├─ Players                               │
│        │   - Player 1 (Batsman)                 │
│        │   - Player 2 (Bowler)                  │
│        │   - Player 3 (All-rounder)             │
│        │   - ...                                │
│        ├─ Points Table                          │
│        │   - Points earned in tournament        │
│        │   - Auto-calculated from scoreboard    │
│        └─ Statistics                            │
│            - Total matches                      │
│            - Wins/Losses                        │
└─────────────────────────────────────────────────┘
```

**Algorithm: Player Points Calculation**
```
FUNCTION calculatePlayerPoints(tournamentId, playerId):
  // Get all matches in tournament
  matches = getMatchesByTournament(tournamentId)
  
  totalPoints = 0
  
  FOR each match IN matches:
    // Get player performance from match
    performance = getPlayerPerformance(match, playerId)
    
    // Calculate points
    points = 0
    
    // Batting points
    points += performance.runs * 1           // 1 point per run
    points += performance.fours * 1          // 1 point per four
    points += performance.sixes * 2           // 2 points per six
    
    // Bowling points
    points += performance.wickets * 10       // 10 points per wicket
    points += performance.maidenOvers * 5    // 5 points per maiden
    
    // Fielding points
    points += performance.catches * 5         // 5 points per catch
    points += performance.runOuts * 5        // 5 points per run out
    
    totalPoints += points
  
  RETURN totalPoints
```

---

### 6. Match Management & Scoring

**Match Detail Sections**:
```
┌─────────────────────────────────────────────────┐
│              MATCH DETAIL                       │
├─────────────────────────────────────────────────┤
│  Match Name: Semi-Final 1                       │
│  Venue: City Stadium                            │
│  Date: 2024-01-15  |  Time: 10:00 AM            │
│  Format: T20                                    │
├─────────────────────────────────────────────────┤
│  OVERLAY SECTION                                │
│  ┌─────────────────────────────────────────┐    │
│  │ Overlay Selection (by membership)       │    │
│  │ [Select Overlay ▼]                      │    │
│  │                                         │    │
│  │ Generated URL:                          │    │
│  │ https://scorex.com/overlay/abc123?id=123│    │
│  │                                         │    │
│  │ [Copy URL] [Preview]                    │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  SCORING BOARD                                  │
│  ┌─────────────────────────────────────────┐    │
│  │            INNINGS 1                    │    │
│  │  Team A: 145/2 (15.4 overs)             │    │
│  │  CRR: 9.25  |  RRR: 8.50                │    │
│  ├─────────────────────────────────────────┤    │
│  │  BATTING          │  BOWLING            │    │
│  │  Player A: 45(32) │  Player X: 3/25     │    │
│  │  Player B: 67(41) │  Player Y: 2/30     │    │
│  │  *on strike*      │                     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │           SCORING CONTROLS              │    │
│  │  [1] [2] [3] [4] [6] [0] (Dot Ball)     │    │
│  │                                         │    │
│  │  [OUT ▼]                                │    │
│  │  ┌──────────────────────────────────┐   │    │
│  │  │ Caught | Bowled | LBW | Run Out │    │    │
│  │  │ Stumped | Hit Wicket | Obstruct │    │    │
│  │  └──────────────────────────────────┘   │    │
│  │                                         │    │
│  │  [NO BALL ▼]                            │    │
│  │  ┌──────────────────────────────────┐   │    │
│  │  │ +1 +2 +3 +4 +5 +6 +Wicket        │   │    │
│  │  └──────────────────────────────────┘   │    │
│  │                                         │    │
│  │  [BYE ▼]    [LEG BYE ▼]                 │    │
│  │                                         │    │ 
│  │  [↩ UNDO]    [OTHER ▼]                  │    │ 
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**Match Start Flow**:
```
1. Click "Start Match"
2. Select Toss Winner Team
3. Select: Bat or Bowl
4. Select Batsman on Strike
5. Select Batsman on Non-Strike
6. Select Bowler
7. Start Scoring
```

**Algorithm: Cricket Scoring**
```
FUNCTION addBall(matchId, ballData):
  match = findMatchById(matchId)
  
  // Validate ball data
  validate(ballData.runs, ballData.extras, ballData.wicket)
  
  // Update over/ball count
  currentOver = match.currentOver
  currentBall = match.currentBall
  
  IF currentBall == 6:
    // New over
    currentOver += 1
    currentBall = 0
  ELSE:
    currentBall += 1
  
  // Add runs to total
  team = match.currentInnings == 1 ? match.team1 : match.team2
  team.score += ballData.runs + ballData.extras
  
  // Handle wicket
  IF ballData.wicket:
    team.wickets += 1
    // Record wicket details
    match.wickets.push({
      type: ballData.wicketType,
      player: ballData.dismissedPlayer,
      bowler: ballData.bowler
    })
  
  // Handle extras
  IF ballData.noBall:
    team.extras.noBall += 1
    team.extras.total += ballData.noBallRuns
  IF ballData.bye:
    team.extras.bye += 1
  IF ballData.legBye:
    team.extras.legBye += 1
  
  // Calculate run rate
  ballsBowled = (currentOver * 6) + currentBall
  overFraction = ballsBowled / 6
  team.runRate = team.score / overFraction
  
  // Update striker
  IF ballData.runs % 2 == 1:
    swapStriker(match)
  
  // Check for over end (swap bowler)
  IF currentBall == 0 AND currentOver > 0:
    swapBowler(match)
  
  // Save match
  match.save()
  
  // Emit socket event for real-time update
  io.to(match._id).emit('scoreUpdate', match)
  
  RETURN match
```

**Out Types Supported**:
- Caught
- Bowled
- LBW (Leg Before Wicket)
- Run Out
- Stumped
- Hit Wicket
- Obstructing the Field
- Timed Out
- Handled the Ball

**Extras**:
- No Ball (with runs 0-6 + wicket option)
- Wide (with runs 0-6 + wicket option)
- Bye (runs 0-6)
- Leg Bye (runs 0-6)

---

### 7. Tournament Stats

**Stats Sections**:
```
┌─────────────────────────────────────────────────┐
│            TOURNAMENT STATS                     │
├─────────────────────────────────────────────────┤
│  TEAM STATISTICS                                │
│  ┌────────┬──────┬───────┬───────┬──────┐       │
│  │ Team   │Matches│ Wins  │ Losses│ Points│     │
│  ├────────┼──────┼───────┼───────┼──────┤       │
│  │ Team A │   5   │   4   │   1   │  12   │     │
│  │ Team B │   5   │   3   │   2   │   9   │     │
│  └────────┴──────┴───────┴───────┴──────┘       │
│                                                 │
│  PLAYER LEADERBOARD                            │
│  ┌──────┬───────────┬──────┬──────┬──────┐   │
│  │ Rank │ Player    │ Team │ Runs │ Points│   │
│  ├──────┼───────────┼──────┼──────┼──────┤   │
│  │  1   │ Player A  │Team A│  345 │  520  │   │
│  │  2   │ Player B  │Team B│  298 │  445  │   │
│  └──────┴───────────┴──────┴──────┴──────┘   │
│                                                 │
│  MATCH STATISTICS                              │
│  ┌────────┬───────────┬────────┬──────────┐    │
│  │Match   │ Winner    │  MVP   │  Score   │    │
│  ├────────┼───────────┼────────┼──────────┤    │
│  │ Final  │ Team A    │Player X│ 145/2    │    │
│  └────────┴───────────┴────────┴──────────┘    │
│                                                 │
│  MVP AWARDS                                    │
│  - Match MVP per game                          │
│  - Tournament best player                      │
│  - Orange Cap (Top scorer)                     │
│  - Purple Cap (Top wicket taker)              │
└─────────────────────────────────────────────────┘
```

---

### 8. Live Match Page (Public)

**Public URL**: `/live/:matchId`

**Sections**:
```
┌─────────────────────────────────────────────────┐
│           LIVE MATCH VIEWER                     │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐  │
│  │         VIDEO STREAM URL                 │  │
│  │  (YouTube/Twitch/Custom Embed)           │  │
│  │  [Stream not added yet]                  │  │
│  └─────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐  │
│  │         LIVE SCORE                        │  │
│  │                                          │  │
│  │   Team A: 145/2 (15.4 ov)               │  │
│  │   Team B: Need 56 runs                  │  │
│  │                                          │  │
│  │   CRR: 9.25  |  RRR: 8.50               │  │
│  └─────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐  │
│  │         MATCH DETAILS                    │  │
│  │  Match: Semi-Final 1                     │  │
│  │  Teams: Team A vs Team B                 │  │
│  │  Venue: City Stadium                    │  │
│  │  Date: January 15, 2024                 │  │
│  │  Time: 10:00 AM                         │  │
│  │  Created by: User123                     │  │
│  └─────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  STATUS: 🔴 LIVE  |  🟡 UPCOMING  |  ✅ COMPLETED│
└─────────────────────────────────────────────────┘
```

---

### 9. Global Leaderboard

**Sections**:
```
┌─────────────────────────────────────────────────┐
│              GLOBAL LEADERBOARD                 │
├─────────────────────────────────────────────────┤
│  FILTER: [All Time] [This Year] [This Month]  │
├─────────────────────────────────────────────────┤
│  ┌──────┬───────────┬────────┬───────┬─────┐ │
│  │ Rank │ Player    │ Matches│ Wins  │ Points│ │
│  ├──────┼───────────┼────────┼───────┼─────┤ │
│  │  1   │ Player A  │  150   │  120  │ 5200 │ │
│  │  2   │ Player B  │  145   │  115  │ 4950 │ │
│  │  3   │ Player C  │  142   │  108  │ 4700 │ │
│  └──────┴───────────┴────────┴───────┴─────┘ │
└─────────────────────────────────────────────────┘
```

---

### 10. Club Management

**Club Sections**:
```
┌─────────────────────────────────────────────────┐
│                 CLUB SECTION                    │
├─────────────────────────────────────────────────┤
│  [+ CREATE CLUB]  [SEARCH CLUBS]               │
├─────────────────────────────────────────────────┤
│  CLUB CREATION FORM                            │
│  - Club Name                                   │
│  - Club Image (optional)                       │
│  - Location                                    │
│  - Type: Public / Initiation Required          │
├─────────────────────────────────────────────────┤
│  CLUB LIST (Search by name)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Club A  │ │ Club B  │ │ Club C  │          │
│  │ Public  │ │ Init.   │ │ Public  │          │
│  │ [Join]  │ │ [Apply] │ │ [Join]  │          │
│  └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────┤
│  MY CLUB (After joining/creating)             │
│  ┌─────────────────────────────────────────┐  │
│  │ Club Name: Super Cricket Club           │  │
│  │ Members: 15 | Location: New York        │  │
│  ├─────────────────────────────────────────┤  │
│  │ CLUB MEMBERS LIST                       │  │
│  │ ┌────────────────────────────────────┐ │  │
│  │ │ Owner: John (Leader)               │ │  │
│  │ │ Vice-Leader: Mike                 │ │  │
│  │ │ Member: Sarah                     │ │  │
│  │ │ Member: Alex                      │ │  │
│  │ └────────────────────────────────────┘ │  │
│  ├─────────────────────────────────────────┤  │
│  │ [Change Role] [Remove Member]          │  │
│  │ (Only for Owner/Vice-Leader)            │  │
│  ├─────────────────────────────────────────┤  │
│  │ [LEAVE CLUB] button                     │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Club Roles**:
- Owner (Leader) - Full control, can manage all members
- Vice-Leader - Can manage members, approve requests
- Member - Basic access

**Club Types**:
- Public - Anyone can join freely
- Initiation Required - Owner/Vice-Leader must approve join requests

---

### 11. Friends Management

**Features**:
```
┌─────────────────────────────────────────────────┐
│              FRIENDS SECTION                    │
├─────────────────────────────────────────────────┤
│  [+ ADD FRIEND]                                │
│  Search by: [Email] or [Username]              │
├─────────────────────────────────────────────────┤
│  FRIENDS LIST                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Friend1 │ │ Friend2 │ │ Friend3 │          │
│  │ Online  │ │ Offline │ │ Online  │          │
│  │ [Chat]  │ │ [Chat]  │ │ [Chat]  │          │
│  └─────────┘ └─────────┘ └─────────┘          │
│                                                 │
│  [REMOVE FRIEND] option on each friend         │
└─────────────────────────────────────────────────┘
```

---

### 12. Membership System

**Features**:
```
┌─────────────────────────────────────────────────┐
│            MEMBERSHIP SECTION                   │
├─────────────────────────────────────────────────┤
│  CURRENT MEMBERSHIP                            │
│  ┌─────────────────────────────────────────┐  │
│  │ Status: ACTIVE                          │  │
│  │ Plan: Premium                            │  │
│  │ Start Date: January 1, 2024             │  │
│  │ End Date: January 1, 2025               │  │
│  │ Time Left: 11 months, 15 days           │  │
│  └─────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  UPGRADE/EXTEND MEMBERSHIP                     │
│  ┌─────────────┐ ┌─────────────┐              │
│  │ Basic ($9)  │ │ Premium($19)│              │
│  │ - 1 Month   │ │ - 1 Month   │              │
│  │ [Select]    │ │ [Select]    │              │
│  └─────────────┘ └─────────────┘              │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │         PAYMENT FORM                     │  │
│  │  Card Number: **** **** **** ****        │  │
│  │  Expiry: **/**    CVV: ***              │  │
│  │                                          │  │
│  │  [PAY NOW]                              │  │
│  └─────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  SECRET DEV CARD (Hidden/Internal)             │
│  Card: 88714741390926000                       │
│  Date: 0926  |  CVV: 000                      │
│  (Developer override - no verification)        │
└─────────────────────────────────────────────────┘
```

**Membership Logic**:
```
FUNCTION purchaseMembership(userId, plan, cardDetails):
  // Check for secret dev card
  IF cardDetails.number == '88714741390926000' AND 
     cardDetails.expiry == '0926' AND 
     cardDetails.cvv == '000':
    // Skip payment, approve immediately
    membership = activateMembership(userId, plan)
    RETURN { success: true, membership }
  
  // Normal payment processing
  paymentResult = processPayment(cardDetails, plan.price)
  
  IF paymentResult.success:
    membership = activateMembership(userId, plan)
    RETURN { success: true, membership }
  ELSE:
    RETURN { success: false, error: paymentResult.error }

FUNCTION extendMembership(userId, months):
  user = findUserById(userId)
  
  currentEndDate = user.membership.endDate
  
  IF currentEndDate > NOW():
    // Add to current membership
    newEndDate = currentEndDate.addMonths(months)
  ELSE:
    // Start new membership
    newEndDate = NOW().addMonths(months)
  
  user.membership.endDate = newEndDate
  user.membership.status = 'active'
  user.save()
  
  RETURN user.membership
```

---

### 13. Profile Section

- User profile display (no changes needed)
- Edit profile information
- Change password
- Account settings

---

### 14. Navigation & Theme

**Sidebar Features**:
- Dashboard
- Tournaments
- Teams
- Live Matches
- Leaderboard
- Clubs
- Friends
- Membership
- Profile
- Theme Toggle (Light/Dark)
- Logout (redirects to frontpage)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                              │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Pages: Frontpage | Login | Register | Dashboard | Tournament    │ │
│  │  Components: LiveScoring | MatchDetails | OverlayEditor | etc.  │ │
│  │  Services: API | Socket | Auth                                   │ │
│  │  Hooks: useCricketScoring | useOptimisticMutation              │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                     │ HTTP/WebSocket
┌───────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Express)                           │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Routes: /api/v1/*                                              │ │
│  │  Controllers: Tournament | Match | Team | User | Club | etc.    │ │
│  │  Models: User | Tournament | Match | Team | Player | Club       │ │
│  │  Middleware: Auth | Validation | ErrorHandler                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                     │
┌───────────────────────────────────────────────────────────────────────┐
│                        DATABASE (MongoDB)                             │
│  Collections: users | tournaments | matches | teams | players | clubs │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow & Algorithms

### 1. Authentication Flow
```
User → Login/Register → Validate Email → Create User → JWT Token → Dashboard
```

### 2. Tournament Creation Flow
```
Tournament Form → Validate → Create Tournament → Generate Matches → Return
```

### 3. Live Scoring Flow
```
Scoring Board → Add Ball → Update Match → Emit Socket → Update Overlay
```

### 4. Points Calculation Flow
```
Match Completed → Calculate Player Stats → Update Points Table → Update Leaderboard
```

---

## API Endpoints & Routes

### Base URL: `/api/v1`

| Route | Methods | Description |
|-------|---------|-------------|
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User login |
| `/auth/google` | GET | Google OAuth |
| `/auth/github` | GET | GitHub OAuth |
| `/users/profile` | GET, PUT | User profile |
| `/tournaments` | GET, POST | List/Create tournaments |
| `/tournaments/:id` | GET, PUT, DELETE | Tournament CRUD |
| `/tournaments/:id/teams` | GET, POST | Tournament teams |
| `/tournaments/:id/matches` | GET | Tournament matches |
| `/tournaments/:id/stats` | GET | Tournament stats |
| `/matches` | GET, POST | List/Create matches |
| `/matches/:id` | GET, PUT, DELETE | Match CRUD |
| `/matches/:id/score` | POST | Add ball/score |
| `/matches/:id/status` | PUT | Update match status |
| `/teams` | GET, POST | List/Create teams |
| `/teams/:id` | GET, PUT, DELETE | Team CRUD |
| `/teams/:id/players` | GET, POST | Team players |
| `/players/:id/stats` | GET | Player statistics |
| `/clubs` | GET, POST | List/Create clubs |
| `/clubs/:id/join` | POST | Join club |
| `/clubs/:id/leave` | POST | Leave club |
| `/clubs/:id/members` | GET, PUT | Manage members |
| `/friends` | GET, POST | List/Add friends |
| `/friends/:id` | DELETE | Remove friend |
| `/payments/membership` | POST | Purchase membership |
| `/leaderboard` | GET | Global leaderboard |
| `/leaderboard/tournament/:id` | GET | Tournament leaderboard |
| `/notifications` | GET | User notifications |

---

## Real-Time Communication (Socket.IO)

### Socket Events

| Event | Description |
|-------|-------------|
| `joinMatch` | Join match room |
| `leaveMatch` | Leave match room |
| `addBall` | Add ball/scoring |
| `scoreUpdate` | Broadcast score update |
| `matchStatusUpdate` | Broadcast status change |
| `tournamentUpdate` | Broadcast tournament update |
| `notification` | User notification |

### Rooms
- `match:{matchId}` - Match updates
- `tournament:{id}` - Tournament updates
- `user:{userId}` - User notifications

---

## Frontend Application Flow

### Route Structure
```
Routes
├── Public
│   ├── / → Frontpage
│   ├── /login → Login
│   ├── /register → Register
│   ├── /live/:id → Live Match Viewer
│   └── /leaderboard → Global Leaderboard
│
├── Protected (require auth)
│   └── DashboardLayout
│       ├── /dashboard → Dashboard
│       ├── /tournaments → Tournament List
│       ├── /tournaments/create → Create Tournament
│       ├── /tournaments/:id → Tournament Detail
│       ├── /teams → Team Management
│       ├── /live-matches → User's Live Matches
│       ├── /clubs → Club Management
│       ├── /friends → Friend List
│       ├── /membership → Membership
│       ├── /profile → Profile
│       └── /admin → Admin Panel
```

---

## Database Schema Relationships

### Entity Relationships
```
User (1) ────── (N) Tournament
User (1) ────── (N) Team
User (1) ────── (N) Club (owner)
User (1) ────── (N) Club (member)
User (1) ────── (N) Friend

Tournament (1) ────── (N) Match
Tournament (1) ────── (N) Team
Tournament (1) ────── (N) Bracket

Team (1) ────── (N) Player
Team (1) ────── (N) Match

Match (N) ────── (N) Player (scores)

Club (1) ────── (N) User (members)
```

### Model Registration Order
1. User, Player
2. Team (depends on Player)
3. Tournament (depends on Team)
4. Match (depends on Tournament, Team)
5. Club (depends on User)
6. Bracket (depends on Tournament, Match)
7. Overlay, Notification, Friend

---

## Cricket Scoring System

### Score Types
- **Runs**: 0, 1, 2, 3, 4, 6
- **Wides**: 0, 1, 2, 3, 4, 5, 6 + extra ball
- **No Balls**: 0, 1, 2, 3, 4, 5, 6 + extra ball + can take wicket
- **Byes**: 0, 1, 2, 3, 4, 5, 6
- **Leg Byes**: 0, 1, 2, 3, 4, 5, 6

### Out Types
- Caught, Bowled, LBW, Run Out, Stumped, Hit Wicket, Obstructing the Field

### Key Calculations
- **Run Rate**: Total Runs / Overs Bowled
- **Required Run Rate**: Runs Needed / Balls Remaining
- **Player Points**: (Runs × 1) + (Fours × 1) + (Sixes × 2) + (Wickets × 10) + (Catches × 5)

---

## Membership & Payments

### Plans
- **Basic** ($9/month): Basic overlays
- **Premium** ($19/month): All overlays + features

### Dev Override Card
- Number: 88714741390926000
- Expiry: 0926
- CVV: 000

---

## Known Issues & Bugs

1. **Duplicate Directories**: scorex-frontend/scorex-frontend/, scorex-backend/scorex-backend/
2. **Socket Event Inconsistency**: Both snake_case and camelCase events
3. **Overlay Path Issues**: Static file serving problems
4. **TypeScript Types**: Some `any` types need fixing
5. **Email Validation**: Need to add proper validation

---

## Development Workflow

### Running the Project
```bash
# Backend
cd scorex-backend/scorex-backend
npm install
npm run dev  # Port 5000

# Frontend
cd scorex-frontend/scorex-frontend
npm install
npm run dev  # Port 5173
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/scorex
JWT_SECRET=your-secret
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

---

*Document Version: 2.0 - Updated with complete feature specifications*

