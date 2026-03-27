import { useState, useEffect } from 'react';
import { Trophy, Save, Plus, ChevronRight, X } from 'lucide-react';
import { bracketAPI, teamAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import type { Team } from './types';

interface MatchNode {
  id: string;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  isBye: boolean;
}

interface Round {
  id: string;
  title: string;
  matches: MatchNode[];
}

export default function BracketView({ tournamentId }: { tournamentId?: string }) {
  const { addToast } = useToast();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingMatch, setEditingMatch] = useState<{ roundId: string, matchId: string } | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    const init = async () => {
      try {
        const tRes = await teamAPI.getTeams(tournamentId);
        setTeams(tRes.data.data || []);
        
        const bRes = await bracketAPI.getBracket(tournamentId); 
        const existing = bRes.data?.data;
        
        if (existing && existing.rounds && existing.rounds.length > 0) {
          setRounds(existing.rounds);
        } else {
          setRounds([{ id: 'r1', title: 'Quarter Finals', matches: [{ id: 'm1', team1: null, team2: null, winner: null, isBye: false }] }]);
        }
      } catch (e) {
        console.error(e);
        if (rounds.length === 0) setRounds([{ id: 'r1', title: 'Quarter Finals', matches: [{ id: 'm1', team1: null, team2: null, winner: null, isBye: false }] }]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tournamentId]);

  const addRound = () => {
    const newRoundNum = rounds.length + 1;
    setRounds([...rounds, { 
      id: `r${newRoundNum}`, 
      title: `Round ${newRoundNum}`, 
      matches: [{ id: `m${Date.now()}`, team1: null, team2: null, winner: null, isBye: false }] 
    }]);
  };

  const addMatchToRound = (roundId: string) => {
    setRounds(rounds.map(r => {
      if (r.id === roundId) {
        return { ...r, matches: [...r.matches, { id: `m${Date.now()}`, team1: null, team2: null, winner: null, isBye: false }] };
      }
      return r;
    }));
  };

  const updateMatchNode = (roundId: string, matchId: string, updates: Partial<MatchNode>) => {
    setRounds(rounds.map(r => {
      if (r.id === roundId) {
        return { ...r, matches: r.matches.map(m => m.id === matchId ? { ...m, ...updates } : m) };
      }
      return r;
    }));
    setEditingMatch(null);
  };

  const saveBracket = async () => {
    try {
      await bracketAPI.updateBracket(tournamentId!, { type: 'knockout', numberOfTeams: teams.length, rounds });
      addToast({ type: 'success', message: 'Bracket schedule saved successfully!' });
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to save bracket' });
    }
  };

  if (loading) return <div className="py-12 text-center text-[var(--text-muted)] animate-pulse">Loading Bracket Engine...</div>;

  return (
    <div className="bg-[var(--bg-primary)] min-h-[60vh] rounded-3xl border border-[var(--border)] overflow-hidden flex flex-col relative">
      <div className="bg-[var(--bg-card)] p-4 sm:p-6 border-b border-[var(--border)] flex flex-wrap gap-4 items-center justify-between z-10 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2"><Trophy className="w-5 h-5 text-green-500"/> Visual Bracket Editor</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Design your playoff structure, assign BYEs, and map matches.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={addRound} className="flex-1 sm:flex-none px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold rounded-xl border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-all text-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4"/> Add Round
          </button>
          <button onClick={saveBracket} className="flex-1 sm:flex-none px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-sm flex items-center justify-center gap-2">
            <Save className="w-4 h-4"/> Save Layout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-4 sm:p-8 bg-black/20">
        <div className="flex gap-8 sm:gap-16 w-max min-w-full pb-8">
          {rounds.map((round, rIndex) => (
            <div key={round.id} className="flex flex-col gap-6 min-w-[240px] sm:min-w-[280px] shrink-0">
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-center shadow-md relative group">
                <input type="text" value={round.title} onChange={(e) => setRounds(rounds.map(r => r.id === round.id ? { ...r, title: e.target.value } : r))} className="w-full bg-transparent text-center font-black text-[var(--text-primary)] outline-none focus:text-green-400 transition-colors uppercase tracking-wider text-sm" />
                <button onClick={() => addMatchToRound(round.id)} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-green-500 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"><Plus className="w-4 h-4" /></button>
              </div>

              <div className="flex flex-col gap-6 sm:gap-10 flex-1 justify-around relative">
                {round.matches.map((match, mIndex) => (
                  <div key={match.id} className="relative group">
                    {rIndex < rounds.length - 1 && <div className="absolute top-1/2 left-full w-8 sm:w-16 border-t-2 border-[var(--border)] -z-10" />}
                    <div onClick={() => setEditingMatch({ roundId: round.id, matchId: match.id })} className={`bg-[var(--bg-card)] border-2 ${match.isBye ? 'border-amber-500/50 border-dashed' : 'border-[var(--border)]'} rounded-xl overflow-hidden shadow-lg cursor-pointer hover:border-green-500 transition-colors relative z-10`}>
                      <div className={`p-3 border-b border-[var(--border)] flex justify-between items-center ${match.winner?._id === match.team1?._id ? 'bg-green-500/10' : ''}`}>
                        <span className={`font-bold text-sm truncate ${match.team1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] italic'}`}>{match.team1?.name || 'TBD'}</span>
                        {match.winner?._id === match.team1?._id && <ChevronRight className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className={`p-3 flex justify-between items-center ${match.winner?._id === match.team2?._id ? 'bg-green-500/10' : ''}`}>
                        {match.isBye ? <span className="font-bold text-sm text-amber-500 tracking-widest uppercase">BYE</span> : <span className={`font-bold text-sm truncate ${match.team2 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] italic'}`}>{match.team2?.name || 'TBD'}</span>}
                        {match.winner?._id === match.team2?._id && <ChevronRight className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 animate-in zoom-in-95 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-[var(--text-primary)]">Configure Match</h3>
              <button onClick={() => setEditingMatch(null)} className="text-[var(--text-muted)] hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            {(() => {
              const r = rounds.find(r => r.id === editingMatch.roundId);
              const m = r?.matches.find(m => m.id === editingMatch.matchId);
              if (!m) return null;
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Slot 1 / Home Team</label>
                    <select value={m.team1?._id || ''} onChange={e => updateMatchNode(editingMatch.roundId, editingMatch.matchId, { team1: teams.find(t => t._id === e.target.value) || null })} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none">
                      <option value="">-- TBD / Empty --</option>
                      {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer mt-2">
                    <input type="checkbox" checked={m.isBye} onChange={e => updateMatchNode(editingMatch.roundId, editingMatch.matchId, { isBye: e.target.checked, team2: null })} className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm font-bold text-amber-500">Auto-Advance (BYE)</span>
                  </label>
                  {!m.isBye && (
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider mt-2">Slot 2 / Away Team</label>
                      <select value={m.team2?._id || ''} onChange={e => updateMatchNode(editingMatch.roundId, editingMatch.matchId, { team2: teams.find(t => t._id === e.target.value) || null })} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none">
                        <option value="">-- TBD / Empty --</option>
                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="pt-4 border-t border-[var(--border)] mt-6">
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Set Winner</label>
                    <div className="flex gap-2">
                      <button onClick={() => updateMatchNode(editingMatch.roundId, editingMatch.matchId, { winner: m.team1 })} disabled={!m.team1} className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${m.winner?._id === m.team1?._id ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'} disabled:opacity-50`}>Team 1</button>
                      <button onClick={() => updateMatchNode(editingMatch.roundId, editingMatch.matchId, { winner: m.team2 })} disabled={!m.team2 || m.isBye} className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${m.winner?._id === m.team2?._id ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'} disabled:opacity-50`}>Team 2</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}