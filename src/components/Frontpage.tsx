import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Frontpage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = isLogin ? { email, password } : { username, email, password };
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, data);
      localStorage.setItem('token', response.data.token);
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-gray-800 shadow-lg">
        <h1 className="text-2xl font-bold">ScoreX</h1>
        <nav className="hidden md:flex space-x-6">
          <Link to="/tournaments" className="hover:text-blue-400 transition-colors">Tournaments</Link>
          <Link to="/teams" className="hover:text-blue-400 transition-colors">Teams</Link>
          <Link to="/brackets" className="hover:text-blue-400 transition-colors">Brackets</Link>
          <Link to="/overlay" className="hover:text-blue-400 transition-colors">Overlays</Link>
        </nav>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors shadow-md"
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-purple-900 h-96 flex items-center justify-center px-6">
        <div className="text-center max-w-4xl">
          <h2 className="text-5xl font-bold mb-4 leading-tight">
            Manage Cricket Tournaments Like a Pro
          </h2>
          <p className="text-xl mb-8 leading-relaxed">
            ScoreX is your ultimate platform for creating and managing cricket tournaments.
            Generate live overlays for YouTube and streaming platforms, track real-time scores,
            and organize teams and brackets effortlessly. Whether you're a tournament organizer
            or a streamer, ScoreX makes cricket management simple and professional.
          </p>
          <p className="text-lg mb-8">
            Sign in to start creating tournaments, managing teams, and building custom
            overlays for your live streams.
          </p>
        </div>
      </section>

      {/* Live Scores Section */}
      <section className="py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-8">Live Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg text-center shadow-lg">
            <h4 className="text-xl font-semibold mb-2">Match 1</h4>
            <p className="text-lg">Team A vs Team B: 150/5 (20 overs)</p>
            <p className="text-sm text-gray-400 mt-2">Live</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center shadow-lg">
            <h4 className="text-xl font-semibold mb-2">Match 2</h4>
            <p className="text-lg">Team C vs Team D: 120/3 (18 overs)</p>
            <p className="text-sm text-gray-400 mt-2">Completed</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center shadow-lg">
            <h4 className="text-xl font-semibold mb-2">Match 3</h4>
            <p className="text-lg">Team E vs Team F: 180/7 (20 overs)</p>
            <p className="text-sm text-gray-400 mt-2">Upcoming</p>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section className="py-16 px-6 bg-gray-800">
        <h3 className="text-3xl font-bold text-center mb-8">Featured Tournaments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-semibold mb-2">T20 World Cup</h4>
            <p className="text-gray-300 mb-4">
              Global cricket tournament with live updates and overlays.
            </p>
            <Link to="/tournaments" className="text-blue-400 hover:underline transition-colors">
              View Details
            </Link>
          </div>
          <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-semibold mb-2">Local League</h4>
            <p className="text-gray-300 mb-4">
              Community cricket matches and brackets for local teams.
            </p>
            <Link to="/tournaments" className="text-blue-400 hover:underline transition-colors">
              View Details
            </Link>
          </div>
        </div>
      </section>

      {/* Team Stats Section */}
      <section className="py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-8">Team Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <h4 className="text-4xl font-bold text-blue-400 mb-2">150</h4>
            <p className="text-lg">Total Runs</p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-green-400 mb-2">10</h4>
            <p className="text-lg">Wickets Taken</p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-yellow-400 mb-2">5</h4>
            <p className="text-lg">Matches Won</p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-red-400 mb-2">95%</h4>
            <p className="text-lg">Win Rate</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-800 text-center">
        <p>&copy; 2023 ScoreX. All rights reserved. Built for cricket enthusiasts.</p>
      </footer>

      {/* Login/Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                {isLogin ? 'Login' : 'Register'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg text-lg font-semibold transition-colors mb-4"
              >
                Google
              </button>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-400 hover:underline transition-colors"
              >
                {isLogin ? 'Need to register?' : 'Already have an account?'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Frontpage;