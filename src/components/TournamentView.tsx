import { useState, useEffect } from 'react';
import { Plus, Calendar, Users, Trophy, Edit, Trash2, Play, Square, TrendingUp } from 'lucide-react';
import { tournamentAPI } from '../services/api';
import { Tournament } from './types';

export default function TournamentView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [selectedLiveTournament, setSelectedLiveTournament] = useState<Tournament | null>(null);
  const [showLiveScoreForm, setShowLiveScoreForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'T20',
    startDate: '',
    numberOfTeams: 8,
  });
  const [liveScoreData, setLiveScoreData] = useState({
    team1: { name: '', score: 0, wickets: 0, overs: 0 },
    team2: { name: '', score: 0, wickets: 0, overs: 0 },
    currentRunRate: 0,
    requiredRunRate: 0,
    target: 0,
    lastFiveOvers: '',
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await tournamentAPI.getTournaments();
      setTournaments(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch tournaments');
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingTournament) {
        await tournamentAPI.updateTournament(editingTournament._id, formData);
      } else {
        await tournamentAPI.createTournament(formData);
      }
      setShowCreateForm(false);
      setEditingTournament(null);
      resetForm();
      fetchTournaments();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      format: tournament.format,
      startDate: tournament.startDate.split('T')[0],
      numberOfTeams: tournament.numberOfTeams,
    });
    setShowCreateForm(true);
  };

  const handleDeleteTournament = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      try {
        await tournamentAPI.deleteTournament(id);
        fetchTournaments();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete tournament');
      }
    }
  };

  const handleGoLive = async (tournament: Tournament) => {
    try {
      await tournamentAPI.goLive(tournament._id);
      fetchTournaments();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update live status');
    }
  };

  const handleUpdateLiveScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiveTournament) return;

    setLoading(true);
    try {
      await tournamentAPI.updateLiveScores(selectedLiveTournament._id, liveScoreData);
      fetchTournaments();
      setShowLiveScoreForm(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update scores');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      format: 'T20',
      startDate: '',
      numberOfTeams: 8,
    });
  };

  const cancelEdit = () => {
    setShowCreateForm(false);
    setEditingTournament(null);
    resetForm();
  };

  const openLiveScoreForm = (tournament: Tournament) => {
    setSelectedLiveTournament(tournament);
    setLiveScoreData(tournament.liveScores || {
      team1: { name: '', score: 0, wickets: 0, overs: 0 },
      team2: { name: '', score: 0, wickets: 0, overs: 0 },
      currentRunRate: 0,
      requiredRunRate: 0,
      target: 0,
      lastFiveOvers: '',
    });
    setShowLiveScoreForm(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Tournaments</h1>
          <p className="text-gray-600 mt-2">Create and manage cricket tournaments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>New Tournament</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
          </h2>

          <form onSubmit={handleCreateTournament}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tournament Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option>T20</option>
                  <option>T10</option>
                  <option>ODI (50 Overs)</option>
                  <option>Test Match</option>
                  <option>The Hundred</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Teams
                </label>
                <input
                  type="number"
                  value={formData.numberOfTeams}
                  onChange={(e) => setFormData({ ...formData, numberOfTeams: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="2"
                  max="32"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tournament Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe your tournament..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingTournament ? 'Update Tournament' : 'Create Tournament')}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showLiveScoreForm && selectedLiveTournament && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Update Live Scores - {selectedLiveTournament.name}
          </h2>

          <form onSubmit={handleUpdateLiveScores}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team 1</h3>
                <div className="space-y-4">
                  // ... (previous code up to the live score form)

                  <input
                    type="text"
                    placeholder="Team Name"
                    value={liveScoreData.team1.name}
                    onChange={(e) => setLiveScoreData({
                      ...liveScoreData,
                      team1: { ...liveScoreData.team1, name: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Score"
                    value={liveScoreData.team1.score}
                    onChange={(e) => setLiveScoreData({
                      ...liveScoreData,
                      team1: { ...liveScoreData.team1, score: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Wickets"
                    value={liveScoreData.team1.wickets}
                    onChange={(e) => setLiveScoreData({
                      ...liveScoreData,
                      team1: { ...liveScoreData.team1, wickets: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Overs"
                    value={liveScoreData.team1.overs}
                    onChange={(e) => setLiveScoreData({
                      ...liveScoreData,
                      team1: { ...liveScoreData.team1, overs: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team 2</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={liveScoreData.team2.name}
                    onChange={(e) => setLiveScoreData({
                      ...liveScoreData,
                      team2: { ...liveScoreData.team2, name: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Score"
                    value={liveScoreData.team2.score}
                    onChange={(e) => setLiveScoreData({
                      ...liveScoreData,
                      team2: { ...liveScoreData.team2, score: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Wickets"
                    value={liveScoreData.team2.wickets}
                    onChange={(e) => setLiveScoreData({
                      ...liveScoreData,
                      team2: { ...liveScoreData.team2, wickets: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Overs"
                    value={liveScoreData.team2.overs}
                    onChange={(e) => setLiveScoreData({
                      ...liveScoreData,
                      team2: { ...liveScoreData.team2, overs: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Current Run Rate"
                  value={liveScoreData.currentRunRate}
                  onChange={(e) => setLiveScoreData({
                    ...liveScoreData,
                    currentRunRate: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Required Run Rate"
                  value={liveScoreData.requiredRunRate}
                  onChange={(e) => setLiveScoreData({
                    ...liveScoreData,
                    requiredRunRate: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Target"
                  value={liveScoreData.target}
                  onChange={(e) => setLiveScoreData({
                    ...liveScoreData,
                    target: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  placeholder="Last 5 Overs (e.g., 4/0, 6/1, 2/0, 1/0, 3/0)"
                  value={liveScoreData.lastFiveOvers}
                  onChange={(e) => setLiveScoreData({
                    ...liveScoreData,
                    lastFiveOvers: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Live Scores'}
              </button>
              <button
                type="button"
                onClick={() => setShowLiveScoreForm(false)}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <div
            key={tournament._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-32 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center relative">
              {tournament.isLive && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  LIVE
                </div>
              )}
              <Trophy className="w-16 h-16 text-white opacity-80" />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tournament.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : tournament.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tournament.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>{tournament.format} Format</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{tournament.numberOfTeams} Teams</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Starting {new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
              </div>
              {tournament.isLive && tournament.liveScores && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Live Scores</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-medium">{tournament.liveScores.team1.name || 'Team 1'}</p>
                      <p>{tournament.liveScores.team1.score}/{tournament.liveScores.team1.wickets} ({tournament.liveScores.team1.overs} ov)</p>
                    </div>
                    <div>
                      <p className="font-medium">{tournament.liveScores.team2.name || 'Team 2'}</p>
                      <p>{tournament.liveScores.team2.score}/{tournament.liveScores.team2.wickets} ({tournament.liveScores.team2.overs} ov)</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>Target: {tournament.liveScores.target}</p>
                    <p>CRR: {tournament.liveScores.currentRunRate} | RRR: {tournament.liveScores.requiredRunRate}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 p-6 pt-0">
              <button
                onClick={() => handleGoLive(tournament)}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  tournament.isLive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {tournament.isLive ? (
                  <>
                    <Square className="w-4 h-4 inline mr-1" />
                    End Live
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 inline mr-1" />
                    Go Live
                  </>
                )}
              </button>

              {tournament.isLive && (
                <button
                  onClick={() => openLiveScoreForm(tournament)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Update Scores
                </button>
              )}

              <button
                onClick={() => handleEditTournament(tournament)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                <Edit className="w-4 h-4 inline mr-1" />
                Edit
              </button>

              <button
                onClick={() => handleDeleteTournament(tournament._id)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}