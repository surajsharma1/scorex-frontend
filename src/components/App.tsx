import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';
import { useTheme } from './ThemeProvider';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { Tournament, Match, Team } from './types';
import Profile from './Profile';
import Payment from './Payment';
import { User, Search, Bell, BarChart3, Crown } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [error, setError] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        fetchDashboardData();
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl);
          setIsAuthenticated(true);
          fetchDashboardData();
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tournamentsRes, matchesRes, teamsRes] = await Promise.all([
        tournamentAPI.getTournaments(),
        matchAPI.getMatches(),
        teamAPI.getTeams(),
      ]);
      setTournaments(tournamentsRes.data);
      setMatches(matchesRes.data.filter((match: Match) => match.status === 'ongoing'));
      setTeams(teamsRes.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      try {
        await tournamentAPI.deleteTournament(id);
        fetchDashboardData();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete tournament');
      }
    }
  };

  const handleGoLive = async (matchId: string) => {
    try {
      await matchAPI.updateMatchScore(matchId, { status: 'ongoing' });
      fetchDashboardData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to start match');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Frontpage />;
  }

  const isDashboard = location.pathname === '/';
  const activeTournaments = tournaments.filter((t) => t.status === 'ongoing');

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 overflow-auto">
        {isDashboard ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-t-lg"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700 rounded-b-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-blue-400">Tournaments</h3>
                <p className="text-white">View and manage tournaments.</p>
                <button onClick={() => navigate('/tournaments')} className="text-white hover:underline mt-2">Go to Tournaments</button>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-blue-400">Teams</h3>
                <p className="text-white">Manage teams and players.</p>
                <button onClick={() => navigate('/teams')} className="text-white hover:underline mt-2">Go to Teams</button>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-blue-400">Overlays</h3>
                <p className="text-white">Create live streaming overlays.</p>
                <button onClick={() => navigate('/overlays')} className="text-white hover:underline mt-2">Go to Overlays</button>
              </div>
            </div>

            {/* Active Tournaments Section */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold mb-6">Active Tournaments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTournaments.length === 0 ? (
                  <p className="text-gray-400">No active tournaments.</p>
                ) : (
                  activeTournaments.map((tournament) => (
                    <div key={tournament._id} className="bg-gray-800 p-6 rounded-lg shadow">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold">{tournament.name}</h4>
                        <button
                          onClick={() => handleDeleteTournament(tournament._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-gray-300 mb-4">{tournament.description}</p>
                      <button
                        onClick={() => setSelectedTournament(tournament)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Live Scores Section */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold mb-6">Live Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matches.length === 0 ? (
                  <p className="text-gray-400">No live matches.</p>
                ) : (
                  matches.map((match) => (
                    <div key={match._id} className="bg-gray-700 p-6 rounded-lg text-center shadow">
                      <h4 className="text-xl font-semibold mb-2">{match.team1?.name} vs {match.team2?.name}</h4>
                      <p className="text-lg">
                        {match.score1 || 0}/{match.wickets1 || 0} - {match.score2 || 0}/{match.wickets2 || 0}
                      </p>
                      <p className="text-sm text-green-400 mt-2">Live</p>
                      {match.status !== 'ongoing' && (
                        <button
                          onClick={() => handleGoLive(match._id)}
                          className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Go Live
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Tournament Details Modal */}
            {selectedTournament && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{selectedTournament.name}</h2>
                    <button
                      onClick={() => setSelectedTournament(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Live Scores</h3>
                      {matches.filter((m) => m.tournament === selectedTournament._id).map((match) => (
                        <div key={match._id} className="bg-gray-700 p-4 rounded-lg mb-4">
                          <p>{match.team1?.name} vs {match.team2?.name}</p>
                          <p>{match.score1 || 0}/{match.wickets1 || 0} - {match.score2 || 0}/{match.wickets2 || 0}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Team Stats</h3>
                      {teams.filter((t) => t.tournament === selectedTournament._id).map((team) => (
                        <div key={team._id} className="bg-gray-700 p-4 rounded-lg mb-4">
                          <h4 className="font-bold">{team.name}</h4>
                          <p>Runs: {team.players?.reduce((sum, p) => sum + (p.stats?.runs || 0), 0) || 0}</p>
                          <p>Wickets: {team.players?.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0) || 0}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

export default App;