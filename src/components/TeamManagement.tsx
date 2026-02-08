import { useState, useEffect } from 'react';
import { Plus, Upload, Edit, Trash2, Loader2, User } from 'lucide-react';
import { teamAPI, tournamentAPI } from '../services/api';
import { Team, Tournament, Player } from './types';
import PlayerSearch from './PlayerSearch';

interface TeamManagementProps {
  selectedTournament?: Tournament | null;
}

export default function TeamManagement({ selectedTournament }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(selectedTournament?._id || '');
  const [formData, setFormData] = useState({
    name: '',
    color: '#16a34a',
    tournament: selectedTournament?._id || '',
  });
  const [playerForm, setPlayerForm] = useState({
    name: '',
    role: 'Batsman',
    jerseyNumber: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [playerImageFile, setPlayerImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedTournament, selectedTournamentId]);

  const fetchData = async () => {
    try {
      const tournamentFilter = selectedTournament ? selectedTournament._id : (selectedTournamentId && selectedTournamentId !== '' ? selectedTournamentId : undefined);
      const [teamsRes, tournamentsRes] = await Promise.all([
        teamAPI.getTeams(tournamentFilter),
        tournamentAPI.getTournaments(),
      ]);
      const teamsData = teamsRes.data?.teams || teamsRes.data || [];
      const tournamentsData = tournamentsRes.data?.tournaments || tournamentsRes.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch data');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('color', formData.color);
      formDataToSend.append('tournament', formData.tournament);
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      if (editingTeam) {
        await teamAPI.updateTeam(editingTeam._id, formDataToSend);
      } else {
        await teamAPI.createTeam(formDataToSend);
      }

      setShowCreateForm(false);
      setEditingTeam(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      color: team.color,
      tournament: team.tournament,
    });
    setShowCreateForm(true);
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await teamAPI.deleteTeam(id);
        fetchData();
        if (selectedTeam && selectedTeam._id === id) {
          setSelectedTeam(null);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete team');
      }
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setLoading(true);
    setError('');
    try {
      const playerData = new FormData();
      playerData.append('name', playerForm.name);
      playerData.append('role', playerForm.role);
      playerData.append('jerseyNumber', playerForm.jerseyNumber);
      if (playerImageFile) {
        playerData.append('image', playerImageFile);
      }

      await teamAPI.addPlayer(selectedTeam._id, playerData);
      setPlayerForm({ name: '', role: 'Batsman', jerseyNumber: '' });
      setPlayerImageFile(null);
      fetchData();
      setSelectedTeam(teams.find((team) => team._id === selectedTeam._id) || null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', color: '#16a34a', tournament: '' });
    setLogoFile(null);
  };

  return (
    <div className="space-y-8 bg-gray-900 text-white min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-blue-400">Teams & Players</h1>
          <p className="text-gray-300 mt-2">
            Manage teams and add players with images
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Team</span>
        </button>
      </div>

      {!selectedTournament && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Filter by Tournament</h2>
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-700 text-white"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingTeam ? 'Edit Team' : 'Create New Team'}
          </h2>

          <form onSubmit={handleCreateTeam}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mumbai Indians"
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Tournament
                </label>
                <select
                  value={formData.tournament}
                  onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-700 text-white"
                  required
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament._id} value={tournament._id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
                {tournaments.length === 0 && (
                  <p className="text-red-400 text-sm mt-1">No tournaments available. Please create a tournament first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Team Logo
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      {logoFile ? logoFile.name : 'Click to upload logo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Team Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-12 rounded-lg border border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingTeam ? 'Update Team' : 'Create Team')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTeam(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Teams</h2>
            <div className="space-y-4">
              {selectedTournament ? (
                // When viewing specific tournament, show flat list
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team._id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTeam && selectedTeam._id === team._id
                          ? 'bg-green-100 text-green-800'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedTeam(team)}
                        className="flex-1 text-left"
                      >
                        <p className="font-semibold text-white">{team.name}</p>
                        <p className="text-sm text-gray-400">{team.players?.length || 0} players</p>
                      </button>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="p-1 text-blue-400 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team._id)}
                          className="p-1 text-red-400 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // When viewing all teams, group by tournament
                tournaments.map((tournament) => {
                  const tournamentTeams = teams.filter(team => {
                    const teamTournamentId = typeof team.tournament === 'string' ? team.tournament : team.tournament?._id;
                    return teamTournamentId === tournament._id;
                  });
                  if (tournamentTeams.length === 0) return null;
                  return (
                    <div key={tournament._id} className="space-y-2">
                      <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-600 pb-2">
                        {tournament.name}
                      </h3>
                      {tournamentTeams.map((team) => (
                        <div
                          key={team._id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ml-4 ${
                            selectedTeam && selectedTeam._id === team._id
                              ? 'bg-green-100 text-green-800'
                              : 'hover:bg-gray-700'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedTeam(team)}
                            className="flex-1 text-left"
                          >
                            <p className="font-semibold text-white">{team.name}</p>
                            <p className="text-sm text-gray-400">{team.players?.length || 0} players</p>
                          </button>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditTeam(team)}
                              className="p-1 text-blue-400 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team._id)}
                              className="p-1 text-red-400 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {selectedTeam && (
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
                    <p className="text-blue-100 mt-1">T20 Squad</p>
                  </div>
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">
                    Squad Players ({selectedTeam.players?.length || 0})
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedTeam.players?.map((player) => (
                    <div
                      key={player._id}
                      className="flex items-center justify-between p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                          {player.image ? (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${player.image}`}
                              alt={player.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">
                            {player.name}
                          </h4>
                          <p className="text-sm text-gray-400">{player.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-gray-400">
                          #{player.jerseyNumber}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 space-y-6">
                  <div>
                    <h4 className="font-bold text-white mb-4">
                      Add Player by Username
                    </h4>
                    <PlayerSearch
                      onPlayerSelect={async (user) => {
                        try {
                          setLoading(true);
                          await teamAPI.addPlayerByUsername(selectedTeam._id, user._id);
                          fetchData();
                          setSelectedTeam(teams.find((team) => team._id === selectedTeam._id) || null);
                        } catch (error) {
                          console.error('Error adding player:', error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      placeholder="Search for players to add..."
                      className="mb-4"
                    />
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <h4 className="font-bold text-white mb-2">
                      Or Add Player with Image
                    </h4>
                    <form onSubmit={handleAddPlayer}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          value={playerForm.name}
                          onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                          placeholder="Player Name"
                          className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 text-white"
                          required
                        />
                        <input
                          type="text"
                          value={playerForm.jerseyNumber}
                          onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value })}
                          placeholder="Jersey Number"
                          className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 text-white"
                          required
                        />
                        <select
                          value={playerForm.role}
                          onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                          className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 text-white"
                        >
                          <option>Batsman</option>
                          <option>Bowler</option>
                          <option>All-rounder</option>
                          <option>Wicket Keeper</option>
                        </select>
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPlayerImageFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="player-image-upload"
                          />
                          <label
                            htmlFor="player-image-upload"
                            className="flex-1 bg-gray-600 text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-500 transition-colors cursor-pointer text-center"
                          >
                            {playerImageFile ? playerImageFile.name : 'Upload Photo'}
                          </label>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Add to Team'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}