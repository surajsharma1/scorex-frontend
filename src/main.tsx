import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// Layouts & Pages
import App from './components/App';
import Frontpage from './components/Frontpage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TournamentView from './components/TournamentView';
import TournamentDetail from './components/TournamentDetail';
import MatchDetails from './components/MatchDetails';
import LiveMatches from './components/LiveMatches';
import LiveTournament from './components/LiveTournament';
import TeamManagement from './components/TeamManagement';
import FriendList from './components/FriendList';
import ClubManagement from './components/ClubManagement';
import Leaderboard from './components/Leaderboard';
import OverlayEditor from './components/OverlayEditor';
import Profile from './components/Profile';
import Membership from './components/Membership';
import Payment from './components/Payment';

// Providers
import { ThemeProvider } from './components/ThemeProvider';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Protected Layout (Sidebar + Header)
    children: [
      { index: true, element: <Dashboard /> },
      { path: "tournaments", element: <TournamentView /> },
      { path: "tournaments/:id", element: <TournamentDetail /> },
      { path: "match/:id", element: <MatchDetails /> },
      { path: "teams", element: <TeamManagement /> },
      { path: "leaderboard", element: <Leaderboard /> },
      { path: "friends", element: <FriendList /> },
      { path: "clubs", element: <ClubManagement /> },
      { path: "overlays", element: <OverlayEditor /> },
      { path: "profile", element: <Profile /> },
      { path: "membership", element: <Membership /> },
    ]
  },
  // Public Routes
  { path: "/welcome", element: <Frontpage /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/live-matches", element: <LiveMatches /> },
  { path: "/live-tournament/:id", element: <LiveTournament /> },
  
  // Payment Callback Mock
  { path: "/payment", element: <Payment onClose={() => window.history.back()} onSuccess={() => alert('Success')} /> }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);