import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TournamentView from './components/TournamentView';
import TeamManagement from './components/TeamManagement';
import BracketView from './components/BracketView';
import OverlayEditor from './components/OverlayEditor';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tournaments':
        return <TournamentView onNavigate={setActiveView} />;
      case 'teams':
        return <TeamManagement onNavigate={setActiveView} />;
      case 'brackets':
        return <BracketView onNavigate={setActiveView} />;
      case 'overlay':
        return <OverlayEditor onNavigate={setActiveView} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
