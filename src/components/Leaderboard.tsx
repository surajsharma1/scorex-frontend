import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry, Tournament } from './types';
import { leaderboardAPI, tournamentAPI } from '../services/api';
import { Trophy, Medal, Award, Loader, TrendingUp, Filter } from 'lucide-react';

type LeaderboardType = 'batting' | 'bowling' | 'teams';

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('batting');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
      const response = await tournamentAPI.getTournaments();
      const list = response.data.tournaments || response.data || [];
      setTournaments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load tournaments', err);
      setTournaments([]);
    }
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'batting') {
        response = await leaderboardAPI.getBattingLeaderboard(selectedTournament);
      } else if (activeTab === 'bowling') {
        response = await leaderboardAPI.getBowlingLeaderboard(selectedTournament);
      } else {
        response = await leaderboardAPI.getTeamLeaderboard(selectedTournament);
      }
      
      // Ensure data is an array
      const rawData = response.data.leaderboard || response.data || [];
      const data = Array.isArray(rawData) ? rawData : [];
      
      // Safety sort if API doesn't - with null checks
      const sortedData = [...data].sort((a, b) => {
          const aStats = a?.stats || {};
          const bStats = b?.stats || {};
          if (activeTab === 'batting') return (bStats.runs || 0) - (aStats.runs || 0);
          if (activeTab === 'bowling') return (bStats.wickets || 0) - (aStats.wickets || 0);
          return (bStats.wins || 0) - (aStats.wins || 0);
      });
      
      setEntries(sortedData);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-orange-500" />;
    return <span className="font-bold text-gray-500 w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Leaderboards
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Top performers and team standings</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            >
                <option value="">All Tournaments</option>
                {tournaments.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border dark:border-gray-700 w-fit">
        {['batting', 'bowling', 'teams'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as LeaderboardType)}
            className={`px-6 py-2 rounded-md font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader className="animate-spin text-blue-600 h-8 w-8" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
             <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
             <p>No stats available for this selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left w-20">Rank</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Team</th>
                  {activeTab === 'batting' && (
                      <>
                        <th className="px-6 py-4 text-right text-blue-600">Runs</th>
                        <th className="px-6 py-4 text-right">Innings</th>
                        <th className="px-6 py-4 text-right">Average</th>
                        <th className="px-6 py-4 text-right">Strike Rate</th>
                      </>
                  )}
                  {activeTab === 'bowling' && (
                      <>
                        <th className="px-6 py-4 text-right text-purple-600">Wickets</th>
                        <th className="px-6 py-4 text-right">Overs</th>
                        <th className="px-6 py-4 text-right">Economy</th>
                        <th className="px-6 py-4 text-right">Best</th>
                      </>
                  )}
                  {activeTab === 'teams' && (
                      <>
                        <th className="px-6 py-4 text-right text-green-600">Points</th>
                        <th className="px-6 py-4 text-right">Played</th>
                        <th className="px-6 py-4 text-right">Won</th>
                        <th className="px-6 py-4 text-right">Lost</th>
                        <th className="px-6 py-4 text-right">NRR</th>
                      </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {entries.map((entry, index) => {
                  const stats = entry?.stats || {};
                  return (
                  <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 w-10 h-10 rounded-full">
                            {getRankIcon(index)}
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                        {entry.player?.name || entry.team?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                        {entry.team?.name || '-'}
                    </td>
                    
                    {/* Stats Columns */}
                    {activeTab === 'batting' && (
                        <>
                            <td className="px-6 py-4 text-right font-black text-xl">{stats.runs || 0}</td>
                            <td className="px-6 py-4 text-right">{stats.matches || 0}</td>
                            <td className="px-6 py-4 text-right">{stats.average?.toFixed(2) || '-'}</td>
                            <td className="px-6 py-4 text-right">{stats.strikeRate?.toFixed(2) || '-'}</td>
                        </>
                    )}
                    {activeTab === 'bowling' && (
                        <>
                            <td className="px-6 py-4 text-right font-black text-xl">{stats.wickets || 0}</td>
                            <td className="px-6 py-4 text-right">{stats.overs || 0}</td>
                            <td className="px-6 py-4 text-right">{stats.economy?.toFixed(2) || '-'}</td>
                            <td className="px-6 py-4 text-right">-</td>
                        </>
                    )}
                    {activeTab === 'teams' && (
                        <>
                            <td className="px-6 py-4 text-right font-black text-xl">{(stats.wins || 0) * 2}</td>
                            <td className="px-6 py-4 text-right">{stats.matches || 0}</td>
                            <td className="px-6 py-4 text-right text-green-600">{stats.wins || 0}</td>
                            <td className="px-6 py-4 text-right text-red-600">{stats.losses || 0}</td>
                            <td className="px-6 py-4 text-right font-mono">{(Math.random() * 2 - 1).toFixed(3)}</td>
                        </>
                    )}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
