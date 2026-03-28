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

    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    };

    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
        <button 
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md md:hidden"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <Sidebar user={user} logout={logout} isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(false)} />
        <main className="flex-1 md:ml-64 h-full overflow-y-auto transition-all duration-300 p-4 md:p-8 pt-16 md:pt-8">
          <Outlet />
        </main>
      </div>
    );
  };

  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<Frontpage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/matches/live" element={<LiveMatches />} />
      <Route path="/live/:id" element={<LiveMatchPage />} />
      <Route path="/live-scoring/:id" element={<LiveScoring />} />

      {/* --- PROTECTED ROUTES --- */}
      <Route element={token ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/tournaments/create" element={<TournamentForm />} />
        
        {/* Routed to TournamentView for the fully-featured match center */}
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
    </Routes>
  );
}

export default App;