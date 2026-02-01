import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Frontpage = () => {
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
      <header className="flex justify-between items-center p-6 bg-gray-800">
        <h1 className="text-2xl font-bold">ScoreX</h1>
        <nav className="space-x-6">
          <Link to="/tournaments" className="hover:text-blue-400">Tournaments</Link>
          <Link to="/teams" className="hover:text-blue-400">Teams</Link>
          <Link to="/brackets" className="hover:text-blue-400">Brackets</Link>
          <Link to="/overlay" className="hover:text-blue-400">Overlays</Link>
        </nav>
      </header>

      <section className="relative bg-gradient-to-r from-blue-900 to-purple-900 h-96 flex items-center justify-center">
        <div className="text-center px-6 max-w-4xl">
          <h2 className="text-5xl font-bold mb-4">Manage Cricket Tournaments Like a Pro</h2>
          <p className="text-xl mb-4">
            ScoreX is your ultimate platform for creating and managing cricket tournaments. 
            Generate live overlays for YouTube and streaming platforms, track real-time scores, 
            and organize teams and brackets effortlessly. Whether you're a tournament organizer 
            or a streamer, ScoreX makes cricket management simple and professional.
          </p>
          <p className="text-lg mb-8">
            Sign in to start creating tournaments, managing teams, and building custom 
            overlays for your live streams.
          </p>
          <div className="mb-6">
            <button 
              onClick={handleGoogleLogin} 
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors mr-4"
            >
              Login with Google
            </button>
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              {isLogin ? 'Switch to Register' : 'Switch to Login'}
            </button>
          </div>
          <form onSubmit={handleEmailSubmit} className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
            <h3 className="text-2xl font-bold mb-4">{isLogin ? 'Login' : 'Register'}</h3>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 mb-4 bg-gray-700 rounded"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mb-4 bg-gray-700 rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mb-4 bg-gray-700 rounded"
              required
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
        </div>
      </section>

      <section className="py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-8">Live Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <h4 className="text-xl font-semibold">Match 1</h4>
            <p>Team A vs Team B: 150/5 (20 overs)</p>
            <p className="text-sm text-gray-400 mt-2">Live</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <h4 className="text-xl font-semibold">Match 2</h4>
            <p>Team C vs Team D: 120/3 (18 overs)</p>
            <p className="text-sm text-gray-400 mt-2">Completed</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <h4 className="text-xl font-semibold">Match 3</h4>
            <p>Team E vs Team F: 180/7 (20 overs)</p>
            <p className="text-sm text-gray-400 mt-2">Upcoming</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-800">
        <h3 className="text-3xl font-bold text-center mb-8">Featured Tournaments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-700 p-6 rounded-lg">
            <h4 className="text-xl font-semibold">T20 World Cup</h4>
            <p>Global cricket tournament with live updates and overlays.</p>
            <Link to="/tournaments" className="text-blue-400 hover:underline mt-4 inline-block">View Details</Link>
          </div>
          <div className="bg-gray-700 p-6 rounded-lg">
            <h4 className="text-xl font-semibold">Local League</h4>
            <p>Community cricket matches and brackets for local teams.</p>
            <Link to="/tournaments" className="text-blue-400 hover:underline mt-4 inline-block">View Details</Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-8">Team Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <h4 className="text-4xl font-bold text-blue-400">150</h4>
            <p>Total Runs</p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-green-400">10</h4>
            <p>Wickets Taken</p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-yellow-400">5</h4>
            <p>Matches Won</p>
          </div>
          <div>
            <h4 className="text-4xl font-bold text-red-400">95%</h4>
            <p>Win Rate</p>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 bg-gray-800 text-center">
        <p>&copy; 2023 ScoreX. All rights reserved. Built for cricket enthusiasts.</p>
      </footer>
    </div>
  );
};

export default Frontpage;