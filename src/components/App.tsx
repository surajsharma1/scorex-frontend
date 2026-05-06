import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import TournamentList from './TournamentList';
import TournamentForm from './TournamentForm';
import TournamentDetail from './TournamentDetail';
import TournamentView from './TournamentView';
import LiveMatches from './LiveMatches';
import LiveMatchPage from './LiveMatchPage';
import LiveScoring from './LiveScoring';
import Payment from './Payment';
import Leaderboard from './Leaderboard';

import FriendList from './FriendList';
import ClubManagement from './ClubManagement';
import Membership from './Membership';
import Profile from './Profile';
import AdminPanel from './AdminPanel';
import PreviewStudio from './PreviewStudio'; // ADDED
import OverlayManager from './OverlayManager'; // ADDED
import MembershipPreview from './MembershipPreview'; // ADDED
import { Menu } from 'lucide-react';

function App() {
  const token = localStorage.getItem('token');
  
  let user = null;
  let isAdmin = false;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
      isAdmin = user?.role === 'admin';
    }
  } catch (e) {
    console.error("Error parsing user data from localStorage:", e);
    localStorage.removeItem('user');
  }

  const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
      setSidebarOpen(prev => {
        const willBeOpen = !prev;
        if (willBeOpen) document.body.classList.add('sidebar-open');
        else document.body.classList.remove('sidebar-open');
        return willBeOpen;
      });
    };

    const closeSidebar = () => {
      setSidebarOpen(false);
      document.body.classList.remove('sidebar-open');
    };

    const logout = () => { localStorage.clear(); window.location.href = '/login'; };

    return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
        <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar 
            user={user} 
            logout={() => { localStorage.clear(); window.location.href = '/login'; }} 
            isOpen={isSidebarOpen} 
            onClose={() => {
              setSidebarOpen(false);
              document.body.classList.remove('sidebar-open');
            }} 
          />
        </div>
        {/* FIX: Added h-full p-4 md:p-8 pt-20 md:pt-8 z-10 to restore website scrolling */}
        <main className="flex-1 h-full overflow-y-auto relative z-10 p-4 md:p-8 pt-20 md:pt-8 custom-scrollbar">
          <div className="lg:hidden p-4 sticky top-0 z-30 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
            <h1 className="font-orbitron font-black text-xl text-green-500 tracking-wider">SCORE<span className="text-white">X</span></h1>
            <button onClick={toggleSidebar} className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <Outlet />
        </main>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Frontpage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/matches/live" element={<LiveMatches />} />
      <Route path="/live/:id" element={<LiveMatchPage />} />
      <Route path="/live-scoring/:id" element={<LiveScoring />} />
      <Route path="/studio" element={<PreviewStudio />} />

      {/* --- PROTECTED ROUTES --- */}
      <Route element={token ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/tournaments/create" element={<TournamentForm />} />
        
        {/* FIX: ADDED PREVIEW ROUTES HERE SO THEY DON'T REDIRECT TO HOME */}
        <Route path="/preview-studio" element={<PreviewStudio />} />
        <Route path="/overlay-manager/:tournamentId?" element={<OverlayManager />} />
        
        {/* Note: If MembershipPreview requires props natively, you wrap it here, or use URL params */}
        <Route path="/membership-preview" element={<MembershipPreview overlayFile="default" planName="Preview" baseUrl="/" />} />

        <Route path="/tournaments/:id" element={<TournamentView />} />
        <Route path="/friends" element={<FriendList />} />
        <Route path="/clubs" element={<ClubManagement />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/live-matches" element={<LiveMatches />} />
        {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
        <Route path="/upgrade" element={
          <div className="flex items-center justify-center h-full">
            <Payment onClose={() => window.history.back()} onSuccess={() => alert('Upgraded!')} />
          </div>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;