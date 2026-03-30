import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import { Zap, MapPin, Shield, RefreshCw } from 'lucide-react';

export default function LiveScoreboardPreview() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatch = async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      setMatch(res.data.data || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    const iv = setInterval(fetchMatch, 5000);
    socket.joinMatch(id!);
    socket.get().on('scoreUpdate', fetchMatch);
    return () => {
      clearInterval(iv);
      socket.get().off('scoreUpdate', fetchMatch);
    };
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!match) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Match not found.</p>
    </div>
  );

  const inn1 = match.innings?.[0];
  const inn2 = match.innings?.[1];
  const currentInn = match.innings?.[match.currentInnings - 1];

  // Find striker and non-striker from current innings batsmen
  const striker = currentInn?.batsmen?.find((b: any) => b.name === match.strikerName || b.isStriker);
  const nonStriker = currentInn?.batsmen?.find((b: any) => b.name === match.nonStrikerName || (!b.isStriker && !b.isOut));
  const currentBowler = currentInn?.bowlers?.find((b: any) => b.name === match.currentBowlerName || b.isBowling);

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-3xl mx-auto" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> LIVE
            </span>
            {match.name}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {match.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{match.venue}</span>}
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />{match.format}</span>
            <span>Inn {match.currentInnings}</span>
          </div>
        </div>
        <button onClick={fetchMatch} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Score Section — like LiveScoring style */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Team 1 */}
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              {match.team1Name}
            </p>
            <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              {match.team1Score ?? 0}<span className="text-2xl" style={{ color: 'var(--text-secondary)' }}>/{match.team1Wickets ?? 0}</span>
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              ({Number(match.team1Overs ?? 0).toFixed(1)} ov)
            </p>
          </div>

          {/* VS */}
          <div className="text-center">
            <p className="text-xl font-black" style={{ color: 'var(--text-muted)' }}>VS</p>
          </div>

          {/* Team 2 */}
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              {match.team2Name}
            </p>
            <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              {match.team2Score ?? 0}<span className="text-2xl" style={{ color: 'var(--text-secondary)' }}>/{match.team2Wickets ?? 0}</span>
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              ({Number(match.team2Overs ?? 0).toFixed(1)} ov)
            </p>
          </div>
        </div>

        {/* Target / required info */}
        {currentInn?.targetScore && (
          <div className="mt-4 px-4 py-3 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <span className="font-bold text-blue-400">Target: {currentInn.targetScore}</span>
            {currentInn.requiredRuns != null && (
              <span className="text-sm ml-3" style={{ color: 'var(--text-secondary)' }}>
                Need {currentInn.requiredRuns} @ RRR {currentInn.requiredRunRate?.toFixed(2)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Current Players Section */}
      {(striker || nonStriker || currentBowler) && (
        <div className="space-y-4 mb-6">

          {/* Batsmen Cards */}
          {(striker || nonStriker) && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Batting</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    <th className="text-left py-3 px-5 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Batsman</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>R</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>B</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>4s</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>6s</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {[striker, nonStriker].filter(Boolean).map((b: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(var(--border-rgb, 255,255,255),0.08)' }}>
                      <td className="py-4 px-5">
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                          {(b.isStriker || b.name === match.strikerName) && !b.isOut
                            ? <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-400">Striker *</span>
                            : <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-600/50 text-slate-400">Non-Striker</span>
                          }
                          <div className="text-xs mt-0.5 font-bold" style={{ color: 'rgb(var(--success, 34 197 94))' }}>not out</div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{b.runs ?? 0}</td>
                      <td className="py-4 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>{b.balls ?? 0}</td>
                      <td className="py-4 px-3 text-center font-bold" style={{ color: 'var(--accent, #22c55e)' }}>{b.fours ?? 0}</td>
                      <td className="py-4 px-3 text-center font-bold" style={{ color: '#a855f7' }}>{b.sixes ?? 0}</td>
                      <td className="py-4 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>{b.strikeRate?.toFixed(1) ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bowler Card */}
          {currentBowler && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <span className="text-sm">🎳</span>
                <span className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Bowling</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    <th className="text-left py-3 px-5 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Bowler</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>O</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>M</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>R</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>W</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Eco</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-4 px-5">
                      <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{currentBowler.name}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">Bowling</span>
                    </td>
                    <td className="py-4 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>{currentBowler.overs ?? 0}.{(currentBowler.balls ?? 0) % 6}</td>
                    <td className="py-4 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>{currentBowler.maidens ?? 0}</td>
                    <td className="py-4 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>{currentBowler.runs ?? 0}</td>
                    <td className="py-4 px-3 text-center font-bold text-xl" style={{ color: 'var(--danger, #ef4444)' }}>{currentBowler.wickets ?? 0}</td>
                    <td className="py-4 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>{currentBowler.economy?.toFixed(2) ?? '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* No live player data fallback */}
      {!striker && !nonStriker && !currentBowler && match.status === 'live' && (
        <div className="text-center py-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <p>Waiting for player data...</p>
        </div>
      )}
    </div>
  );
}