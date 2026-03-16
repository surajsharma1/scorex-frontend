import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import api from './services/api';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import OAuthCallback from './components/OAuthCallback';
import TournamentView from './components/TournamentView';
import LiveScoring from './components/LiveScoring';
import LiveMatches from './components/LiveMatches';
import Profile from './components/Profile';
import Membership from './components/Membership';
import ClubManagement from './components/ClubManagement';
import FriendList from './components/FriendList';
import Leaderboard from './components/Leaderboard';
import OverlayEditor from './components/OverlayEditor';
import ForgotPassword from './components/ForgotPassword';
import Frontpage from './components/Frontpage';

// ─── Auth Context ─────────────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  membershipLevel?: number;
  fullName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (userData: any) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true
});

export const useAuth = () => useContext(AuthContext);

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading ScoreX...</p>
      </div>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar user={user} logout={logout} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          const userData = res.data.data;
          setUser({
            id: userData._id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            membershipLevel: userData.membershipLevel,
            fullName: userData.fullName
          });
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData: any) => {
    const u = userData.user || userData;
    localStorage.setItem('token', userData.token || userData.data?.token);
    setUser({
      id: u._id || u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      membershipLevel: u.membershipLevel,
      fullName: u.fullName
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Frontpage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout><Dashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/tournaments" element={
            <ProtectedRoute>
              <DashboardLayout><TournamentView /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/tournaments/:id" element={
            <ProtectedRoute>
              <DashboardLayout><TournamentView /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/live" element={
            <ProtectedRoute>
              <DashboardLayout><LiveMatches /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/matches/:id/score" element={
            <ProtectedRoute>
              <LiveScoring />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout><Profile /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/membership" element={
            <ProtectedRoute>
              <DashboardLayout><Membership /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/clubs" element={
            <ProtectedRoute>
              <DashboardLayout><ClubManagement /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/friends" element={
            <ProtectedRoute>
              <DashboardLayout><FriendList /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <DashboardLayout><Leaderboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/overlays" element={
            <ProtectedRoute>
              <DashboardLayout><OverlayEditor /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}
