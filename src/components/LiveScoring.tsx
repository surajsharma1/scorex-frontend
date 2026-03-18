import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import {
  RotateCcw, LogOut, ChevronRight, Zap, AlertTriangle, X,
  RefreshCw, Users, Target, TrendingUp, Award
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

// ─── Wicket types ─────────────────────────────────────────────────────────────
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
  { id: 'retired_hurt', label: 'Retired Hurt' },
];

// ─── Toss Modal ───────────────────────────────────────────────────────────────
function TossModal({ match, onDone }: { match: any; onDone: (data: any) => void }) {
  const [tossWinner, setTossWinner] = useState('');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');

  const submit = () => {
    if (!tossWinner) return;
    const team = match.team1._id === tossWinner || match.team1?._id === tossWinner
      ? match.team1 : match.team2;
    const other = team._id === (match.team1._id || match.team1) ? match.team2 : match.team1;
    const battingTeam = decision === 'bat' ? team : other;
    const bowlingTeam = decision === 'bat' ? other : team;
    onDone({
      tossWinnerId: tossWinner,
      tossWinnerName: team.name || team.team1Name,
      tossDecision: decision,
      battingTeamId: battingTeam._id,
      battingTeamName: battingTeam.name,
      bowlingTeamId: bowlingTeam._id,
      bowlingTeamName: bowlingTeam.name,
    });
  };

  const t1 = match.team1;
  const t2 = match.team2;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-black text-white mb-6 text-center flex items-center justify-center gap-2">
          <span className="text-3xl">🪙</span> Toss
        </h2>
        <div className="space-y-5">
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-2 block">Who won the toss?</label>
            <div className="grid grid-cols-2 gap-3">
              {[t1, t2].map(team => (
                <button key={team._id} onClick={() => setTossWinner(team._id)}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${tossWinner === team._id ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  {team.name}
                </button>
              ))}
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
  match, battingTeamId, bowlingTeamId, inningsNum,
  title, onDone, requireAll = true
}: {
  match: any; battingTeamId: string; bowlingTeamId: string;
  inningsNum: number; title: string;
  onDone: (data: { striker: string; nonStriker: string; bowler: string }) => void;
  requireAll?: boolean;
}) {
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  // Get batting/bowling teams
  const battingTeam = match.team1?._id === battingTeamId || match.team1?.toString() === battingTeamId
    ? match.team1 : match.team2;
  const bowlingTeam = battingTeam === match.team1 ? match.team2 : match.team1;

  const battingPlayers: any[] = battingTeam?.players || [];
  const bowlingPlayers: any[] = bowlingTeam?.players || [];

  const valid = requireAll ? (striker && nonStriker && bowler && striker !== nonStriker) : (striker || nonStriker || bowler);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg my-4">
        <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" /> {title}
        </h2>
        <p className="text-slate-500 text-xs mb-4">Innings {inningsNum} | {battingTeam?.name} batting vs {bowlingTeam?.name}</p>

        <div className="space-y-4">
          {/* Striker */}
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🏏 Striker (On Strike)</label>
            {battingPlayers.length > 0 ? (
              <select value={striker} onChange={e => setStriker(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Select Striker --</option>
                {battingPlayers.filter((p: any) => p.name !== nonStriker).map((p: any) => (
                  <option key={p._id || p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input value={striker} onChange={e => setStriker(e.target.value)} placeholder="Enter striker name"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            )}
          </div>

          {/* Non-Striker */}
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🏏 Non-Striker</label>
            {battingPlayers.length > 0 ? (
              <select value={nonStriker} onChange={e => setNonStriker(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Select Non-Striker --</option>
                {battingPlayers.filter((p: any) => p.name !== striker).map((p: any) => (
                  <option key={p._id || p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input value={nonStriker} onChange={e => setNonStriker(e.target.value)} placeholder="Enter non-striker name"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            )}
          </div>

          {/* Bowler */}
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🎳 Bowler</label>
            {bowlingPlayers.length > 0 ? (
              <select value={bowler} onChange={e => setBowler(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="">-- Select Bowler --</option>
                {bowlingPlayers.map((p: any) => (
                  <option key={p._id || p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input value={bowler} onChange={e => setBowler(e.target.value)} placeholder="Enter bowler name"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            )}
          </div>

          <button onClick={() => valid && onDone({ striker, nonStriker, bowler })}
            disabled={!valid}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all mt-2">
            Start Scoring →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Innings Break ────────────────────────────────────────────────────────────
function InningsBreak({ match, onContinue }: { match: any; onContinue: () => void }) {
  const innings1 = match.innings?.[0];
  const target = (innings1?.score || 0) + 1;
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🏏</div>
        <h2 className="text-2xl font-black text-white mb-2">Innings Break</h2>
        <p className="text-slate-400 mb-6">1st Innings Complete</p>
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <p className="text-slate-400 text-sm mb-1">{innings1?.teamName || 'Team 1'} scored</p>
          <p className="text-4xl font-black text-white">{innings1?.score}/{innings1?.wickets}</p>
          <p className="text-slate-400 text-sm mt-1">{innings1?.overs?.toFixed ? innings1.overs.toFixed(1) : 0} overs</p>
        </div>
        <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 mb-6">
          <p className="text-blue-400 font-bold text-lg">Target: {target}</p>
          <p className="text-slate-400 text-sm">2nd innings team needs {target} to win</p>
        </div>
        <button onClick={onContinue}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
          Select Players for 2nd Innings →
        </button>
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
  const [wicketModal, setWicketModal] = useState<{ open: boolean; baseData: BallData }>({ open: false, baseData: {} });
  const [tossData, setTossData] = useState<any>(null);

  // Fetch match
  const fetchMatch = useCallback(async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      const m = res.data.data;
      setMatch(m);
      // Determine step from match state
      if (m.status === 'completed') setStep('done');
      else if (m.status === 'live') {
        const innings = m.innings?.[m.currentInnings - 1];
        if (!innings || (!m.strikerName && !m.nonStrikerName)) setStep('players');
        else setStep('scoring');
      } else setStep('toss');
    } catch (e) {
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  useEffect(() => {
    if (!id) return;
    socket.emit('joinMatch', id);
    socket.on('scoreUpdate', (data: any) => {
      if (data.match) setMatch(data.match);
    });
    socket.on('inningsEnded', () => fetchMatch());
    socket.on('matchEnded', (data: any) => {
      setMatch(data);
      setStep('done');
    });
    return () => {
      socket.emit('leaveMatch', id);
      socket.off('scoreUpdate');
      socket.off('inningsEnded');
      socket.off('matchEnded');
    };
  }, [id, fetchMatch]);

  // ── Toss done ──────────────────────────────────────────────────────────────
  const handleTossDone = (data: any) => {
    setTossData(data);
    setStep('players');
  };

  // ── Players selected (start match or select mid-innings) ───────────────────
  const handlePlayersDone = async (players: { striker: string; nonStriker: string; bowler: string }) => {
    if (!id || !match) return;
    setSubmitting(true);
    try {
      if (match.status !== 'live') {
        // Start match with toss + players
        await matchAPI.startMatch(id, { ...tossData, ...players });
      } else {
        // Mid-innings player selection (after over or wicket)
        await matchAPI.selectPlayers(id, players);
      }
      await fetchMatch();
      setStep('scoring');
      setPanel('main');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to start/select players');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit ball ────────────────────────────────────────────────────────────
  const submitBall = async (data: BallData) => {
    if (!id || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await matchAPI.addBall(id, data);
      const result = res.data.data;
      const updatedMatch = res.data.match;
      setMatch(updatedMatch);
      setLastBall(result?.ballDescription || '');
      setPanel('main');

      if (result?.matchEnded) {
        setStep('done');
      } else if (result?.inningsEnded) {
        setStep('inningsBreak');
      } else if (result?.needPlayerSelection) {
        setStep('playerSelect');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to record ball');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Undo ───────────────────────────────────────────────────────────────────
  const handleUndo = async () => {
    if (!id || submitting) return;
    if (!confirm('Undo last ball?')) return;
    setSubmitting(true);
    try {
      const res = await matchAPI.undoBall(id);
      setMatch(res.data.data);
      setLastBall('↩ Undone');
      setPanel('main');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cannot undo');
    } finally {
      setSubmitting(false);
    }
  };

  // ── End innings manually ───────────────────────────────────────────────────
  const handleEndInnings = async () => {
    if (!confirm('End current innings?')) return;
    setSubmitting(true);
    try {
      await matchAPI.endInnings(id!);
      await fetchMatch();
      setStep('inningsBreak');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── End match ──────────────────────────────────────────────────────────────
  const handleEndMatch = async () => {
    if (!confirm('End the match?')) return;
    setSubmitting(true);
    try {
      await matchAPI.endMatch(id!, {});
      await fetchMatch();
      setStep('done');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Innings break continue ─────────────────────────────────────────────────
  const handleInningsBreakContinue = () => {
    setStep('playerSelect');
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const innings = match?.innings?.[match?.currentInnings - 1] || {};
  // Safe batsman/bowler lookups - prevent array errors
  const safeBatsmen = Array.isArray(innings?.batsmen) ? innings.batsmen : [];
  const safeBowlers = Array.isArray(innings?.bowlers) ? innings.bowlers : [];
  const striker = safeBatsmen.find((b: any) => b?.isStriker && !b?.isOut) || null;
  const nonStriker = safeBatsmen.find((b: any) => !b?.isStriker && !b?.isOut) || null;
  const bowler = safeBowlers.find((b: any) => b?.name === match?.currentBowlerName) || null;
  const score = innings?.score || 0;
  const wickets = innings?.wickets || 0;
  const oversDisplay = `${innings?.overs || 0}.${innings?.balls ? innings.balls % 6 : 0}`;
  const runRate = innings?.runRate?.toFixed(2) || '0.00';
  const target = innings?.targetScore;
  const requiredRuns = innings?.requiredRuns;
  const rrr = innings?.requiredRunRate?.toFixed(2);

  // Current over balls from history - DEFENSIVE AGAINST RangeError
  const ballsInOver = Math.max(0, Math.floor(Number(innings?.balls || 0) % 6));
  const safeHistory = Array.isArray(innings?.ballHistory) ? innings.ballHistory : [];
  const safeSliceLen = Math.max(0, Math.min(ballsInOver, safeHistory.length));
  const thisOverBalls = safeHistory.slice(-safeSliceLen);

  // ── Get batting/bowling team IDs for player selection ─────────────────────
  const currentBattingTeamId = innings?.teamId || tossData?.battingTeamId || match?.team1?._id;
  const currentBowlingTeamId = currentBattingTeamId === match?.team1?._id ? match?.team2?._id : match?.team1?._id;

  // ── Wicket modal handler ───────────────────────────────────────────────────
  const openWicketModal = (baseData: BallData = {}) => {
    setWicketModal({ open: true, baseData });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading scoreboard...</p>
      </div>
    </div>
  );

  if (!match) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-xl mb-4">Match not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-400 hover:underline">Go back</button>
      </div>
    </div>
  );

  // ── DONE state ─────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-md w-full">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-2xl font-black text-white mb-2">Match Completed</h2>
        {match.winnerName && <p className="text-green-400 text-lg font-semibold mb-4">{match.winnerName} won!</p>}
        {match.resultSummary && <p className="text-slate-400 mb-6">{match.resultSummary}</p>}
        <button onClick={() => navigate(-1)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
          Back to Match
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {step === 'toss' && <TossModal match={match} onDone={handleTossDone} />}

      {(step === 'players' || step === 'playerSelect') && (
        <PlayerSelectModal
          match={match}
          battingTeamId={currentBattingTeamId}
          bowlingTeamId={currentBowlingTeamId}
          inningsNum={match.currentInnings || 1}
          title={step === 'players' ? 'Select Opening Players' : 'Select Players for Next Over'}
          onDone={handlePlayersDone}
        />
      )}

      {step === 'inningsBreak' && <InningsBreak match={match} onContinue={handleInningsBreakContinue} />}

      {/* ── Wicket Modal ─────────────────────────────────────────────────── */}
      {wicketModal.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Wicket Type</h3>
              <button onClick={() => setWicketModal({ open: false, baseData: {} })} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {WICKET_TYPES.map(wt => (
                <button key={wt.id}
                  onClick={() => {
                    setWicketModal({ open: false, baseData: {} });
                    submitBall({ ...wicketModal.baseData, wicket: true, outType: wt.id, outBatsmanName: match?.strikerName });
                  }}
                  className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-red-900/40 hover:bg-red-700/60 border border-red-700/40 text-red-200 transition-all">
                  {wt.label}
                </button>
              ))}
            </div>
            {/* Also allow runs with wicket */}
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-slate-500 text-xs mb-2">Runs before wicket</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[0,1,2,3].map(r => (
                  <button key={r}
                    onClick={() => {
                      setWicketModal({ open: false, baseData: {} });
                      submitBall({ ...wicketModal.baseData, runs: r, wicket: true, outType: wicketModal.baseData.outType || 'bowled', outBatsmanName: match?.strikerName });
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

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-white text-sm">{match.name}</h1>
            <p className="text-slate-500 text-xs">{match.venue} · {match.format}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUndo} disabled={submitting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-400 text-xs font-semibold transition-all disabled:opacity-40">
              <RotateCcw className="w-3.5 h-3.5" /> Undo
            </button>
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-all">
              <LogOut className="w-3.5 h-3.5" /> Leave
            </button>
          </div>
        </div>
      </div>

      {/* ── Score Display ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              {innings?.teamName || match.team1Name} · Inn {match.currentInnings}
            </p>
            <div className="flex items-end gap-2 mt-0.5">
              <span className="text-5xl font-black text-white leading-none">{score}/{wickets}</span>
              <span className="text-slate-400 text-lg mb-1">({oversDisplay} ov)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 text-xs mb-1">Run Rate</div>
            <div className="text-2xl font-black text-green-400">{runRate}</div>
            {target && (
              <div className="mt-1">
                <div className="text-xs text-blue-400 font-semibold">Target {target}</div>
                <div className="text-xs text-slate-400">Need {requiredRuns} @ {rrr}</div>
              </div>
            )}
          </div>
        </div>

        {/* Current over balls */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-slate-600 text-xs mr-1">Over:</span>
          {thisOverBalls.map((b: any, i: number) => (
            <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold
              ${b.wicket ? 'bg-red-600 text-white' : b.extras ? 'bg-amber-600/80 text-white' : b.runs === 4 ? 'bg-blue-600 text-white' : b.runs === 6 ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {b.wicket ? 'W' : b.extras === 'wide' ? 'Wd' : b.extras === 'nb' ? 'Nb' : (b.runs || '•')}
            </span>
          ))}
          {Array(6 - thisOverBalls.length).fill(0).map((_, i) => (
            <span key={`empty-${i}`} className="w-7 h-7 flex items-center justify-center rounded-full text-xs bg-slate-800/50 text-slate-700">·</span>
          ))}
        </div>

        {/* Players */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2.5">
            <div className="text-slate-500 mb-0.5 flex items-center gap-1">🏏 Striker</div>
            <div className="text-white font-semibold truncate">{striker?.name || match.strikerName || '–'}</div>
            {striker && <div className="text-slate-400 mt-0.5">{striker.runs}({striker.balls}) SR:{striker.strikeRate?.toFixed(0)}</div>}
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5">
            <div className="text-slate-500 mb-0.5">⬤ Non-Striker</div>
            <div className="text-white font-semibold truncate">{nonStriker?.name || match.nonStrikerName || '–'}</div>
            {nonStriker && <div className="text-slate-400 mt-0.5">{nonStriker.runs}({nonStriker.balls})</div>}
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5">
            <div className="text-slate-500 mb-0.5">🎳 Bowler</div>
            <div className="text-white font-semibold truncate">{bowler?.name || match.currentBowlerName || '–'}</div>
            {bowler && <div className="text-slate-400 mt-0.5">{bowler.overs}.{bowler.balls % 6}ov {bowler.runs}R {bowler.wickets}W</div>}
          </div>
        </div>

        {lastBall && (
          <div className="mt-2 text-center">
            <span className="text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-slate-300">
              Last: {lastBall}
            </span>
          </div>
        )}
        {error && (
          <div className="mt-2 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-xs">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* ── Scoring Panels ───────────────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-950 px-4 py-4 overflow-y-auto">

        {/* MAIN PANEL */}
        {panel === 'main' && (
          <div className="space-y-4">
            {/* Run buttons */}
            <div>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Runs</p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button key={r} disabled={submitting}
                    onClick={() => submitBall({ runs: r })}
                    className={`py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 shadow-lg
                      ${r === 4 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30' :
                        r === 6 ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30' :
                        r === 0 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' :
                        'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                    {r === 0 ? '•' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Extras + Special buttons */}
            <div>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Extras & Wickets</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Wide', icon: '↔', panel: 'wide' as ScoringPanel, color: 'bg-amber-600/20 border-amber-600/40 text-amber-300 hover:bg-amber-600/40' },
                  { label: 'No Ball', icon: '⊘', panel: 'noBall' as ScoringPanel, color: 'bg-orange-600/20 border-orange-600/40 text-orange-300 hover:bg-orange-600/40' },
                  { label: 'Bye', icon: 'B', panel: 'bye' as ScoringPanel, color: 'bg-teal-600/20 border-teal-600/40 text-teal-300 hover:bg-teal-600/40' },
                  { label: 'Leg Bye', icon: 'LB', panel: 'legBye' as ScoringPanel, color: 'bg-cyan-600/20 border-cyan-600/40 text-cyan-300 hover:bg-cyan-600/40' },
                ].map(btn => (
                  <button key={btn.label} onClick={() => setPanel(btn.panel)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all flex items-center gap-2 ${btn.color}`}>
                    <span className="font-black">{btn.icon}</span> {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => openWicketModal({})}
                className="py-4 rounded-2xl font-black text-lg bg-red-700 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-700/30 active:scale-95">
                OUT! 🎯
              </button>
              <button onClick={() => setPanel('others')}
                className="py-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all">
                Others…
              </button>
            </div>
          </div>
        )}

        {/* WIDE PANEL */}
        {panel === 'wide' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-bold">Wide Ball</h3>
            </div>
            <p className="text-slate-500 text-sm">Select extra runs (1 wide already counted)</p>
            <RunButtons onSelect={r => submitBall({ wide: true, runs: r })} disabled={submitting} extraLabel="Wd" />
            <div className="border-t border-slate-800 pt-4">
              <p className="text-slate-500 text-xs mb-3">Wide + Wicket (run-out, stumped off wide)</p>
              <div className="grid grid-cols-2 gap-2">
                {['run_out', 'stumped', 'obstructing', 'hit_wicket'].map(wt => (
                  <button key={wt} onClick={() => { setPanel('main'); submitBall({ wide: true, runs: 0, wicket: true, outType: wt, outBatsmanName: match?.strikerName }); }}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 transition-all capitalize">
                    {wt.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NO BALL PANEL */}
        {panel === 'noBall' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-bold">No Ball</h3>
            </div>
            <p className="text-slate-500 text-sm">Runs scored off the bat (1 no-ball extra auto-added)</p>
            <RunButtons onSelect={r => submitBall({ noBall: true, runs: r })} disabled={submitting} extraLabel="NB" />
            <div className="border-t border-slate-800 pt-4">
              <p className="text-slate-500 text-xs mb-3">No Ball + Wicket (run out only)</p>
              <button onClick={() => { setPanel('main'); submitBall({ noBall: true, runs: 0, wicket: true, outType: 'run_out', outBatsmanName: match?.strikerName }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 transition-all w-full">
                Run Out (off No Ball)
              </button>
            </div>
          </div>
        )}

        {/* BYE PANEL */}
        {panel === 'bye' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-bold">Byes</h3>
            </div>
            <p className="text-slate-500 text-sm">Runs scored as byes (ball missed bat and keeper)</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(r => (
                <button key={r} disabled={submitting}
                  onClick={() => { setPanel('main'); submitBall({ bye: r }); }}
                  className="py-4 rounded-xl font-bold text-lg bg-teal-900/40 hover:bg-teal-700/60 border border-teal-700/40 text-teal-200 transition-all">
                  B{r}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-800 pt-4">
              <p className="text-slate-500 text-xs mb-3">Bye + Wicket (run out)</p>
              <button onClick={() => { setPanel('main'); submitBall({ bye: 0, wicket: true, outType: 'run_out', outBatsmanName: match?.strikerName }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 transition-all w-full">
                Run Out (off Bye)
              </button>
            </div>
          </div>
        )}

        {/* LEG BYE PANEL */}
        {panel === 'legBye' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-bold">Leg Byes</h3>
            </div>
            <p className="text-slate-500 text-sm">Runs scored off the body (leg byes)</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(r => (
                <button key={r} disabled={submitting}
                  onClick={() => { setPanel('main'); submitBall({ legBye: r }); }}
                  className="py-4 rounded-xl font-bold text-lg bg-cyan-900/40 hover:bg-cyan-700/60 border border-cyan-700/40 text-cyan-200 transition-all">
                  LB{r}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-800 pt-4">
              <p className="text-slate-500 text-xs mb-3">Leg Bye + Wicket (run out)</p>
              <button onClick={() => { setPanel('main'); submitBall({ legBye: 0, wicket: true, outType: 'run_out', outBatsmanName: match?.strikerName }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 transition-all w-full">
                Run Out (off Leg Bye)
              </button>
            </div>
          </div>
        )}

        {/* OTHERS PANEL */}
        {panel === 'others' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-bold">Other Actions</h3>
            </div>
            <button onClick={() => { setPanel('main'); submitBall({ retired: true }); }}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all text-left">
              🚶 Retired Hurt (batsman retires)
            </button>
            <button onClick={() => { setPanel('main'); setStep('playerSelect'); }}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all text-left">
              🔄 Player Substitution (change player)
            </button>
            {[1,2,3,4,5].map(p => (
              <button key={p} onClick={() => { setPanel('main'); submitBall({ penalty: p }); }}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all text-left">
                ⚡ +{p} Penalty Run{p > 1 ? 's' : ''}
              </button>
            ))}
            <div className="border-t border-slate-800 pt-3">
              <button onClick={handleEndInnings} disabled={submitting}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 transition-all disabled:opacity-40">
                🔚 End Innings Manually
              </button>
              <button onClick={handleEndMatch} disabled={submitting}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/40 border border-red-700/40 text-red-300 transition-all mt-2 disabled:opacity-40">
                🏁 End Match
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 grid grid-cols-2 gap-3">
        <button onClick={handleEndInnings} disabled={submitting}
          className="py-3 rounded-xl font-semibold text-sm bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" /> Change Inning
        </button>
        <button onClick={() => navigate(-1)}
          className="py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> Leave & Save
        </button>
      </div>

      {submitting && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-300 flex items-center gap-2 shadow-xl z-40">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Recording...
        </div>
      )}
    </div>
  );
}
