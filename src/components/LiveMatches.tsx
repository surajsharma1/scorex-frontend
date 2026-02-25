import { useState, useEffect } from 'react';
import { matchAPI } from '../services/api';
import { Match } from './types';
import { Play, Calendar, MapPin, TrendingUp, MonitorPlay } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveMatches();
    const interval = setInterval(loadLiveMatches, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const loadLiveMatches = async () => {
    try {
      const res = await matchAPI.getAllMatches();
      const live = (res.data.matches || []).filter((m: Match) => m.status === 'ongoing');
      setMatches(live);
    } catch (e) {
      console.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center dark:text-white">Loading live scores...</div>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="relative">
          <MonitorPlay className="w-8 h-8 text-red-600" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Matches</h1>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-xl text-gray-500 dark:text-gray-400">No matches are currently live.</p>
          <Link to="/matches" className="text-green-600 hover:underline mt-2 inline-block">View upcoming schedule</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div key={match._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-70">
                  {typeof match.tournament === 'string' ? 'Tournament Match' : match.tournament?.name}
                </span>
                <span className="bg-red-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
                </span>
              </div>

              {/* Score Display */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  {/* Team 1 */}
                  <div className="text-center w-1/3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2 font-bold text-2xl text-gray-600 dark:text-gray-300">
                      {match.team1.shortName || match.team1.name.substring(0,2)}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{match.team1.name}</h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {match.score1 || 0}/{match.wickets1 || 0}
                    </div>
                    <div className="text-sm text-gray-500">({match.overs1 || 0} ov)</div>
                  </div>

                  <div className="text-center w-1/3 px-2">
                    <span className="text-gray-400 text-xs font-bold block mb-1">VS</span>
                    {match.battingTeam === 'team1' ? (
                       <div className="text-green-600 text-xs">◀ Batting</div>
                    ) : (
                       <div className="text-green-600 text-xs">Batting ▶</div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="text-center w-1/3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2 font-bold text-2xl text-gray-600 dark:text-gray-300">
                      {match.team2.shortName || match.team2.name.substring(0,2)}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{match.team2.name}</h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {match.score2 || 0}/{match.wickets2 || 0}
                    </div>
                    <div className="text-sm text-gray-500">({match.overs2 || 0} ov)</div>
                  </div>
                </div>

                {/* Match Status / Target */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center mb-4">
                  {match.target ? (
                     <p className="text-sm text-gray-700 dark:text-gray-200">
                       Target: <span className="font-bold">{match.target}</span> | 
                       Need <span className="font-bold">{match.target - (match.battingTeam === 'team1' ? (match.score1||0) : (match.score2||0))}</span> runs
                     </p>
                  ) : (
                     <p className="text-sm text-gray-500 dark:text-gray-400">1st Innings</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">CRR: {match.currentRunRate || '0.00'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    to={`/match/${match._id}`}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <TrendingUp className="w-4 h-4" /> Scorecard
                  </Link>
                  {match.videoLink && (
                    <a 
                      href={match.videoLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Play className="w-4 h-4" /> Watch Live
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}