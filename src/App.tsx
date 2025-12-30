// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TournamentList from './components/TournamentList';
import TournamentForm from './components/TournamentForm';
import TeamList from './components/TeamList';
import TeamForm from './components/TeamForm';
import BracketView from './components/BracketView';
import OverlayList from './components/OverlayList';
import OverlayForm from './components/OverlayForm';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
          <h1 style={{ margin: 0, color: '#333' }}>🏏 Cricket Tournament Platform</h1>
        </header>
        
        <main style={{ flex: 1, padding: '20px', backgroundColor: '#f9f9f9' }}>
          <Routes>
            <Route path="/" element={
              <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                <h2>Welcome to Cricket Tournament Platform</h2>
                <p>Manage your cricket tournaments, teams, and live streaming overlays all in one place.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                  <button onClick={() => window.location.href = '/login'} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Login
                  </button>
                  <button onClick={() => window.location.href = '/register'} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Register
                  </button>
                </div>
              </div>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tournaments" element={<TournamentList />} />
            <Route path="/tournaments/new" element={<TournamentForm />} />
            <Route path="/tournaments/:id/edit" element={<TournamentForm />} />
            <Route path="/teams" element={<TeamList />} />
            <Route path="/teams/new" element={<TeamForm />} />
            <Route path="/teams/:id/edit" element={<TeamForm />} />
            <Route path="/brackets" element={<BracketView />} />
            <Route path="/overlays" element={<OverlayList />} />
            <Route path="/overlays/new" element={<OverlayForm />} />
            <Route path="/overlays/:id/edit" element={<OverlayForm />} />
          </Routes>
        </main>

        <footer style={{ padding: '15px', background: '#f0f0f0', borderTop: '1px solid #ddd', textAlign: 'center', color: '#666' }}>
          <p style={{ margin: 0 }}>&copy; 2024 Cricket Tournament Platform. All rights reserved.</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
            Built for cricket enthusiasts and tournament organizers.
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;