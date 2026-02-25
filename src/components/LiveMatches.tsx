import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Match } from './types';
import { matchAPI } from '../services/api';
import { Radio, Loader, Play, Trophy, Clock, MapPin } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

const LiveMatches: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'completed'>('live');

  useEffect(() => {
    loadMatches();
    
    // Robust URL handling for Socket.IO
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    // Remove /api/v1 suffix if present to get root domain
    const socketUrl = apiBase.replace(/\/api\/v1\/?$/, '');
    
    const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
        console.log('Connected to match updates socket');
    });

    newSocket.on('scoreUpdate', (data: { matchId: string; match: Match }) => {
      setLiveMatches((prev) =>
        prev.map((match) => (match._id === data.matchId ? data.match : match))
      );
      setAllMatches((prev) =>
        prev.map((match) => (match._id === data.matchId ? data.match : match))
      );
    });

    newSocket.on('matchStatusChange', () => {
      loadMatches(); // Reload to get updated status
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const response = await matchAPI.getAllMatches();
      // Handle both { matches: [] } and [] response formats
      const matchesData = response.data?.matches || response.data || [];
      const matchesArray = Array.isArray(matchesData) ? matchesData : [];
      
      setAllMatches(matchesArray);
      setLiveMatches(matchesArray.filter((m: Match) => m.status === 'ongoing'));
      
      // Auto-switch tab if no live matches but we have upcoming ones
      if(matchesArray.filter((m: Match) => m.status === 'ongoing').length === 0) {
          if(matchesArray.filter((m: Match) => m.status === 'scheduled').length > 0) {
              setActiveTab('upcoming');
          }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load matches. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMatches = () => {
    switch (activeTab) {
      case 'live':
        return allMatches.filter((m) => m.status === 'ongoing');
      case 'upcoming':
        return allMatches.filter((m) => m.status === 'scheduled' || m.status === 'upcoming');
      case 'completed':
        return allMatches.filter((m) => m.status === 'completed');
      default:
        return [];
    }
  };

  const handleWatchLive = (match: Match) => {
    navigate(`/live-tournament/${match._id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 h-64">
        <Loader className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Radio className="h-8 w-8 mr-3 text-red-500 animate-pulse" />
          {t('liveMatches.title', 'Live Matches')}
        </h1>
        <div className="flex items-center gap-2">
          {liveMatches.length > 0 && (
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                {liveMatches.length} Live Now
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
            activeTab === 'live'
              ? 'text-red-600 border-red-600 dark:text-red-400 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
              : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Radio className="h-4 w-4" />
          Live ({allMatches.filter((m) => m.status === 'ongoing').length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
            activeTab === 'upcoming'
              ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
              : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          Upcoming ({allMatches.filter((m) => m.status === 'scheduled' || m.status === 'upcoming').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
            activeTab === 'completed'
              ? 'text-green-600 border-green-600 dark:text-green-400 dark:border-green-400 bg-green-50 dark:bg-green-900/10'
              : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Completed ({allMatches.filter((m) => m.status === 'completed').length})
        </button>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Radio className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {activeTab === 'live'
                ? t('liveMatches.noLive', 'No live matches at the moment')
                : activeTab === 'upcoming'
                ? t('liveMatches.noUpcoming', 'No upcoming matches scheduled')
                : t('liveMatches.noCompleted', 'No completed matches yet')}
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <div
              key={match._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleWatchLive(match)}
            >
              {/* Match Header */}
              <div className={`p-4 ${
                match.status === 'ongoing'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : match.status === 'completed'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    {match.matchType || 'League Match'}
                  </span>
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium text-white backdrop-blur-sm">
                    {match.status === 'ongoing' && 'LIVE'}
                    {match.status === 'scheduled' && 'UPCOMING'}
                    {match.status === 'completed' && 'FINISHED'}
                  </span>
                </div>
              </div>

              {/* Teams & Scores */}
              <div className="p-4 space-y-4">
                {/* Team 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sm font-bold text-white">
                        {(match.team1?.name || 'T1').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                      {match.team1?.name || 'Team 1'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {match.score1 || 0}/{match.wickets1 || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ({match.overs1 || 0} ov)
                    </p>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-bold">VS</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                </div>

                {/* Team 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sm font-bold text-white">
                        {(match.team2?.name || 'T2').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                      {match.team2?.name || 'Team 2'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {match.score2 || 0}/{match.wickets2 || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ({match.overs2 || 0} ov)
                    </p>
                  </div>
                </div>

                {/* Match Info Footer */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(match.date).toLocaleDateString()}</span>
                  </div>
                  {match.venue && (
                    <div className="flex items-center gap-1 max-w-[50%]">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{match.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveMatches;