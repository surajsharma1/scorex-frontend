import { useState, useEffect } from 'react';
import { Save, Play, Pause } from 'lucide-react';
import { tournamentAPI } from '../services/api';
import { Tournament } from './types';

interface ScoreboardUpdateProps {
  tournament: Tournament;
  onUpdate: () => void;
}

export default function ScoreboardUpdate({ tournament, onUpdate }: ScoreboardUpdateProps) {
  const [liveScores, setLiveScores] = useState(tournament.liveScores || {
    team1: { name: '', score: 0, wickets: 0, overs: 0 },
    team2: { name: '', score: 0, wickets: 0, overs: 0 },
    currentRunRate: 0,
    requiredRunRate: 0,
    target: 0,
    lastFiveOvers: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLiveScores(tournament.liveScores || {
      team1: { name: '', score: 0, wickets: 0, overs: 0 },
      team2: { name: '', score: 0, wickets: 0, overs: 0 },
      currentRunRate: 0,
      requiredRunRate: 0,
      target: 0,
      lastFiveOvers: '',
    });
  }, [tournament]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await tournamentAPI.updateLiveScores(tournament._id, liveScores);
      onUpdate();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update scores');
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    setLoading(true);
    try {
      await tournamentAPI.goLive(tournament._id);
      onUpdate();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to go live');
    } finally {
      setLoading(false);
    }
  };

  const updateScore = (team: 'team1' | 'team2', field: string, value: any) => {
    setLiveScores(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [field]: value
      }
    }));
  };

  const updateStats = (field: string, value: any) => {
    setLiveScores(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Live Scoreboard Update</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleGoLive}
            disabled={loading || tournament.isLive}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              tournament.isLive
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{tournament.isLive ? 'Live' : 'Go Live'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Scores'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team 1 */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-4">Team 1</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
              <input
                type="text"
                value={liveScores.team1.name}
                onChange={(e) => updateScore('team1', 'name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                placeholder="Enter team name"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Score</label>
                <input
                  type="number"
                  value={liveScores.team1.score}
                  onChange={(e) => updateScore('team1', 'score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Wickets</label>
                <input
                  type="number"
                  value={liveScores.team1.wickets}
                  onChange={(e) => updateScore('team1', 'wickets', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Overs</label>
                <input
                  type="number"
                  step="0.1"
                  value={liveScores.team1.overs}
                  onChange={(e) => updateScore('team1', 'overs', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team 2 */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-4">Team 2</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
              <input
                type="text"
                value={liveScores.team2.name}
                onChange={(e) => updateScore('team2', 'name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                placeholder="Enter team name"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Score</label>
                <input
                  type="number"
                  value={liveScores.team2.score}
                  onChange={(e) => updateScore('team2', 'score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Wickets</label>
                <input
                  type="number"
                  value={liveScores.team2.wickets}
                  onChange={(e) => updateScore('team2', 'wickets', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Overs</label>
                <input
                  type="number"
                  step="0.1"
                  value={liveScores.team2.overs}
                  onChange={(e) => updateScore('team2', 'overs', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="mt-6 bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">Match Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Current Run Rate</label>
            <input
              type="number"
              step="0.01"
              value={liveScores.currentRunRate}
              onChange={(e) => updateStats('currentRunRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Required Run Rate</label>
            <input
              type="number"
              step="0.01"
              value={liveScores.requiredRunRate}
              onChange={(e) => updateStats('requiredRunRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Target</label>
            <input
              type="number"
              value={liveScores.target}
              onChange={(e) => updateStats('target', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Last 5 Overs</label>
            <input
              type="text"
              value={liveScores.lastFiveOvers}
              onChange={(e) => updateStats('lastFiveOvers', e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
              placeholder="e.g., 1 4 6 W 2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
