import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeProvider from './ThemeProvider';
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
import { Menu, Loader2 } from 'lucide-react';

// --- 1. Dashboard Layout Wrapper ---
// This component handles the Sidebar and Mobile Menu for all protected pages
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
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
        {children}
      </main>
    </div>
  );
};

// --- 2. Private Route Protection ---
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

// --- 3. Main App Component ---
function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          {/* New Landing Page at Root */}
          <Route path="/" element={<Frontpage />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Public Live View (No Auth Needed) */}
          <Route path="/matches/live" element={<LiveMatches />} />
          
          {/* Public Tournament List */}
          <Route path="/tournaments" element={<TournamentList />} />

          {/* --- PROTECTED ROUTES (Require Login) --- */}
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />

          <Route path="/tournaments/create" element={
            <PrivateRoute><TournamentForm /></PrivateRoute>
          } />

          <Route path="/tournaments/:id" element={
            <PrivateRoute><TournamentDetail /></PrivateRoute>
          } />

          <Route path="/overlays" element={
            <PrivateRoute><OverlayEditor /></PrivateRoute>
          } />

          {/* Fallback to Payment Test if needed */}
          <Route path="/upgrade" element={
             <PrivateRoute>
               <div className="flex items-center justify-center h-full">
                 <Payment onClose={() => window.history.back()} onSuccess={() => alert('Upgraded!')} />
               </div>
             </PrivateRoute>
          } />
          
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;