import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Match, Tournament } from './types';
import { matchAPI, tournamentAPI, liveMatchAPI } from '../services/api';
import { Radio, Loader, Play, ExternalLink, Eye, Trophy, Clock, MapPin } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

const LiveMatches: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'completed'>('live');

  useEffect(() => {
    loadMatches();
    
    // Setup socket for real-time updates
    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('scoreUpdate', (data: { matchId: string; match: Match }) => {
      setLiveMatches((prev) =>
        prev.map((match) => (match._id === data.matchId ? data.match : match))
      );
      setAllMatches((prev) =>
        prev.map((match) => (match._id === data.matchId ? data.match : match))
      );
    });

    newSocket.on('matchStatusChange', (data: { matchId: string; status: string }) => {
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
      const matchesData = response.data?.matches || response.data || [];
      const matchesArray = Array.isArray(matchesData) ? matchesData : [];
      
      setAllMatches(matchesArray);
      setLiveMatches(matchesArray.filter((m: Match) => m.status === 'ongoing'));
    } catch (err) {
      setError('Failed to load matches');
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
      <div className="flex justify-center items-center p-12">
        <Loader className="animate-spin h-8 w-8 text-light-primary dark:text-dark-accent" />
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-light flex items-center">
          <Radio className="h-8 w-8 mr-3 text-red-500 animate-pulse" />
          {t('liveMatches.title', 'Live Matches')}
        </h1>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
            {liveMatches.length} Live Now
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-primary/30">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'live'
              ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light'
          }`}
        >
          <Radio className="h-4 w-4" />
          Live ({allMatches.filter((m) => m.status === 'ongoing').length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light'
          }`}
        >
          <Clock className="h-4 w-4" />
          Upcoming ({allMatches.filter((m) => m.status === 'scheduled' || m.status === 'upcoming').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'completed'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Completed ({allMatches.filter((m) => m.status === 'completed').length})
        </button>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-dark-bg-alt rounded-lg border border-gray-200 dark:border-dark-primary/30">
            <Radio className="h-16 w-16 mx-auto text-gray-300 dark:text-dark-primary/50 mb-4" />
            <p className="text-gray-500 dark:text-dark-accent/70 text-lg">
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
              className="bg-white dark:bg-dark-bg-alt rounded-xl shadow-sm border border-gray-200 dark:border-dark-primary/30 overflow-hidden hover:shadow-lg transition-shadow"
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    match.status === 'ongoing'
                      ? 'bg-white/20 text-white'
                      : match.status === 'completed'
                      ? 'bg-white/20 text-white'
                      : 'bg-white/20 text-white'
                  }`}>
                    {match.status === 'ongoing' && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                    )}
                    {match.status === 'scheduled' && 'UPCOMING'}
                    {match.status === 'completed' && 'COMPLETED'}
                  </span>
                </div>
              </div>

              {/* Teams & Scores */}
              <div className="p-4 space-y-4">
                {/* Team 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-light-primary dark:bg-dark-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(match.team1?.name || 'T1').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-dark-light">
                      {match.team1?.name || 'Team 1'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-dark-light">
                      {match.score1 || 0}/{match.wickets1 || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-accent/70">
                      ({match.overs1 || 0} overs)
                    </p>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-dark-primary/30"></div>
                  <span className="text-gray-400 dark:text-dark-accent/50 text-sm font-medium">VS</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-dark-primary/30"></div>
                </div>

                {/* Team 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-light-secondary dark:bg-dark-secondary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(match.team2?.name || 'T2').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-dark-light">
                      {match.team2?.name || 'Team 2'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-dark-light">
                      {match.score2 || 0}/{match.wickets2 || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-accent/70">
                      ({match.overs2 || 0} overs)
                    </p>
                  </div>
                </div>

                {/* Match Info */}
                <div className="pt-4 border-t border-gray-200 dark:border-dark-primary/30 flex items-center justify-between text-sm text-gray-500 dark:text-dark-accent/70">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(match.date).toLocaleDateString()}</span>
                  </div>
                  {match.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{match.venue}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {match.status === 'ongoing' && (
                  <button
                    onClick={() => handleWatchLive(match)}
                    className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-red-600 hover:to-orange-600 transition-all"
                  >
                    <Play className="h-4 w-4" />
                    Watch Live
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveMatches;
