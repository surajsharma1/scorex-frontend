import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import {
  RotateCcw, LogOut, X, RefreshCw, Users,
  AlertTriangle, ChevronDown, ChevronUp, Radio
} from 'lucide-react';

const N = {
  accent:       '#00ff88',
  accentDim:    '#00cc6a',
  accentGlow:   'rgba(0,255,136,0.15)',
  accentBorder: 'rgba(0,255,136,0.3)',
  bg:           '#070d0f',
  bgCard:       '#0c1418',
  bgElevated:   '#111c20',
  border:       '#1a2e35',
  textPrimary:  '#e8f5f0',
  textSecondary:'#8ba89e',
  textMuted:    '#4a6560',
  red:          '#ff4444',
  redDim:       'rgba(255,68,68,0.15)',
  redBorder:    'rgba(255,68,68,0.3)',
  amber:        '#f59e0b',
  amberDim:     'rgba(245,158,11,0.15)',
  amberBorder:  'rgba(245,158,11,0.3)',
  blue:         '#38bdf8',
};

interface BallData { runs?: number; wide?: boolean; noBall?: boolean; bye?: number; legBye?: number; wicket?: boolean; outType?: string; outBatsmanName?: string; retired?: boolean; penalty?: number; }
type ScoringPanel = 'main' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'others';
type ScoreStep = 'toss' | 'players' | 'scoring' | 'playerSelect' | 'inningsBreak' | 'done';

const WICKET_TYPES = [
  { id: 'bowled', label: 'Bowled' }, { id: 'caught', label: 'Caught' },
  { id: 'lbw', label: 'LBW' }, { id: 'run_out', label: 'Run Out' },
  { id: 'stumped', label: 'Stumped' }, { id: 'hit_wicket', label: 'Hit Wicket' },
  { id: 'handled_ball', label: 'Handled Ball' }, { id: 'obstructing', label: 'Obstructing' },
  { id: 'timed_out', label: 'Timed Out' },
];

const btnBase = 'rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';

function RunButtons({ onSelect, disabled = false, extraLabel = '' }: { onSelect: (r: number) => void; disabled?: boolean; extraLabel?: string }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[0, 1, 2, 3, 4, 5, 6].map(r => (
        <button key={r} disabled={disabled} onClick={() => onSelect(r)}
          className={`py-4 rounded-xl font-bold text-lg ${btnBase}`}
          style={{ background: N.bgElevated, border: `1px solid ${N.border}`, color: N.textPrimary }}>
          {extraLabel ? `${extraLabel}+${r}` : (r === 0 ? '•' : r)}
        </button>
      ))}
    </div>
  );
}

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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: N.bgCard, border: `1px solid ${N.accentBorder}`, boxShadow: `0 0 40px ${N.accentGlow}` }}>
        <h2 className="text-2xl font-black mb-6 text-center" style={{ color: N.accent }}>🪙 Toss</h2>
        <div className="space-y-5">
          <div>
            <div className="grid grid-cols-2 gap-3">
              {[match.team1, match.team2].map(team => {
                const id = team?._id || team; const name = team?.name || 'Team';
                const active = tossWinner === id;
                return <button key={id} onClick={() => setTossWinner(id)}
                  className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all`}
                  style={{ borderColor: active ? N.accent : N.border, background: active ? N.accentGlow : N.bgElevated, color: active ? N.accent : N.textSecondary }}>{name}</button>;
              })}
            </div>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-3">
              {(['bat', 'bowl'] as const).map(d => (
                <button key={d} onClick={() => setDecision(d)}
                  className="py-3 px-4 rounded-xl font-bold text-sm border-2 capitalize transition-all"
                  style={{ borderColor: decision === d ? N.accent : N.border, background: decision === d ? N.accentGlow : N.bgElevated, color: decision === d ? N.accent : N.textSecondary }}>
                  {d === 'bat' ? '🏏 Bat' : '🎳 Bowl'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={submit} disabled={!tossWinner} className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40" style={{ background: N.accent, color: N.bg }}>Continue →</button>
        </div>
      </div>
    </div>
  );
}

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
  const sel = (v: string, set: (s:string)=>void, opts: any[], filterFn: (p:any)=>boolean) => (
    <select value={v} onChange={e => set(e.target.value)}
      className="w-full rounded-xl px-3 py-2.5 text-sm"
      style={{ background: N.bgElevated, border: `1px solid ${N.border}`, color: N.textPrimary }}>
      <option value="">-- Select --</option>
      {opts.filter(filterFn).map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
    </select>
  );
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="rounded-2xl p-6 w-full max-w-lg my-4 relative" style={{ background: N.bgCard, border: `1px solid ${N.accentBorder}` }}>
        {onClose && <button onClick={onClose} className="absolute top-4 right-4" style={{ color: N.textMuted }}><X className="w-5 h-5" /></button>}
        <h2 className="text-xl font-black mb-2 flex items-center gap-2" style={{ color: N.accent }}><Users className="w-5 h-5" /> {title}</h2>
        <p className="text-xs mb-4" style={{ color: N.textMuted }}>Innings {inningsNum} · {battingTeam?.name || 'Batting'} vs {bowlingTeam?.name || 'Bowling'}</p>
        <div className="space-y-4">
          <div><label className="text-sm font-semibold mb-1.5 block" style={{ color: N.textSecondary }}>🏏 Striker</label>{sel(striker, setStriker, availableBatsmen, () => true)}</div>
          <div><label className="text-sm font-semibold mb-1.5 block" style={{ color: N.textSecondary }}>⬤ Non-Striker</label>{sel(nonStriker, setNonStriker, availableBatsmen, (p:any) => p.name !== striker)}</div>
          <div><label className="text-sm font-semibold mb-1.5 block" style={{ color: N.textSecondary }}>🎳 Bowler</label>{sel(bowler, setBowler, bowlPlayers, () => true)}</div>
          <button onClick={() => isValid() && onDone({ striker, nonStriker, bowler })} disabled={!isValid()}
            className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40"
            style={{ background: N.accent, color: N.bg }}>
            Confirm Selection ✓
          </button>
        </div>
      </div>
    </div>
  );
}

function InningsBreak({ match, onContinue }: { match: any; onContinue: () => void }) {
  const inn1 = match.innings?.[0];
  const target = (inn1?.score || 0) + 1;
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-8 w-full max-w-sm text-center" style={{ background: N.bgCard, border: `1px solid ${N.accentBorder}`, boxShadow: `0 0 40px ${N.accentGlow}` }}>
        <div className="text-5xl mb-4">🏏</div>
        <h2 className="text-2xl font-black mb-2" style={{ color: N.accent }}>Innings Break</h2>
        <div className="rounded-xl p-4 mb-4" style={{ background: N.bgElevated }}>
          <p className="text-sm" style={{ color: N.textMuted }}>{inn1?.teamName || 'Team 1'} scored</p>
          <p className="text-4xl font-black" style={{ color: N.textPrimary }}>{inn1?.score}/{inn1?.wickets}</p>
        </div>
        <div className="rounded-xl p-4 mb-6" style={{ background: N.accentGlow, border: `1px solid ${N.accentBorder}` }}>
          <p className="font-bold text-lg" style={{ color: N.accent }}>Target: {target}</p>
        </div>
        <button onClick={onContinue} className="w-full py-3 rounded-xl font-black text-sm" style={{ background: N.accent, color: N.bg }}>
          Select Players for 2nd Innings →
        </button>
      </div>
    </div>
  );
}

function BroadcastPanel({ fire, match }: any) {
  const [open, setOpen] = useState(false);

  const neonStyle = {
    background: 'rgba(0, 255, 136, 0.05)',
    border: `1px solid ${N.accentBorder}`,
    color: N.accent,
    boxShadow: `0 0 10px rgba(0, 255, 136, 0.02)`
  };

  const inn = match?.innings?.[match?.currentInnings - 1] || {};
  const batsmen = inn.batsmen || [];
  const bowlers = inn.bowlers || [];
  
  const buildBatSummary = () => batsmen.map((b: any) => ({ name: b.name, runs: b.runs||0, balls: b.balls||0, fours: b.fours||0, sixes: b.sixes||0, sr: b.strikeRate||0, outStatus: b.isOut?'out':'not_out' }));
  const buildBowlSummary = () => bowlers.map((b: any) => ({ name: b.name, overs: b.balls?`${Math.floor(b.balls/6)}.${b.balls%6}`:'0.0', maidens: 0, runs: b.runs||0, wkts: b.wickets||0, econ: b.economy||0 }));

  const activeStriker = batsmen.find((b: any) => b.name === match?.strikerName);
  const currentBowler = bowlers.find((b: any) => b.name === match?.currentBowlerName);

  const triggers = [
    { label: '🎯 Batting Card',   fn: () => fire('BATTING_CARD', { batsmen: buildBatSummary() }, 12) },
    { label: '🎳 Bowling Card',   fn: () => fire('BOWLING_CARD', { bowlers: buildBowlSummary() }, 12) },
    { label: '📊 Both Cards',     fn: () => fire('BOTH_CARDS', { batsmen: buildBatSummary(), bowlers: buildBowlSummary() }, 12) },
    { label: '🔄 Recover State',  fn: () => fire('RESTORE') },
  ];

  return (
    <div className="border-t" style={{ borderColor: N.border, background: N.bgCard }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold"
        style={{ color: N.textSecondary }}>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4" style={{ color: N.accent }} />
          <span className="uppercase tracking-wider text-xs">Broadcast Director</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse"
            style={{ background: 'rgba(255,68,68,0.2)', color: N.red, border: '1px solid rgba(255,68,68,0.3)' }}>LIVE</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4" style={{ color: N.textMuted }} /> : <ChevronUp className="w-4 h-4" style={{ color: N.textMuted }} />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: N.textMuted }}>Tap to broadcast manual override</p>
          <div className="grid grid-cols-2 gap-2">
            {triggers.map((t, i) => (
              <button key={i} onClick={t.fn}
                className="py-2.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 text-left hover:brightness-125"
                style={neonStyle}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

  const fetchMatch = useCallback(async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      const m = res.data.data || res.data;
      setMatch(m);
      const userStr = localStorage.getItem('user');
      if (userStr) setIsScorer(m.scorerId === JSON.parse(userStr)._id || JSON.parse(userStr).role === 'admin');
      if (m.status === 'completed') setStep('done');
      else if (m.status === 'live') {
        const inn = m.innings?.[m.currentInnings - 1];
        if (!inn || (!m.strikerName && !m.nonStrikerName)) setStep('players');
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

  // CRITICAL: Packages `isManual: true` into the data object so engine bypasses configuration locks.
  const fireTrigger = useCallback((type: string, data: any = {}, duration = 6) => {
    if (!match?._id) return;
    const payload = { type, data: { ...data, isManual: true }, duration };
    socket.emit('manualOverlayTrigger', { matchId: match._id, trigger: payload });
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try { iframe.contentWindow?.postMessage({ type: 'OVERLAY_TRIGGER', payload: payload }, '*'); } catch (_) {}
    });
  }, [match]);

  const handleTossDone = (data: any) => { setTossData(data); setStep('players'); };

  const handlePlayersDone = async (players: any) => {
    if (!id || !match) return;
    setSubmitting(true);
    try {
      if (match.status !== 'live') {
        await matchAPI.startMatch(id, { ...tossData, ...players });
      } else {
        await matchAPI.selectPlayers(id, players);
      }
      await fetchMatch(); setStep('scoring'); setPanel('main');
    } catch (e: any) { setError('Failed to update players'); } finally { setSubmitting(false); }
  };

  const submitBall = async (data: BallData) => {
    if (!id || submitting || isDecisionPending || !isScorer) { setScorerError('Scorer authorization required'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await matchAPI.addBall(id, data);
      const result = res.data.data;
      
      await fetchMatch();
      setLastBall(result?.ballDescription || 'Ball Recorded');
      setPanel('main');
      
      if (result?.matchEnded) setStep('done');
      else if (result?.inningsEnded) setStep('inningsBreak');
      else if (result?.needPlayerSelection) setStep('playerSelect');

    } catch (e: any) { setError('Failed to record ball'); } finally { setSubmitting(false); }
  };

  const handleUndo = async () => {
    if (!id || submitting || isDecisionPending || !confirm('Undo last ball?')) return;
    setSubmitting(true);
    try { await matchAPI.undoBall(id); await fetchMatch(); setLastBall('↩ Undone'); setPanel('main'); } catch { setError('Cannot undo'); } finally { setSubmitting(false); }
  };

  const handleStrikeChange = async () => {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await matchAPI.selectPlayers(id, { striker: match?.nonStrikerName, nonStriker: match?.strikerName, bowler: match?.currentBowlerName });
      await fetchMatch(); setLastBall('⇄ Strike Changed');
    } catch { setError('Failed to change strike'); } finally { setSubmitting(false); }
  };

  const handleRetirement = (type: 'striker' | 'nonStriker') => {
    const retiredName = type === 'striker' ? match?.strikerName : match?.nonStrikerName;
    const retiredBatsman = type === 'striker' ? activeStriker : activeNonStriker;
    // Fire a BATSMAN_CHANGE animation tagged as retirement so overlay shows correct card
    fireTrigger('BATSMAN_CHANGE', {
      outName: retiredName,
      howOut: 'Retired Hurt',
      outRuns: retiredBatsman?.runs || 0,
      outBalls: retiredBatsman?.balls || 0,
      inName: '',
      inRuns: 0,
      inBalls: 0,
      isSub: false
    }, 6);
    setPanel('main'); setStep('playerSelect');
    submitBall({ retired: true, outBatsmanName: retiredName });
  };

  const handleEndInnings = async () => {
    if (!confirm('End current innings?')) return;
    setSubmitting(true);
    try { await matchAPI.endInnings(id!); await fetchMatch(); setStep('inningsBreak'); } catch { } finally { setSubmitting(false); }
  };

  const toggleDecisionPending = () => {
    const next = !isDecisionPending;
    setIsDecisionPending(next);
    fireTrigger('DECISION_PENDING', { active: next }, 0);
  };

  const openWicketModal = (baseData: BallData = {}) => { setSelectedWicketType(''); setWicketModal({ open: true, baseData }); setOutBatsman('striker'); };

  const innings = match?.innings?.[match?.currentInnings - 1] || {};
  const safeBatsmen = Array.isArray(innings?.batsmen) ? innings.batsmen : [];
  const safeBowlers = Array.isArray(innings?.bowlers) ? innings.bowlers : [];
  const score = innings.score || 0;
  const wickets = innings.wickets || 0;
  const oversNum = Math.floor((innings?.balls || 0) / 6);
  const ballsNum = (innings?.balls || 0) % 6;
  const oversDisplay = `${oversNum}.${ballsNum}`;

  const currentBattingTeamId = innings?.teamId || tossData?.battingTeamId || match?.team1?._id || match?.team1;
  const currentBowlingTeamId = currentBattingTeamId === (match?.team1?._id || match?.team1) ? (match?.team2?._id || match?.team2) : (match?.team1?._id || match?.team1);
  const activeStriker = safeBatsmen.find((b: any) => b.name === match?.strikerName) || safeBatsmen.find((b: any) => b?.isStriker && !b?.isOut);
  const activeNonStriker = safeBatsmen.find((b: any) => b.name === match?.nonStrikerName) || safeBatsmen.find((b: any) => !b?.isStriker && !b?.isOut && b?.enteredAt !== undefined);
  const currentBowler = safeBowlers.find((b: any) => b.name === match?.currentBowlerName);
  
  let defStriker = activeStriker?.name || ''; let defNonStriker = activeNonStriker?.name || ''; let defBowler = match?.currentBowlerName || '';
  if (step === 'players') { defStriker = ''; defNonStriker = ''; defBowler = ''; }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-12 h-12 border-4 border-t-transparent border-green-500 rounded-full animate-spin" /></div>;
  if (!match) return <div className="min-h-screen flex items-center justify-center bg-black"><p className="text-red-500 text-xl">Match not found</p></div>;
  if (step === 'done') return <div className="min-h-screen bg-black flex justify-center items-center"><div className="text-green-500 font-bold text-2xl">Match Completed</div></div>;

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: N.bg, color: N.textPrimary }}>
      
      {/* 3RD UMPIRE SCOREBOARD LOCK OVERLAY */}
      {isDecisionPending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center p-10 rounded-3xl" style={{ border: `2px solid ${N.amber}`, background: N.bgCard, boxShadow: `0 0 80px ${N.amberDim}` }}>
             <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-amber-500 animate-pulse" />
             <h2 className="text-4xl font-black text-amber-500 mb-8 uppercase tracking-widest">Decision Pending</h2>
             <button onClick={toggleDecisionPending} className="px-10 py-5 bg-amber-500 text-black font-black text-xl rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                RESUME SCORING
             </button>
          </div>
        </div>
      )}

      {step === 'toss' && <TossModal match={match} onDone={handleTossDone} />}
      {(step === 'players' || step === 'playerSelect') && (
        <PlayerSelectModal match={match} battingTeamId={currentBattingTeamId} bowlingTeamId={currentBowlingTeamId} inningsNum={match.currentInnings || 1} title={step === 'players' ? 'Select Opening Players' : 'Player Selection'} defaultStriker={defStriker} defaultNonStriker={defNonStriker} defaultBowler={defBowler} currentInningsData={innings} onDone={handlePlayersDone} onClose={step === 'playerSelect' ? () => setStep('scoring') : undefined} />
      )}
      {step === 'inningsBreak' && <InningsBreak match={match} onContinue={() => { setStep('playerSelect'); }} />}

      {wicketModal.open && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: N.bgCard, border: `1px solid ${N.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black" style={{ color: N.red }}>⚡ Wicket Details</h3>
              <button onClick={() => setWicketModal({ open: false, baseData: {} })} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {WICKET_TYPES.map(wt => (
                <button key={wt.id} onClick={() => setSelectedWicketType(wt.id)} className="py-2.5 px-3 rounded-xl text-sm font-semibold border" style={{ background: selectedWicketType === wt.id ? N.red : N.redDim, borderColor: selectedWicketType === wt.id ? N.red : N.redBorder, color: selectedWicketType === wt.id ? '#fff' : '#fca5a5' }}>{wt.label}</button>
              ))}
            </div>
            {selectedWicketType && (
              <div className="pt-3 border-t" style={{ borderColor: N.border }}>
                <div className="flex gap-2 mb-4">
                  {(['striker', 'nonStriker'] as const).map(role => (
                    <button key={role} onClick={() => setOutBatsman(role)} className="flex-1 py-2 rounded-xl text-sm font-bold border" style={{ background: outBatsman === role ? N.redDim : N.bgElevated, borderColor: outBatsman === role ? N.red : N.border, color: outBatsman === role ? N.red : N.textSecondary }}>{role === 'striker' ? `Striker` : `Non-Striker`}</button>
                  ))}
                </div>
                <button onClick={() => { setWicketModal({ open: false, baseData: {} }); submitBall({ ...wicketModal.baseData, wicket: true, outType: selectedWicketType, outBatsmanName: outBatsman === 'striker' ? activeStriker?.name : activeNonStriker?.name }); }} className="w-full py-3 rounded-xl font-black text-sm" style={{ background: N.red, color: '#fff' }}>Confirm Wicket ⚡</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESTORED HEADER WITH UNDO ── */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b" style={{ background: N.bgCard, borderColor: N.border }}>
        <div>
          <h1 className="font-black text-sm" style={{ color: N.accent }}>{match.name}</h1>
          <p className="text-xs" style={{ color: N.textMuted }}>{match.venue} · {match.format}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleUndo} disabled={submitting || isDecisionPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
            style={{ background: N.amberDim, border: `1px solid ${N.amberBorder}`, color: N.amber }}>
            <RotateCcw className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      </div>

      <div className="px-4 py-4 shrink-0 border-b" style={{ background: N.bgCard, borderColor: N.border }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: N.textMuted }}>{innings?.teamName || match.team1Name} · Inn {match.currentInnings}</p>
            <div className="flex items-end gap-2"><span className="text-5xl font-black leading-none" style={{ color: N.accent }}>{score}/{wickets}</span><span className="text-lg mb-0.5" style={{ color: N.textSecondary }}>({oversDisplay} ov)</span></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { label: '🏏 Striker', name: activeStriker?.name || match.strikerName || '–' },
            { label: '⬤ Non-Str', name: activeNonStriker?.name || match.nonStrikerName || '–' },
            { label: '🎳 Bowler', name: match.currentBowlerName || '–' },
          ].map(p => (
            <div key={p.label} className="rounded-xl p-2.5" style={{ background: N.bgElevated, border: `1px solid ${N.border}` }}>
              <div className="mb-0.5 text-[11px]" style={{ color: N.textMuted }}>{p.label}</div>
              <div className="font-bold truncate" style={{ color: N.textPrimary }}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: N.bg }}>
        {panel === 'main' && (
          <div className="p-4 space-y-4">
            <BroadcastPanel fire={fireTrigger} match={match} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: N.textMuted }}>Runs</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button key={r} disabled={submitting || isDecisionPending} onClick={() => submitBall({ runs: r })} className={`py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 shadow-lg`} style={{ background: r === 4 ? '#1d4ed8' : r === 6 ? '#6d28d9' : N.bgElevated, border: `1px solid ${r === 4 ? '#2563eb' : r === 6 ? '#7c3aed' : N.border}`, color: r === 4 || r === 6 ? '#fff' : N.textPrimary }}>{r === 0 ? '•' : r}</button>
                ))}
                <button onClick={toggleDecisionPending} className={`py-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95`} style={{ background: isDecisionPending ? N.amber : N.amberDim, border: `1px solid ${N.amberBorder}`, color: isDecisionPending ? N.bg : N.amber, boxShadow: isDecisionPending ? `0 0 20px ${N.amberBorder}` : 'none', animation: isDecisionPending ? 'pulse 1.5s infinite' : 'none' }}><AlertTriangle className="w-5 h-5" /><span className="uppercase leading-tight text-center">3rd Umpire</span></button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: N.textMuted }}>Extras & Wickets</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Wide', icon: '↔', panel: 'wide' as ScoringPanel, bg: '#92400e22', border: '#d97706', color: '#fcd34d' },
                  { label: 'No Ball', icon: '⊘', panel: 'noBall' as ScoringPanel, bg: '#7c2d1222', border: '#ea580c', color: '#fb923c' },
                  { label: 'Bye', icon: 'B', panel: 'bye' as ScoringPanel, bg: '#0f3d3322', border: '#0d9488', color: '#5eead4' },
                  { label: 'Leg Bye', icon: 'LB', panel: 'legBye' as ScoringPanel, bg: '#0c2a3d22', border: '#0369a1', color: '#38bdf8' },
                ].map(btn => (
                  <button key={btn.label} disabled={submitting || isDecisionPending} onClick={() => setPanel(btn.panel)} className="py-3 px-4 rounded-xl font-bold text-sm border flex items-center gap-2 disabled:opacity-40" style={{ background: btn.bg, borderColor: btn.border, color: btn.color }}><span className="font-black">{btn.icon}</span> {btn.label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={submitting || isDecisionPending} onClick={() => openWicketModal({})} className="py-4 rounded-2xl font-black text-lg active:scale-95 disabled:opacity-40 transition-all" style={{ background: N.red, color: '#fff', boxShadow: `0 4px 20px ${N.redBorder}` }}>OUT! 🎯</button>
              <button disabled={submitting || isDecisionPending} onClick={() => setPanel('others')} className="py-4 rounded-2xl font-bold text-sm disabled:opacity-40" style={{ background: N.bgElevated, border: `1px solid ${N.border}`, color: N.textSecondary }}>Others…</button>
            </div>
          </div>
        )}
        
        {panel === 'wide' && <div className="p-4 space-y-4"><div className="flex items-center gap-2"><button onClick={() => setPanel('main')} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button><h3 className="font-bold" style={{ color: N.textPrimary }}>Wide Ball</h3></div><RunButtons onSelect={r => { setPanel('main'); submitBall({ wide: true, runs: r }); }} disabled={submitting || isDecisionPending} extraLabel="Wd" /><div className="border-t pt-4" style={{ borderColor: N.border }}><button disabled={submitting || isDecisionPending} onClick={() => { setPanel('main'); openWicketModal({ wide: true }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold w-full disabled:opacity-40" style={{ background: N.redDim, border: `1px solid ${N.redBorder}`, color: '#fca5a5' }}>Wicket (Off Wide)</button></div></div>}
        {panel === 'noBall' && <div className="p-4 space-y-4"><div className="flex items-center gap-2"><button onClick={() => setPanel('main')} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button><h3 className="font-bold" style={{ color: N.textPrimary }}>No Ball</h3></div><RunButtons onSelect={r => { setPanel('main'); submitBall({ noBall: true, runs: r }); }} disabled={submitting || isDecisionPending} extraLabel="NB" /><div className="border-t pt-4" style={{ borderColor: N.border }}><button disabled={submitting || isDecisionPending} onClick={() => { setPanel('main'); openWicketModal({ noBall: true }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold w-full disabled:opacity-40" style={{ background: N.redDim, border: `1px solid ${N.redBorder}`, color: '#fca5a5' }}>Run Out (Off No Ball)</button></div></div>}
        {panel === 'others' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2"><button onClick={() => setPanel('main')} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button><h3 className="font-bold" style={{ color: N.textPrimary }}>Other Actions</h3></div>
            {[
              { label: '⇄ Change Strike', fn: () => { setPanel('main'); handleStrikeChange(); }, color: N.accentGlow, border: N.accentBorder, text: N.accent },
              { label: '🚶 Retired Hurt (Striker)', fn: () => handleRetirement('striker'), color: N.bgElevated, border: N.border, text: N.textSecondary },
              { label: '🚶 Retired Hurt (Non-Striker)', fn: () => handleRetirement('nonStriker'), color: N.bgElevated, border: N.border, text: N.textSecondary },
              { label: '🔄 Change Bowler / Players', fn: () => { setPanel('main'); setStep('playerSelect'); }, color: N.bgElevated, border: N.border, text: N.textSecondary },
            ].map(b => (
              <button key={b.label} disabled={submitting || isDecisionPending} onClick={b.fn} className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-left disabled:opacity-40" style={{ background: b.color, border: `1px solid ${b.border}`, color: b.text }}>{b.label}</button>
            ))}
            <div className="border-t pt-3 space-y-2" style={{ borderColor: N.border }}>
              <button onClick={handleEndInnings} disabled={submitting || isDecisionPending} className="w-full py-3 px-4 rounded-xl text-sm font-semibold disabled:opacity-40" style={{ background: N.amberDim, border: `1px solid ${N.amberBorder}`, color: N.amber }}>🔚 End Innings Manually</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}