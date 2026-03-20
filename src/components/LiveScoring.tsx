import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import {
  RotateCcw, LogOut, ChevronRight, Zap, AlertTriangle, X,
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
        <h2 className="text-2xl font-black text-white mb-6 text-center flex items-center justify-center gap-2">
          <span className="text-3xl">🪙</span> Toss
        </h2>
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
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all mt-4">
            Continue to Player Selection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SMART PRE-FILLED MODAL ───────────────────────────────────────────────────
function PlayerSelectModal({
  match, battingTeamId, bowlingTeamId, inningsNum, mode, title,
  defaultStriker = '', defaultNonStriker = '', defaultBowler = '', lastBowler = '',
  onDone, onClose
}: any) {
  const [striker, setStriker] = useState(defaultStriker);
  const [nonStriker, setNonStriker] = useState(defaultNonStriker);
  const [bowler, setBowler] = useState(defaultBowler);

  useEffect(() => {
    setStriker(defaultStriker);
    setNonStriker(defaultNonStriker);
    setBowler(defaultBowler);
  }, [defaultStriker, defaultNonStriker, defaultBowler]);

  const t1Id = match.team1?._id || match.team1;
  const battingTeam = t1Id === battingTeamId ? match.team1 : match.team2;
  const bowlingTeam = battingTeam === match.team1 ? match.team2 : match.team1;
  const bPlayers: any[] = battingTeam?.players || [];
  const bowlPlayers: any[] = bowlingTeam?.players || [];

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
        {onClose && <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>}
        <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> {title}</h2>
        <p className="text-slate-500 text-xs mb-5">Innings {inningsNum} | {battingTeam?.name || 'Batting Team'} vs {bowlingTeam?.name || 'Bowling Team'}</p>

        <div className="space-y-4">
          {(mode === 'all' || mode === 'striker') && (
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🏏 Incoming Striker</label>
              <select value={striker} onChange={e => setStriker(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm">
                <option value="">-- Select Player --</option>
                {bPlayers.map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          )}
          {(mode === 'all' || mode === 'nonStriker') && (
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🏏 Incoming Non-Striker</label>
              <select value={nonStriker} onChange={e => setNonStriker(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm">
                <option value="">-- Select Player --</option>
                {bPlayers.filter((p: any) => p.name !== striker).map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          )}
          {(mode === 'all' || mode === 'bowler') && (
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-1.5 flex justify-between">
                <span>🎳 New Bowler</span>
                {lastBowler && <span className="text-slate-500 text-xs">Last: {lastBowler}</span>}
              </label>
              <select value={bowler} onChange={e => setBowler(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm">
                <option value="">-- Select Bowler --</option>
                {bowlPlayers.map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => isValid() && onDone({ striker, nonStriker, bowler })} disabled={!isValid()} className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold rounded-xl mt-2">Confirm Selection</button>
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
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <p className="text-slate-400 text-sm">{innings1?.teamName || 'Team 1'} scored</p>
          <p className="text-4xl font-black text-white">{innings1?.score}/{innings1?.wickets}</p>
          <p className="text-slate-400 text-sm mt-1">{innings1?.overs?.toFixed ? innings1.overs.toFixed(1) : 0} overs</p>
        </div>
        <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 mb-6"><p className="text-blue-400 font-bold text-lg">Target: {target}</p></div>
        <button onClick={onContinue} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">Select Players for 2nd Innings →</button>
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
  const [wicketModal, setWicketModal] = useState<{ open: boolean; baseData: BallData }>({ open: false, baseData: {} });
  const [outBatsman, setOutBatsman] = useState<'striker' | 'nonStriker'>('striker');
  const [manualPlayerSelectMode, setManualPlayerSelectMode] = useState<PlayerSelectMode>('all');

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
          setManualPlayerSelectMode('all');
          setStep('players');
        }
        else setStep('scoring');
      } else setStep('toss');
    } catch (e) { setError('Failed to load match'); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  useEffect(() => {
    if (!id) return;
    socket.joinMatch(id);
    socket.get().on('scoreUpdate', (data: any) => { if (data.match) setMatch(data.match); });
    socket.get().on('inningsEnded', () => fetchMatch());
    socket.get().on('matchEnded', (data: any) => { setMatch(data); setStep('done'); });
    return () => { socket.leaveMatch(id); socket.get().off('scoreUpdate'); socket.get().off('inningsEnded'); socket.get().off('matchEnded'); };
  }, [id, fetchMatch]);

  const handleTossDone = (data: any) => {
    setTossData(data);
    setStep('players');
  };

  const handlePlayersDone = async (players: { striker?: string; nonStriker?: string; bowler?: string }) => {
    if (!id || !match) return;
    setSubmitting(true);
    try {
      if (match.status !== 'live') await matchAPI.startMatch(id, { ...tossData, striker: players.striker, nonStriker: players.nonStriker, bowler: players.bowler });
      else await matchAPI.selectPlayers(id, players);
      await fetchMatch();
      setStep('scoring');
      setPanel('main');
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to update players'); } finally { setSubmitting(false); }
  };

  const submitBall = async (data: BallData) => {
    if (!id || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await matchAPI.addBall(id, data);
      await fetchMatch(); // Refetch perfectly syncs active players from backend
      setLastBall(res.data.data?.ballDescription || 'Ball Recorded');
      setPanel('main');
      if (res.data.data?.matchEnded) setStep('done');
      else if (res.data.data?.inningsEnded) setStep('inningsBreak');
      else if (res.data.data?.needPlayerSelection) setStep('playerSelect');
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to record ball'); } finally { setSubmitting(false); }
  };

  const handleRetirement = (type: 'striker' | 'nonStriker') => {
    setPanel('main');
    setManualPlayerSelectMode(type);
    setStep('playerSelect');
    submitBall({ retired: true, outBatsmanName: type === 'striker' ? match?.strikerName : match?.nonStrikerName });
  };

  const handleUndo = async () => {
    if (!id || submitting || !confirm('Undo last ball?')) return;
    setSubmitting(true);
    try { await matchAPI.undoBall(id); await fetchMatch(); setLastBall('↩ Undone'); setPanel('main'); } catch (e: any) { setError('Cannot undo'); } finally { setSubmitting(false); }
  };

  const handleEndInnings = async () => {
    if (!confirm('End current innings?')) return;
    setSubmitting(true);
    try { await matchAPI.endInnings(id!); await fetchMatch(); setStep('inningsBreak'); } catch (e: any) { } finally { setSubmitting(false); }
  };

  const handleEndMatch = async () => {
    if (!confirm('End the match?')) return;
    setSubmitting(true);
    try { await matchAPI.endMatch(id!, {}); await fetchMatch(); setStep('done'); } catch (e: any) { } finally { setSubmitting(false); }
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const innings = match?.innings?.[match?.currentInnings - 1] || {};
  const safeBatsmen = Array.isArray(innings?.batsmen) ? innings.batsmen : [];
  const safeBowlers = Array.isArray(innings?.bowlers) ? innings.bowlers : [];

  const score = innings?.score || 0;
  const wickets = innings?.wickets || 0;
  const oversDisplay = `${innings?.overs || 0}.${innings?.balls ? innings.balls % 6 : 0}`;
  const runRate = innings?.runRate?.toFixed(2) || '0.00';
  const target = innings?.targetScore;
  const requiredRuns = innings?.requiredRuns;
  const rrr = innings?.requiredRunRate?.toFixed(2);

  const safeHistory = Array.isArray(innings?.ballHistory) ? innings.ballHistory : [];
  const currentBallsMod = Number(innings?.balls || 0) % 6;
  const validBallsInCurrentOver = (currentBallsMod === 0 && safeHistory.length > 0 && innings?.balls > 0) ? 6 : currentBallsMod;

  let thisOverBalls: any[] = [];
  let validCount = 0;
  for (let i = safeHistory.length - 1; i >= 0; i--) {
    const b = safeHistory[i]; thisOverBalls.unshift(b);
    if (!(b.extras === 'wide' || b.wide || b.extras === 'nb' || b.noBall || b.extras === 'noBall')) validCount++;
    if (validCount >= validBallsInCurrentOver) break;
  }

  const currentBattingTeamId = innings?.teamId || tossData?.battingTeamId || match?.team1?._id || match?.team1;
  const currentBowlingTeamId = currentBattingTeamId === (match?.team1?._id || match?.team1) ? (match?.team2?._id || match?.team2) : (match?.team1?._id || match?.team1);

  // --- DYNAMIC GAP DETECTION FOR PLAYER SELECTION ---
  const isOverEnd = innings?.balls > 0 && innings?.balls % 6 === 0;
  const activeStriker = safeBatsmen.find((b: any) => b?.isStriker && !b?.isOut);
  const activeNonStriker = safeBatsmen.find((b: any) => !b?.isStriker && !b?.isOut && b?.enteredAt !== undefined);

  let dynamicSelectMode: PlayerSelectMode = 'all';
  if (step === 'players') dynamicSelectMode = 'all';
  else if (!activeStriker && activeNonStriker) dynamicSelectMode = 'striker';
  else if (activeStriker && !activeNonStriker) dynamicSelectMode = 'nonStriker';
  else if (activeStriker && activeNonStriker && isOverEnd) dynamicSelectMode = 'bowler';
  else dynamicSelectMode = manualPlayerSelectMode;

  let defStriker = activeStriker ? activeStriker.name : '';
  let defNonStriker = activeNonStriker ? activeNonStriker.name : '';
  let defBowler = isOverEnd ? '' : match?.currentBowlerName || '';
  if (step === 'players') { defStriker = ''; defNonStriker = ''; defBowler = ''; }

  const openWicketModal = (baseData: BallData = {}) => { setWicketModal({ open: true, baseData }); setOutBatsman('striker'); };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!match) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><p className="text-red-400 text-xl">Match not found</p></div>;
  if (step === 'done') return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-md w-full">
        <div className="text-5xl mb-4">🏆</div><h2 className="text-2xl font-black text-white mb-2">Match Completed</h2>
        {match.winnerName && <p className="text-green-400 font-semibold mb-4">{match.winnerName} won!</p>}
        {match.resultSummary && <p className="text-slate-400 mb-6">{match.resultSummary}</p>}
        <button onClick={() => navigate(-1)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4">Back to Match</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {step === 'toss' && <TossModal match={match} onDone={handleTossDone} />}

      {(step === 'players' || step === 'playerSelect') && (
        <PlayerSelectModal match={match} battingTeamId={currentBattingTeamId} bowlingTeamId={currentBowlingTeamId} inningsNum={match.currentInnings || 1}
          mode={dynamicSelectMode} title={step === 'players' ? 'Select Opening Players' : 'Select Incoming Player'}
          defaultStriker={defStriker} defaultNonStriker={defNonStriker} defaultBowler={defBowler} lastBowler={isOverEnd ? match?.currentBowlerName : ''}
          onDone={handlePlayersDone} onClose={step === 'playerSelect' ? () => setStep('scoring') : undefined} />
      )}

      {step === 'inningsBreak' && <InningsBreak match={match} onContinue={() => setStep('playerSelect')} />}

      {/* ── Wicket Modal ─────────────────────────────────────────────────── */}
      {wicketModal.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Wicket Details</h3>
              <button onClick={() => setWicketModal({ open: false, baseData: {} })} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
              <label className="text-slate-400 text-sm font-semibold mb-2 block">Who is out?</label>
              <div className="flex gap-2">
                <button onClick={() => setOutBatsman('striker')} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${outBatsman === 'striker' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-700 text-slate-400'}`}>
                  Striker ({activeStriker?.name || 'Unknown'})
                </button>
                <button onClick={() => setOutBatsman('nonStriker')} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${outBatsman === 'nonStriker' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-700 text-slate-400'}`}>
                  Non-Striker ({activeNonStriker?.name || 'Unknown'})
                </button>
              </div>
            </div>
            <label className="text-slate-400 text-sm font-semibold mb-2 block">How did they get out?</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {WICKET_TYPES.map(wt => (
                <button key={wt.id} onClick={() => {
                  setWicketModal({ open: false, baseData: {} });
                  submitBall({ ...wicketModal.baseData, wicket: true, outType: wt.id, outBatsmanName: outBatsman === 'striker' ? activeStriker?.name : activeNonStriker?.name });
                }} className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-red-900/40 hover:bg-red-700/60 border border-red-700/40 text-red-200">
                  {wt.label}
                </button>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-700">
              <p className="text-slate-500 text-xs mb-2">Runs completed before wicket</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map(r => (
                  <button key={r} onClick={() => {
                    setWicketModal({ open: false, baseData: {} });
                    submitBall({ ...wicketModal.baseData, runs: r, wicket: true, outType: 'run_out', outBatsmanName: outBatsman === 'striker' ? activeStriker?.name : activeNonStriker?.name });
                  }} className="py-2 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header & Score Display ────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div><h1 className="font-bold text-white text-sm">{match.name}</h1><p className="text-slate-500 text-xs">{match.venue} · {match.format}</p></div>
          <div className="flex gap-2">
            <button onClick={handleUndo} disabled={submitting} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 text-xs font-semibold"><RotateCcw className="w-3.5 h-3.5" /> Undo</button>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"><LogOut className="w-3.5 h-3.5" /> Leave</button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{innings?.teamName || match.team1Name} · Inn {match.currentInnings}</p>
            <div className="flex items-end gap-2 mt-0.5"><span className="text-5xl font-black text-white">{score}/{wickets}</span><span className="text-slate-400 text-lg mb-1">({oversDisplay} ov)</span></div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 text-xs mb-1">Run Rate</div><div className="text-2xl font-black text-green-400">{runRate}</div>
            {target && <div className="mt-1"><div className="text-xs text-blue-400 font-semibold">Target {target}</div><div className="text-xs text-slate-400">Need {requiredRuns} @ {rrr}</div></div>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-slate-600 text-xs mr-2 font-semibold">Over:</span>
          {thisOverBalls.map((b: any, i: number) => {
            const isWide = b.extras === 'wide' || b.wide; const isNoBall = b.extras === 'nb' || b.noBall || b.extras === 'noBall';
            return <span key={i} className={`min-w-[1.75rem] h-7 px-1.5 flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${b.wicket ? 'bg-red-600 text-white shadow-md' : (isWide || isNoBall) ? 'bg-amber-500 text-white shadow-md' : b.runs === 4 ? 'bg-blue-600 text-white shadow-md' : b.runs === 6 ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-700 text-slate-200'}`}>{b.wicket ? 'W' : isWide ? 'Wd' : isNoBall ? 'Nb' : (b.runs || '•')}</span>;
          })}
          {Array(Math.max(0, 6 - validBallsInCurrentOver)).fill(0).map((_, i) => <span key={`empty-${i}`} className="min-w-[1.75rem] h-7 flex flex-shrink-0 items-center justify-center rounded-full text-xs bg-slate-800/50 border border-slate-700/50 text-slate-600">·</span>)}
        </div>

        {/* Dynamic Players Display */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2.5">
            <div className="text-slate-500 mb-0.5 flex items-center gap-1">🏏 Striker</div>
            <div className="text-white font-semibold truncate">{activeStriker?.name || match.strikerName || '–'}</div>
            {activeStriker && <div className="text-slate-400 mt-0.5">{activeStriker.runs}({activeStriker.balls}) SR:{activeStriker.strikeRate?.toFixed(0)}</div>}
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5">
            <div className="text-slate-500 mb-0.5">⬤ Non-Striker</div>
            <div className="text-white font-semibold truncate">{activeNonStriker?.name || match.nonStrikerName || '–'}</div>
            {activeNonStriker && <div className="text-slate-400 mt-0.5">{activeNonStriker.runs}({activeNonStriker.balls})</div>}
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5">
            <div className="text-slate-500 mb-0.5">🎳 Bowler</div>
            <div className="text-white font-semibold truncate">{match.currentBowlerName || '–'}</div>
            {match.currentBowlerName && <div className="text-slate-400 mt-0.5">{safeBowlers.find((b: any) => b.name === match.currentBowlerName)?.overs}.{safeBowlers.find((b: any) => b.name === match.currentBowlerName)?.balls % 6}ov {safeBowlers.find((b: any) => b.name === match.currentBowlerName)?.runs}R</div>}
          </div>
        </div>

        {lastBall && <div className="mt-3 text-center"><span className="text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-slate-300">Last: {lastBall}</span></div>}
        {error && <div className="mt-2 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-red-300 text-xs">{error}</span><button onClick={() => setError('')} className="ml-auto text-red-400"><X className="w-3.5 h-3.5" /></button></div>}
      </div>

      {/* ── Scoring Panels ───────────────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-950 px-4 py-4 overflow-y-auto">
        {panel === 'main' && (
          <div className="space-y-4">
            <div><p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Runs</p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button key={r} disabled={submitting} onClick={() => submitBall({ runs: r })} className={`py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 shadow-lg ${r === 4 ? 'bg-blue-600 shadow-blue-600/30' : r === 6 ? 'bg-purple-600 shadow-purple-600/30' : r === 0 ? 'bg-slate-800 text-slate-300' : 'bg-slate-700'}`}>{r === 0 ? '•' : r}</button>
                ))}
              </div>
            </div>
            <div><p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Extras & Wickets</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Wide', icon: '↔', panel: 'wide' as ScoringPanel, color: 'bg-amber-600/20 border-amber-600/40 text-amber-300' }, { label: 'No Ball', icon: '⊘', panel: 'noBall' as ScoringPanel, color: 'bg-orange-600/20 border-orange-600/40 text-orange-300' }, { label: 'Bye', icon: 'B', panel: 'bye' as ScoringPanel, color: 'bg-teal-600/20 border-teal-600/40 text-teal-300' }, { label: 'Leg Bye', icon: 'LB', panel: 'legBye' as ScoringPanel, color: 'bg-cyan-600/20 border-cyan-600/40 text-cyan-300' }].map(btn => (
                  <button key={btn.label} onClick={() => setPanel(btn.panel)} className={`py-3 px-4 rounded-xl font-bold text-sm border flex items-center gap-2 ${btn.color}`}><span className="font-black">{btn.icon}</span> {btn.label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => openWicketModal({})} className="py-4 rounded-2xl font-black text-lg bg-red-700 hover:bg-red-600 text-white shadow-lg active:scale-95">OUT! 🎯</button>
              <button onClick={() => setPanel('others')} className="py-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">Others…</button>
            </div>
          </div>
        )}

        {panel === 'wide' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">Wide Ball</h3></div>
            <RunButtons onSelect={r => submitBall({ wide: true, runs: r })} disabled={submitting} extraLabel="Wd" />
            <div className="border-t border-slate-800 pt-4"><button onClick={() => { setPanel('main'); openWicketModal({ wide: true }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full">Wicket (Off Wide)</button></div>
          </div>
        )}

        {panel === 'noBall' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">No Ball</h3></div>
            <RunButtons onSelect={r => submitBall({ noBall: true, runs: r })} disabled={submitting} extraLabel="NB" />
            <div className="border-t border-slate-800 pt-4"><button onClick={() => { setPanel('main'); openWicketModal({ noBall: true }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full">Run Out (Off No Ball)</button></div>
          </div>
        )}

        {panel === 'bye' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">Byes</h3></div>
            <div className="grid grid-cols-4 gap-2">{[1, 2, 3, 4].map(r => <button key={r} disabled={submitting} onClick={() => { setPanel('main'); submitBall({ bye: r }); }} className="py-4 rounded-xl font-bold text-lg bg-teal-900/40 hover:bg-teal-700/60 border border-teal-700/40 text-teal-200">B{r}</button>)}</div>
            <div className="border-t border-slate-800 pt-4"><button onClick={() => { setPanel('main'); openWicketModal({ bye: 0 }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full">Run Out (Off Bye)</button></div>
          </div>
        )}

        {panel === 'legBye' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">Leg Byes</h3></div>
            <div className="grid grid-cols-4 gap-2">{[1, 2, 3, 4].map(r => <button key={r} disabled={submitting} onClick={() => { setPanel('main'); submitBall({ legBye: r }); }} className="py-4 rounded-xl font-bold text-lg bg-cyan-900/40 hover:bg-cyan-700/60 border border-cyan-700/40 text-cyan-200">LB{r}</button>)}</div>
            <div className="border-t border-slate-800 pt-4"><button onClick={() => { setPanel('main'); openWicketModal({ legBye: 0 }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full">Run Out (Off Leg Bye)</button></div>
          </div>
        )}

        {panel === 'others' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4"><button onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">Other Actions</h3></div>
            <button onClick={() => handleRetirement('striker')} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300">🚶 Retired Hurt (Striker)</button>
            <button onClick={() => handleRetirement('nonStriker')} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300">🚶 Retired Hurt (Non-Striker)</button>
            <button onClick={() => { setPanel('main'); setManualPlayerSelectMode('bowler'); setStep('playerSelect'); }} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300">🔄 Change Bowler Mid-Over</button>
            <div className="pt-3 border-t border-slate-800 mt-2">
              <p className="text-slate-500 text-xs mb-2">Penalty Runs</p>
              <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(p => <button key={p} onClick={() => { setPanel('main'); submitBall({ penalty: p }); }} className="py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300">+{p}</button>)}</div>
            </div>
            <div className="border-t border-slate-800 pt-3 mt-4">
              <button onClick={handleEndInnings} disabled={submitting} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 mb-2">🔚 End Innings Manually</button>
              <button onClick={handleEndMatch} disabled={submitting} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/40 border border-red-700/40 text-red-300">🏁 End Match</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 grid grid-cols-2 gap-3">
        <button onClick={handleEndInnings} disabled={submitting} className="py-3 rounded-xl font-semibold text-sm bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 flex justify-center items-center gap-2"><RefreshCw className="w-4 h-4" /> Change Inning</button>
        <button onClick={() => navigate(-1)} className="py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex justify-center items-center gap-2"><LogOut className="w-4 h-4" /> Leave & Save</button>
      </div>

      {submitting && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-300 flex items-center gap-2 shadow-xl z-40"><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Recording...</div>
      )}
    </div>
  );
}