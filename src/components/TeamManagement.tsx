import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { teamAPI, tournamentAPI } from '../services/api';
import { Team, Tournament } from './types';

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    tournament: '',
    players: [''],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, tournamentsRes] = await Promise.all([
        teamAPI.getTeams(),
        tournamentAPI.getTournaments(),
      ]);
      setTeams(teamsRes.data);
      setTournaments(tournamentsRes.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch data');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await teamAPI.createTeam(formData);
      setShowCreateForm(false);
      setFormData({ name: '', tournament: '', players: [''] });
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    setFormData({ ...formData, players: [...formData.players, ''] });
  };

  const updatePlayer = (index: number, value: string) => {
    const newPlayers = [...formData.players];
    newPlayers[index] = value;
    setFormData({ ...formData, players: newPlayers });
  };

  const removePlayer = (index: number) => {
    const newPlayers = formData.players.filter((_, i) => i !== index);
    setFormData({ ...formData, players: newPlayers });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage teams for tournaments
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>Create Team</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Create New Team
          </h2>
          <form onSubmit={handleCreateTeam}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tournament
                </label>
                <select
                  value={formData.tournament}
                  onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament._id} value={tournament._id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Players
              </label>
              {formData.players.map((player, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => updatePlayer(index, e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  {formData.players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPlayer}
                className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Add Player
              </button>
            </div>
            <div className="mt-6 flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
            </div>
            <p className="text-gray-600 mb-4">Tournament: {team.tournament?.name || 'N/A'}</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Players: {team.players.length}</p>
              <ul className="list-disc list-inside">
                {team.players.slice(0, 3).map((player, index) => (
                  <li key={index}>{player}</li>
                ))}
                {team.players.length > 3 && <li>...and {team.players.length - 3} more</li>}
              </ul>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Edit Team
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Teams Yet</h3>
          <p className="text-gray-500 mb-6">Create your first team to get started.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Create Team
          </button>
        </div>
      )}
    </div>
  );
}