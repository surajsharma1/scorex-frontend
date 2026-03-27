import React, { useState, useEffect, useCallback } from 'react';
import { teamAPI } from '../services/api';
import { Plus, Trash2, Users, X, Edit3, Save, Search, UserPlus } from 'lucide-react';
import PlayerSearch from './PlayerSearch';
import { useToast } from '../hooks/useToast';

interface Props {
  tournamentId?: string; 
  onTeamsChange?: () => void;
}

export default function TeamManagement({ tournamentId = '', onTeamsChange }: Props) {
  const { addToast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [addingPlayerTo, setAddingPlayerTo] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  
  // Forms
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShort, setNewTeamShort] = useState('');
  const [editTeamData, setEditTeamData] = useState({ name: '', shortName: '' });
  const [newPlayerForm, setNewPlayerForm] = useState({ name: '', role: 'batsman', jerseyNumber: '' });

  const loadTeams = useCallback(async () => {
    try {
      const res = await teamAPI.getTeams(tournamentId || undefined);
      setTeams(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamShort) return addToast({ type: 'error', message: 'Name and Short Name required' });
    try {
      await teamAPI.createTeam({ name: newTeamName, shortName: newTeamShort, tournamentId });
      addToast({ type: 'success', message: 'Team created' });
      setNewTeamName(''); setNewTeamShort('');
      loadTeams();
      if(onTeamsChange) onTeamsChange();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Creation failed' });
    }
  };

  const handleEditTeamSave = async (teamId: string) => {
    try {
      await teamAPI.updateTeam(teamId, editTeamData);
      addToast({ type: 'success', message: 'Team updated' });
      setEditingTeam(null);
      loadTeams();
    } catch (err) { addToast({ type: 'error', message: 'Update failed' }); }
  };

  const handleAddPlayer = async (teamId: string, playerUser?: any) => {
    try {
      const payload = playerUser 
        ? { playerId: playerUser._id } 
        : { name: newPlayerForm.name, role: newPlayerForm.role, jerseyNumber: newPlayerForm.jerseyNumber };
      
      await teamAPI.addPlayer(teamId, payload);
      addToast({ type: 'success', message: 'Player added' });
      setAddingPlayerTo(null);
      setNewPlayerForm({ name: '', role: 'batsman', jerseyNumber: '' });
      loadTeams();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to add player' });
    }
  };

  const handleRemovePlayer = async (teamId: string, playerId: string) => {
    if (!confirm('Remove this player from the team?')) return;
    try {
      await teamAPI.removePlayer(teamId, playerId);
      addToast({ type: 'success', message: 'Player removed' });
      loadTeams();
    } catch (err) { addToast({ type: 'error', message: 'Failed to remove' }); }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Delete this entire team?')) return;
    try {
      await teamAPI.deleteTeam(teamId);
      addToast({ type: 'success', message: 'Team deleted' });
      loadTeams();
      if(onTeamsChange) onTeamsChange();
    } catch (err) { addToast({ type: 'error', message: 'Delete failed' }); }
  };

  if (loading) return <div className="py-12 text-center text-[var(--text-muted)] animate-pulse">Loading squads...</div>;

  return (
    <div className="space-y-8">
      {/* Create Team Form */}
      <div className="p-6 bg-[var(--bg-card)] rounded-3xl border border-[var(--border)]">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]"><Users className="text-green-500 w-5 h-5"/> Register New Team</h3>
        <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Team Name</label>
            <input type="text" value={newTeamName} onChange={e=>setNewTeamName(e.target.value)} placeholder="e.g. Royal Challengers" className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Short Name</label>
            <input type="text" value={newTeamShort} onChange={e=>setNewTeamShort(e.target.value.toUpperCase())} maxLength={4} placeholder="e.g. RCB" className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500 text-center uppercase font-bold" />
          </div>
          <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-green-500/20">
            Create Team
          </button>
        </form>
      </div>

      {/* Teams List */}
      <div className="grid grid-cols-1 gap-6">
        {teams.map(team => (
          <div key={team._id} className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden transition-all shadow-sm hover:shadow-green-500/5">
            {/* Team Header */}
            <div className="p-4 sm:p-6 bg-[var(--bg-elevated)] border-b border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}>
              {editingTeam === team._id ? (
                <div className="flex items-center gap-2 w-full sm:w-auto" onClick={e => e.stopPropagation()}>
                  <input type="text" value={editTeamData.name} onChange={e=>setEditTeamData({...editTeamData, name: e.target.value})} className="p-2 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] outline-none" />
                  <input type="text" value={editTeamData.shortName} onChange={e=>setEditTeamData({...editTeamData, shortName: e.target.value})} className="w-20 p-2 rounded bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] outline-none uppercase font-bold" />
                  <button onClick={() => handleEditTeamSave(team._id)} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"><Save className="w-4 h-4"/></button>
                  <button onClick={() => setEditingTeam(null)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center font-black text-xl text-white shadow-inner">
                    {team.shortName}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{team.name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{team.players?.length || 0} Players listed</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {editingTeam !== team._id && (
                  <button onClick={(e) => { e.stopPropagation(); setEditTeamData({name: team.name, shortName: team.shortName}); setEditingTeam(team._id); }} className="p-2 rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-blue-400 border border-[var(--border)] transition-colors"><Edit3 className="w-4 h-4" /></button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team._id); }} className="p-2 rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-red-400 border border-[var(--border)] transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Players List (Expanded) */}
            {expandedTeam === team._id && (
              <div className="p-4 sm:p-6 bg-[var(--bg-primary)]/50">
                {/* Roster Array */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {team.players?.map((p: any) => (
                    <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                          {p.jerseyNumber || '--'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--text-primary)] truncate max-w-[150px]">{p.name}</p>
                          <p className="text-[10px] uppercase tracking-wider text-green-400 font-semibold">{p.role}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemovePlayer(team._id, p._id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/20 rounded transition-all"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {(!team.players || team.players.length === 0) && <div className="col-span-full text-center text-sm py-4 text-[var(--text-muted)]">No players added to this squad yet.</div>}
                </div>

                {/* Add Player Controls */}
                <div className="border-t border-[var(--border)] pt-6 mt-4">
                  {addingPlayerTo === team._id ? (
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">Add Player</h4>
                        <button onClick={() => setAddingPlayerTo(null)} className="text-[var(--text-muted)] hover:text-white"><X className="w-5 h-5"/></button>
                      </div>
                      
                      {/* Search By User Option */}
                      <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)]">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Search Registered User (Friends/Global)</label>
                        <PlayerSearch onSelect={(user) => handleAddPlayer(team._id, user)} placeholder="Search by username or email..." excludeIds={team.players?.map((p:any)=>p._id)} />
                      </div>

                      <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-[var(--border)]"></div>
                        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">OR CUSTOM PLAYER</span>
                        <div className="flex-1 h-px bg-[var(--border)]"></div>
                      </div>

                      {/* Manual Custom Player */}
                      <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] flex flex-col sm:flex-row gap-3">
                        <input type="text" placeholder="Full Name" value={newPlayerForm.name} onChange={e=>setNewPlayerForm({...newPlayerForm, name: e.target.value})} className="flex-1 p-2.5 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-white text-sm outline-none" />
                        <select value={newPlayerForm.role} onChange={e=>setNewPlayerForm({...newPlayerForm, role: e.target.value})} className="p-2.5 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-white text-sm outline-none">
                          <option value="batsman">Batsman</option>
                          <option value="bowler">Bowler</option>
                          <option value="all-rounder">All-Rounder</option>
                          <option value="wicket-keeper">Wicket Keeper</option>
                        </select>
                        <input type="text" placeholder="Jersey #" value={newPlayerForm.jerseyNumber} onChange={e=>setNewPlayerForm({...newPlayerForm, jerseyNumber: e.target.value})} className="w-20 p-2.5 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-white text-sm outline-none text-center" />
                        <button onClick={() => handleAddPlayer(team._id)} disabled={!newPlayerForm.name} className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-black font-bold rounded disabled:opacity-50 transition-colors">Add</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingPlayerTo(team._id)} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl font-bold text-sm transition-colors shadow-sm">
                      <UserPlus className="w-4 h-4 text-green-500" /> Add New Player
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}