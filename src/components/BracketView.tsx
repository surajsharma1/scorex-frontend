import { useState, useEffect } from 'react';
import { Trophy, Save, Plus, X, Edit3, Trash2, Users, Layout, MessageSquare, CheckCircle2 } from 'lucide-react';
import { bracketAPI, teamAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import type { Team } from './types';

interface MatchNode {
  id: string;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  isBye: boolean;
  label?: string;
}

interface Round {
  id: string;
  title: string;
  matches: MatchNode[];
}

interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export default function BracketView({ tournamentId }: { tournamentId?: string }) {
  const { addToast } = useToast();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'groups' | 'knockout'>('knockout');

  const [editingMatch, setEditingMatch] = useState<{ roundId: string, matchId: string } | null>(null);

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }
    
    const init = async () => {
      try {
        const tRes = await teamAPI.getTeams(tournamentId);
        setTeams(tRes.data?.data || tRes.data?.teams || []);
        
        try {
          const bRes = await bracketAPI.getBracket(tournamentId);
          if (bRes.data?.rounds) setRounds(bRes.data.rounds);
          if (bRes.data?.groups) setGroups(bRes.data.groups);
        } catch (e) {
          setRounds([{ id: 'r1', title: 'Quarter Finals', matches: [] }]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tournamentId]);

  const saveConfiguration = async () => {
    if (!tournamentId) return;
    setSaving(true);
    try {
      await bracketAPI.updateBracket(tournamentId, { rounds, groups });
      addToast({ type: 'success', message: 'Tournament structure saved!' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  // ─── GROUP MANAGEMENT ────────────────────────────────────────────────────────
  const addGroup = () => {
    setGroups([...groups, { id: Date.now().toString(), name: `Group ${String.fromCharCode(65 + groups.length)}`, teams: [] }]);
  };

  const deleteGroup = (groupId: string) => {
    if (confirm('Delete this group?')) setGroups(groups.filter(g => g.id !== groupId));
  };

  const updateGroupName = (groupId: string, name: string) => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, name } : g));
  };

  const addTeamToGroup = (groupId: string, teamId: string) => {
    if (!teamId) return;
    const team = teams.find(t => t._id === teamId);
    if (!team) return;
    
    setGroups(groups.map(g => {
      if (g.id === groupId && !g.teams.find(t => t._id === teamId)) {
        return { ...g, teams: [...g.teams, team] };
      }
      return g;
    }));
  };

  const removeTeamFromGroup = (groupId: string, teamId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) return { ...g, teams: g.teams.filter(t => t._id !== teamId) };
      return g;
    }));
  };

  // ─── KNOCKOUT MANAGEMENT ─────────────────────────────────────────────────────
  const addRound = () => {
    setRounds([...rounds, { id: Date.now().toString(), title: `Round ${rounds.length + 1}`, matches: [] }]);
  };

  const deleteRound = (roundId: string) => {
    if (confirm('Delete this entire round and its matches?')) setRounds(rounds.filter(r => r.id !== roundId));
  };

  const updateRoundTitle = (roundId: string, title: string) => {
    setRounds(rounds.map(r => r.id === roundId ? { ...r, title } : r));
  };

  const addMatchToRound = (roundId: string) => {
    const newMatch: MatchNode = {
      id: Date.now().toString(), team1: null, team2: null, winner: null, isBye: false
    };
    setRounds(rounds.map(r => r.id === roundId ? { ...r, matches: [...r.matches, newMatch] } : r));
  };

  const deleteMatch = (roundId: string, matchId: string) => {
    setRounds(rounds.map(r => r.id === roundId ? { ...r, matches: r.matches.filter(m => m.id !== matchId) } : r));
  };

  const updateMatchNode = (roundId: string, matchId: string, updates: Partial<MatchNode>) => {
    setRounds(rounds.map(r => {
      if (r.id === roundId) {
        return {
          ...r,
          matches: r.matches.map(m => m.id === matchId ? { ...m, ...updates } : m)
        };
      }
      return r;
    }));
  };

  if (loading) return <div className="py-20 text-center text-green-500 animate-pulse font-bold">Loading Builder...</div>;

  return (
    <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden flex flex-col min-h-[70vh]">
      
      {/* ── Header & Toolbar ── */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
          <button 
            onClick={() => setViewMode('knockout')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'knockout' ? 'bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-[var(--text-muted)] hover:text-white'}`}>
            <Layout className="w-4 h-4" /> Knockouts
          </button>
          <button 
            onClick={() => setViewMode('groups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'groups' ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-[var(--text-muted)] hover:text-white'}`}>
            <Users className="w-4 h-4" /> Groups
          </button>
        </div>
        
        <button 
          onClick={saveConfiguration} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Structure'}
        </button>
      </div>

      {/* ── Work Area ── */}
      <div className="p-6 flex-1 overflow-auto custom-scrollbar bg-[var(--bg-primary)]">
        
        {/* GROUP STAGE VIEW */}
        {viewMode === 'groups' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Group Stage Configuration</h3>
              <button onClick={addGroup} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-blue-400 font-bold hover:bg-blue-500/10 transition-colors">
                <Plus className="w-4 h-4" /> Add Group
              </button>
            </div>
            
            {groups.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">No groups created yet. Click "Add Group" to start.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(g => (
                  <div key={g.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm relative group">
                    <button onClick={() => deleteGroup(g.id)} className="absolute top-4 right-4 p-2 text-red-500/50 hover:text-red-500 bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <input 
                      value={g.name} 
                      onChange={(e) => updateGroupName(g.id, e.target.value)}
                      className="bg-transparent text-lg font-black text-blue-400 outline-none border-b border-transparent focus:border-blue-500/50 w-3/4 mb-4"
                    />

                    <div className="space-y-2 mb-4">
                      {g.teams.map(t => (
                        <div key={t._id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{t.name}</span>
                          <button onClick={() => removeTeamFromGroup(g.id, t._id)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {g.teams.length === 0 && <div className="text-xs text-[var(--text-muted)] italic">No teams in this group</div>}
                    </div>

                    <select 
                      onChange={(e) => { addTeamToGroup(g.id, e.target.value); e.target.value = ''; }}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-blue-500">
                      <option value="">+ Add Team</option>
                      {teams.filter(t => !g.teams.find(gt => gt._id === t._id)).map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KNOCKOUT BRACKET VIEW */}
        {viewMode === 'knockout' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Knockout Bracket Builder</h3>
              <button onClick={addRound} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-green-400 font-bold hover:bg-green-500/10 transition-colors">
                <Plus className="w-4 h-4" /> Add Round
              </button>
            </div>

            <div className="flex gap-8 overflow-x-auto pb-8 hide-scrollbar snap-x">
              {rounds.length === 0 ? (
                <div className="w-full text-center py-12 text-[var(--text-muted)]">No rounds added. Start building your bracket!</div>
              ) : (
                rounds.map((round, rIndex) => (
                  <div key={round.id} className="min-w-[320px] shrink-0 snap-start flex flex-col gap-4">
                    
                    {/* Round Header */}
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-2xl flex items-center justify-between group">
                      <input 
                        value={round.title} 
                        onChange={(e) => updateRoundTitle(round.id, e.target.value)}
                        className="bg-transparent font-black text-[var(--text-primary)] outline-none w-2/3"
                      />
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => addMatchToRound(round.id)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/20" title="Add Match">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteRound(round.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20" title="Delete Round">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Round Matches */}
                    {round.matches.map((m, mIndex) => {
                      const t1Won = m.winner?._id === m.team1?._id && m.team1;
                      const t2Won = m.winner?._id === m.team2?._id && m.team2;

                      return (
                        <div key={m.id} className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm group">
                          
                          {/* Match Controls */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => setEditingMatch({ roundId: round.id, matchId: m.id })} className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white" title="Settings">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteMatch(round.id, m.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" title="Remove Match">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Custom Label */}
                          {m.label && (
                            <div className="mb-3 flex items-center gap-2">
                              <MessageSquare className="w-3 h-3 text-amber-500" />
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{m.label}</span>
                            </div>
                          )}

                          <div className="space-y-2 relative">
                            {/* Team 1 Selector */}
                            <div className={`relative p-2 rounded-xl border overflow-hidden transition-all ${t1Won ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'border-[var(--border)] bg-[var(--bg-elevated)]'}`}>
                              {t1Won && <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-green-500/20 to-transparent pointer-events-none flex items-center justify-end pr-2"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>}
                              <select 
                                value={m.team1?._id || ''} 
                                onChange={(e) => updateMatchNode(round.id, m.id, { team1: teams.find(t => t._id === e.target.value) || null, winner: null })}
                                className="w-full bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none relative z-10 appearance-none">
                                <option value="">TBD / Slot 1</option>
                                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                              </select>
                            </div>
                            
                            {/* Team 2 Selector */}
                            {!m.isBye && (
                              <div className={`relative p-2 rounded-xl border overflow-hidden transition-all ${t2Won ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'border-[var(--border)] bg-[var(--bg-elevated)]'}`}>
                                {t2Won && <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-green-500/20 to-transparent pointer-events-none flex items-center justify-end pr-2"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>}
                                <select 
                                  value={m.team2?._id || ''} 
                                  onChange={(e) => updateMatchNode(round.id, m.id, { team2: teams.find(t => t._id === e.target.value) || null, winner: null })}
                                  className="w-full bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none relative z-10 appearance-none">
                                  <option value="">TBD / Slot 2</option>
                                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Match Editing Modal/Overlay */}
                          {editingMatch?.matchId === m.id && (
                            <div className="absolute inset-0 z-20 bg-[var(--bg-card)]/95 backdrop-blur-md p-4 rounded-2xl flex flex-col justify-center border border-green-500/40 shadow-2xl">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Match Settings</h4>
                                <button onClick={() => setEditingMatch(null)} className="p-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]"><X className="w-4 h-4 text-[var(--text-muted)]"/></button>
                              </div>
                              
                              <input 
                                type="text" 
                                placeholder="Custom Label (e.g. Elimination)" 
                                value={m.label || ''}
                                onChange={(e) => updateMatchNode(round.id, m.id, { label: e.target.value })}
                                className="w-full p-2.5 text-sm font-bold bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl mb-3 outline-none focus:border-green-500 text-[var(--text-primary)]"
                              />
                              
                              <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-4 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={m.isBye} 
                                  onChange={(e) => updateMatchNode(round.id, m.id, { isBye: e.target.checked, team2: null, winner: e.target.checked ? m.team1 : null })}
                                  className="w-4 h-4 accent-green-500"
                                /> 
                                Mark as Bye (Auto-Advance)
                              </label>

                              {/* Restored Original Set Winner Buttons */}
                              {!m.isBye && (
                                <div className="mt-auto pt-3 border-t border-[var(--border)]">
                                  <label className="block text-[10px] font-black text-[var(--text-secondary)] mb-2 uppercase tracking-widest">Set Winner</label>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => updateMatchNode(round.id, m.id, { winner: m.team1 })} 
                                      disabled={!m.team1} 
                                      className={`flex-1 py-2.5 rounded-xl text-sm font-black border transition-all ${m.winner?._id === m.team1?._id ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'} disabled:opacity-40`}
                                    >
                                      Team 1
                                    </button>
                                    <button 
                                      onClick={() => updateMatchNode(round.id, m.id, { winner: m.team2 })} 
                                      disabled={!m.team2} 
                                      className={`flex-1 py-2.5 rounded-xl text-sm font-black border transition-all ${m.winner?._id === m.team2?._id ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'} disabled:opacity-40`}
                                    >
                                      Team 2
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                        </div>
                      );
                    })}
                    
                    {round.matches.length === 0 && (
                      <button onClick={() => addMatchToRound(round.id)} className="w-full p-4 border border-dashed border-[var(--border)] rounded-2xl text-[var(--text-muted)] hover:border-green-500/50 hover:bg-green-500/5 hover:text-green-400 transition-colors font-bold text-sm flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add First Match
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}