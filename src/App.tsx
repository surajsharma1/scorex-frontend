import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import api from './services/api';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import OAuthCallback from './components/OAuthCallback';
import ForgotPassword from './components/ForgotPassword';
import Frontpage from './components/Frontpage';

const Dashboard = lazy(() => import('./components/Dashboard'));
const TournamentView = lazy(() => import('./components/TournamentView'));
const LiveScoring = lazy(() => import('./components/LiveScoring'));
const LiveMatches = lazy(() => import('./components/LiveMatches'));
const Profile = lazy(() => import('./components/Profile'));
const Membership = lazy(() => import('./components/Membership'));
const ClubManagement = lazy(() => import('./components/ClubManagement'));
const FriendList = lazy(() => import('./components/FriendList'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

// Loading fallback matching app style
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-green-500/20" />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading ScoreX...</p>
    </div>
  </div>
);

// ─── Auth Context ─────────────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  membershipLevel?: number;
  membershipExpiry?: string;
  membershipPurchasedAt?: string;
  membershipDuration?: string;
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-green-500/20" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading ScoreX...</p>
      </div>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// ─── Admin Route ──────────────────────────────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  useEffect(() => {
    // Force light theme for admin panel to fix black screen issue
    document.documentElement.classList.add('light');
    return () => {
      // Restore previous theme state on unmount
      const saved = localStorage.getItem('theme');
      if (saved !== 'light') {
        document.documentElement.classList.remove('light');
      }
    };
  }, []);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
function DashboardLayout({ 
  children, 
  isMobileMenuOpen, 
  toggleMobileMenu 
}: { 
  children: React.ReactNode; 
  isMobileMenuOpen?: boolean; 
  toggleMobileMenu?: () => void; 
}) {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex md:flex" style={{ background: 'var(--bg-primary)' }}>
      
      {/* Mobile overlay backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={toggleMobileMenu}
        />
      )}
      
      {/* Sidebar - Full screen overlay on mobile, fixed on desktop */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        w-full h-full md:w-64 md:h-auto md:flex-shrink-0 bg-slate-900 md:bg-[var(--bg-secondary)]
        border-r border-slate-800 md:border-r-[var(--border)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ background: 'var(--bg-secondary)' }}>
        <Sidebar 
          user={user} 
          logout={logout} 
          isMobileMenuOpen={isMobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:ml-0">
        {/* Mobile header with hamburger */}
        <div className="md:hidden bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors md:hidden"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>ScoreX</h1>
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [window.location.pathname]);

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
    }
  }, []);

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
            membershipExpiry: userData.membershipExpiry,
            membershipPurchasedAt: userData.membershipPurchasedAt,
            membershipDuration: userData.membershipDuration,
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
      membershipExpiry: u.membershipExpiry,
      membershipPurchasedAt: u.membershipPurchasedAt,
      membershipDuration: u.membershipDuration,
      fullName: u.fullName
    });
    setIsMobileMenuOpen(false); // Close menu after login
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsMobileMenuOpen(false);
  };

  // Pass mobile menu props to protected routes with DashboardLayout
  const ProtectedDashboardRoute = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
      <DashboardLayout 
        isMobileMenuOpen={isMobileMenuOpen} 
        toggleMobileMenu={toggleMobileMenu}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );

  const AdminDashboardRoute = ({ children }: { children: React.ReactNode }) => (
    <AdminRoute>
      <DashboardLayout 
        isMobileMenuOpen={isMobileMenuOpen} 
        toggleMobileMenu={toggleMobileMenu}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </DashboardLayout>
    </AdminRoute>
  );

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

          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={<ProtectedDashboardRoute><Dashboard /></ProtectedDashboardRoute>} />
          <Route path="/tournaments" element={<ProtectedDashboardRoute><TournamentView /></ProtectedDashboardRoute>} />
          <Route path="/tournaments/:id" element={<ProtectedDashboardRoute><TournamentView /></ProtectedDashboardRoute>} />
          <Route path="/live" element={<ProtectedDashboardRoute><LiveMatches /></ProtectedDashboardRoute>} />
          <Route path="/profile" element={<ProtectedDashboardRoute><Profile /></ProtectedDashboardRoute>} />
          <Route path="/membership" element={<ProtectedDashboardRoute><Membership /></ProtectedDashboardRoute>} />
          <Route path="/clubs" element={<ProtectedDashboardRoute><ClubManagement /></ProtectedDashboardRoute>} />
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
  );
}



