# ScoreX — Live Cricket Scoring & Broadcast Overlay Platform

> Real-time cricket scoring web app with live OBS broadcast overlays, tournament management, and WebSocket-driven score transmission.

🔗 **Live:** [scorex-live.vercel.app](https://scorex-live.vercel.app)  
📦 **Backend Repo:** [github.com/surajsharma1/scorex-backend](https://github.com/surajsharma1/scorex-backend)

---

## What This Is

ScoreX is a full-stack cricket scoring platform built for real match broadcasts. Scorers update the live score through a web interface; the score instantly appears on an OBS overlay used during live streams — with no page refresh, no manual updates.

It handles everything from ball-by-ball scoring to full tournament brackets, with a separate admin panel for managing matches, teams, and users.

---

## Features

- **Live Scoring Interface** — Ball-by-ball scoring with real-time WebSocket sync
- **OBS Broadcast Overlay** — Animating overlay that receives live score via Socket.io; plug directly into OBS as a browser source
- **Match Management** — Create matches, assign teams, track scorecards
- **Tournament Management** — Create and manage tournaments with bracket progression
- **User Auth** — JWT-based login/register, password reset via Nodemailer
- **Admin Panel** — Manage users, matches, and tournament data
- **Dark / Light Theme** — Full UI theme toggle across all pages
- **Membership Flows** — User tiers and access control

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript |
| Styling | CSS Modules, custom theming |
| Real-time | Socket.io Client |
| Auth | JWT (stored client-side) |
| Deployment | Vercel |
| API | REST (Node.js/Express backend) |

---

## Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/             # Route-level page components
│   ├── LiveScoring/   # Ball-by-ball scoring interface
│   ├── Overlay/       # OBS browser source overlay
│   ├── Tournament/    # Tournament management UI
│   └── Admin/         # Admin panel
├── hooks/             # Custom React hooks
├── context/           # Auth and theme context
├── services/          # API call functions
└── types/             # TypeScript interfaces
```

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js 18+
- npm or yarn
- ScoreX backend running locally (see backend repo)

### Installation

```bash
# Clone the repo
git clone https://github.com/surajsharma1/scorex-frontend.git
cd scorex-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and set VITE_API_URL to your backend URL
```

### Environment Variables

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Run Locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## How the Overlay Works

1. Scorer opens the Live Scoring page and starts updating the score
2. Every update emits a Socket.io event to the backend
3. Backend broadcasts the event to all connected overlay clients
4. The OBS overlay page (running as a browser source) receives the event and updates the display in real time — no refresh needed

To use the overlay in OBS:
- Add a **Browser Source**
- Set URL to: `https://scorex-live.vercel.app/overlay?matchId=YOUR_MATCH_ID`
- Set resolution to match your stream canvas (e.g. 1920×1080)

---

## Known Limitations

- No mobile-optimised scoring interface (designed for desktop use by scorers)
- Single active match per user account (one-tournament-per-user enforcement in progress)
- Google OAuth integration planned but not yet implemented

---

## Author

**Suraj Sharma**  
B.Tech IT — Malwa Institute of Science & Technology, Indore  
[github.com/surajsharma1](https://github.com/surajsharma1)
