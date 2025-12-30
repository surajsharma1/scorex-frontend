import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TournamentView from './components/TournamentView';
import TeamManagement from './components/TeamManagement';
import BracketView from './components/BracketView';
import OverlayEditor from './components/OverlayEditor';
import Login from './components/Login';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // You could decode token to get user info here
    }
  }, []);

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', userData.token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />
      <main className="flex-1 p-8 ml-64">
        {renderView()}
      </main>
    </div>
  );

  function renderView() {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tournaments':
        return <TournamentView />;
      case 'teams':
        return <TeamManagement />;
      case 'brackets':
        return <BracketView />;
      case 'overlay':
        return <OverlayEditor />;
      default:
        return <Dashboard />;
    }
  }
}


export default App;