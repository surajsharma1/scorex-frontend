import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry, Tournament } from './types';
import { leaderboardAPI, tournamentAPI } from '../services/api';
import { Trophy, Medal, Award, Loader, TrendingUp, Target, Zap } from 'lucide-react';

type LeaderboardType = 'batting' | 'bowling' | 'teams';

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('batting');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, selectedTournament]);

  const loadTournaments = async () => {
    try {
      const response = await tournamentAPI.getTournaments(1, 50);
      const tournamentsData = response.data?.tournaments || response.data || [];
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
    } catch (err) {
      console.error('Failed to load tournaments');
    }
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      const tournamentId = selectedTournament || undefined;
      
      switch (activeTab) {
        case 'batting':
          response = await leaderboardAPI.getBattingLeaderboard(tournamentId);
          break;
        case 'bowling':
          response = await leaderboardAPI.getBowlingLeaderboard(tournamentId);
          break;
        case 'teams':
          response = await leaderboardAPI.getTeamLeaderboard(tournamentId);
          break;
      }
      
      const entriesData = response?.data?.leaderboard || response?.data || [];
      setEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch (err) {
      setError('Failed to load leaderboard');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500 dark:text-dark-accent/70">{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-300 dark:border-yellow-600/30';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700/30 dark:to-gray-700/20 border-gray-300 dark:border-gray-600/30';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-300 dark:border-amber-600/30';
      default:
        return 'bg-white dark:bg-dark-bg border-gray-200 dark:border-dark-primary/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-light flex items-center">
          <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
          {t('leaderboard.title', 'Leaderboard')}
        </h1>
        
        {/* Tournament Filter */}
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-accent"
        >
          <option value="">{t('leaderboard.allTournaments', 'All Tournaments')}</option>
          {tournaments.map((tournament) => (
            <option key={tournament._id} value={tournament._id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-primary/30">
        <button
          onClick={() => setActiveTab('batting')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'batting'
              ? 'text-light-primary dark:text-dark-accent border-b-2 border-light-primary dark:border-dark-accent bg-light-primary/10 dark:bg-dark-primary/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light hover:bg-gray-50 dark:hover:bg-dark-primary/5'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          {t('leaderboard.batting', 'Top Batsmen')}
        </button>
        <button
          onClick={() => setActiveTab('bowling')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'bowling'
              ? 'text-light-primary dark:text-dark-accent border-b-2 border-light-primary dark:border-dark-accent bg-light-primary/10 dark:bg-dark-primary/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light hover:bg-gray-50 dark:hover:bg-dark-primary/5'
          }`}
        >
          <Target className="h-4 w-4" />
          {t('leaderboard.bowling', 'Top Bowlers')}
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'teams'
              ? 'text-light-primary dark:text-dark-accent border-b-2 border-light-primary dark:border-dark-accent bg-light-primary/10 dark:bg-dark-primary/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light hover:bg-gray-50 dark:hover:bg-dark-primary/5'
          }`}
        >
          <Zap className="h-4 w-4" />
          {t('leaderboard.teams', 'Top Teams')}
        </button>
      </div>

      {/* Leaderboard Content */}
      <div className="bg-white dark:bg-dark-bg-alt rounded-lg shadow-sm border border-gray-200 dark:border-dark-primary/30">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader className="animate-spin h-8 w-8 text-light-primary dark:text-dark-accent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-gray-300 dark:text-dark-primary/50 mb-4" />
            <p className="text-gray-500 dark:text-dark-accent/70 text-lg">
              {t('leaderboard.noData', 'No leaderboard data available')}
            </p>
            <p className="text-gray-400 dark:text-dark-accent/50 text-sm mt-2">
              {t('leaderboard.playMatches', 'Play some matches to see rankings!')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-primary/30">
            {entries.map((entry, index) => (
              <div
                key={entry._id}
                className={`p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-dark-primary/10 transition-colors ${getRankBgColor(entry.rank || index + 1)} border-l-4`}
              >
                {/* Rank */}
                <div className="w-12 h-12 flex items-center justify-center">
                  {getRankIcon(entry.rank || index + 1)}
                </div>

                {/* Player/Team Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-light-primary dark:bg-dark-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(entry.player?.name || entry.team?.name || entry.user?.username || 'N/A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-dark-light">
                        {entry.player?.name || entry.team?.name || entry.user?.username || 'Unknown'}
                      </h3>
                      {entry.player?.role && (
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">{entry.player.role}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-right">
                  {activeTab === 'batting' && (
                    <>
                      <div>
                        <p className="text-2xl font-bold text-light-primary dark:text-dark-accent">
                          {entry.stats.runs || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">Runs</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-lg font-semibold text-gray-700 dark:text-dark-light">
                          {entry.stats.average?.toFixed(2) || '-'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">Avg</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-lg font-semibold text-gray-700 dark:text-dark-light">
                          {entry.stats.strikeRate?.toFixed(2) || '-'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">SR</p>
                      </div>
                    </>
                  )}
                  {activeTab === 'bowling' && (
                    <>
                      <div>
                        <p className="text-2xl font-bold text-light-secondary dark:text-dark-secondary">
                          {entry.stats.wickets || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">Wickets</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-lg font-semibold text-gray-700 dark:text-dark-light">
                          {entry.stats.economy?.toFixed(2) || '-'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">Econ</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-lg font-semibold text-gray-700 dark:text-dark-light">
                          {entry.stats.average?.toFixed(2) || '-'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">Avg</p>
                      </div>
                    </>
                  )}
                  {activeTab === 'teams' && (
                    <>
                      <div>
                        <p className="text-2xl font-bold text-green-500 dark:text-green-400">
                          {entry.stats.wins || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">Wins</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-lg font-semibold text-red-500 dark:text-red-400">
                          {entry.stats.losses || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">Losses</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700 dark:text-dark-light">
                          {entry.stats.matches || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-accent/70">Matches</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
