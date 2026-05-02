import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './components/ThemeProvider';
import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { ToastProvider } from './hooks/useToast';
import api from './services/api';

// ── JWT client-side expiry check ─────────────────────────────────────────────
// Decodes token locally (no network). Returns true if expired or malformed.
// Stops the app from using a dead token before even hitting the server.
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now() - 10_000; // 10s clock-skew buffer
  } catch {
    return true;
  }
}
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
  refreshUser: () => void;
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
  refreshUser: () => {},
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

  // ── PWA install prompt ───────────────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  // ── User parser — always normalise to the same shape ────────────────────
  const parseUser = useCallback((userData: any): AuthUser => ({
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
  }), []);

  // ── Clear all auth state + storage ──────────────────────────────────────
  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // ── On app load: check token validity FIRST, then fetch fresh user ───────
  // We do NOT pre-render with localStorage('user') as source of truth.
  // localStorage token is only used to decide whether to call /auth/me.
  // The actual user state always comes from the server response.
  useEffect(() => {
    const t = localStorage.getItem('token');

    if (!t) {
      setLoading(false);
      return;
    }

    // Step 1 — client-side expiry check (no network needed)
    if (isTokenExpired(t)) {
      console.log('[Auth] Token expired client-side — clearing session');
      clearAuth();
      setLoading(false);
      return;
    }

    // Step 2 — token looks valid, set it so API calls work
    setToken(t);

    // Step 3 — fetch fresh user from server (this is the ONLY source of truth)
    // We deliberately do NOT read localStorage('user') here to avoid stale data
    api.get('/auth/me')
      .then(res => {
        const userData = res.data?.data;
        if (userData?.username || userData?.email) {
          const parsed = parseUser(userData);
          setUser(parsed);
          // Keep localStorage('user') in sync for logout/reload hints only
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          clearAuth();
        }
      })
      .catch(() => {
        // Server rejected the token (expired server-side, banned, deleted user)
        console.log('[Auth] /auth/me failed — clearing session');
        clearAuth();
      })
      .finally(() => setLoading(false));
  }, [clearAuth, parseUser]);

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

  // refreshUser — call this after any action that changes user data on server
  // (membership upgrade, profile edit, role change etc.)
  const refreshUser = useCallback(() => {
    api.get('/auth/me').then(res => {
      const userData = res.data?.data;
      if (userData) {
        setUser(parseUser(userData));
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }).catch(() => {});
  }, [parseUser]);

  const logout = () => {
    clearAuth();
    window.location.href = '/';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthContext.Provider value={{ user, token, login, logout, refreshUser, loading }}>
            {/* ── PWA Install Banner ─────────────────────────────────────── */}
            {showInstallBanner && (
              <div style={{
                position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                zIndex: 9999, background: '#111', border: '1px solid #39ff14',
                borderRadius: 12, padding: '12px 20px', display: 'flex',
                alignItems: 'center', gap: 12, boxShadow: '0 0 20px rgba(57,255,20,0.2)',
                maxWidth: '90vw', fontFamily: 'sans-serif'
              }}>
                <span style={{ color: '#39ff14', fontSize: 20 }}>🏏</span>
                <span style={{ color: '#fff', fontSize: 14 }}>Install ScoreX for quick access</span>
                <button onClick={handleInstallClick} style={{
                  background: '#39ff14', color: '#000', border: 'none',
                  borderRadius: 6, padding: '6px 14px', fontWeight: 700,
                  cursor: 'pointer', fontSize: 13
                }}>Install</button>
                <button onClick={() => setShowInstallBanner(false)} style={{
                  background: 'transparent', color: '#888', border: 'none',
                  cursor: 'pointer', fontSize: 18, lineHeight: 1
                }}>×</button>
              </div>
            )}
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
