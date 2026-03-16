import { useState, useEffect, useCallback } from 'react';
import { teamAPI } from '../services/api';
import { Plus, Trash2, Users, X, ChevronDown, ChevronUp, User } from 'lucide-react';

interface Props {
  tournamentId?: string;  // CHANGED: Optional to fix App.tsx route error
  onTeamsChange?: () => void;
}

export default function TeamManagement({ tournamentId = '', onTeamsChange }: Props) {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', shortName: '' });
  const [playerForm, setPlayerForm] = useState({ name: '', role: 'batsman' });
  const [addingPlayerTo, setAddingPlayerTo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTeams = useCallback(async () => {
    try {
      const res = await teamAPI.getTeams(tournamentId || undefined);
      setTeams(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name) return;
    setSaving(true); setError('');
    try {
      await teamAPI.createTeam({ ...teamForm, ...(tournamentId && { tournamentId }) });
      setTeamForm({ name: '', shortName: '' });
      setShowCreateTeam(false);
      await loadTeams();
      onTeamsChange?.();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create team');
    } finally { setSaving(false); }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Delete this team?')) return;
    try {
      await teamAPI.deleteTeam(id);
      setTeams(prev => prev.filter(t => t._id !== id));
      onTeamsChange?.();
    } catch (e) { console.error(e); }
  };

  const addPlayer = async (teamId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name) return;
    setSaving(true); setError('');
    try {
      // Create player and add to team
      const res = await teamAPI.addPlayer(teamId, playerForm);
      await loadTeams();
      setPlayerForm({ name: '', role: 'batsman' });
      setAddingPlayerTo(null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to add player');
    } finally { setSaving(false); }
  };

  const removePlayer = async (teamId: string, playerId: string) => {
    if (!confirm('Remove this player?')) return;
    try {
      await teamAPI.removePlayer(teamId, playerId);
      await loadTeams();
    } catch (e) { console.error(e); }
  };

  const roleColors: Record<string, string> = {
    batsman: 'bg-blue-500/20 text-blue-400',
    bowler: 'bg-red-500/20 text-red-400',
    'all-rounder': 'bg-purple-500/20 text-purple-400',
    'wicket-keeper': 'bg-amber-500/20 text-amber-400',
    'batsman-wicket-keeper': 'bg-teal-500/20 text-teal-400',
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Teams ({teams.length})</h2>
        <button onClick={() => setShowCreateTeam(!showCreateTeam)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      {error && <div className="p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm">{error}</div>}

      {/* Create team form */}
      {showCreateTeam && (
        <form onSubmit={createTeam} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
          <h3 className="text-white font-semibold">New Team</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Team Name *</label>
              <input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="e.g. Mumbai Indians" required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Short Name (up to 4)</label>
              <input value={teamForm.shortName} onChange={e => setTeamForm({ ...teamForm, shortName: e.target.value.toUpperCase().slice(0, 4) })}
                placeholder="MI" maxLength={4}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
              {saving ? 'Creating...' : 'Create Team'}
            </button>
            <button type="button" onClick={() => setShowCreateTeam(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-xl transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No teams yet</p>
          <button onClick={() => setShowCreateTeam(true)} className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold">+ Add First Team</button>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(team => (
            <div key={team._id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <button className="flex items-center gap-3 flex-1 text-left"
                  onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {team.shortName || team.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-bold">{team.name}</p>
                    <p className="text-slate-500 text-xs">{team.players?.length || 0} players</p>
                  </div>
                  {expandedTeam === team._id ? <ChevronUp className="w-4 h-4 text-slate-500 ml-auto" /> : <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />}
                </button>
                <div className="flex items-center gap-2 ml-3">
                  <button onClick={() => setAddingPlayerTo(addingPlayerTo === team._id ? null : team._id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 text-xs font-semibold transition-all">
                    <Plus className="w-3 h-3" /> Player
                  </button>
                  <button onClick={() => deleteTeam(team._id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add player form */}
              {addingPlayerTo === team._id && (
                <form onSubmit={e => addPlayer(team._id, e)}
                  className="px-4 pb-3 border-t border-slate-800 pt-3 flex gap-2 flex-wrap">
                  <input value={playerForm.name} onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })}
                    placeholder="Player name" required
                    className="flex-1 min-w-[140px] bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  <select value={playerForm.role} onChange={e => setPlayerForm({ ...playerForm, role: e.target.value })}
                    className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="all-rounder">All-Rounder</option>
                    <option value="wicket-keeper">Wicket Keeper</option>
                    <option value="batsman-wicket-keeper">Batsman WK</option>
                  </select>
                  <button type="submit" disabled={saving}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
                    Add
                  </button>
                  <button type="button" onClick={() => setAddingPlayerTo(null)}
                    className="px-3 py-2 bg-slate-700 text-slate-400 text-sm rounded-xl transition-all hover:bg-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Players list */}
              {expandedTeam === team._id && (
                <div className="border-t border-slate-800">
                  {!team.players?.length ? (
                    <p className="text-slate-600 text-sm px-4 py-3">No players added yet</p>
                  ) : (
                    <div className="divide-y divide-slate-800/50">
                      {team.players.map((player: any, i: number) => (
                        <div key={player._id || i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 group">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <User className="w-4 h-4 text-slate-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{player.name}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${roleColors[player.role] || 'bg-slate-700 text-slate-400'}`}>
                            {player.role?.replace('-', ' ')}
                          </span>
                          <button onClick={() => removePlayer(team._id, player._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

