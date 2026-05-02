import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './components/ThemeProvider';
import { useState, useEffect, createContext, useContext } from 'react';
import { ToastProvider } from './hooks/useToast';
import api from './services/api';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import OAuthCallback from './components/OAuthCallback';
import ForgotPassword from './components/ForgotPassword';
import Frontpage from './components/Frontpage';
import ResetPassword from './components/ResetPassword';
import ErrorBoundary from './components/ErrorBoundary';

// ── All routes imported eagerly — no lazy loading, no blank-screen flicker ──
import Dashboard from './components/Dashboard';
import TournamentList from './components/TournamentList';
import TournamentForm from './components/TournamentForm';
import TournamentView from './components/TournamentView';
import LiveScoring from './components/LiveScoring';
import LiveMatches from './components/LiveMatches';
import LiveMatchPage from './components/LiveMatchPage';
import Profile from './components/Profile';
import Membership from './components/Membership';
import LiveScoreboardPreview from './components/LiveScoreboardPreview';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import PreviewStudio from './components/PreviewStudio';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';

export interface AuthUser {
  _id: string;
  id: string;
  username: string;
  email: string;
  role: string;
  membershipLevel: number;
  membershipExpiry: string | null;
  membershipPurchasedAt: string | null;
  membershipDuration: number | null;
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
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#030305]">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: AuthUser | null;
  logout: () => void;
  token: string | null;
  requireAdmin?: boolean;
}

function DashboardLayout({ children, user, logout, token, requireAdmin }: DashboardLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-primary)]">
      {!isSidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-xl md:hidden transition-transform hover:scale-105 active:scale-95 bg-transparent"
          onClick={toggleSidebar}
        >
          <svg className="w-7 h-7 text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={closeSidebar}
        />
      )}
      <Sidebar user={user} logout={logout} isOpen={isSidebarOpen} onClose={closeSidebar} />
      <main className="flex-1 relative z-10 overflow-auto p-4 md:p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
}

// ProtectedRoute outside App to prevent reconciliation issues
function ProtectedRoute({ token, children }: { token: string | null; children: React.ReactNode }) {
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const parseUser = (userData: any): AuthUser => ({
    _id: userData._id || userData.id || '',
    id: userData._id || userData.id || '',
    username: userData.username || '',
    email: userData.email || '',
    role: userData.role || 'user',
    membershipLevel: userData.membership?.level ?? userData.membershipLevel ?? 0,
    membershipExpiry: userData.membership?.expires || userData.membershipExpiresAt || null,
    membershipPurchasedAt: userData.membershipStartedAt || null,
    membershipDuration: null,
    fullName: userData.fullName,
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');

    if (t && u) {
      setToken(t);
      try {
        const userData = JSON.parse(u);
        if (userData?.username || userData?.email) setUser(parseUser(userData));
        else localStorage.removeItem('user');
      } catch { localStorage.removeItem('user'); }

      api.get('/auth/me')
        .then(res => {
          const userData = res.data?.data;
          if (userData?.username || userData?.email) {
            setUser(parseUser(userData));
            localStorage.setItem('user', JSON.stringify(userData));
          }
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (data: { token: string; user: any; data?: any }) => {
    const t = data.token || data.data?.token;
    const u = data.user || data.data?.user;
    if (t && u) {
      setToken(t);
      setUser(parseUser(u));
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            <Router>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Frontpage />} />
                <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" replace />} />
                <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />

{/* Studio — public, fullscreen, no sidebar */}
                <Route path="/studio" element={<PreviewStudio />} />
                <Route path="/studio/:id" element={<PreviewStudio />} />
                <Route path="/studio/preview" element={<PreviewStudio />} />
                <Route path="/preview-studio" element={<PreviewStudio />} />

                {/* Dashboard pages */}
                <Route path="/dashboard"          element={<DashboardLayout user={user} logout={logout} token={token}><Dashboard /></DashboardLayout>} />
                <Route path="/live"               element={<DashboardLayout user={user} logout={logout} token={token}><LiveMatches /></DashboardLayout>} />
                <Route path="/live/:id"           element={<DashboardLayout user={user} logout={logout} token={token}><LiveScoreboardPreview /></DashboardLayout>} />
                <Route path="/profile"            element={<DashboardLayout user={user} logout={logout} token={token}><Profile /></DashboardLayout>} />
                <Route path="/tournaments"        element={<DashboardLayout user={user} logout={logout} token={token}><TournamentList /></DashboardLayout>} />
                <Route path="/tournaments/create" element={<DashboardLayout user={user} logout={logout} token={token}><TournamentForm /></DashboardLayout>} />
                <Route path="/tournaments/:id"    element={<DashboardLayout user={user} logout={logout} token={token}><TournamentView /></DashboardLayout>} />
                <Route path="/membership"         element={<DashboardLayout user={user} logout={logout} token={token}><Membership /></DashboardLayout>} />
                <Route path="/leaderboard"        element={<DashboardLayout user={user} logout={logout} token={token}><Leaderboard /></DashboardLayout>} />
                <Route path="/admin"              element={<DashboardLayout user={user} logout={logout} token={token} requireAdmin><AdminPanel /></DashboardLayout>} />

                {/* Live scoring — protected, no sidebar */}
                <Route path="/matches/:id/score" element={
                  <ProtectedRoute token={token}>
                    <LiveScoring />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
              </Routes>
            </Router>
          </AuthContext.Provider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
