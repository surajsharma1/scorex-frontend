import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Frontpage />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
        
        {/* Frontpage-like Content for Dashboard */}
        <section className="relative bg-gradient-to-r from-blue-900 to-purple-900 py-20 px-6 flex items-center justify-center">
          <div className="text-center max-w-4xl">
            <h2 className="text-6xl font-bold mb-6 leading-tight text-white">ScoreX</h2>
            <p className="text-xl mb-8 leading-relaxed text-white">
              The ultimate platform for cricket tournament management and live streaming.
              Create tournaments, manage teams, generate brackets, and produce professional
              overlays for YouTube and streaming platforms. Perfect for organizers, streamers,
              and cricket enthusiasts worldwide.
            </p>
            <p className="text-lg mb-8 text-white">
              Join thousands of users who trust ScoreX for seamless cricket management and
              stunning live overlays.
            </p>
          </div>
        </section>

        <section className="py-20 px-6">
          <h3 className="text-4xl font-bold text-center mb-12">Our Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h4 className="text-2xl font-semibold mb-4">Tournament Management</h4>
              <p className="text-gray-600 leading-relaxed">
                Easily create and manage cricket tournaments. Schedule matches, track scores,
                and organize brackets for leagues, cups, and local events.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h4 className="text-2xl font-semibold mb-4">Team & Player Organization</h4>
              <p className="text-gray-600 leading-relaxed">
                Build teams, add players, and manage rosters. Keep track of player stats,
                performance, and team standings with our intuitive tools.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h4 className="text-2xl font-semibold mb-4">Live Streaming Overlays</h4>
              <p className="text-gray-600 leading-relaxed">
                Generate professional overlays for your live streams. Customize designs,
                display scores, brackets, and team info in real-time.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h4 className="text-2xl font-semibold mb-4">Real-Time Score Updates</h4>
              <p className="text-gray-600 leading-relaxed">
                Update match scores live during games. View real-time statistics,
                wickets, overs, and more for an immersive experience.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h4 className="text-2xl font-semibold mb-4">Bracket Generation</h4>
              <p className="text-gray-600 leading-relaxed">
                Automatically generate tournament brackets for single-elimination,
                round-robin, and custom formats. Visualize progress and winners.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h4 className="text-2xl font-semibold mb-4">Community Features</h4>
              <p className="text-gray-600 leading-relaxed">
                Connect with other organizers and streamers. Share tournaments,
                view public events, and collaborate on cricket projects.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gray-800 text-white">
          <h3 className="text-4xl font-bold text-center mb-12">Overlay Previews</h3>
          <p className="text-center text-lg mb-12 text-gray-300">
            See examples of our professional overlay designs. Unlock premium templates
            and customizations with our membership plans.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg text-center">
              <div className="bg-gray-600 h-48 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-400">Overlay Preview 1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Score Overlay</h4>
              <p className="text-gray-300">Display live scores, wickets, and overs.</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg text-center">
              <div className="bg-gray-600 h-48 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-400">Overlay Preview 2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Bracket Overlay</h4>
              <p className="text-gray-300">Show tournament brackets and matchups.</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg text-center">
              <div className="bg-gray-600 h-48 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-400">Overlay Preview 3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Team Stats Overlay</h4>
              <p className="text-gray-300">Highlight player and team statistics.</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-lg text-gray-300 mb-4">
              These premium overlays are available with our membership subscription.
            </p>
            <button className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-semibold transition-colors">
              Join Now
            </button>
          </div>
        </section>

        <section className="py-20 px-6">
          <h3 className="text-4xl font-bold text-center mb-12">Membership & Subscription</h3>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl mb-8 text-gray-600 leading-relaxed">
              Unlock the full potential of ScoreX with our premium membership. Access
              exclusive overlay designs, advanced customization tools, and priority
              support. Our subscription plans are designed for organizers and streamers
              who want professional-grade cricket management and streaming tools.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h4 className="text-2xl font-semibold mb-4">Basic Plan</h4>
                <p className="text-gray-600 mb-4">Free - Core tournament management features.</p>
                <ul className="text-left text-gray-600 space-y-2">
                  <li>✓ Create tournaments</li>
                  <li>✓ Manage teams</li>
                  <li>✓ Basic brackets</li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-blue-500">
                <h4 className="text-2xl font-semibold mb-4">Pro Plan</h4>
                <p className="text-gray-600 mb-4">$9.99/month - Advanced features.</p>
                <ul className="text-left text-gray-600 space-y-2">
                  <li>✓ All Basic features</li>
                  <li>✓ Premium overlays</li>
                  <li>✓ Real-time updates</li>
                  <li>✓ Custom designs</li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h4 className="text-2xl font-semibold mb-4">Enterprise Plan</h4>
                <p className="text-gray-600 mb-4">$29.99/month - For large events.</p>
                <ul className="text-left text-gray-600 space-y-2">
                  <li>✓ All Pro features</li>
                  <li>✓ Multi-tournament support</li>
                  <li>✓ API access</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
            </div>
            <div className="mt-12">
              <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors">
                Start Free Trial
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gray-800 text-white">
          <h3 className="text-4xl font-bold text-center mb-12">Live Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-700 p-6 rounded-lg text-center shadow-lg">
              <h4 className="text-xl font-semibold mb-2">Match 1</h4>
              <p className="text-lg">Team A vs Team B: 150/5 (20 overs)</p>
              <p className="text-sm text-gray-400 mt-2">Live</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg text-center shadow-lg">
              <h4 className="text-xl font-semibold mb-2">Match 2</h4>
              <p className="text-lg">Team C vs Team D: 120/3 (18 overs)</p>
              <p className="text-sm text-gray-400 mt-2">Completed</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg text-center shadow-lg">
              <h4 className="text-xl font-semibold mb-2">Match 3</h4>
              <p className="text-lg">Team E vs Team F: 180/7 (20 overs)</p>
              <p className="text-sm text-gray-400 mt-2">Upcoming</p>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <h3 className="text-4xl font-bold text-center mb-12">Featured Tournaments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h4 className="text-2xl font-semibold mb-4">T20 World Cup</h4>
              <p className="text-gray-600 mb-6">
                Global cricket tournament with live updates and overlays.
              </p>
              <button onClick={() => navigate('/tournaments')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors inline-block">
                View All Tournaments
              </button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h4 className="text-2xl font-semibold mb-4">Local League</h4>
              <p className="text-gray-600 mb-6">
                Community cricket matches and brackets for local teams.
              </p>
              <button onClick={() => navigate('/tournaments')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors inline-block">
                View All Tournaments
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gray-800 text-white">
          <h3 className="text-4xl font-bold text-center mb-12">Team Stats</h3>
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

        <footer className="py-12 px-6 bg-gray-900 text-center text-white">
          <p>&copy; 2023 ScoreX. All rights reserved. Built for cricket enthusiasts.</p>
        </footer>

        <Outlet />
      </main>
    </div>
  );
}

export default App;