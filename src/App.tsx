import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './components/ThemeProvider';
import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { ToastProvider } from './hooks/useToast';
import api from './services/api';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import OAuthCallback from './components/OAuthCallback';
import ForgotPassword from './components/ForgotPassword';
import Frontpage from './components/Frontpage';
import ResetPassword from './components/ResetPassword';

const Dashboard = lazy(() => import('./components/Dashboard'));
const TournamentList = lazy(() => import('./components/TournamentList'));
const TournamentForm = lazy(() => import('./components/TournamentForm'));
const TournamentDetail = lazy(() => import('./components/TournamentDetail'));
const TournamentView = lazy(() => import('./components/TournamentView'));
const LiveScoring = lazy(() => import('./components/LiveScoring'));
const LiveMatches = lazy(() => import('./components/LiveMatches'));
const LiveMatchPage = lazy(() => import('./components/LiveMatchPage'));
const Profile = lazy(() => import('./components/Profile'));
const Membership = lazy(() => import('./components/Membership'));
const ClubList = lazy(() => import('./components/ClubList'));
const ClubDetail = lazy(() => import('./components/ClubDetail'));
const CreateClubForm = lazy(() => import('./components/CreateClubForm'));
const ClubManagement = lazy(() => import('./components/ClubManagement'));

const FriendList = lazy(() => import('./components/FriendList'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

export interface AuthUser {
  _id: string;
  id: string;
  username: string;
  email: string;
  role: string;
  membershipLevel: number;
  membershipExpiry: string | null;
  membershipPurchasedAt: string | null;
  membershipDuration: string | null;
  fullName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (data: { token: string; user: any; data?: any }) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  loading: true
});

export const useAuth = () => useContext(AuthContext);

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#030305]">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ToastWrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    
    if (t) {
      setToken(t);
      if (u) {
        try {
          const userData = JSON.parse(u);
          setUser({
            _id: userData._id || userData.id,
            id: userData._id || userData.id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            membershipLevel: userData.membership?.level || userData.membershipLevel || 0,
            membershipExpiry: userData.membership?.expires || userData.membershipExpiresAt || null,
            membershipPurchasedAt: userData.membershipStartedAt || null,
            membershipDuration: null,
            fullName: userData.fullName
          });
        } catch(e) {
          console.error("Failed to parse user from local storage");
        }
      }
      
      api.get('/auth/me').then(res => {
        const u = res.data.data;
        setUser({
          _id: u._id || u.id,
          id: u._id || u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          membershipLevel: u.membership?.level || u.membershipLevel || 0,
          membershipExpiry: u.membership?.expires || u.membershipExpiresAt || null,
          membershipPurchasedAt: u.membershipStartedAt || null,
          membershipDuration: null,
          fullName: u.fullName
        });
        localStorage.setItem('user', JSON.stringify(u));
      }).catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (data: { token: string; user?: any; data?: any }) => {
    const t = data.token || data.data?.token;
    const u = data.user || data.data?.user;
    if (t && u) {
      setToken(t);
      setUser({
        _id: u._id || u.id,
        id: u._id || u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        membershipLevel: u.membership?.level || u.membershipLevel || 0,
        membershipExpiry: u.membership?.expires || u.membershipExpiresAt || null,
        membershipPurchasedAt: u.membershipStartedAt || null,
        membershipDuration: null,
        fullName: u.fullName
      });
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) return <LoadingSpinner />;

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  const AdminDashboardRoute = ({ children }: { children: React.ReactNode }) => {
    if (!token) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
    
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
        <Sidebar user={user} logout={logout} />
        <main className="flex-1 overflow-y-auto w-full max-w-full">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
      </div>
    );
  };

  const ProtectedDashboardRoute = ({ children }: { children: React.ReactNode }) => {
    if (!token) return <Navigate to="/login" replace />;
    
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
        <Sidebar user={user} logout={logout} />
        <main className="flex-1 overflow-y-auto w-full max-w-full">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
      </div>
    );
  };

  return (
    <ThemeProvider>
      <ToastWrapper>
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
          <Router>
            <Routes>
            {/* Public */}
            <Route path="/" element={<Frontpage />} />
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
<Route path="/oauth/callback" element={<OAuthCallback />} />
  <Route path="/dashboard" element={<ProtectedDashboardRoute><Dashboard /></ProtectedDashboardRoute>} />

            
            <Route path="/live" element={<ProtectedDashboardRoute><LiveMatches /></ProtectedDashboardRoute>} />

            <Route path="/profile" element={<ProtectedDashboardRoute><Profile /></ProtectedDashboardRoute>} />
            
            <Route path="/tournaments" element={<ProtectedDashboardRoute><TournamentList /></ProtectedDashboardRoute>} />
            <Route path="/tournaments/create" element={<ProtectedDashboardRoute><TournamentForm /></ProtectedDashboardRoute>} />
            <Route path="/tournaments/:id" element={<ProtectedDashboardRoute><TournamentView /></ProtectedDashboardRoute>} />
            
            <Route path="/membership" element={<ProtectedDashboardRoute><Membership /></ProtectedDashboardRoute>} />
            <Route path="/clubs" element={<ProtectedDashboardRoute><ClubList /></ProtectedDashboardRoute>} />
            <Route path="/clubs/create" element={<ProtectedDashboardRoute><CreateClubForm /></ProtectedDashboardRoute>} />
            <Route path="/clubs/:id/manage" element={<ProtectedDashboardRoute><ClubManagement /></ProtectedDashboardRoute>} />
            <Route path="/clubs/:id" element={<ProtectedDashboardRoute><ClubDetail /></ProtectedDashboardRoute>} />

            <Route path="/friends" element={<ProtectedDashboardRoute><FriendList /></ProtectedDashboardRoute>} />
            <Route path="/leaderboard" element={<ProtectedDashboardRoute><Leaderboard /></ProtectedDashboardRoute>} />
            
            {/* Admin */}
            <Route path="/admin" element={<AdminDashboardRoute><AdminPanel /></AdminDashboardRoute>} />

            {/* Live scoring (full screen, no sidebar) */}
            <Route path="/matches/:id/score" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <LiveScoring />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </AuthContext.Provider>
      </ToastWrapper>
    </ThemeProvider>
  );
}