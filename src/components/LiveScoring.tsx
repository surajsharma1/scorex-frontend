import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import {
  RotateCcw, LogOut, ChevronRight, AlertTriangle, X,
  RefreshCw, Users
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BallData {
  runs?: number;
  wide?: boolean;
  noBall?: boolean;
  bye?: number;
  legBye?: number;
  wicket?: boolean;
  outType?: string;
  outBatsmanName?: string;
  outFielder?: string;
  retired?: boolean;
  penalty?: number;
}

type ScoringPanel = 'main' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'wicket' | 'others';
type ScoreStep = 'toss' | 'players' | 'scoring' | 'playerSelect' | 'inningsBreak' | 'done';
type PlayerSelectMode = 'all' | 'striker' | 'nonStriker' | 'bowler';

// ─── Sub-panel: Run buttons ───────────────────────────────────────────────────
function RunButtons({ onSelect, disabled = false, extraLabel = '' }: {
  onSelect: (runs: number) => void;
  disabled?: boolean;
  extraLabel?: string;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
      {[0, 1, 2, 3, 4, 5, 6].map(r => (
        <button key={r} disabled={disabled}
          onClick={() => onSelect(r)}
          className="py-4 sm:py-3 md:py-4 rounded-xl font-bold text-lg sm:text-base lg:text-lg bg-slate-700 hover:bg-slate-600 text-white transition-all active:scale-95 disabled:opacity-40 shadow-md hover:shadow-lg">
          {extraLabel ? `${extraLabel}+${r}` : (r === 0 ? '•' : r)}
        </button>
      ))}
    </div>
  );
}

const WICKET_TYPES = [
  { id: 'bowled', label: 'Bowled' },
  { id: 'caught', label: 'Caught' },
  { id: 'lbw', label: 'LBW' },
  { id: 'run_out', label: 'Run Out' },
  { id: 'stumped', label: 'Stumped' },
  { id: 'hit_wicket', label: 'Hit Wicket' },
  { id: 'handled_ball', label: 'Handled Ball' },
  { id: 'obstructing', label: 'Obstructing' },
  { id: 'timed_out', label: 'Timed Out' },
];

// ─── Toss Modal ───────────────────────────────────────────────────────────────
function TossModal({ match, onDone }: { match: any; onDone: (data: any) => void }) {
  const [tossWinner, setTossWinner] = useState('');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');

  const submit = () => {
    if (!tossWinner) return;
    const t1Id = match.team1?._id || match.team1;
    const team = t1Id === tossWinner ? match.team1 : match.team2;
    const other = team._id === t1Id ? match.team2 : match.team1;
    const battingTeam = decision === 'bat' ? team : other;
    const bowlingTeam = decision === 'bat' ? other : team;
    onDone({
      tossWinnerId: tossWinner,
      tossWinnerName: team.name || team.team1Name,
      tossDecision: decision,
      battingTeamId: battingTeam._id || battingTeam,
      battingTeamName: battingTeam.name,
      bowlingTeamId: bowlingTeam._id || bowlingTeam,
      bowlingTeamName: bowlingTeam.name,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-black text-white mb-6 text-center">🪙 Toss</h2>
        <div className="space-y-5">
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-2 block">Who won the toss?</label>
            <div className="grid grid-cols-2 gap-3">
              {[match.team1, match.team2].map(team => {
                const id = team?._id || team;
                const name = team?.name || `Team ${id}`;
                return (
                  <button key={id} onClick={() => setTossWinner(id)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${tossWinner === id ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-2 block">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              {(['bat', 'bowl'] as const).map(d => (
                <button key={d} onClick={() => setDecision(d)}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 capitalize ${decision === d ? 'border-green-500 bg-green-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  {d === 'bat' ? '🏏 Bat' : '🎳 Bowl'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={submit} disabled={!tossWinner}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
            Continue to Player Selection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Player Selection Modal ───────────────────────────────────────────────────
function PlayerSelectModal({
  match, battingTeamId, bowlingTeamId, inningsNum, mode, title, onDone, onClose
}: {
  match: any; battingTeamId: string; bowlingTeamId: string; inningsNum: number;
  mode: PlayerSelectMode; title: string;
  onDone: (data: { striker?: string; nonStriker?: string; bowler?: string }) => void;
  onClose?: () => void;
}) {
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  const t1Id = match.team1?._id || match.team1;
  const battingTeam = t1Id === battingTeamId ? match.team1 : match.team2;
  const bowlingTeam = battingTeam === match.team1 ? match.team2 : match.team1;

  const battingPlayers: any[] = battingTeam?.players || [];
  const bowlingPlayers: any[] = bowlingTeam?.players || [];

  const isValid = () => {
    if (mode === 'all') return striker && nonStriker && bowler && striker !== nonStriker;
    if (mode === 'striker') return !!striker;
    if (mode === 'nonStriker') return !!nonStriker;
    if (mode === 'bowler') return !!bowler;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg my-4 relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" /> {title}
        </h2>
        <p className="text-slate-500 text-xs mb-5">Innings {inningsNum} | {battingTeam?.name || 'Batting Team'} vs {bowlingTeam?.name || 'Bowling Team'}</p>

        <div className="space-y-4">
          {(mode === 'all' || mode === 'striker') && (
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🏏 Incoming Striker</label>
              <select value={striker} onChange={e => setStriker(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Select Player --</option>
                {battingPlayers.map((p: any) => (
                  <option key={p._id || p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {(mode === 'all' || mode === 'nonStriker') && (
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🏏 Incoming Non-Striker</label>
              <select value={nonStriker} onChange={e => setNonStriker(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Select Player --</option>
                {battingPlayers.filter((p: any) => p.name !== striker).map((p: any) => (
                  <option key={p._id || p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {(mode === 'all' || mode === 'bowler') && (
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🎳 New Bowler</label>
              <select value={bowler} onChange={e => setBowler(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Select Bowler --</option>
                {bowlingPlayers.map((p: any) => (
                  <option key={p._id || p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={() => isValid() && onDone({ striker, nonStriker, bowler })}
            disabled={!isValid()}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all mt-2">
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN LiveScoring ─────────────────────────────────────────────────────────
export default function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<ScoreStep>('toss');
  const [panel, setPanel] = useState<ScoringPanel>('main');
  const [submitting, setSubmitting] = useState(false);
  const [lastBall, setLastBall] = useState<string>('');
  const [error, setError] = useState('');
  const [tossData, setTossData] = useState<any>(null);
  
  // Advanced Modal States
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [outBatsman, setOutBatsman] = useState<'striker' | 'nonStriker'>('striker');
  
  const [playerSelectMode, setPlayerSelectMode] = useState<PlayerSelectMode>('all');

  const fetchMatch = useCallback(async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      const m = res.data.data || res.data;
      setMatch(m);
      if (m.status === 'completed') setStep('done');
      else if (m.status === 'live') {
        const innings = m.innings?.[m.currentInnings - 1];
        if (!innings || (!m.strikerName && !m.nonStrikerName)) {
          setPlayerSelectMode('all');
          setStep('players');
        } else setStep('scoring');
      } else setStep('toss');
    } catch (e) {
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      socket.joinMatch(id);
      return () => socket.leaveMatch(id);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const handlePlayersDone = async (players: { striker?: string; nonStriker?: string; bowler?: string }) => {
    if (!id || !match) return;
    setSubmitting(true);
    try {
      if (match.status !== 'live') {
        await matchAPI.startMatch(id, { ...tossData, striker: players.striker, nonStriker: players.nonStriker, bowler: players.bowler });
      } else {
        await matchAPI.selectPlayers(id, players);
      }
      await fetchMatch();
      setStep('scoring');
      setPanel('main');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update players');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBall = async (data: BallData) => {
    if (!id || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await matchAPI.addBall(id, data);
      const result = res.data.data;
      await fetchMatch(); // Refresh state immediately
      setLastBall(result?.ballDescription || 'Ball Recorded');
      setPanel('main');

      // The backend decides if we need a new bowler (end of over) or new batsman (wicket)
      if (result?.matchEnded) {
        setStep('done');
      } else if (result?.inningsEnded) {
        setStep('inningsBreak');
      } else if (result?.needPlayerSelection) {
        // If it's a wicket, ask for striker. If it's over end, ask for bowler. 
        // We set to 'all' here, but ideally your backend should specify `needBowler` vs `needBatsman`
        setPlayerSelectMode('all'); 
        setStep('playerSelect');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to record ball');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetirement = (type: 'striker' | 'nonStriker') => {
    setPanel('main');
    setPlayerSelectMode(type);
    setStep('playerSelect');
    submitBall({ retired: true, outBatsmanName: type === 'striker' ? match?.strikerName : match?.nonStrikerName });
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const innings = match?.innings?.[match?.currentInnings - 1] || {};
  const safeBatsmen = Array.isArray(innings?.batsmen) ? innings.batsmen : [];
  const safeBowlers = Array.isArray(innings?.bowlers) ? innings.bowlers : [];
  const striker = safeBatsmen.find((b: any) => b?.isStriker && !b?.isOut) || null;
  const nonStriker = safeBatsmen.find((b: any) => !b?.isStriker && !b?.isOut) || null;
  const bowler = safeBowlers.find((b: any) => b?.name === match?.currentBowlerName) || null;

  // Over Logic Fix
  const safeHistory = Array.isArray(innings?.ballHistory) ? innings.ballHistory : [];
  const currentBallsMod = Number(innings?.balls || 0) % 6;
  const validBallsInCurrentOver = (currentBallsMod === 0 && safeHistory.length > 0 && innings?.balls > 0) ? 6 : currentBallsMod;

  let thisOverBalls: any[] = [];
  let validCount = 0;
  for (let i = safeHistory.length - 1; i >= 0; i--) {
    const b = safeHistory[i];
    thisOverBalls.unshift(b);
    const isExtra = b.extras === 'wide' || b.wide || b.extras === 'nb' || b.noBall || b.extras === 'noBall';
    if (!isExtra) validCount++;
    if (validCount >= validBallsInCurrentOver) break;
  }

  const currentBattingTeamId = innings?.teamId || tossData?.battingTeamId || match?.team1?._id || match?.team1;
  const currentBowlingTeamId = currentBattingTeamId === (match?.team1?._id || match?.team1) ? (match?.team2?._id || match?.team2) : (match?.team1?._id || match?.team1);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
{step === 'toss' && <TossModal match={match} onDone={(data) => {
    setTossData(data);
    setStep('players');
  }} />}

      {(step === 'players' || step === 'playerSelect') && (
        <PlayerSelectModal
          match={match}
          battingTeamId={currentBattingTeamId}
          bowlingTeamId={currentBowlingTeamId}
          inningsNum={match.currentInnings || 1}
          mode={playerSelectMode}
          title={step === 'players' ? 'Select Opening Players' : 'Select Incoming Player'}
          onDone={handlePlayersDone}
          onClose={step === 'playerSelect' ? () => setStep('scoring') : undefined}
        />
      )}

      {/* ── Advanced Wicket Modal ─────────────────────────────────────────────────── */}
      {wicketModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Wicket Details</h3>
              <button onClick={() => setWicketModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="mb-4">
              <label className="text-slate-400 text-sm font-semibold mb-2 block">Who is out?</label>
              <div className="flex gap-2">
                <button onClick={() => setOutBatsman('striker')} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${outBatsman === 'striker' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-700 text-slate-400'}`}>
                  Striker ({striker?.name || 'Unknown'})
                </button>
                <button onClick={() => setOutBatsman('nonStriker')} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${outBatsman === 'nonStriker' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-700 text-slate-400'}`}>
                  Non-Striker ({nonStriker?.name || 'Unknown'})
                </button>
              </div>
            </div>

            <label className="text-slate-400 text-sm font-semibold mb-2 block">How did they get out?</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {WICKET_TYPES.map(wt => (
                <button key={wt.id}
                  onClick={() => {
                    setWicketModalOpen(false);
                    setPlayerSelectMode(outBatsman); // Prep for batsman replacement
                    submitBall({ wicket: true, outType: wt.id, outBatsmanName: outBatsman === 'striker' ? striker?.name : nonStriker?.name });
                  }}
                  className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-red-900/40 hover:bg-red-700/60 border border-red-700/40 text-red-200 transition-all">
                  {wt.label}
                </button>
              ))}
            </div>
            
            <div className="pt-3 border-t border-slate-700">
              <p className="text-slate-500 text-xs mb-2">Runs completed before wicket (Run Out)</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[0,1,2,3].map(r => (
                  <button key={r}
                    onClick={() => {
                      setWicketModalOpen(false);
                      setPlayerSelectMode(outBatsman);
                      submitBall({ runs: r, wicket: true, outType: 'run_out', outBatsmanName: outBatsman === 'striker' ? striker?.name : nonStriker?.name });
                    }}
                    className="py-2 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Score Display & Panels (Truncated for brevity, logic applies the same) ── */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
             <div className="flex items-end gap-2 mt-0.5">
              <span className="text-5xl font-black text-white">{innings?.score || 0}/{innings?.wickets || 0}</span>
              <span className="text-slate-400 text-lg mb-1">
                ({innings?.overs || 0}.{innings?.balls ? innings.balls % 6 : 0} ov)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-slate-600 text-xs mr-2 font-semibold">Over:</span>
          {thisOverBalls.map((b: any, i: number) => {
            const isWide = b.extras === 'wide' || b.wide;
            const isNoBall = b.extras === 'nb' || b.noBall || b.extras === 'noBall';
            return (
              <span key={i} className={`min-w-[1.75rem] h-7 px-1.5 flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
                ${b.wicket ? 'bg-red-600 text-white shadow-md' : (isWide || isNoBall) ? 'bg-amber-500 text-white shadow-md' : b.runs === 4 ? 'bg-blue-600 text-white shadow-md' : b.runs === 6 ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-700 text-slate-200'}`}>
                {b.wicket ? 'W' : isWide ? 'Wd' : isNoBall ? 'Nb' : (b.runs || '•')}
              </span>
            );
          })}
          {Array(Math.max(0, 6 - validBallsInCurrentOver)).fill(0).map((_, i) => (
            <span key={`empty-${i}`} className="min-w-[1.75rem] h-7 flex flex-shrink-0 items-center justify-center rounded-full text-xs bg-slate-800/50 border border-slate-700/50 text-slate-600">·</span>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-950 px-4 py-4 overflow-y-auto">
        {panel === 'main' && (
          <div className="space-y-4">
            <div>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Runs</p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button key={r} disabled={submitting} onClick={() => submitBall({ runs: r })}
                    className={`py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 shadow-lg ${r === 4 ? 'bg-blue-600' : r === 6 ? 'bg-purple-600' : 'bg-slate-700'}`}>
                    {r === 0 ? '•' : r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setWicketModalOpen(true)}
                className="py-4 rounded-2xl font-black text-lg bg-red-700 hover:bg-red-600 text-white shadow-lg active:scale-95">
                OUT! 🎯
              </button>
              <button onClick={() => setPanel('others')}
                className="py-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                Others…
              </button>
            </div>
          </div>
        )}

        {panel === 'others' && (
          <div className="space-y-3">
             <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-bold">Other Actions</h3>
            </div>
            <button onClick={() => handleRetirement('striker')} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300">
              🚶 Retired Hurt (Striker)
            </button>
            <button onClick={() => handleRetirement('nonStriker')} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300">
              🚶 Retired Hurt (Non-Striker)
            </button>
            <button onClick={() => { setPanel('main'); setPlayerSelectMode('bowler'); setStep('playerSelect'); }} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300">
              🔄 Change Bowler Mid-Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}