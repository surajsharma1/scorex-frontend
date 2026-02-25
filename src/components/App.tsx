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
import LiveMatches from './LiveMatches';
import OverlayEditor from './OverlayEditor';
import Payment from './Payment';
import Leaderboard from './Leaderboard';
import TeamManagement from './TeamManagement';
import FriendList from './FriendList';
import ClubManagement from './ClubManagement';
import Membership from './Membership';
import Profile from './Profile';
import { Menu } from 'lucide-react';

// --- Dashboard Layout Wrapper ---
// This component handles the Sidebar and Mobile Menu for all protected pages
const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      {/* Mobile Menu Button */}
      <button 
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md md:hidden"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 h-full overflow-y-auto transition-all duration-300 p-4 md:p-8 pt-16 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
};

// --- Main App Component ---
// Router is already in main.tsx, this just defines routes
function App() {
  const token = localStorage.getItem('token');

  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<Frontpage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/matches/live" element={<LiveMatches />} />
      <Route path="/tournaments" element={<TournamentList />} />
      <Route path="/leaderboard" element={<Leaderboard />} />

      {/* --- PROTECTED ROUTES (Require Login) --- */}
      <Route element={token ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tournaments/create" element={<TournamentForm />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/overlays" element={<OverlayEditor />} />
        <Route path="/teams" element={<TeamManagement />} />
        <Route path="/friends" element={<FriendList />} />
        <Route path="/clubs" element={<ClubManagement />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/live-matches" element={<LiveMatches />} />
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
