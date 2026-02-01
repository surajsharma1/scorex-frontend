import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom'; // Add useLocation
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';
import { useTheme } from './ThemeProvider';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Add this
  const { isDark } = useTheme();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl);
          setIsAuthenticated(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
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

  const isDashboard = location.pathname === '/'; // Check if on root path

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 overflow-auto">
        {isDashboard ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-black">Tournaments</h3>
                <p className="text-black">View and manage tournaments.</p>
                <button onClick={() => navigate('/tournaments')} className="text-blue-400 hover:underline mt-2">Go to Tournaments</button>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-black">Teams</h3>
                <p className="text-black">Manage teams and players.</p>
                <button onClick={() => navigate('/teams')} className="text-blue-400 hover:underline mt-2">Go to Teams</button>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-black">Overlays</h3>
                <p className="text-black">Create live streaming overlays.</p>
                <button onClick={() => navigate('/overlay')} className="text-blue-400 hover:underline mt-2">Go to Overlays</button>
              </div>
            </div>

            {/* Active Tournaments Section */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold mb-6">Active Tournaments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow">
                  <h4 className="text-lg font-semibold mb-2">T20 World Cup</h4>
                  <p className="text-gray-300 mb-4">Ongoing global tournament.</p>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Ongoing</span>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow">
                  <h4 className="text-lg font-semibold mb-2">Local League</h4>
                  <p className="text-gray-300 mb-4">Community matches in progress.</p>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Live</span>
                </div>
              </div>
            </section>

            {/* Live Scores Section */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold mb-6">Live Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700 p-6 rounded-lg text-center shadow">
                  <h4 className="text-xl font-semibold mb-2">Match 1</h4>
                  <p className="text-lg">Team A vs Team B: 150/5 (20 overs)</p>
                  <p className="text-sm text-gray-400 mt-2">Live</p>
                </div>
                <div className="bg-gray-700 p-6 rounded-lg text-center shadow">
                  <h4 className="text-xl font-semibold mb-2">Match 2</h4>
                  <p className="text-lg">Team C vs Team D: 120/3 (18 overs)</p>
                  <p className="text-sm text-gray-400 mt-2">Completed</p>
                </div>
                <div className="bg-gray-700 p-6 rounded-lg text-center shadow">
                  <h4 className="text-xl font-semibold mb-2">Match 3</h4>
                  <p className="text-lg">Team E vs Team F: 180/7 (20 overs)</p>
                  <p className="text-sm text-gray-400 mt-2">Upcoming</p>
                </div>
              </div>
            </section>

            {/* Team Stats Section */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold mb-6">Team Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <h4 className="text-5xl font-bold text-blue-400 mb-2">150</h4>
                  <p className="text-lg">Total Runs</p>
                </div>
                <div>
                  <h4 className="text-5xl font-bold text-green-400 mb-2">10</h4>
                  <p className="text-lg">Wickets Taken</p>
                </div>
                <div>
                  <h4 className="text-5xl font-bold text-yellow-400 mb-2">5</h4>
                  <p className="text-lg">Matches Won</p>
                </div>
                <div>
                  <h4 className="text-5xl font-bold text-red-400 mb-2">95%</h4>
                  <p className="text-lg">Win Rate</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <Outlet /> // Render only the routed component for other paths
        )}
      </main>
    </div>
  );
}

export default App;