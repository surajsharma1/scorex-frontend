import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { socket } from '../services/socket';
import { useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import {
  ArrowLeft, Zap, BarChart2, Users, MapPin, Shield, Activity
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface Props {
  matchId: string;
  onBack?: () => void;
  openScoreboard?: () => void;
}

export default function MatchDetail({ matchId, onBack, openScoreboard }: Props) {
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'scoreboard' | 'players' | 'leaderboard'>('overview');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { addToast } = useToast();

  useEffect(() => {
    matchAPI.getMatch(matchId)
      .then(r => setMatch(r.data.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user');
      }
    }
  }, []);

  if (loading) return (
    <div className="min-h-[90vh] flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-2xl animate-spin shadow-lg" />
    </div>
  );
  if (!match) return (
    <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Match not found</div>
  );

  const innings1 = match.innings?.[0];
  const innings2 = match.innings?.[1];
  const team1 = match.team1;
  const team2 = match.team2;

  // All players for leaderboard
  const allBatsmen: any[] = [];
  const allBowlers: any[] = [];
  [innings1, innings2].filter(Boolean).forEach((inn: any) => {
    inn.batsmen?.forEach((b: any) => {
      allBatsmen.push({ ...b, team: inn.teamName });
    });
    inn.bowlers?.forEach((b: any) => {
      allBowlers.push({ ...b, team: inn.teamName });
    });
  });
  allBatsmen.sort((a, b) => b.runs - a.runs);

  const handleDeleteMatch = async () => {
    if (!confirm(`Delete "${match.name}" match? This action cannot be undone.`)) return;
    try {
      await matchAPI.deleteMatch(matchId);
      addToast({ type: 'success', title: 'Match Deleted', message: 'Match has been deleted successfully.' });
      onBack?.();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to delete match' });
    }
  };

  const isAuthorized = currentUser && (currentUser.role === 'admin' || currentUser._id === match.tournament?.createdBy?._id);

  return (
    <div className="min-h-[90vh] max-h-[90vh] overflow-hidden flex flex-col rounded-2xl" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="shrink-0 p-6" style={{ 
        background: 'var(--bg-elevated)', 
        borderBottom: '1px solid var(--border)', 
        borderRadius: '2rem 2rem 0 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)' 
      }}>
<div className="flex flex-col gap-3">
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-3 min-w-0">
      <button onClick={onBack} className="p-2.5 rounded-2xl hover:bg-[var(--bg-elevated)] transition-all shrink-0" style={{ color: 'var(--text-primary)' }}>
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="min-w-0">
        <h1 className="text-lg sm:text-2xl font-black truncate" style={{ color: 'var(--text-primary)' }}>{match.name}</h1>
        <div className="flex items-center gap-3 text-xs sm:text-sm flex-wrap" style={{ color: 'var(--text-secondary)' }}>
          {match.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {match.venue}</span>}
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {match.format}</span>
        </div>
      </div>
    </div>
{isAuthorized ? (
  <button
    onClick={() => navigate(`/live-scoring/${matchId}`)}
className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-2xl transition-all hover:scale-105 shadow-lg bg-slate-700 hover:bg-slate-600 text-sm" style={{ color: 'var(--text-primary)' }}
  >
<Zap className="w-4 h-4" /> Live Scoring
  </button>
) : match.status === 'live' ? (
  <button
    onClick={() => navigate(`/live/${matchId}`)}
    className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-2xl transition-all hover:scale-105 shadow-lg bg-slate-700 hover:bg-slate-600 text-sm"
    style={{ color: 'var(--text-primary)' }}>
    <Zap className="w-4 h-4" /> Live Scoreboard
  </button>
) : (
  <button
    onClick={() => setTab('scoreboard')}
    className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-2xl transition-all hover:scale-105 shadow-lg bg-slate-700 hover:bg-slate-600 text-sm"
    style={{ color: 'var(--text-primary)' }}>
    <Zap className="w-4 h-4" /> Scoreboard
  </button>
)}
          {isAuthorized && (
            <button
              onClick={handleDeleteMatch}
className="p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-200 transition-all shadow-md hover:shadow-lg"
              title="Delete Match"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Score summary */}
        <div className="flex items-center gap-8 mt-6 p-6 rounded-2xl" style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div className="flex-1 text-center">
            <p className="text-sm uppercase tracking-wide font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{match.team1Name}</p>
            <p className="text-4xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{match.team1Score}/{match.team1Wickets}</p>
            <p style={{ color: 'var(--text-secondary)' }}>({Number(match.team1Overs || 0).toFixed(1)} ov)</p>
          </div>
          <div className="text-2xl font-black uppercase tracking-wider" style={{ color: 'rgb(var(--success))' }}>VS</div>
          <div className="flex-1 text-center">
            <p className="text-sm uppercase tracking-wide font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{match.team2Name}</p>
            <p className="text-4xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{match.team2Score}/{match.team2Wickets}</p>
            <p style={{ color: 'var(--text-secondary)' }}>({Number(match.team2Overs || 0).toFixed(1)} ov)</p>
          </div>
        </div>
        
        {match.resultSummary && (
          <div className="text-center p-4">
            <p className="text-xl font-bold px-6 py-3 rounded-2xl" style={{ 
              background: 'rgba(var(--success), 0.15)', 
              color: 'rgb(var(--success))',
              border: '1px solid rgba(var(--success), 0.3)'
            }}>
              {match.resultSummary}
            </p>
          </div>
        )}

        {/* Tabs */}
<div className="flex bg-[var(--bg-elevated)] border-t border-[var(--border)] px-2 py-2 -mx-6 mt-4 overflow-x-auto gap-1 scrollbar-none">
  {(['overview', 'scoreboard', 'players', 'leaderboard'] as const).map(t => {
    const isActive = tab === t;
    const labels: Record<string, string> = {
      overview: 'Overview',
      scoreboard: 'Score',
      players: 'Players',
      leaderboard: 'Leaders',
    };
    return (
      <button key={t} onClick={() => setTab(t)}
        className="flex-shrink-0 flex-1 min-w-[70px] px-3 py-2.5 rounded-xl font-semibold transition-all text-sm whitespace-nowrap"
        style={isActive
          ? {
              background: 'linear-gradient(135deg, var(--accent), #059669)',
              color: '#000',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
            }
          : { color: 'var(--text-secondary)' }
        }>
        {labels[t]}
      </button>
    );
  })}
</div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-[var(--bg-elevated)]">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {match.tossWinnerName && (
              <div className="p-6 rounded-2xl" style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>TOSS</p>
                <p style={{ color: 'var(--text-primary)' }}>{match.tossWinnerName} won the toss and chose to {match.tossDecision}</p>
              </div>
            )}
            {[innings1, innings2].filter(Boolean).map((inn: any, i: number) => (
              <div key={i} className="p-6 rounded-2xl" style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      {i + 1}st Innings
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{inn.teamName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{inn.score}/{inn.wickets}</p>
                    <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>RR: {inn.runRate?.toFixed(2)}</p>
                  </div>
                </div>
                {inn.targetScore && (
                  <div className="p-4 rounded-xl mb-6" style={{ 
                    background: 'rgba(var(--accent), 0.1)', 
                    border: '1px solid rgba(var(--accent), 0.3)',
                    color: 'rgb(var(--accent))'
                  }}>
                    <p className="font-bold text-lg">Target: {inn.targetScore} runs</p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="text-sm uppercase font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Wides</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{inn.extras?.wides || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="text-sm uppercase font-bold mb-1" style={{ color: 'var(--text-muted)' }}>No Balls</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{inn.extras?.noBalls || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="text-sm uppercase font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Byes</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{inn.extras?.byes || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="text-sm uppercase font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Leg Byes</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{inn.extras?.legByes || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCOREBOARD */}
        {tab === 'scoreboard' && (
          <div className="space-y-6">
            {[innings1, innings2].filter(Boolean).map((inn: any, i: number) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{inn.teamName}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Innings {i + 1}</p>
                    </div>
                    <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{inn.score}/{inn.wickets} ({inn.overs?.toFixed ? inn.overs.toFixed(1) : 0})</p>
                  </div>
                </div>

                {/* Batting */}
                {inn.batsmen?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                          <th className="text-left py-4 px-6 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Batsman</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>R</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>B</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>4s</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>6s</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inn.batsmen.map((b: any, j: number) => (
                          <tr key={j} className="border-b hover:bg-[var(--bg-elevated)] transition-colors" style={{ borderColor: 'rgba(var(--border),0.5)' }}>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                                  {b.isStriker && !b.isOut && <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-[var(--accent)] text-black">Striker</span>}
                                  {!b.isOut && !b.isStriker && <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-[var(--text-muted)] text-black">Non-Striker</span>}
                                  {b.isOut && <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{b.outType?.replace('_', ' ')} b {b.outTo}</div>}
                                  {!b.isOut && <div className="text-sm mt-1 font-bold" style={{ color: 'rgb(var(--success))' }}>not out</div>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{b.runs}</td>
                            <td className="py-4 px-4 text-center" style={{ color: 'var(--text-secondary)' }}>{b.balls}</td>
                            <td className="py-4 px-4 text-center font-bold" style={{ color: 'rgb(var(--accent))' }}>{b.fours}</td>
                            <td className="py-4 px-4 text-center font-bold" style={{ color: '#a855f7' }}>{b.sixes}</td>
                            <td className="py-4 px-4 text-center" style={{ color: 'var(--text-secondary)' }}>{b.strikeRate?.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Extras */}
                {inn.extras && (
                  <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                    <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>
                      Extras: <span style={{ color: 'var(--text-primary)' }}>{inn.extras?.total || 0}</span> 
                      (W: {inn.extras?.wides || 0}, NB: {inn.extras?.noBalls || 0}, B: {inn.extras?.byes || 0}, LB: {inn.extras?.legByes || 0})
                    </p>
                  </div>
                )}

                {/* Bowling */}
                {inn.bowlers?.length > 0 && (
                  <div className="border-t overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                          <th className="text-left py-4 px-6 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Bowler</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>O</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>M</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>R</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>W</th>
                          <th className="text-center py-4 px-4 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Eco</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inn.bowlers.map((b: any, j: number) => (
                          <tr key={j} className="border-b hover:bg-[var(--bg-elevated)] transition-colors" style={{ borderColor: 'rgba(var(--border),0.5)' }}>
                            <td className="py-4 px-6 font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{b.name}</td>
                            <td className="py-4 px-4 text-center" style={{ color: 'var(--text-secondary)' }}>{b.overs || 0}.{b.balls ? b.balls % 6 : 0}</td>
                            <td className="py-4 px-4 text-center" style={{ color: 'var(--text-secondary)' }}>{b.maidens}</td>
                            <td className="py-4 px-4 text-center" style={{ color: 'var(--text-secondary)' }}>{b.runs}</td>
                            <td className="py-4 px-4 text-center font-bold text-xl" style={{ color: 'rgb(var(--danger))' }}>{b.wickets}</td>
                            <td className="py-4 px-4 text-center" style={{ color: 'var(--text-secondary)' }}>{b.economy?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Fall of wickets */}
{inn.fallOfWickets?.length > 0 && (
                  <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                    <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Fall of Wickets</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      {inn.fallOfWickets.map((f: any) => `${f.score}/${f.wicket} (${f.batsman}, ${f.overs})`).join(' • ')}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {match.decisionPending && (
              <div className="p-6 rounded-2xl mt-6" style={{ 
                background: 'rgba(251, 191, 36, 0.1)', 
                border: '1px solid rgba(251, 191, 36, 0.5)',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-xl" style={{ color: 'rgb(251, 191, 36)' }}>Decision Pending</h3>
                      <p className="text-sm" style={{ color: 'rgba(251, 191, 36, 0.8)' }}>Awaiting official decision (umpire/admin required).</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      socket.emit('resolveDecisionPending', { matchId });
                      // Refetch to update
                      matchAPI.getMatch(matchId).then(r => setMatch(r.data.data));
                    }}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    Resolve Decision
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLAYERS */}
        {tab === 'players' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { team: team1, name: match.team1Name || 'Team 1', players: team1?.players || [] },
              { team: team2, name: match.team2Name || 'Team 2', players: team2?.players || [] }
            ].map((side, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                <div className="p-6 pb-4" style={{ 
                  background: 'linear-gradient(135deg, rgba(var(--accent),0.15), rgba(16,185,129,0.1))',
                  borderBottom: '1px solid rgba(var(--accent),0.2)'
                }}>
                  <h3 className="text-2xl font-black mb-1" style={{ color: 'rgb(var(--text-primary))' }}>{side.name}</h3>
                  <p className="text-lg" style={{ color: 'rgb(var(--accent))' }}>{side.players.length} Players</p>
                </div>
                <div className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto">
                  {side.players.length === 0 ? (
                    <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
                      No players added yet
                    </div>
                  ) : (
                    side.players.map((p: any, j: number) => (
                      <div key={j} className="flex items-center gap-4 p-6 hover:bg-[var(--bg-elevated)] transition-colors">
                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-lg shadow-lg flex-shrink-0" 
                             style={{ background: 'linear-gradient(135deg, var(--accent), #059669)', color: 'rgb(var(--text-primary))' }}>
                          {j + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                          <p className="text-sm capitalize px-3 py-1 rounded-full inline-block" style={{ 
                            background: 'var(--bg-elevated)', 
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)'
                          }}>
                            {p.role}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD */}
        {tab === 'leaderboard' && (
          <div className="space-y-6">

            {/* Batting */}
            <div className="rounded-2xl overflow-hidden" style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ 
                borderColor: 'var(--border)', 
                background: 'var(--bg-elevated)' 
              }}>
                <BarChart2 className="w-6 h-6" style={{ color: 'rgb(var(--accent))' }} />
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Batting Leaderboard</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                      <th className="text-left py-4 px-6 font-semibold" style={{ color: 'var(--text-secondary)' }}>Player</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>R</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>B</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>4s</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>6s</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBatsmen.slice(0, 10).map((b, i) => (
                      <tr key={i} className="border-b hover:bg-[var(--bg-elevated)] transition-colors" style={{ borderColor: 'rgba(var(--border),0.5)' }}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0" 
                                 style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                              #{i + 1}
                            </div>
                            <div>
                              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
                              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{b.team}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-black text-3xl" style={{ color: 'var(--text-primary)' }}>{b.runs}</td>
                        <td className="py-4 px-4 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{b.balls}</td>
                        <td className="py-4 px-4 text-center font-bold text-xl" style={{ color: 'rgb(var(--accent))' }}>{b.fours}</td>
                        <td className="py-4 px-4 text-center font-bold text-xl" style={{ color: '#a855f7' }}>{b.sixes}</td>
                        <td className="py-4 px-4 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{b.strikeRate?.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowling */}
            <div className="rounded-2xl overflow-hidden" style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ 
                borderColor: 'var(--border)', 
                background: 'var(--bg-elevated)' 
              }}>
                <Activity className="w-6 h-6" style={{ color: 'rgb(var(--success))' }} />
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Bowling Leaderboard</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                      <th className="text-left py-4 px-6 font-semibold" style={{ color: 'var(--text-secondary)' }}>Player</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>O</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>R</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>W</th>
                      <th className="text-center py-4 px-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBowlers.sort((a, b) => b.wickets - a.wickets).slice(0, 10).map((b, i) => (
                      <tr key={i} className="border-b hover:bg-[var(--bg-elevated)] transition-colors" style={{ borderColor: 'rgba(var(--border),0.5)' }}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0" 
                                 style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                              #{i + 1}
                            </div>
                            <div>
                              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
                              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{b.team}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{b.overs || 0}.{b.balls ? b.balls % 6 : 0}</td>
                        <td className="py-4 px-4 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{b.runs}</td>
                        <td className="py-4 px-4 text-center font-black text-3xl" style={{ color: 'rgb(var(--danger))' }}>{b.wickets}</td>
                        <td className="py-4 px-4 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{b.economy?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

