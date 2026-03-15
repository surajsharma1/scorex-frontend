/**
 * App.tsx — Fixed & Rewritten
 *
 * BUGS FIXED:
 * 1. Duplicate console.error + localStorage.removeItem in the catch block
 * 2. {isAdmin && <Route ... />} inside <Routes> — conditional route rendering
 *    is unreliable in React Router v6. Routes must always be present in the tree;
 *    auth/role checks should live inside the element, not around the <Route> itself.
 *    FIX: AdminRoute wrapper component that redirects non-admins.
 * 3. App read localStorage once at render time — token/user changes required a
 *    full page reload to take effect. FIX: useState so it re-renders on change.
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import TournamentList from './TournamentList';
import TournamentForm from './TournamentForm';
import TournamentDetail from './TournamentDetail';
import LiveMatches from './LiveMatches';
import LiveMatchPage from './LiveMatchPage';
import LiveScoring from './LiveScoring';
import OverlayEditor from './OverlayEditor';
import OverlayForm from './OverlayForm';
import Payment from './Payment';
import Leaderboard from './Leaderboard';
import TeamManagement from './TeamManagement';
import FriendList from './FriendList';
import ClubManagement from './ClubManagement';
import Membership from './Membership';
import Profile from './Profile';
import AdminPanel from './AdminPanel';
import { Menu } from 'lucide-react';

// ─── Dashboard Layout ──────────────────────────────────────────────────────
const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md md:hidden"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <main className="flex-1 md:ml-64 h-full overflow-y-auto transition-all duration-300 p-4 md:p-8 pt-16 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
};

// ─── Admin Guard ───────────────────────────────────────────────────────────
// FIX #2: instead of {isAdmin && <Route />} (unreliable in RRv6),
// the route always exists but redirects non-admins from inside the element.
const AdminRoute = () => {
  let isAdmin = false;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      isAdmin = JSON.parse(userStr)?.role === 'admin';
    }
  } catch { /* ignore */ }

  return isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" replace />;
};

// ─── App ───────────────────────────────────────────────────────────────────
function App() {
  // FIX #3: use state so the component re-renders when auth changes
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Keep token state in sync with localStorage (e.g. after OAuth redirect)
  useEffect(() => {
    const sync = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return (
    <Routes>
      {/* ── PUBLIC ── */}
      <Route path="/" element={<Frontpage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/matches/live" element={<LiveMatches />} />
      <Route path="/live/:id" element={<LiveMatchPage />} />
      <Route path="/live-scoring/:id" element={<LiveScoring />} />

      {/* ── PROTECTED ── */}
      <Route element={token ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/create" element={<TournamentForm />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/overlays" element={<OverlayEditor />} />
        <Route path="/overlays/create" element={<OverlayForm />} />
        <Route path="/teams" element={<TeamManagement />} />
        <Route path="/friends" element={<FriendList />} />
        <Route path="/clubs" element={<ClubManagement />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/live-matches" element={<LiveMatches />} />
        {/* FIX #2: AdminRoute always present, guards internally */}
        <Route path="/admin" element={<AdminRoute />} />
        <Route
          path="/upgrade"
          element={
            <div className="flex items-center justify-center h-full">
              <Payment onClose={() => window.history.back()} onSuccess={() => alert('Upgraded!')} />
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
