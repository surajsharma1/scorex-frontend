import React, { useState, useEffect, useCallback } from 'react';
import { teamAPI } from '../services/api';
import { Plus, Trash2, Users, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  tournamentId?: string; 
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

  // Stable input handlers to prevent re-render flicker during typing
  const handleTeamNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamForm((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  const handleTeamShortNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamForm((prev) => ({ ...prev, shortName: e.target.value }));
  }, []);

  const handlePlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerForm((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  const handlePlayerRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayerForm((prev) => ({ ...prev, role: e.target.value }));
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      const res = await teamAPI.getTeams(tournamentId || undefined);
      setTeams(res.data.data || []);
    } catch (e) { 
      console.error(e); 
    }
    finally { 
      setLoading(false); 
    }
  }, [tournamentId]);

  useEffect(() => { 
    loadTeams(); 
  }, [loadTeams]);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.shortName) return;
    setSaving(true); 
    setError('');
    try {
      await teamAPI.createTeam({ ...teamForm, tournamentId });
      setTeamForm({ name: '', shortName: '' });
      setShowCreateTeam(false);
      loadTeams();
      if (onTeamsChange) onTeamsChange();
    } catch (e: any) { 
      setError(e.response?.data?.message || 'Failed to create team'); 
    }
    finally { 
      setSaving(false); 
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamAPI.deleteTeam(id);
      loadTeams();
      if (onTeamsChange) onTeamsChange();
    } catch (e) { 
      console.error(e); 
    }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingPlayerTo || !playerForm.name) return;
    setSaving(true);
    try {
      await teamAPI.addPlayer(addingPlayerTo, playerForm);
      setPlayerForm({ name: '', role: 'batsman' });
      setAddingPlayerTo(null);
      loadTeams();
    } catch (e) { 
      console.error(e); 
    }
    finally { 
      setSaving(false); 
    }
  };

  const removePlayer = async (teamId: string, playerId: string) => {
    if (!confirm('Remove this player?')) return;
    try {
      await teamAPI.removePlayer(teamId, playerId);
      loadTeams();
    } catch (e) { 
      console.error(e); 
    }
  };

  const roleColors: Record<string, string> = {
    'batsman': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    'bowler': 'bg-red-500/10 text-red-400 border border-red-500/20',
    'all-rounder': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'wicket-keeper': 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  };

  const InputFieldComponent = React.memo(({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
      inputMode="text"
      autoComplete="name"
      className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 focus-visible:border-[var(--accent)] transition-all border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
      {...props} 
    />
  ));

  InputFieldComponent.displayName = 'InputField';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Users className="w-6 h-6 text-green-400" /> Teams & Squads
        </h2>
        <button 
          onClick={() => setShowCreateTeam(!showCreateTeam)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      {showCreateTeam && (

        <div className="p-6 rounded-2xl mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

          <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Create New Team</h3>
          {error && <div className="mb-4 text-sm text-red-400 bg-red-900/20 p-3 rounded-xl border border-red-500/30">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <InputFieldComponent 
              placeholder="Team Name (e.g. Mumbai Indians)" 
              value={teamForm.name} 
              onChange={handleTeamNameChange} 
              required 
            />
            <InputFieldComponent 
              placeholder="Short Name (e.g. MI)" 
              value={teamForm.shortName} 
              onChange={handleTeamShortNameChange} 
              maxLength={4} 
              required 
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
              {saving ? 'Saving...' : 'Save Team'}
            </button>
            <button type="button" onClick={() => setShowCreateTeam(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-primary)' }} />
          <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>No Teams Added</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add teams to manage their squads for this tournament.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team._id} className="rounded-2xl overflow-hidden transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {/* Team Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" 
                onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center font-black text-green-400 border border-green-500/30">
                    {team.shortName}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{team.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.players?.length || 0} Players</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      deleteTeam(team._id); 
                    }} 
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedTeam === team._id ? (
                    <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
              </div>

              {/* Expanded Squad View */}
              {expandedTeam === team._id && (
                <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--border)' }}>
                  {/* Add Player Form */}
                  {addingPlayerTo === team._id ? (
                    <form onSubmit={addPlayer} className="flex gap-2 mb-4 p-3 rounded-xl mt-4" style={{ background: 'var(--bg-elevated)' }}>
                      <InputFieldComponent 
                        placeholder="Player Name" 
                        value={playerForm.name} 
                        onChange={handlePlayerNameChange} 
                        required 
                      />
                      <select 
                        value={playerForm.role} 
                        onChange={handlePlayerRoleChange}
                        className="px-4 py-2.5 rounded-xl text-sm focus:outline-none" 
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        <option value="batsman">Batsman</option>
                        <option value="bowler">Bowler</option>
                        <option value="all-rounder">All Rounder</option>
                        <option value="wicket-keeper">Wicket Keeper</option>
                      </select>
                      <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 text-black transition-all">
                        Add
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setAddingPlayerTo(null)} 
                        className="p-2.5 rounded-xl hover:bg-white/10" 
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <div className="mt-4 mb-3">
                      <button 
                        onClick={() => setAddingPlayerTo(team._id)} 
                        className="flex items-center gap-1.5 text-sm font-bold text-green-400 hover:text-green-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Player to Squad
                      </button>
                    </div>
                  )}

                  {/* Player List */}
                  {team.players?.length === 0 ? (
                    <p className="text-sm italic p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                      No players added to this squad yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {team.players.map((player: any, i: number) => (
                        <div 
                          key={player._id || i} 
                          className="flex items-center gap-3 p-3 rounded-xl group transition-colors hover:bg-white/5" 
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                              {player.name}
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${roleColors[player.role] || 'bg-gray-500/10 text-gray-400'}`}>
                              {player.role?.replace('-', ' ')}
                            </span>
                          </div>
                          <button 
                            onClick={() => removePlayer(team._id, player._id)} 
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                          >
                            <X className="w-4 h-4" />
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

