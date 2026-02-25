import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { Match } from './types';
import { Trophy, Play, Activity, Users, ArrowRight } from 'lucide-react';

export default function Frontpage() {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);

  useEffect(() => {
    // Redirect if already logged in
    if (localStorage.getItem('token')) {
      navigate('/');
    }
    
    // Fetch teaser data
    loadLiveMatches();
  }, []);

  const loadLiveMatches = async () => {
    try {
      const res = await matchAPI.getAllMatches();
      const matches = res.data.matches || [];
      setLiveMatches(matches.filter((m: Match) => m.status === 'ongoing').slice(0, 3));
    } catch (e) {
      console.error("Failed to load landing data");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          ScoreX
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-4 py-2 hover:text-blue-400 font-medium">Login</Link>
          <Link to="/register" className="px-6 py-2 bg-blue-600 rounded-full font-bold hover:bg-blue-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-6 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          Next Gen Cricket <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            Tournament Manager
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Create tournaments, manage teams, and broadcast professional-grade live scores with our advanced overlay system.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 flex items-center gap-2">
            Start Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/live-matches" className="px-8 py-4 bg-gray-800 border border-gray-700 rounded-full font-bold text-lg hover:bg-gray-700 flex items-center gap-2">
            <Play className="w-5 h-5 text-red-500" /> Watch Live
          </Link>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-gray-800 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
            <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Tournament Brackets</h3>
            <p className="text-gray-400">Automated scheduling and drag-and-drop bracket generation for any tournament format.</p>
          </div>
          <div className="p-8 bg-gray-800 rounded-2xl border border-gray-700 hover:border-green-500 transition-colors">
            <Activity className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Live Scoring</h3>
            <p className="text-gray-400">Real-time ball-by-ball scoring with advanced stats, wagon wheels, and run rates.</p>
          </div>
          <div className="p-8 bg-gray-800 rounded-2xl border border-gray-700 hover:border-purple-500 transition-colors">
            <Users className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Stream Overlays</h3>
            <p className="text-gray-400">Professional broadcast overlays that sync instantly with your live scorecard.</p>
          </div>
        </div>
      </section>

      {/* Live Preview */}
      {liveMatches.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            Happening Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {liveMatches.map(match => (
              <div key={match._id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold bg-red-900/50 text-red-400 px-2 py-1 rounded">LIVE</span>
                  <span className="text-xs text-gray-400">{match.venue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{match.team1.name}</h3>
                    <p className="text-2xl font-bold text-blue-400">{match.score1}/{match.wickets1}</p>
                  </div>
                  <span className="text-gray-600 font-bold">VS</span>
                  <div className="text-right">
                    <h3 className="font-bold">{match.team2.name}</h3>
                    <p className="text-2xl font-bold text-yellow-400">{match.score2}/{match.wickets2}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}