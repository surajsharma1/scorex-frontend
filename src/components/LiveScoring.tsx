import React, { useState, useEffect } from 'react';

// --- Types & Interfaces ---
interface Team {
  name: string;
  score: number;
  color: string; // Tailwind color class for the team's logo placeholder
}

interface MatchState {
  homeTeam: Team;
  awayTeam: Team;
  status: 'PRE-MATCH' | 'LIVE' | 'HALF-TIME' | 'FULL-TIME';
  time: string;
}

const LiveScoring: React.FC = () => {
  // --- State Management ---
  const [match, setMatch] = useState<MatchState>({
    homeTeam: { name: 'Eagles', score: 0, color: 'bg-blue-600' },
    awayTeam: { name: 'Tigers', score: 0, color: 'bg-orange-600' },
    status: 'LIVE',
    time: '45:00'
  });

  // --- Real-time Data Integration Placeholder ---
  useEffect(() => {
    if (match.status !== 'LIVE') return;

    // TODO: Connect to your actual data source here.
    // Example using WebSockets:
    // const socket = new WebSocket('wss://your-api.com/live-scores');
    // socket.onmessage = (event) => setMatch(JSON.parse(event.data));
    // return () => socket.close();

    // Simulating a polling interval for demonstration
    const interval = setInterval(() => {
      console.log('Fetching latest scores...');
    }, 10000);

    return () => clearInterval(interval);
  }, [match.status]);

  // --- Handlers (For manual testing in this demo) ---
  const handleScore = (team: 'homeTeam' | 'awayTeam', points: number) => {
    setMatch(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        score: prev[team].score + points
      }
    }));
  };

  // --- UI Render ---
  return (
    <div className="w-full max-w-2xl mx-auto p-4 font-sans">
      
      {/* Main Scoreboard Card */}
      <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">

        {/* Header: Match Info & Time */}
        <div className="bg-gray-950 px-6 py-4 flex justify-between items-center border-b border-gray-800">
          <span className="text-gray-400 text-sm font-semibold tracking-wider uppercase">
            Championship Finals
          </span>
          <div className="flex items-center gap-2">
            {/* Live Indicator Dot */}
            {match.status === 'LIVE' && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            <span className={`text-sm font-bold ${match.status === 'LIVE' ? 'text-red-500' : 'text-gray-400'}`}>
              {match.status} {match.status === 'LIVE' && <span className="text-gray-200 ml-1">{match.time}</span>}
            </span>
          </div>
        </div>

        {/* Score Display Area */}
        <div className="p-8 flex justify-between items-center">
          
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-16 h-16 rounded-full ${match.homeTeam.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4`}>
              {match.homeTeam.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{match.homeTeam.name}</h2>
          </div>

          {/* Scores */}
          <div className="flex items-center justify-center gap-6 px-4">
            <span className="text-6xl font-black text-white tabular-nums tracking-tighter">
              {match.homeTeam.score}
            </span>
            <span className="text-3xl text-gray-600 font-bold">-</span>
            <span className="text-6xl font-black text-white tabular-nums tracking-tighter">
              {match.awayTeam.score}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-16 h-16 rounded-full ${match.awayTeam.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4`}>
              {match.awayTeam.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{match.awayTeam.name}</h2>
          </div>
        </div>
      </div>

      {/* --- Admin / Testing Controls (Remove before deploying to production) --- */}
      <div className="mt-6 p-4 bg-gray-100 rounded-xl border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Simulate Live Updates
        </h3>
        <div className="flex justify-between gap-4">
           <button
             onClick={() => handleScore('homeTeam', 1)}
             className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors"
           >
             +1 {match.homeTeam.name}
           </button>
           <button
             onClick={() => setMatch(p => ({ ...p, status: p.status === 'LIVE' ? 'HALF-TIME' : 'LIVE' }))}
             className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
           >
             Toggle Status
           </button>
           <button
             onClick={() => handleScore('awayTeam', 1)}
             className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition-colors"
           >
             +1 {match.awayTeam.name}
           </button>
        </div>
      </div>

    </div>
  );
};

export default LiveScoring;