import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import ErrorBoundary from './components/ErrorBoundary';

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

const LiveScoreboardPreview = lazy(() => import('./components/LiveScoreboardPreview'));

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
      
{/* FIXED: Hide this button completely when the sidebar is open */}
      {!isSidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-xl md:hidden transition-transform hover:scale-105 active:scale-95 bg-transparent"
          onClick={toggleSidebar}
        >
          <svg className="w-7 h-7 text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Clean Dark Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 md:hidden transition-opacity" 
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={closeSidebar} 
        />
      )}

      <Sidebar user={user} logout={logout} isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <main className="flex-1 w-full h-full overflow-y-auto relative z-10 p-4 md:p-8 pt-20 md:pt-8">
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
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
          const userData = typeof u === 'string' ? JSON.parse(u) : u;
          if (userData && (userData.username || userData.email)) {
            setUser({
              _id: userData._id || userData.id || '',
              id: userData._id || userData.id || '',
              username: userData.username || '',
              email: userData.email || '',
              role: userData.role || 'user',
              membershipLevel: userData.membership?.level || userData.membershipLevel || 0,
              membershipExpiry: userData.membership?.expires || userData.membershipExpiresAt || null,
              membershipPurchasedAt: userData.membershipStartedAt || null,
              membershipDuration: null,
              fullName: userData.fullName
            });
          } else {
            localStorage.removeItem('user');
          }
        } catch(e) {
          localStorage.removeItem('user');
        }
      }
      
      api.get('/auth/me').then(res => {
        const userData = res.data?.data;
        if (userData && (userData.username || userData.email)) {
          setUser({
            _id: userData._id || userData.id || '',
            id: userData._id || userData.id || '',
            username: userData.username || '',
            email: userData.email || '',
            role: userData.role || 'user',
            membershipLevel: userData.membership?.level || userData.membershipLevel || 0,
            membershipExpiry: userData.membership?.expires || userData.membershipExpiresAt || null,
            membershipPurchasedAt: userData.membershipStartedAt || null,
            membershipDuration: null,
            fullName: userData.fullName
          });
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }).catch(err => {
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
    window.location.href = '/';
  };

  if (loading) return <LoadingSpinner />;

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastWrapper>
          <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            <Router>
              <Routes>
                <Route path="/" element={<Frontpage />} />
                <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />

                <Route path="/dashboard" element={<DashboardLayout user={user} logout={logout} token={token}><Dashboard /></DashboardLayout>} />
                <Route path="/live" element={<DashboardLayout user={user} logout={logout} token={token}><LiveMatches /></DashboardLayout>} />
                <Route path="/live/:id" element={
                  <DashboardLayout user={user} logout={logout} token={token}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <LiveScoreboardPreview />
                    </Suspense>
                  </DashboardLayout>
                } />
                <Route path="/profile" element={<DashboardLayout user={user} logout={logout} token={token}><Profile /></DashboardLayout>} />
                <Route path="/tournaments" element={<DashboardLayout user={user} logout={logout} token={token}><TournamentList /></DashboardLayout>} />
                <Route path="/tournaments/create" element={<DashboardLayout user={user} logout={logout} token={token}><TournamentForm /></DashboardLayout>} />
                <Route path="/tournaments/:id" element={<DashboardLayout user={user} logout={logout} token={token}><TournamentView /></DashboardLayout>} />
                <Route path="/membership" element={<DashboardLayout user={user} logout={logout} token={token}><Membership /></DashboardLayout>} />
                <Route path="/clubs" element={<DashboardLayout user={user} logout={logout} token={token}><ClubList /></DashboardLayout>} />
                <Route path="/clubs/create" element={<DashboardLayout user={user} logout={logout} token={token}><CreateClubForm /></DashboardLayout>} />
                <Route path="/clubs/:id/manage" element={<DashboardLayout user={user} logout={logout} token={token}><ClubManagement /></DashboardLayout>} />
                <Route path="/clubs/:id" element={<DashboardLayout user={user} logout={logout} token={token}><ClubDetail /></DashboardLayout>} />
                <Route path="/friends" element={<DashboardLayout user={user} logout={logout} token={token}><FriendList /></DashboardLayout>} />
                <Route path="/leaderboard" element={<DashboardLayout user={user} logout={logout} token={token}><Leaderboard /></DashboardLayout>} />
                
                <Route path="/admin" element={<DashboardLayout user={user} logout={logout} token={token} requireAdmin><AdminPanel /></DashboardLayout>} />

                <Route path="/matches/:id/score" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><LiveScoring /></Suspense></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </AuthContext.Provider>
        </ToastWrapper>
      </ThemeProvider>
    </ErrorBoundary>
  );
}