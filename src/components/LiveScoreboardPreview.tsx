import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import { Zap, MapPin, Shield, RefreshCw, ArrowLeft } from 'lucide-react';

export default function LiveScoreboardPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatch = useCallback(async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      setMatch(res.data.data || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
    const iv = setInterval(fetchMatch, 5000);
    socket.joinMatch(id!);
    const handler = () => fetchMatch();
    socket.get().on('scoreUpdate', handler);
    return () => {
      clearInterval(iv);
      socket.get().off('scoreUpdate', handler);
    };
  }, [fetchMatch, id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!match) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <p className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>Match not found.</p>
        <button onClick={() => navigate('/live')} className="px-4 py-2 bg-slate-700 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Back to Live Matches
        </button>
      </div>
    </div>
  );

  const currentInn = match.innings?.[match.currentInnings - 1];

  const striker = currentInn?.batsmen?.find(
    (b: any) => b.name === match.strikerName || b.isStriker
  );
  const nonStriker = currentInn?.batsmen?.find(
    (b: any) => b.name === match.nonStrikerName || (b.name !== match.strikerName && !b.isOut && !b.isStriker)
  );
  const currentBowler = currentInn?.bowlers?.find(
    (b: any) => b.name === match.currentBowlerName || b.isBowling
  );

  const hasPlayers = striker || nonStriker || currentBowler;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/live')}
              className="p-2.5 rounded-xl shrink-0 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black truncate" style={{ color: 'var(--text-primary)' }}>
                {match.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap mt-0.5">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                </span>
                {match.venue && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <MapPin className="w-3 h-3" />{match.venue}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Shield className="w-3 h-3" />{match.format}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Inn {match.currentInnings}</span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchMatch}
            className="p-2.5 rounded-xl shrink-0 transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Score Card */}
        <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Team 1 */}
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wide mb-2 truncate" style={{ color: 'var(--text-muted)' }}>
                {match.team1Name}
              </p>
              <p className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                {match.team1Score ?? 0}
                <span className="text-xl sm:text-2xl" style={{ color: 'var(--text-secondary)' }}>
                  /{match.team1Wickets ?? 0}
                </span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                ({Number(match.team1Overs ?? 0).toFixed(1)} ov)
              </p>
            </div>

            {/* VS */}
            <div className="text-center">
              <p className="text-base sm:text-xl font-black" style={{ color: 'var(--text-muted)' }}>VS</p>
            </div>

            {/* Team 2 */}
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wide mb-2 truncate" style={{ color: 'var(--text-muted)' }}>
                {match.team2Name}
              </p>
              <p className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                {match.team2Score ?? 0}
                <span className="text-xl sm:text-2xl" style={{ color: 'var(--text-secondary)' }}>
                  /{match.team2Wickets ?? 0}
                </span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                ({Number(match.team2Overs ?? 0).toFixed(1)} ov)
              </p>
            </div>
          </div>

          {/* Target bar */}
          {currentInn?.targetScore && (
            <div className="mt-4 px-4 py-3 rounded-xl text-center text-sm" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <span className="font-bold text-blue-400">Target: {currentInn.targetScore}</span>
              {currentInn.requiredRuns != null && (
                <span className="ml-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Need {currentInn.requiredRuns} runs @ RRR {currentInn.requiredRunRate?.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Player Cards */}
        {hasPlayers && (
          <div className="space-y-4">

            {/* Batsmen */}
            {(striker || nonStriker) && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Batting</span>
                </div>

                {/* Mobile: cards layout / Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                        <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Batsman</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>R</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>B</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>4s</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>6s</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[striker, nonStriker].filter(Boolean).map((b: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                              {(b.isStriker || b.name === match.strikerName)
                                ? <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-400">* Striker</span>
                                : <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-slate-600/40 text-slate-400">Non-Striker</span>
                              }
                              <div className="text-xs font-bold mt-0.5 text-green-400">not out</div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-xl font-black" style={{ color: 'var(--text-primary)' }}>{b.runs ?? 0}</td>
                          <td className="py-3 px-3 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{b.balls ?? 0}</td>
                          <td className="py-3 px-3 text-center font-bold text-sm" style={{ color: '#22c55e' }}>{b.fours ?? 0}</td>
                          <td className="py-3 px-3 text-center font-bold text-sm" style={{ color: '#a855f7' }}>{b.sixes ?? 0}</td>
                          <td className="py-3 px-3 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{b.strikeRate?.toFixed(1) ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
                  {[striker, nonStriker].filter(Boolean).map((b: any, i: number) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                          {(b.isStriker || b.name === match.strikerName)
                            ? <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-400">* Striker</span>
                            : <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-slate-600/40 text-slate-400">Non-Striker</span>
                          }
                        </div>
                        <span className="text-xs font-bold text-green-400">not out</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { label: 'Runs', value: b.runs ?? 0, color: 'var(--text-primary)', big: true },
                          { label: 'Balls', value: b.balls ?? 0, color: 'var(--text-secondary)' },
                          { label: '4s', value: b.fours ?? 0, color: '#22c55e' },
                          { label: '6s', value: b.sixes ?? 0, color: '#a855f7' },
                        ].map(stat => (
                          <div key={stat.label} className="rounded-xl py-2" style={{ background: 'var(--bg-elevated)' }}>
                            <p className={`font-black ${stat.big ? 'text-xl' : 'text-base'}`} style={{ color: stat.color }}>{stat.value}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bowler */}
            {currentBowler && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <span>🎳</span>
                  <span className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Bowling</span>
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                        <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Bowler</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>O</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>M</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>R</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>W</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Eco</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-4">
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{currentBowler.name}</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">Bowling</span>
                        </td>
                        <td className="py-3 px-3 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{currentBowler.overs ?? 0}.{(currentBowler.balls ?? 0) % 6}</td>
                        <td className="py-3 px-3 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{currentBowler.maidens ?? 0}</td>
                        <td className="py-3 px-3 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{currentBowler.runs ?? 0}</td>
                        <td className="py-3 px-3 text-center font-bold text-lg" style={{ color: '#ef4444' }}>{currentBowler.wickets ?? 0}</td>
                        <td className="py-3 px-3 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{currentBowler.economy?.toFixed(2) ?? '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile card */}
                <div className="sm:hidden px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{currentBowler.name}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">Bowling</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Overs', value: `${currentBowler.overs ?? 0}.${(currentBowler.balls ?? 0) % 6}`, color: 'var(--text-secondary)' },
                      { label: 'Runs', value: currentBowler.runs ?? 0, color: 'var(--text-secondary)' },
                      { label: 'Wkts', value: currentBowler.wickets ?? 0, color: '#ef4444' },
                      { label: 'Eco', value: currentBowler.economy?.toFixed(2) ?? '-', color: 'var(--text-secondary)' },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-xl py-2" style={{ background: 'var(--bg-elevated)' }}>
                        <p className="font-black text-base" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Waiting fallback */}
        {!hasPlayers && (
          <div className="text-center py-10 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Waiting for player data...</p>
          </div>
        )}

      </div>
    </div>
  );
}

