import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import {
  RotateCcw, LogOut, X, RefreshCw, Users, MonitorPlay,
  AlertTriangle, ChevronDown, ChevronUp, Layers, TrendingUp
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BallData { runs?: number; wide?: boolean; noBall?: boolean; bye?: number; legBye?: number; wicket?: boolean; outType?: string; outBatsmanName?: string; outFielder?: string; retired?: boolean; penalty?: number; }
type ScoringPanel = 'main' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'wicket' | 'others';
type ScoreStep = 'toss' | 'players' | 'scoring' | 'playerSelect' | 'inningsBreak' | 'done';

const WICKET_TYPES = [
  { id: 'bowled', label: 'Bowled' }, { id: 'caught', label: 'Caught' },
  { id: 'lbw', label: 'LBW' }, { id: 'run_out', label: 'Run Out' },
  { id: 'stumped', label: 'Stumped' }, { id: 'hit_wicket', label: 'Hit Wicket' },
  { id: 'handled_ball', label: 'Handled Ball' }, { id: 'obstructing', label: 'Obstructing' },
  { id: 'timed_out', label: 'Timed Out' },
];

// ─── Run Buttons (for extras panels) ─────────────────────────────────────────
function RunButtons({ onSelect, disabled = false, extraLabel = '' }: { onSelect: (r: number) => void; disabled?: boolean; extraLabel?: string }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[0, 1, 2, 3, 4, 5, 6].map(r => (
        <button
          key={r} disabled={disabled} onClick={() => onSelect(r)}
          className="py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-40 shadow-md" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {extraLabel ? `${extraLabel}+${r}` : (r === 0 ? '•' : r)}
        </button>
      ))}
    </div>
  );
}

// ─── Toss Modal ───────────────────────────────────────────────────────────────
function TossModal({ match, onDone }: { match: any; onDone: (data: any) => void }) {
  const [tossWinner, setTossWinner] = useState('');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');
  const submit = () => {
    if (!tossWinner) return;
    const t1Id = match.team1?._id || match.team1;
    const team = t1Id === tossWinner ? match.team1 : match.team2;
    const other = team._id === t1Id ? match.team2 : match.team1;
    onDone({ tossWinnerId: tossWinner, tossWinnerName: team.name, tossDecision: decision, battingTeamId: decision === 'bat' ? team._id || team : other._id || other, battingTeamName: decision === 'bat' ? team.name : other.name, bowlingTeamId: decision === 'bat' ? other._id || other : team._id || team, bowlingTeamName: decision === 'bat' ? other.name : team.name });
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-2xl font-black mb-6 text-center" style={{ color: 'var(--text-primary)' }}>🪙 Toss</h2>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Who won the toss?</label>
            <div className="grid grid-cols-2 gap-3">
              {[match.team1, match.team2].map(team => {
                const id = team?._id || team; const name = team?.name || `Team`;
                return <button key={id} onClick={() => setTossWinner(id)} className={`py-3 px-4 rounded-xl font-bold text-sm border-2 ${tossWinner === id ? 'border-blue-500 bg-blue-500/20 text-white' : 'text-muted'}`} style={tossWinner === id ? {} : { borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>{name}</button>;
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Decision</label>
            <div className="grid grid-cols-2 gap-3">
              {(['bat', 'bowl'] as const).map(d => (
                <button key={d} onClick={() => setDecision(d)} className={`py-3 px-4 rounded-xl font-bold text-sm border-2 capitalize ${decision === d ? 'border-green-500 bg-green-500/20 text-white' : 'border-var text-var' style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}}`}>{d === 'bat' ? '🏏 Bat' : '🎳 Bowl'}</button>
              ))}
            </div>
          </div>
          <button onClick={submit} disabled={!tossWinner} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl">Continue</button>
        </div>
      </div>
    </div>
  );
}

// ─── Player Select Modal ──────────────────────────────────────────────────────
function PlayerSelectModal({ match, battingTeamId, bowlingTeamId, inningsNum, title, defaultStriker = '', defaultNonStriker = '', defaultBowler = '', onDone, onClose, currentInningsData }: any) {
  const [striker, setStriker] = useState(defaultStriker);
  const [nonStriker, setNonStriker] = useState(defaultNonStriker);
  const [bowler, setBowler] = useState(defaultBowler);

  useEffect(() => { setStriker(defaultStriker); setNonStriker(defaultNonStriker); setBowler(defaultBowler); }, [defaultStriker, defaultNonStriker, defaultBowler]);

  const t1Id = match.team1?._id || match.team1;
  const battingTeam = t1Id === battingTeamId ? match.team1 : match.team2;
  const bowlingTeam = battingTeam === match.team1 ? match.team2 : match.team1;
  const allBPlayers: any[] = battingTeam?.players || [];
  const bowlPlayers: any[] = bowlingTeam?.players || [];
  const outPlayerNames = new Set<string>((currentInningsData?.batsmen || []).filter((b: any) => b.isOut || b.dismissal || (b.outType && b.outType !== '')).map((b: any) => b.name));
  const availableBatsmen = allBPlayers.filter((p: any) => !outPlayerNames.has(p.name));
  const isValid = () => striker && nonStriker && bowler && striker !== nonStriker;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="rounded-2xl p-6 w-full max-w-lg my-4 relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {onClose && <button onClick={onClose} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>}
        <h2 className="text-xl font-black mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Users className="w-5 h-5 text-blue-400" /> {title}</h2>
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Innings {inningsNum} | {battingTeam?.name || 'Batting'} vs {bowlingTeam?.name || 'Bowling'}</p>
        {outPlayerNames.size > 0 && <p className="text-amber-500/70 text-xs mb-4">⚠ {outPlayerNames.size} dismissed player{outPlayerNames.size > 1 ? 's' : ''} hidden</p>}
        <div className="space-y-4">
          {[{ label: '🏏 Striker', value: striker, set: setStriker, opts: availableBatsmen, filter: (p: any) => true },
            { label: '⬤ Non-Striker', value: nonStriker, set: setNonStriker, opts: availableBatsmen, filter: (p: any) => p.name !== striker },
            { label: '🎳 Bowler', value: bowler, set: setBowler, opts: bowlPlayers, filter: (p: any) => true },
          ].map(({ label, value, set, opts, filter }) => (
            <div key={label}>
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
              <select value={value} onChange={e => set(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="">-- Select --</option>
                {opts.filter(filter).map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          ))}
          <button onClick={() => isValid() && onDone({ striker, nonStriker, bowler })} disabled={!isValid()} className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold rounded-xl">Confirm Selection</button>
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-8 w-full max-w-sm text-center" style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="text-5xl mb-4">🏏</div>
        <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Innings Break</h2>
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-elevated)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{innings1?.teamName || 'Team 1'} scored</p>
          <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{innings1?.score}/{innings1?.wickets}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{innings1?.overs?.toFixed ? innings1.overs.toFixed(1) : 0} overs</p>
        </div>
        <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 mb-6">
          <p className="text-blue-400 font-bold text-lg">Target: {target}</p>
        </div>
        <button onClick={onContinue} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">Select Players for 2nd Innings →</button>
      </div>
    </div>
  );
}

// ─── Broadcast Director Panel ─────────────────────────────────────────────────
// Only contains manual triggers that genuinely need a human to fire them.
// Auto triggers (batting/bowling card after N overs) are handled in OverlayManager config.
function BroadcastDirectorPanel({ matchId }: { matchId: string }) {
  const [open, setOpen] = useState(false);

  const fire = (type: string, data: any = {}) => {
    // 1. Fire via socket so live overlays connected via OBS receive it
    socket.emit('manualOverlayTrigger', { matchId, trigger: { type, duration: 15, data } });
    // 2. Also postMessage to any preview iframes open in the same page
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage({ type: 'OVERLAY_TRIGGER', payload: { type, data } }, '*');
      } catch (_) {}
    });
  };

  const triggers = [
    { label: '🪙 Toss Result',  type: 'SHOW_TOSS',       color: 'bg-yellow-900/40 border-yellow-700/40 text-yellow-300 hover:bg-yellow-700/60' },
    { label: '🧑‍🤝‍🧑 Playing XI',  type: 'SHOW_SQUADS',     color: 'bg-purple-900/40 border-purple-700/40 text-purple-300 hover:bg-purple-700/60' },
    { label: '🏏 Batting Card', type: 'BATTING_CARD',    color: 'bg-blue-900/40 border-blue-700/40 text-blue-300 hover:bg-blue-700/60' },
    { label: '🎳 Bowling Card', type: 'BOWLING_CARD',    color: 'bg-indigo-900/40 border-indigo-700/40 text-indigo-300 hover:bg-indigo-700/60' },
    { label: '📊 Both Cards',   type: 'BOTH_CARDS',      color: 'bg-fuchsia-900/40 border-fuchsia-700/40 text-fuchsia-300 hover:bg-fuchsia-700/60' },
    { label: '🔄 Restore Live', type: 'RESTORE',         color: 'border' + `" style="background:var(--bg-elevated);border-color:var(--border);color:var(--text-secondary)` },
  ];

  return (
    <div className="border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors" style={{ color: 'var(--text-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-blue-400" />
          <span className="uppercase tracking-wider text-xs">Animation Triggers</span>
          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Tap to broadcast to overlay</p>
          <div className="grid grid-cols-2 gap-2">
            {triggers.map(t => (
              <button
                key={t.type}
                onClick={() => fire(t.type)}
                className={`py-3 px-3 rounded-xl font-bold text-sm border transition-all active:scale-95 text-left ${t.color}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main LiveScoring ─────────────────────────────────────────────────────────
export default function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<ScoreStep>('toss');
  const [panel, setPanel] = useState<ScoringPanel>('main');
  const [submitting, setSubmitting] = useState(false);
  const [lastBall, setLastBall] = useState('');
  const [error, setError] = useState('');
  const [isScorer, setIsScorer] = useState(false);
  const [scorerError, setScorerError] = useState('');
  const [tossData, setTossData] = useState<any>(null);
  const [isDecisionPending, setIsDecisionPending] = useState(false);
  const [wicketModal, setWicketModal] = useState<{ open: boolean; baseData: BallData }>({ open: false, baseData: {} });
  const [selectedWicketType, setSelectedWicketType] = useState('');
  const [outBatsman, setOutBatsman] = useState<'striker' | 'nonStriker'>('striker');

  const isActionDisabled = submitting || isDecisionPending;

  const fetchMatch = useCallback(async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      const m = res.data.data || res.data;
      setMatch(m);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsScorer(m.scorerId === user._id || m.tournament?.createdBy?._id === user._id || user.role === 'admin');
      }
      if (m.status === 'completed') setStep('done');
      else if (m.status === 'live') {
        const innings = m.innings?.[m.currentInnings - 1];
        if (!innings || (!m.strikerName && !m.nonStrikerName)) setStep('players');
        else setStep('scoring');
      } else setStep('toss');
    } catch { setError('Failed to load match'); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  useEffect(() => {
    if (!id) return;
    socket.joinMatch(id);
    const onScore = (data: any) => { if (data.match) setMatch(data.match); };
    const onInnings = () => fetchMatch();
    const onEnd = (data: any) => { setMatch(data); setStep('done'); };
    socket.on('scoreUpdate', onScore);
    socket.on('inningsEnded', onInnings);
    socket.on('matchEnded', onEnd);
    return () => { socket.leaveMatch(id); socket.off('scoreUpdate', onScore); socket.off('inningsEnded', onInnings); socket.off('matchEnded', onEnd); };
  }, [id, fetchMatch]);

  const handleTossDone = (data: any) => { setTossData(data); setStep('players'); };

  const handlePlayersDone = async (players: any) => {
    if (!id || !match) return;
    setSubmitting(true);
    try {
      if (match.status !== 'live') await matchAPI.startMatch(id, { ...tossData, ...players });
      else await matchAPI.selectPlayers(id, players);
      await fetchMatch(); setStep('scoring'); setPanel('main');
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to update players'); } finally { setSubmitting(false); }
  };

  const submitBall = async (data: BallData) => {
    if (!id || isActionDisabled || !isScorer) { setScorerError('Scorer authorization required'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await matchAPI.addBall(id, data);
      await fetchMatch();
      setLastBall(res.data.data?.ballDescription || 'Ball Recorded');
      setPanel('main');
      if (res.data.data?.matchEnded) setStep('done');
      else if (res.data.data?.inningsEnded) setStep('inningsBreak');
      else if (res.data.data?.needPlayerSelection) setStep('playerSelect');
    } catch (e: any) {
      if (e.response?.status === 403) setScorerError('Scoring permission denied.');
      else setError(e.response?.data?.message || 'Failed to record ball');
    } finally { setSubmitting(false); }
  };

  const handleStrikeChange = async () => {
    if (!id || isActionDisabled) return;
    setSubmitting(true);
    try {
      await matchAPI.selectPlayers(id, { striker: match?.nonStrikerName, nonStriker: match?.strikerName, bowler: match?.currentBowlerName });
      await fetchMatch(); setLastBall('⇄ Strike Changed');
    } catch { setError('Failed to change strike'); } finally { setSubmitting(false); }
  };

  const handleRetirement = (type: 'striker' | 'nonStriker') => {
    setPanel('main'); setStep('playerSelect');
    submitBall({ retired: true, outBatsmanName: type === 'striker' ? match?.strikerName : match?.nonStrikerName });
  };

  const handleUndo = async () => {
    if (!id || isActionDisabled || !confirm('Undo last ball?')) return;
    setSubmitting(true);
    try { await matchAPI.undoBall(id); await fetchMatch(); setLastBall('↩ Undone'); setPanel('main'); } catch { setError('Cannot undo'); } finally { setSubmitting(false); }
  };

  const handleEndInnings = async () => {
    if (!confirm('End current innings?')) return;
    setSubmitting(true);
    try { await matchAPI.endInnings(id!); await fetchMatch(); setStep('inningsBreak'); } catch { } finally { setSubmitting(false); }
  };

  const handleEndMatch = async () => {
    if (!confirm('End the match?')) return;
    setSubmitting(true);
    try { await matchAPI.endMatch(id!, {}); await fetchMatch(); setStep('done'); } catch { } finally { setSubmitting(false); }
  };

  const toggleDecisionPending = () => {
    const next = !isDecisionPending;
    setIsDecisionPending(next);
    // Fire to live overlays via socket
    socket.emit('manualOverlayTrigger', { matchId: match._id, trigger: { type: 'DECISION_PENDING', duration: 0, data: {} } });
    // Also postMessage to any open preview iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage({ type: 'OVERLAY_TRIGGER', payload: { type: 'DECISION_PENDING', data: {} } }, '*');
      } catch (_) {}
    });
  };

  const openWicketModal = (baseData: BallData = {}) => { setSelectedWicketType(''); setWicketModal({ open: true, baseData }); setOutBatsman('striker'); };

  // ── Derived data ──────────────────────────────────────────────────────────
  const innings = match?.innings?.[match?.currentInnings - 1] || {};
  const safeBatsmen = Array.isArray(innings?.batsmen) ? innings.batsmen : [];
  const safeBowlers = Array.isArray(innings?.bowlers) ? innings.bowlers : [];
  const score = innings.score || 0;
  const wickets = innings.wickets || 0;
  const oversNum = Math.floor((innings?.balls || 0) / 6);
  const ballsNum = (innings?.balls || 0) % 6;
  const oversDisplay = `${oversNum}.${ballsNum}`;
  const runRate = innings?.runRate?.toFixed(2) || '0.00';
  const target = innings?.targetScore;
  const requiredRuns = innings?.requiredRuns;
  const rrr = innings?.requiredRunRate?.toFixed(2);

  const safeHistory = Array.isArray(innings?.ballHistory) ? innings.ballHistory : [];
  const currentBallsMod = Number(innings?.balls || 0) % 6;
  const validBallsInOver = (currentBallsMod === 0 && safeHistory.length > 0 && innings?.balls > 0) ? 6 : currentBallsMod;
  let thisOverBalls: any[] = []; let validCount = 0;
  for (let i = safeHistory.length - 1; i >= 0; i--) {
    const b = safeHistory[i]; thisOverBalls.unshift(b);
    if (!(b.extras === 'wide' || b.wide || b.extras === 'nb' || b.noBall || b.extras === 'noBall')) validCount++;
    if (validCount >= validBallsInOver) break;
  }

  const currentBattingTeamId = innings?.teamId || tossData?.battingTeamId || match?.team1?._id || match?.team1;
  const currentBowlingTeamId = currentBattingTeamId === (match?.team1?._id || match?.team1) ? (match?.team2?._id || match?.team2) : (match?.team1?._id || match?.team1);
  const activeStriker = safeBatsmen.find((b: any) => b.name === match?.strikerName) || safeBatsmen.find((b: any) => b?.isStriker && !b?.isOut);
  const activeNonStriker = safeBatsmen.find((b: any) => b.name === match?.nonStrikerName) || safeBatsmen.find((b: any) => !b?.isStriker && !b?.isOut && b?.enteredAt !== undefined);
  const currentBowler = safeBowlers.find((b: any) => b.name === match?.currentBowlerName);
  let defStriker = activeStriker?.name || ''; let defNonStriker = activeNonStriker?.name || ''; let defBowler = match?.currentBowlerName || '';
  if (step === 'players') { defStriker = ''; defNonStriker = ''; defBowler = ''; }

// ── Real-time overlay sync ───────────────────────────────────────────────────
  useEffect(() => {
    if (!match) return;

    const currentOverHistory = thisOverBalls.map((b: any) => ({
      runs: b.runs || 0,
      wicket: b.wicket || false,
      isWide: b.extras === 'wide' || b.wide || false,
      isNoBall: b.extras === 'nb' || b.noBall || b.extras === 'noBall' || false,
      isBoundary: b.runs === 4 || b.runs === 6,
    }));

    // Build the full payload the overlay HTML listens for
    const overlayData = {
      matchId: match._id,
      matchName: match.name,
      tournamentName: match.tournamentId?.name || '',
      team1Name: match.team1Name || match.team1?.name || '',
      team2Name: match.team2Name || match.team2?.name || '',
      team1Score: score,
      team1Wickets: wickets,
      team1Overs: oversDisplay,
      team2Score: match.innings?.[1]?.score ?? 0,
      team2Wickets: match.innings?.[1]?.wickets ?? 0,
      team2Overs: (() => {
        const i2 = match.innings?.[1]; if (!i2) return '0.0';
        return `${Math.floor((i2.balls||0)/6)}.${(i2.balls||0)%6}`;
      })(),
      strikerName: match.strikerName || '',
      strikerRuns: activeStriker?.runs ?? 0,
      strikerBalls: activeStriker?.balls ?? 0,
      strikerFours: activeStriker?.fours ?? 0,
      strikerSixes: activeStriker?.sixes ?? 0,
      nonStrikerName: match.nonStrikerName || '',
      nonStrikerRuns: activeNonStriker?.runs ?? 0,
      nonStrikerBalls: activeNonStriker?.balls ?? 0,
      bowlerName: match.currentBowlerName || '',
      bowlerOvers: currentBowler ? `${Math.floor((currentBowler.balls||0)/6)}.${(currentBowler.balls||0)%6}` : '0.0',
      bowlerRuns: currentBowler?.runs ?? 0,
      bowlerWickets: currentBowler?.wickets ?? 0,
      bowlerEconomy: currentBowler?.economy ?? 0,
      thisOver: currentOverHistory,
      runRate: parseFloat(runRate) || 0,
      target: target || null,
      requiredRuns: requiredRuns || null,
      requiredRunRate: rrr ? parseFloat(rrr) : null,
      totalFours: innings?.fours ?? 0,
      totalSixes: innings?.sixes ?? 0,
      extras: innings?.extras?.total ?? 0,
      sponsors: match.tournamentId?.sponsors || match.sponsors || [],
      status: match.status,
      currentInnings: match.currentInnings || 1,
    };

    socket.emit('updateScore', { matchId: match._id, match: { ...match, ...overlayData } });
  }, [match, score, wickets, oversDisplay, thisOverBalls, runRate, target, requiredRuns, rrr, innings, activeStriker, activeNonStriker, currentBowler]);

  // ── Early returns ─────────────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}><div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;
  if (!match) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><p className="text-red-400 text-xl">Match not found</p></div>;
  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="rounded-2xl p-8 text-center max-w-md w-full" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Match Completed</h2>
        {match.winnerName && <p className="text-green-400 font-semibold mb-2">{match.winnerName} won!</p>}
        {match.resultSummary && <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{match.resultSummary}</p>}
        <button onClick={() => navigate(-1)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">Back to Match</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ── Modals ── */}
      {step === 'toss' && <TossModal match={match} onDone={handleTossDone} />}
      {(step === 'players' || step === 'playerSelect') && (
        <PlayerSelectModal
          match={match} battingTeamId={currentBattingTeamId} bowlingTeamId={currentBowlingTeamId}
          inningsNum={match.currentInnings || 1}
          title={step === 'players' ? 'Select Opening Players' : 'Player Selection'}
          defaultStriker={defStriker} defaultNonStriker={defNonStriker} defaultBowler={defBowler}
          currentInningsData={innings}
          onDone={handlePlayersDone} onClose={step === 'playerSelect' ? () => setStep('scoring') : undefined}
        />
      )}
      {step === 'inningsBreak' && <InningsBreak match={match} onContinue={() => setStep('playerSelect')} />}

      {/* ── Wicket Modal ── */}
      {wicketModal.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Wicket Details</h3>
              <button onClick={() => setWicketModal({ open: false, baseData: {} })} className="transition-colors" style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>How out?</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {WICKET_TYPES.map(wt => (
                <button key={wt.id} onClick={() => setSelectedWicketType(wt.id)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${selectedWicketType === wt.id ? 'bg-red-600 border-red-500 text-white' : 'bg-red-900/30 hover:bg-red-700/50 border-red-800/40 text-red-300'}`}>
                  {wt.label}
                </button>
              ))}
            </div>
            {selectedWicketType && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Who is out?</label>
                <div className="flex gap-2 mb-4">
                  {(['striker', 'nonStriker'] as const).map(role => (
                    <button key={role} onClick={() => setOutBatsman(role)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border ${outBatsman === role ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-var text-var' style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}}`}>
                      {role === 'striker' ? `Striker (${activeStriker?.name || '?'})` : `Non-Striker (${activeNonStriker?.name || '?'})`}
                    </button>
                  ))}
                </div>
                {selectedWicketType === 'run_out' ? (
                  <>
                    <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Runs before run out?</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map(r => (
                        <button key={r} onClick={() => { setWicketModal({ open: false, baseData: {} }); submitBall({ ...wicketModal.baseData, runs: r, wicket: true, outType: 'run_out', outBatsmanName: outBatsman === 'striker' ? activeStriker?.name : activeNonStriker?.name }); }}
                          className="py-3 rounded-xl text-sm font-bold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>{r}</button>
                      ))}
                    </div>
                  </>
                ) : (
                  <button onClick={() => { setWicketModal({ open: false, baseData: {} }); submitBall({ ...wicketModal.baseData, wicket: true, outType: selectedWicketType, outBatsmanName: outBatsman === 'striker' ? activeStriker?.name : activeNonStriker?.name }); }}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">Confirm Wicket</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div>
          <h1 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{match.name}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{match.venue} · {match.format}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleUndo} disabled={isActionDisabled}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
            <RotateCcw className="w-3.5 h-3.5" /> Undo
          </button>
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <LogOut className="w-3.5 h-3.5" /> Leave
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SCOREBOARD
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-4 shrink-0" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>

        {/* Score + Run Rate row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
              {innings?.teamName || match.team1Name} · Inn {match.currentInnings}
            </p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-white leading-none">{score}/{wickets}</span>
              <span className="text-lg mb-0.5" style={{ color: 'var(--text-secondary)' }}>({oversDisplay} ov)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Run Rate</div>
            <div className="text-2xl font-black text-green-400">{runRate}</div>
            {target && (
              <div className="mt-1 text-right">
                <div className="text-xs text-blue-400 font-semibold">Target {target}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Need {requiredRuns} @ {rrr}</div>
              </div>
            )}
          </div>
        </div>

        {/* This over balls */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
          <span className="text-xs mr-1 font-semibold shrink-0" style={{ color: 'var(--text-muted)' }}>Over:</span>
          {thisOverBalls.map((b: any, i: number) => {
            const isWide = b.extras === 'wide' || b.wide;
            const isNoBall = b.extras === 'nb' || b.noBall || b.extras === 'noBall';
            return (
              <span key={i} className={`min-w-[1.75rem] h-7 px-1.5 flex shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                b.wicket ? 'bg-red-600 text-white' :
                (isWide || isNoBall) ? 'bg-amber-500 text-white' :
                b.runs === 4 ? 'bg-blue-600 text-white' :
                b.runs === 6 ? 'bg-purple-600 text-white' :
                '' style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              }`}>
                {b.wicket ? 'W' : isWide ? 'Wd' : isNoBall ? 'Nb' : (b.runs || '•')}
              </span>
            );
          })}
          {Array(Math.max(0, 6 - validBallsInOver)).fill(0).map((_, i) => (
            <span key={`e-${i}`} className="min-w-[1.75rem] h-7 flex shrink-0 items-center justify-center rounded-full text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}">·</span>
          ))}
        </div>

        {/* Players row — Striker | Non-Striker | Bowler */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="mb-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>🏏 Striker</div>
            <div className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{activeStriker?.name || match.strikerName || '–'}</div>
            {activeStriker && <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{activeStriker.runs}({activeStriker.balls}) SR:{activeStriker.strikeRate?.toFixed(0) ?? '–'}</div>}
          </div>
          <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="mb-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>⬤ Non-Striker</div>
            <div className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{activeNonStriker?.name || match.nonStrikerName || '–'}</div>
            {activeNonStriker && <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{activeNonStriker.runs}({activeNonStriker.balls})</div>}
          </div>
          <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="mb-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>🎳 Bowler</div>
            <div className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{match.currentBowlerName || '–'}</div>
            {currentBowler && <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{Math.floor(currentBowler.balls / 6)}.{currentBowler.balls % 6}ov {currentBowler.runs}R {currentBowler.wickets}W</div>}
          </div>
        </div>

        {/* Last ball + scorer error */}
        {lastBall && (
          <div className="mt-2.5 text-center">
            <span className="text-xs rounded-full px-3 py-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Last: {lastBall}</span>
          </div>
        )}
        {(error || scorerError) && (
          <div className="mt-2 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-red-300 text-xs flex-1">{error || scorerError}</span>
            <button onClick={() => { setError(''); setScorerError(''); }} className="text-red-400 shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SCORING PANELS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 px-4 py-4 overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>

        {panel === 'main' && (
          <div className="space-y-4">

            {/* ── Animation Triggers (above run buttons) ── */}
            <BroadcastDirectorPanel matchId={match._id} />

            {/* ── Run Buttons: 0 1 2 3 4 6 + Decision Pending ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Runs</p>
              {/* 3 cols: 0 1 2 / 3 4 6 — then Decision Pending in the empty 7th slot */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button
                    key={r} disabled={isActionDisabled}
                    onClick={() => submitBall({ runs: r })}
                    className={`py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
                      r === 4 ? 'bg-blue-600 shadow-blue-600/30' :
                      r === 6 ? 'bg-purple-600 shadow-purple-600/30' :
                      r === 0 ? 'border' :
                      '' style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    }`}
                  >
                    {r === 0 ? '•' : r}
                  </button>
                ))}
                {/* Decision Pending sits naturally in the 7th grid slot */}
                <button
                  onClick={toggleDecisionPending}
                  className={`py-3 rounded-2xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                    isDecisionPending
                      ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                      : '' style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(217,119,6,0.3)', color: '#f59e0b' }}
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="uppercase leading-tight text-center">{isDecisionPending ? 'Resume' : '3rd Umpire'}</span>
                </button>
              </div>
            </div>

            {/* ── Extras & Wickets ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Extras & Wickets</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Wide', icon: '↔', panel: 'wide' as ScoringPanel, color: 'bg-amber-600/20 border-amber-600/40 text-amber-300' },
                  { label: 'No Ball', icon: '⊘', panel: 'noBall' as ScoringPanel, color: 'bg-orange-600/20 border-orange-600/40 text-orange-300' },
                  { label: 'Bye', icon: 'B', panel: 'bye' as ScoringPanel, color: 'bg-teal-600/20 border-teal-600/40 text-teal-300' },
                  { label: 'Leg Bye', icon: 'LB', panel: 'legBye' as ScoringPanel, color: 'bg-cyan-600/20 border-cyan-600/40 text-cyan-300' },
                ].map(btn => (
                  <button key={btn.label} disabled={isActionDisabled} onClick={() => setPanel(btn.panel)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm border flex items-center gap-2 disabled:opacity-40 ${btn.color}`}>
                    <span className="font-black">{btn.icon}</span> {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── OUT + Others ── */}
            <div className="grid grid-cols-2 gap-3">
              <button disabled={isActionDisabled} onClick={() => openWicketModal({})}
                className="py-4 rounded-2xl font-black text-lg bg-red-700 hover:bg-red-600 text-white shadow-lg active:scale-95 disabled:opacity-40">
                OUT! 🎯
              </button>
              <button disabled={isActionDisabled} onClick={() => setPanel('others')}
                className="py-4 rounded-2xl font-bold text-sm disabled:opacity-40" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Others…
              </button>
            </div>
          </div>
        )}

        {/* ── Wide Panel ── */}
        {panel === 'wide' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setPanel('main')} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Wide Ball</h3>
            </div>
            <RunButtons onSelect={r => submitBall({ wide: true, runs: r })} disabled={isActionDisabled} extraLabel="Wd" />
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <button disabled={isActionDisabled} onClick={() => { setPanel('main'); openWicketModal({ wide: true }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full disabled:opacity-40">
                Wicket (Off Wide)
              </button>
            </div>
          </div>
        )}

        {/* ── No Ball Panel ── */}
        {panel === 'noBall' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setPanel('main')} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>No Ball</h3>
            </div>
            <RunButtons onSelect={r => submitBall({ noBall: true, runs: r })} disabled={isActionDisabled} extraLabel="NB" />
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <button disabled={isActionDisabled} onClick={() => { setPanel('main'); openWicketModal({ noBall: true }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full disabled:opacity-40">
                Run Out (Off No Ball)
              </button>
            </div>
          </div>
        )}

        {/* ── Bye Panel ── */}
        {panel === 'bye' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setPanel('main')} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Byes</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(r => (
                <button key={r} disabled={isActionDisabled} onClick={() => { setPanel('main'); submitBall({ bye: r }); }}
                  className="py-4 rounded-xl font-bold text-lg bg-teal-900/40 hover:bg-teal-700/60 border border-teal-700/40 text-teal-200 disabled:opacity-40">
                  B{r}
                </button>
              ))}
            </div>
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <button disabled={isActionDisabled} onClick={() => { setPanel('main'); openWicketModal({ bye: 0 }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full disabled:opacity-40">
                Run Out (Off Bye)
              </button>
            </div>
          </div>
        )}

        {/* ── Leg Bye Panel ── */}
        {panel === 'legBye' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setPanel('main')} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Leg Byes</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(r => (
                <button key={r} disabled={isActionDisabled} onClick={() => { setPanel('main'); submitBall({ legBye: r }); }}
                  className="py-4 rounded-xl font-bold text-lg bg-cyan-900/40 hover:bg-cyan-700/60 border border-cyan-700/40 text-cyan-200 disabled:opacity-40">
                  LB{r}
                </button>
              ))}
            </div>
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <button disabled={isActionDisabled} onClick={() => { setPanel('main'); openWicketModal({ legBye: 0 }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full disabled:opacity-40">
                Run Out (Off Leg Bye)
              </button>
            </div>
          </div>
        )}

        {/* ── Others Panel ── */}
        {panel === 'others' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setPanel('main')} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Other Actions</h3>
            </div>
            <button onClick={() => { setPanel('main'); handleStrikeChange(); }} disabled={isActionDisabled}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-left disabled:opacity-40" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.35)', color: '#60a5fa' }}>
              ⇄ Change Strike
            </button>
            <button onClick={() => handleRetirement('striker')} disabled={isActionDisabled}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-left disabled:opacity-40" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              🚶 Retired Hurt (Striker)
            </button>
            <button onClick={() => handleRetirement('nonStriker')} disabled={isActionDisabled}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-left disabled:opacity-40" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              🚶 Retired Hurt (Non-Striker)
            </button>
            <button onClick={() => { setPanel('main'); setStep('playerSelect'); }} disabled={isActionDisabled}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-left disabled:opacity-40" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              🔄 Change Bowler Mid-Over
            </button>
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Penalty Runs</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(p => (
                  <button key={p} disabled={isActionDisabled} onClick={() => { setPanel('main'); submitBall({ penalty: p }); }}
                    className="py-2 rounded-xl text-sm font-semibold disabled:opacity-40" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    +{p}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
              <button onClick={handleEndInnings} disabled={isActionDisabled}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 disabled:opacity-40">
                🔚 End Innings Manually
              </button>
              <button onClick={handleEndMatch} disabled={isActionDisabled}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/40 border border-red-700/40 text-red-300 disabled:opacity-40">
                🏁 End Match
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM ACTION BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3 shrink-0 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <button onClick={handleEndInnings} disabled={isActionDisabled}
          className="py-3 rounded-xl font-semibold text-sm bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 flex justify-center items-center gap-2 disabled:opacity-40">
          <RefreshCw className="w-4 h-4" /> Change Innings
        </button>
        <button onClick={() => navigate(-1)}
          className="py-3 rounded-xl font-semibold text-sm flex justify-center items-center gap-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <LogOut className="w-4 h-4" /> Leave & Save
        </button>
      </div>

      {/* Recording indicator */}
      {submitting && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm flex items-center gap-2 shadow-xl z-40" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Recording…
        </div>
      )}
    </div>
  );
}
