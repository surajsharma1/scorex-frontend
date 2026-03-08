
import { useState, useEffect } from 'react';
import { matchAPI } from '../services/api';
import { Match } from './types';

interface PlayerStats {
  playerId: string;
  playerName: string;
  matches: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: number;
  strikeRate: string | number;
  average: string | number;
  economy: string | number;
}

interface TournamentStatsProps {
  tournamentId: string;
  matches: Match[];
}

export default function TournamentStats({ tournamentId, matches }: TournamentStatsProps) {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatTab, setActiveStatTab] = useState<'batting' | 'bowling'>('batting');

  useEffect(() => {
    fetchStats();
  }, [tournamentId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await matchAPI.getTournamentStats(tournamentId);
      // API returns: { success: true, data: { playerStats: [...] } }
      // So response.data.data.playerStats
      const playerStats = response?.data?.playerStats;
      if (playerStats) {
        setStats(playerStats);
      }
    } catch (error) {
      console.error('Failed to fetch tournament stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedByRuns = [...stats].sort((a, b) => b.runs - a.runs);
  const sortedByWickets = [...stats].sort((a, b) => b.wickets - a.wickets);
  const sortedByStrikeRate = [...stats].filter(s => Number(s.strikeRate) > 0).sort((a, b) => Number(b.strikeRate) - Number(a.strikeRate));
  const sortedByEconomy = [...stats].filter(s => Number(s.economy) > 0 && s.overs > 0).sort((a, b) => Number(a.economy) - Number(b.economy));

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading statistics...</p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-lg">No statistics available yet.</p>
        <p className="text-gray-500 mt-2">Play some matches to see player statistics!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveStatTab('batting')}
          className={`px-4 py-2 rounded-lg font-medium ${activeStatTab === 'batting' ? 'bg-green-600' : 'bg-gray-700'}`}
        >
          Batting Stats
        </button>
        <button
          onClick={() => setActiveStatTab('bowling')}
          className={`px-4 py-2 rounded-lg font-medium ${activeStatTab === 'bowling' ? 'bg-red-600' : 'bg-gray-700'}`}
        >
          Bowling Stats
        </button>
      </div>

      {activeStatTab === 'batting' && (
        <div>
          <h3 className="text-xl font-bold mb-4">Top Run Scorers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3">Player</th>
                  <th className="p-3">Matches</th>
                  <th className="p-3">Runs</th>
                  <th className="p-3">Balls</th>
                  <th className="p-3">4s</th>
                  <th className="p-3">6s</th>
                  <th className="p-3">Avg</th>
                  <th className="p-3">SR</th>
                </tr>
              </thead>
              <tbody>
                {sortedByRuns.slice(0, 10).map((player, index) => (
                  <tr key={player.playerId} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3 font-medium">
                      {index + 1}. {player.playerName}
                    </td>
                    <td className="p-3">{player.matches}</td>
                    <td className="p-3 text-green-400 font-bold">{player.runs}</td>
                    <td className="p-3">{player.balls}</td>
                    <td className="p-3">{player.fours}</td>
                    <td className="p-3">{player.sixes}</td>
                    <td className="p-3">{player.average}</td>
                    <td className="p-3">{player.strikeRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold mt-8 mb-4">Best Strike Rates (Min 50 balls)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3">Player</th>
                  <th className="p-3">Runs</th>
                  <th className="p-3">Balls</th>
                  <th className="p-3">Strike Rate</th>
                </tr>
              </thead>
              <tbody>
                {sortedByStrikeRate.slice(0, 10).map((player, index) => (
                  <tr key={player.playerId} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3 font-medium">
                      {index + 1}. {player.playerName}
                    </td>
                    <td className="p-3">{player.runs}</td>
                    <td className="p-3">{player.balls}</td>
                    <td className="p-3 text-green-400 font-bold">{player.strikeRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeStatTab === 'bowling' && (
        <div>
          <h3 className="text-xl font-bold mb-4">Top Wicket Takers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3">Player</th>
                  <th className="p-3">Matches</th>
                  <th className="p-3">Wickets</th>
                  <th className="p-3">Overs</th>
                  <th className="p-3">Runs</th>
                  <th className="p-3">Economy</th>
                </tr>
              </thead>
              <tbody>
                {sortedByWickets.slice(0, 10).map((player, index) => (
                  <tr key={player.playerId} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3 font-medium">
                      {index + 1}. {player.playerName}
                    </td>
                    <td className="p-3">{player.matches}</td>
                    <td className="p-3 text-red-400 font-bold">{player.wickets}</td>
                    <td className="p-3">{player.overs}</td>
                    <td className="p-3">{player.runs}</td>
                    <td className="p-3">{player.economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold mt-8 mb-4">Best Economy Rates (Min 10 overs)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3">Player</th>
                  <th className="p-3">Overs</th>
                  <th className="p-3">Wickets</th>
                  <th className="p-3">Runs</th>
                  <th className="p-3">Economy</th>
                </tr>
              </thead>
              <tbody>
                {sortedByEconomy.slice(0, 10).map((player, index) => (
                  <tr key={player.playerId} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3 font-medium">
                      {index + 1}. {player.playerName}
                    </td>
                    <td className="p-3">{player.overs}</td>
                    <td className="p-3">{player.wickets}</td>
                    <td className="p-3">{player.runs}</td>
                    <td className="p-3 text-green-400 font-bold">{player.economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

