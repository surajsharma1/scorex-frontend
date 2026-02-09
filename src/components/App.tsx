import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';
import { useTheme } from './ThemeProvider';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { Tournament, Match, Team } from './types';
import Profile from './Profile';
import Payment from './Payment';
import { User, Search, Bell, BarChart3, Crown, Menu } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [error, setError] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

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
      const tournamentsData = tournamentsRes.data?.tournaments || tournamentsRes.data || [];
      const matchesData = matchesRes.data || [];
      const teamsData = teamsRes.data?.teams || teamsRes.data || [];
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
      setMatches((Array.isArray(matchesData) ? matchesData : []).filter((match: Match) => match.status === 'scheduled' || match.status === 'active'));
      setTeams(Array.isArray(teamsData) ? teamsData : []);
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
  const activeTournaments = tournaments.filter((t) => t.status === 'active');

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="main-content">
        {isDashboard ? (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden btn-secondary p-3"
                  title="Open sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
                  <p className="text-gray-600 dark:text-neutral-400">Welcome back! Here's your tournament overview.</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleTheme}
                  className="btn-secondary text-sm px-4 py-2"
                  title="Toggle theme"
                >
                  {isDark ? '☀️ Light' : '🌙 Dark'}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="btn-secondary p-3"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 card z-50 animate-slide-in">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowProfileDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-900 dark:text-neutral-200 hover:bg-primary-500/20 rounded-t-xl transition-colors"
                      >
                        <User className="w-4 h-4 inline mr-3" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-900 dark:text-neutral-200 hover:bg-red-500/20 rounded-b-xl transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-error mb-8">
                {error}
              </div>
            )}

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="card card-hover p-8 cursor-pointer group" onClick={() => navigate('/tournaments')}>
                <Crown className="w-12 h-12 text-primary-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-primary-300 mb-3">Tournaments</h3>
                <p className="text-neutral-300 mb-4">View and manage your tournaments with advanced bracket systems.</p>
                <div className="text-primary-400 font-medium group-hover:text-primary-300 transition-colors">
                  Go to Tournaments →
                </div>
              </div>
              <div className="card card-hover p-8 cursor-pointer group" onClick={() => navigate('/teams')}>
                <BarChart3 className="w-12 h-12 text-accent-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-accent-300 mb-3">Teams</h3>
                <p className="text-neutral-300 mb-4">Manage teams, players, and track performance statistics.</p>
                <div className="text-accent-400 font-medium group-hover:text-accent-300 transition-colors">
                  Go to Teams →
                </div>
              </div>
              <div className="card card-hover p-8 cursor-pointer group" onClick={() => navigate('/overlays')}>
                <Search className="w-12 h-12 text-primary-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-primary-300 mb-3">Overlays</h3>
                <p className="text-neutral-300 mb-4">Create stunning live streaming overlays for your tournaments.</p>
                <div className="text-primary-400 font-medium group-hover:text-primary-300 transition-colors">
                  Go to Overlays →
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 mb-12">
              <button onClick={() => navigate('/profile')} className="btn-primary">
                <User className="w-5 h-5 mr-2" />
                Profile
              </button>
              <button onClick={() => navigate('/payment')} className="btn-accent">
                <Bell className="w-5 h-5 mr-2" />
                Payment
              </button>
            </div>

            {/* Active Tournaments Section */}
            <section className="mb-12">
              <h3 className="text-3xl font-bold text-gradient mb-8">Active Tournaments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeTournaments.length === 0 ? (
                  <div className="card p-8 text-center">
                    <p className="text-neutral-400 text-lg">No active tournaments at the moment.</p>
                    <p className="text-neutral-500 mt-2">Create your first tournament to get started!</p>
                  </div>
                ) : (
                  activeTournaments.map((tournament) => (
                    <div key={tournament._id} className="card card-hover p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-2xl font-semibold text-white mb-2">{tournament.name}</h4>
                          <p className="text-neutral-300">{tournament.description}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteTournament(tournament._id)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <button
                        onClick={() => setSelectedTournament(tournament)}
                        className="btn-primary w-full"
                      >
                        View Details
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Upcoming Matches Section */}
            <section className="mb-12">
              <h3 className="text-3xl font-bold text-gradient mb-8">Upcoming Matches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {matches.length === 0 ? (
                  <div className="card p-8 text-center col-span-full">
                    <p className="text-neutral-400 text-lg">No upcoming matches scheduled.</p>
                    <p className="text-neutral-500 mt-2">Matches will appear here once tournaments are active.</p>
                  </div>
                ) : (
                  matches.map((match) => (
                    <div key={match._id} className="card card-hover p-8 text-center">
                      <h4 className="text-xl font-semibold mb-4 text-white">
                        {match.team1?.name} <span className="text-primary-400">vs</span> {match.team2?.name}
                      </h4>
                      <div className="text-2xl font-bold text-gradient mb-4">
                        {match.score1 || 0}/{match.wickets1 || 0} - {match.score2 || 0}/{match.wickets2 || 0}
                      </div>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                        match.status === 'active'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {match.status === 'active' ? '🔴 Live' : '⏰ Scheduled'}
                      </div>
                      {match.status !== 'ongoing' && (
                        <button
                          onClick={() => handleGoLive(match._id)}
                          className="btn-accent w-full"
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
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
                <div className="card w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
                  <div className="flex justify-between items-center p-8 border-b border-neutral-700/50">
                    <h2 className="text-3xl font-bold text-gradient">{selectedTournament.name}</h2>
                    <button
                      onClick={() => setSelectedTournament(null)}
                      className="text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-700/50 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-2xl font-semibold text-primary-300 mb-6">Live Scores</h3>
                        {matches.filter((m) => m.tournament === selectedTournament._id).map((match) => (
                          <div key={match._id} className="card p-6 mb-4">
                            <p className="text-lg font-medium text-white mb-2">
                              {match.team1?.name} vs {match.team2?.name}
                            </p>
                            <p className="text-xl font-bold text-gradient">
                              {match.score1 || 0}/{match.wickets1 || 0} - {match.score2 || 0}/{match.wickets2 || 0}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-accent-300 mb-6">Team Stats</h3>
                        {teams.filter((t) => t.tournament === selectedTournament._id).map((team) => (
                          <div key={team._id} className="card p-6 mb-4">
                            <h4 className="text-xl font-bold text-white mb-4">{team.name}</h4>
                            <div className="space-y-2">
                              <p className="text-neutral-300">
                                <span className="text-primary-400 font-medium">Runs:</span> {team.players?.reduce((sum, p) => sum + (p.stats?.runs || 0), 0) || 0}
                              </p>
                              <p className="text-neutral-300">
                                <span className="text-accent-400 font-medium">Wickets:</span> {team.players?.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0) || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}

export default App;