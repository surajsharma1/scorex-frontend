import { useState, useEffect } from 'react';
import { Plus, Upload, Edit, Trash2, Loader2, User, Settings, Shield } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(selectedTournament?._id || '');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    color: '#16a34a',
    tournament: selectedTournament?._id || '',
  });
  
  // Player Form State
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    role: 'Batsman',
    jerseyNumber: '',
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      loadTeams(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  const loadTournaments = async () => {
    try {
      setError(null);
      const res = await tournamentAPI.getTournaments();
      // Handle the new response format { success, count, data }
      let list: Tournament[] = [];
      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (res.data?.tournaments && Array.isArray(res.data.tournaments)) {
        list = res.data.tournaments;
      }
      setTournaments(list);
      // Auto-select first if none selected
      if (!selectedTournamentId && list.length > 0) {
        setSelectedTournamentId(list[0]._id);
      }
    } catch (e: any) {
      console.error("Failed to load tournaments", e);
      setError(e.response?.data?.message || e.message || 'Failed to load tournaments');
      setTournaments([]);
    }
  };

  const loadTeams = async (tId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await teamAPI.getTeams(tId);
      // Handle different response formats
      let teamsList: Team[] = [];
      if (res.data?.teams) {
        teamsList = res.data.teams;
      } else if (Array.isArray(res.data)) {
        teamsList = res.data;
      }
      setTeams(teamsList);
      setSelectedTeam(null); // Reset selection on tournament change
    } catch (e: any) {
      console.error("Failed to load teams", e);
      setError(e.response?.data?.message || e.message || 'Failed to load teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !selectedTournamentId) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = { ...formData, tournament: selectedTournamentId };
      const res = await teamAPI.createTeam(payload);
      // Handle different response formats
      const newTeam = res.data?.team || res.data;
      setTeams([...teams, newTeam]);
      setShowCreateForm(false);
      setFormData({ name: '', shortName: '', color: '#16a34a', tournament: selectedTournamentId });
    } catch (e: any) {
      console.error("Failed to create team", e);
      setError(e.response?.data?.message || e.message || 'Failed to create team');
      alert("Failed to create team: " + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    // Validation: Check duplicate (selectedTeam.play Jersey
    ifers?.some(p => p.jerseyNumber === playerForm.jerseyNumber)) {
        alert("Jersey number already exists in this team!");
        return;
    }

    try {
      const res = await teamAPI.addPlayer(selectedTeam._id, playerForm);
      // Update local state
      const updatedTeam = res.data?.team || res.data;
      setTeams(teams.map(t => t._id === updatedTeam._id ? updatedTeam : t));
      setSelectedTeam(updatedTeam);
      setShowPlayerForm(false);
      setPlayerForm({ name: '', role: 'Batsman', jerseyNumber: '' });
    } catch (e: any) {
      console.error("Failed to add player", e);
      alert("Failed to add player: " + (e.response?.data?.message || e.message));
    }
  };

  const deleteTeam = async (id: string) => {
      if(!confirm("Delete this team?")) return;
      try {
          await teamAPI.deleteTeam(id);
          setTeams(teams.filter(t => t._id !== id));
          if(selectedTeam?._id === id) setSelectedTeam(null);
      } catch(e: any) {
          alert("Failed to delete team: " + (e.response?.data?.message || e.message));
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Error Message */}
      {error && (
        <div className="col-span-full mb-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 font-medium">Error</p>
            <p className="text-red-500 dark:text-red-500 text-sm mt-1">{error}</p>
            <button
              onClick={() => loadTournaments()}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Sidebar: Team List */}
      <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold mb-2 dark:text-white">Select Tournament</h3>
            <select 
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="w-full p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                <option value="">-- Select --</option>
                {tournaments.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                ))}
            </select>
            
            <button 
                onClick={() => setShowCreateForm(true)}
                disabled={!selectedTournamentId}
                className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <Plus className="w-4 h-4" /> New Team
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {loading ? <div className="text-center p-4 dark:text-white">Loading...</div> : (
                <div className="space-y-2">
                    {teams.map(team => (
                        <div 
                            key={team._id}
                            onClick={() => setSelectedTeam(team)}
                            className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                                selectedTeam?._id === team._id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{backgroundColor: team.color || '#666'}}>
                                    {(team.shortName || team.name?.substring(0,2) || 'TM').toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm dark:text-white">{team.name}</p>
                                    <p className="text-xs text-gray-500">{team.players?.length || 0} Players</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {teams.length === 0 && selectedTournamentId && <p className="text-center text-gray-400 mt-10">No teams found</p>}
                    {!selectedTournamentId && <p className="text-center text-gray-400 mt-10">Select a tournament</p>}
                </div>
            )}
        </div>
      </div>

      {/* Main Content: Team Details */}
      <div className="md:col-span-2">
          {selectedTeam ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg" style={{backgroundColor: selectedTeam.color || '#666'}}>
                              {(selectedTeam.shortName || selectedTeam.name?.substring(0,2) || 'TM').toUpperCase()}
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold dark:text-white">{selectedTeam.name}</h2>
                              <p className="text-gray-500">Squad Size: {selectedTeam.players?.length || 0}</p>
                          </div>
                      </div>
                      <button onClick={() => deleteTeam(selectedTeam._id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                          <Trash2 className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg dark:text-white">Squad List</h3>
                          <button 
                            onClick={() => setShowPlayerForm(true)}
                            className="text-sm bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-1"
                          >
                              <Plus className="w-4 h-4" /> Add Player
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedTeam.players?.map((player, idx) => (
                              <div key={idx} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 mr-3">
                                      {player.jerseyNumber || '#'}
                                  </div>
                                  <div className="flex-1">
                                      <p className="font-semibold dark:text-white">{player.name}</p>
                                      <p className="text-xs text-gray-500 uppercase">{player.role}</p>
                                  </div>
                              </div>
                          ))}
                          {(!selectedTeam.players || selectedTeam.players.length === 0) && (
                            <p className="col-span-full text-center text-gray-400 py-4">No players in squad</p>
                          )}
                      </div>
                  </div>
              </div>
          ) : (
              <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-10">
                  <Shield className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Select a team to manage squad</p>
              </div>
          )}
      </div>

      {/* CREATE TEAM MODAL */}
      {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Create New Team</h3>
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                      <input 
                        placeholder="Team Name" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required 
                      />
                      <input 
                        placeholder="Short Name (e.g. CSK)" 
                        value={formData.shortName}
                        onChange={e => setFormData({...formData, shortName: e.target.value.toUpperCase()})}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        maxLength={4}
                      />
                      <div className="flex items-center gap-2">
                          <input 
                             type="color" 
                             value={formData.color}
                             onChange={e => setFormData({...formData, color: e.target.value})}
                             className="h-10 w-10 border-0 p-0 rounded cursor-pointer"
                          />
                          <span className="text-sm text-gray-500">Team Color</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                          <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 py-2 bg-gray-200 rounded dark:bg-gray-700 dark:text-white">Cancel</button>
                          <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded font-bold">Create</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* ADD PLAYER MODAL */}
      {showPlayerForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Add Player</h3>
                  <form onSubmit={handleAddPlayer} className="space-y-4">
                      <input 
                        placeholder="Full Name" 
                        value={playerForm.name}
                        onChange={e => setPlayerForm({...playerForm, name: e.target.value})}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required 
                      />
                      <select 
                        value={playerForm.role}
                        onChange={e => setPlayerForm({...playerForm, role: e.target.value})}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="All-rounder">All-rounder</option>
                          <option value="Wicket Keeper">Wicket Keeper</option>
                      </select>
                      <input 
                        type="number"
                        placeholder="Jersey Number" 
                        value={playerForm.jerseyNumber}
                        onChange={e => setPlayerForm({...playerForm, jerseyNumber: e.target.value})}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required 
                      />
                      <div className="flex gap-2 mt-4">
                          <button type="button" onClick={() => setShowPlayerForm(false)} className="flex-1 py-2 bg-gray-200 rounded dark:bg-gray-700 dark:text-white">Cancel</button>
                          <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded font-bold">Add Player</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
