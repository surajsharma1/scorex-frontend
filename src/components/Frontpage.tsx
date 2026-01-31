import React from 'react';
import { Link } from 'react-router-dom';

const Frontpage = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-gray-800">
        <h1 className="text-2xl font-bold">ScoreX</h1>
        <nav className="space-x-6">
          <Link to="/tournaments" className="hover:text-blue-400">Tournaments</Link>
          <Link to="/teams" className="hover:text-blue-400">Teams</Link>
          <Link to="/brackets" className="hover:text-blue-400">Brackets</Link>
          <Link to="/overlay" className="hover:text-blue-400">Overlays</Link>
        </nav>
      </header>

      {/* Hero Section (No Image, Gradient Background) */}
      <section className="relative bg-gradient-to-r from-blue-900 to-purple-900 h-96 flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-5xl font-bold mb-4">Manage Cricket Tournaments Like a Pro</h2>
          <p className="text-xl mb-4">
            ScoreX is your ultimate platform for creating and managing cricket tournaments. 
            Generate live overlays for YouTube and streaming platforms, track real-time scores, 
            and organize teams and brackets effortlessly. Whether you're a tournament organizer 
            or a streamer, ScoreX makes cricket management simple and professional.
          </p>
          <p className="text-lg mb-8">
            Sign in with Google to start creating tournaments, managing teams, and building 
            custom overlays for your live streams.
          </p>
          <button 
            onClick={handleGoogleLogin} 
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Login with Google
          </button>
        </div>
      </section>

      {/* Live Scores Section */}
      <section className="py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-8">Live Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h4 className="text-xl font-semibold">Match 1</h4>
            <p>Team A vs Team B: 150/5 (20 overs)</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h4 className="text-xl font-semibold">Match 2</h4>
            <p>Team C vs Team D: 120/3 (18 overs)</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h4 className="text-xl font-semibold">Match 3</h4>
            <p>Team E vs Team F: 180/7 (20 overs)</p>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-16 px-6 bg-gray-800">
        <h3 className="text-3xl font-bold text-center mb-8">Featured Tournaments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-700 p-6 rounded-lg">
            <h4 className="text-xl font-semibold">T20 World Cup</h4>
            <p>Global cricket tournament with live updates.</p>
            <Link to="/tournaments" className="text-blue-400 hover:underline">View Details</Link>
          </div>
          <div className="bg-gray-700 p-6 rounded-lg">
            <h4 className="text-xl font-semibold">Local League</h4>
            <p>Community cricket matches and brackets.</p>
            <Link to="/tournaments" className="text-blue-400 hover:underline">View Details</Link>
          </div>
        </div>
      </section>

      {/* Team Stats */}
      <section className="py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-8">Team Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <h4 className="text-2xl font-bold">150</h4>
            <p>Total Runs</p>
          </div>
          <div className="text-center">
            <h4 className="text-2xl font-bold">10</h4>
            <p>Wickets Taken</p>
          </div>
          <div className="text-center">
            <h4 className="text-2xl font-bold">5</h4>
            <p>Matches Won</p>
          </div>
          <div className="text-center">
            <h4 className="text-2xl font-bold">95%</h4>
            <p>Win Rate</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-800 text-center">
        <p>&copy; 2023 ScoreX. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Frontpage;