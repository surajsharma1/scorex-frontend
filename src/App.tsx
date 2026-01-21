import { Routes, Route } from 'react-router-dom';  // Removed BrowserRouter import since it's in main.tsx
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
    <div className="min-h-screen flex flex-col bg-gray-50">  {/* Replaced inline styles with Tailwind */}
      <header className="p-4 bg-gray-100 border-b border-gray-300">
        <h1 className="m-0 text-2xl text-gray-800">🏏 Cricket Tournament Platform</h1>
      </header>
      
      <main className="flex-1 p-5 bg-gray-50">
        <Routes>
          <Route path="/" element={
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-3xl mb-4">Welcome to Cricket Tournament Platform</h2>
              <p className="text-lg mb-6">Manage your cricket tournaments, teams, and live streaming overlays all in one place.</p>
              <div className="flex gap-4 justify-center mt-6">
                <button 
                  onClick={() => window.location.href = '/login'} 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Login
                </button>
                <button 
                  onClick={() => window.location.href = '/register'} 
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
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

      <footer className="p-4 bg-gray-100 border-t border-gray-300 text-center text-gray-600">
        <p className="m-0">&copy; 2024 Cricket Tournament Platform. All rights reserved.</p>
        <p className="mt-1 text-sm">Built for cricket enthusiasts and tournament organizers.</p>
      </footer>
    </div>
  );
}

export default App;