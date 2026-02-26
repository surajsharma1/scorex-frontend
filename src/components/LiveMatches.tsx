import { useState, useEffect } from 'react';
import { matchAPI } from '../services/api';
import { Match } from './types';
import { Play, Calendar, MapPin, TrendingUp, MonitorPlay, Clock, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    loadAllMatches();
    const interval = setInterval(loadAllMatches, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const loadAllMatches = async () => {
    try {
      const res = await matchAPI.getAllMatches();
      const allMatches = res.data.matches || res.data || [];
      setMatches(allMatches);
    } catch (e) {
      console.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const liveMatches = matches.filter(m => m.status === 'ongoing');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming' || m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (loading) return <div className="p-8 text-center dark:text-white">Loading matches...</div>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative">
          <MonitorPlay className="w-8 h-8 text-red-600" />
          {liveMatches.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Matches</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div 
          onClick={() => setFilter('ongoing')}
          className={`p-4 rounded-xl cursor-pointer transition ${filter === 'ongoing' ? 'bg-red-600' : 'bg-gray-800'}`}
        >
          <div className="flex items-center gap-2 text-white mb-1">
            <Play className="w-4 h-4" />
            <span className="font-medium">Live</span>
          </div>
          <div className="text-2xl font-bold text-white">{liveMatches.length}</div>
        </div>
        
        <div 
          onClick={() => setFilter('upcoming')}
          className={`p-4 rounded-xl cursor-pointer transition ${filter === 'upcoming' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          <div className="flex items-center gap-2 text-white mb-1">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Upcoming</span>
          </div>
          <div className="text-2xl font-bold text-white">{upcomingMatches.length}</div>
        </div>
        
        <div 
          onClick={() => setFilter('completed')}
          className={`p-4 rounded-xl cursor-pointer transition ${filter === 'completed' ? 'bg-green-600' : 'bg-gray-800'}`}
        >
          <div className="flex items-center gap-2 text-white mb-1">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">Completed</span>
          </div>
          <div className="text-2xl font-bold text-white">{completedMatches.length}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'ongoing', 'upcoming', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === f 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Match List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-xl text-gray-500 dark:text-gray-400">
            {filter === 'all' ? 'No matches available.' : `No ${filter} matches.`}
          </p>
          <Link to="/tournaments" className="text-green-600 hover:underline mt-2 inline-block">Browse Tournaments</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <div key={match._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
              
              {/* Header with Status */}
              <div className={`p-4 text-white flex justify-between items-center ${
                match.status === 'ongoing' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700' 
                  : match.status === 'completed'
                  ? 'bg-gradient-to-r from-green-600 to-green-700'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700'
              }`}>
                <span className="text-xs uppercase tracking-wider font-semibold opacity-70">
                  {typeof match.tournament === 'string' ? 'Tournament Match' : match.tournament?.name}
                </span>
                {match.status === 'ongoing' ? (
                  <span className="bg-red-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
                  </span>
                ) : match.status === 'completed' ? (
                  <span className="bg-green-600 px-2 py-0.5 rounded text-xs font-bold">FINISHED</span>
                ) : (
                  <span className="bg-blue-600 px-2 py-0.5 rounded text-xs font-bold">UPCOMING</span>
                )}
              </div>

              {/* Score Display */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  {/* Team 1 */}
                  <div className="text-center w-1/3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2 font-bold text-2xl text-gray-600 dark:text-gray-300">
                      {match.team1?.shortName || match.team1?.name?.substring(0,2) || 'T1'}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{match.team1?.name || 'Team 1'}</h3>
                    {match.status !== 'completed' && match.status !== 'scheduled' && (
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {match.score1 || 0}/{match.wickets1 || 0}
                      </div>
                    )}
                  </div>

                  <div className="text-center w-1/3 px-2">
                    <span className="text-gray-400 text-xs font-bold block mb-1">VS</span>
                    {match.status === 'ongoing' && match.battingTeam && (
                      match.battingTeam === 'team1' ? (
                        <div className="text-green-600 text-xs">◀ Batting</div>
                      ) : (
                        <div className="text-green-600 text-xs">Batting ▶</div>
                      )
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="text-center w-1/3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2 font-bold text-2xl text-gray-600 dark:text-gray-300">
                      {match.team2?.shortName || match.team2?.name?.substring(0,2) || 'T2'}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{match.team2?.name || 'Team 2'}</h3>
                    {match.status !== 'upcoming' && match.status !== 'scheduled' && (
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {match.score2 || 0}/{match.wickets2 || 0}
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Status / Target */}
                {match.status === 'ongoing' && match.target ? (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      Target: <span className="font-bold">{match.target}</span> | 
                      Need <span className="font-bold">{match.target - (match.battingTeam === 'team1' ? (match.score1||0) : (match.score2||0))}</span> runs
                    </p>
                    <p className="text-xs text-gray-500 mt-1">CRR: {match.currentRunRate || '0.00'}</p>
                  </div>
                ) : match.status === 'completed' ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center mb-4">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {match.winner ? `${match.winner.name} won!` : 'Match ended in a draw'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center mb-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {match.date ? new Date(match.date).toLocaleDateString() : 'Date not set'}
                    </div>
                    {match.venue && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        {match.venue}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    to={`/tournaments/${typeof match.tournament === 'string' ? match.tournament : match.tournament?._id}`}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <TrendingUp className="w-4 h-4" /> Scorecard
                  </Link>
                  {match.videoLink && match.status === 'ongoing' && (
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
