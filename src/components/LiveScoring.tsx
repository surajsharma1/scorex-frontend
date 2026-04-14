import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import { RotateCcw, X, Users, AlertTriangle, ChevronDown, ChevronUp, Radio, ArrowLeftRight } from 'lucide-react';

// ── Colour tokens ────────────────────────────────────────────────────────────
const N = {
  accent:'#00ff88', accentDim:'#00cc6a', accentGlow:'rgba(0,255,136,0.15)', accentBorder:'rgba(0,255,136,0.3)',
  bg:'#070d0f', bgCard:'#0c1418', bgElevated:'#111c20', border:'#1a2e35',
  textPrimary:'#e8f5f0', textSecondary:'#8ba89e', textMuted:'#4a6560',
  red:'#ff4444', redDim:'rgba(255,68,68,0.15)', redBorder:'rgba(255,68,68,0.3)',
  amber:'#f59e0b', amberDim:'rgba(245,158,11,0.15)', amberBorder:'rgba(245,158,11,0.3)',
  blue:'#38bdf8',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface BallData {
  runs?: number; wide?: boolean; noBall?: boolean;
  bye?: number; legBye?: number;
  wicket?: boolean; outType?: string; outBatsmanName?: string; outFielder?: string;
  retired?: boolean; penalty?: number;
}
type ScoringPanel = 'main' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'others';
type ScoreStep = 'toss' | 'players' | 'scoring' | 'playerSelect' | 'inningsBreak' | 'done';

const WICKET_TYPES = [
  { id:'bowled',        label:'Bowled' },
  { id:'caught',        label:'Caught' },
  { id:'lbw',           label:'LBW' },
  { id:'run_out',       label:'Run Out' },
  { id:'stumped',       label:'Stumped' },
  { id:'hit_wicket',    label:'Hit Wicket' },
  { id:'handled_ball',  label:'Handled Ball' },
  { id:'obstructing',   label:'Obstructing' },
  { id:'timed_out',     label:'Timed Out' },
];

// ── Small run buttons grid (used for extras sub-panels) ──────────────────────
function RunButtons({ onSelect, disabled = false, label = '' }: {
  onSelect:(r:number)=>void; disabled?:boolean; label?:string;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[0,1,2,3,4,5,6].map(r => (
        <button key={r} disabled={disabled} onClick={() => onSelect(r)}
          className="py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-40"
          style={{ background:N.bgElevated, border:`1px solid ${N.border}`, color:N.textPrimary }}>
          {label ? (r === 0 ? label : `${label}+${r}`) : (r === 0 ? '•' : r)}
        </button>
      ))}
    </div>
  );
}

// ── Toss Modal ───────────────────────────────────────────────────────────────
function TossModal({ match, onDone }: { match:any; onDone:(d:any)=>void }) {
  const [winner, setWinner] = useState('');
  const [decision, setDecision] = useState<'bat'|'bowl'>('bat');
  const submit = () => {
    if (!winner) return;
    const t1Id = match.team1?._id || match.team1;
    const winTeam  = t1Id === winner ? match.team1 : match.team2;
    const loseTeam = winTeam === match.team1 ? match.team2 : match.team1;
    const bat  = decision === 'bat' ? winTeam  : loseTeam;
    const bowl = decision === 'bat' ? loseTeam : winTeam;
    onDone({ tossWinnerId:winner, tossWinnerName:winTeam.name, tossDecision:decision,
      battingTeamId: bat._id || bat, battingTeamName: bat.name,
      bowlingTeamId: bowl._id || bowl, bowlingTeamName: bowl.name });
  };
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background:N.bgCard, border:`1px solid ${N.accentBorder}`, boxShadow:`0 0 40px ${N.accentGlow}` }}>
        <h2 className="text-2xl font-black mb-6 text-center" style={{ color:N.accent }}>🪙 Toss</h2>
        <p className="text-xs text-center mb-4" style={{ color:N.textMuted }}>Who won the toss?</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[match.team1, match.team2].map(t => {
            const id = t?._id || t; const name = t?.name || 'Team';
            return <button key={id} onClick={() => setWinner(id)}
              className="py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all"
              style={{ borderColor:winner===id?N.accent:N.border, background:winner===id?N.accentGlow:N.bgElevated, color:winner===id?N.accent:N.textSecondary }}>{name}</button>;
          })}
        </div>
        <p className="text-xs text-center mb-3" style={{ color:N.textMuted }}>Elected to…</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['bat','bowl'] as const).map(d => (
            <button key={d} onClick={() => setDecision(d)}
              className="py-3 px-4 rounded-xl font-bold text-sm border-2 capitalize transition-all"
              style={{ borderColor:decision===d?N.accent:N.border, background:decision===d?N.accentGlow:N.bgElevated, color:decision===d?N.accent:N.textSecondary }}>
              {d==='bat'?'🏏 Bat':'🎳 Bowl'}
            </button>
          ))}
        </div>
        <button onClick={submit} disabled={!winner} className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40" style={{ background:N.accent, color:N.bg }}>Continue →</button>
      </div>
    </div>
  );
}

// ── Player Select Modal ──────────────────────────────────────────────────────
function PlayerSelectModal({ match, battingTeamId, inningsNum, title, defaultStriker='', defaultNonStriker='', defaultBowler='', onDone, onClose, currentInningsData }: any) {
  const [striker,    setStriker]    = useState(defaultStriker);
  const [nonStriker, setNonStriker] = useState(defaultNonStriker);
  const [bowler,     setBowler]     = useState(defaultBowler);
  useEffect(() => { setStriker(defaultStriker); setNonStriker(defaultNonStriker); setBowler(defaultBowler); }, [defaultStriker, defaultNonStriker, defaultBowler]);

  const t1Id = match.team1?._id || match.team1;
  const battingTeam  = t1Id === battingTeamId ? match.team1 : match.team2;
  const bowlingTeam  = battingTeam === match.team1 ? match.team2 : match.team1;
  const batPlayers: any[] = battingTeam?.players || [];
  const bowlPlayers: any[] = bowlingTeam?.players || [];

  // Players who are FULLY out (not retired hurt — they can come back)
  const fullyOut = new Set<string>(
    (currentInningsData?.batsmen || [])
      .filter((b: any) => b.isOut && b.outType !== 'retired_hurt' && b.outType !== 'retired')
      .map((b: any) => b.name)
  );
  const availableBatsmen = batPlayers.filter((p: any) => !fullyOut.has(p.name));

  const isValid = () => striker && nonStriker && bowler && striker !== nonStriker;

  const Sel = ({ label, value, onChange, opts, filterFn }: any) => (
    <div>
      <label className="text-sm font-semibold mb-1.5 block" style={{ color:N.textSecondary }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm"
        style={{ background:N.bgElevated, border:`1px solid ${N.border}`, color:N.textPrimary }}>
        <option value="">-- Select --</option>
        {opts.filter(filterFn).map((p: any) => <option key={p._id||p.name} value={p.name}>{p.name}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="rounded-2xl p-6 w-full max-w-lg my-4 relative" style={{ background:N.bgCard, border:`1px solid ${N.accentBorder}` }}>
        {onClose && <button onClick={onClose} className="absolute top-4 right-4" style={{ color:N.textMuted }}><X className="w-5 h-5" /></button>}
        <h2 className="text-xl font-black mb-1 flex items-center gap-2" style={{ color:N.accent }}><Users className="w-5 h-5" /> {title}</h2>
        <p className="text-xs mb-5" style={{ color:N.textMuted }}>Innings {inningsNum} · {battingTeam?.name} batting vs {bowlingTeam?.name}</p>
        <div className="space-y-4">
          <Sel label="🏏 Striker"      value={striker}    onChange={setStriker}    opts={availableBatsmen} filterFn={() => true} />
          <Sel label="⬤ Non-Striker"  value={nonStriker} onChange={setNonStriker} opts={availableBatsmen} filterFn={(p:any) => p.name !== striker} />
          <Sel label="🎳 Bowler"       value={bowler}     onChange={setBowler}     opts={bowlPlayers}      filterFn={() => true} />
          <button onClick={() => isValid() && onDone({ striker, nonStriker, bowler })} disabled={!isValid()}
            className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40"
            style={{ background:N.accent, color:N.bg }}>
            Confirm ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Innings Break Screen ─────────────────────────────────────────────────────
function InningsBreak({ match, onContinue }: { match:any; onContinue:()=>void }) {
  const inn1 = match.innings?.[0];
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-8 w-full max-w-sm text-center" style={{ background:N.bgCard, border:`1px solid ${N.accentBorder}`, boxShadow:`0 0 40px ${N.accentGlow}` }}>
        <div className="text-5xl mb-4">🏏</div>
        <h2 className="text-2xl font-black mb-4" style={{ color:N.accent }}>Innings Break</h2>
        <div className="rounded-xl p-4 mb-3" style={{ background:N.bgElevated }}>
          <p className="text-xs mb-1" style={{ color:N.textMuted }}>{inn1?.teamName || 'Team 1'} scored</p>
          <p className="text-4xl font-black" style={{ color:N.textPrimary }}>{inn1?.score ?? 0}/{inn1?.wickets ?? 0}</p>
          <p className="text-xs mt-1" style={{ color:N.textMuted }}>({Math.floor((inn1?.balls||0)/6)}.{(inn1?.balls||0)%6} ov)</p>
        </div>
        <div className="rounded-xl p-4 mb-6" style={{ background:N.accentGlow, border:`1px solid ${N.accentBorder}` }}>
          <p className="font-bold text-lg" style={{ color:N.accent }}>Target: {(inn1?.score || 0) + 1}</p>
        </div>
        <button onClick={onContinue} className="w-full py-3 rounded-xl font-black text-sm" style={{ background:N.accent, color:N.bg }}>
          Select Players for 2nd Innings →
        </button>
      </div>
    </div>
  );
}

// ── Wicket Modal ─────────────────────────────────────────────────────────────
function WicketModal({ strikerName, nonStrikerName, baseData, onConfirm, onClose }: {
  strikerName:string; nonStrikerName:string; baseData:BallData;
  onConfirm:(d:BallData)=>void; onClose:()=>void;
}) {
  const [outType,   setOutType]   = useState('');
  const [outPerson, setOutPerson] = useState<'striker'|'nonStriker'>('striker');

  // Run Out can dismiss non-striker; Stumped/LBW etc only striker
  const nonStrikerTypes = ['run_out'];
  const bothAllowed = nonStrikerTypes.includes(outType) || outType === '';

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background:N.bgCard, border:`1px solid ${N.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black" style={{ color:N.red }}>⚡ Wicket</h3>
          <button onClick={onClose} style={{ color:N.textMuted }}><X className="w-5 h-5" /></button>
        </div>

        {/* Dismissal type */}
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color:N.textMuted }}>How out?</p>
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {WICKET_TYPES.map(wt => (
            <button key={wt.id} onClick={() => { setOutType(wt.id); if (!nonStrikerTypes.includes(wt.id)) setOutPerson('striker'); }}
              className="py-2 rounded-lg text-xs font-semibold border transition-all"
              style={{ background:outType===wt.id?N.red:N.redDim, borderColor:outType===wt.id?N.red:N.redBorder, color:outType===wt.id?'#fff':'#fca5a5' }}>
              {wt.label}
            </button>
          ))}
        </div>

        {outType && (
          <>
            {/* Who is out — only show both options for run-out type */}
            {bothAllowed && (
              <>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color:N.textMuted }}>Who is out?</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(['striker','nonStriker'] as const).map(role => (
                    <button key={role} onClick={() => setOutPerson(role)}
                      className="py-2 rounded-xl text-sm font-bold border transition-all"
                      style={{ background:outPerson===role?N.redDim:N.bgElevated, borderColor:outPerson===role?N.red:N.border, color:outPerson===role?N.red:N.textSecondary }}>
                      {role==='striker' ? strikerName || 'Striker' : nonStrikerName || 'Non-Striker'}
                    </button>
                  ))}
                </div>
              </>
            )}
            {!bothAllowed && (
              <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ color:N.textMuted, background:N.bgElevated }}>
                Out: <strong style={{ color:N.textPrimary }}>{strikerName || 'Striker'}</strong>
              </p>
            )}

            <button
              onClick={() => onConfirm({
                ...baseData,
                wicket: true,
                outType,
                outBatsmanName: outPerson === 'striker' ? strikerName : nonStrikerName
              })}
              className="w-full py-3 rounded-xl font-black text-sm"
              style={{ background:N.red, color:'#fff' }}>
              Confirm Wicket ⚡
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Broadcast Panel ──────────────────────────────────────────────────────────
function BroadcastPanel({ fire, match }: any) {
  const [open, setOpen] = useState(false);
  const inn = match?.innings?.[match?.currentInnings-1] || {};
  const batsmen = inn.batsmen || [];
  const bowlers = inn.bowlers || [];
  const buildBat  = () => batsmen.map((b:any) => ({ name:b.name, runs:b.runs||0, balls:b.balls||0, fours:b.fours||0, sixes:b.sixes||0, sr:b.strikeRate||0, outStatus:b.isOut?'out':'not_out' }));
  const buildBowl = () => bowlers.map((b:any) => ({ name:b.name, overs:b.balls?`${Math.floor(b.balls/6)}.${b.balls%6}`:'0.0', maidens:0, runs:b.runs||0, wkts:b.wickets||0, econ:b.economy||0 }));
  const ns = { background:'rgba(0,255,136,0.05)', border:`1px solid ${N.accentBorder}`, color:N.accent };
  const btns = [
    { label:'🎯 Batting Card',  fn:() => fire('BATTING_CARD', { batsmen:buildBat() }, 12) },
    { label:'🎳 Bowling Card',  fn:() => fire('BOWLING_CARD', { bowlers:buildBowl() }, 12) },
    { label:'📊 Both Cards',    fn:() => fire('BOTH_CARDS',   { batsmen:buildBat(), bowlers:buildBowl() }, 12) },
    { label:'↩ Restore',        fn:() => fire('RESTORE') },
  ];
  return (
    <div className="border-t" style={{ borderColor:N.border, background:N.bgCard }}>
      <button onClick={() => setOpen(o=>!o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold" style={{ color:N.textSecondary }}>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4" style={{ color:N.accent }} />
          <span className="uppercase tracking-wider text-xs">Broadcast</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse" style={{ background:'rgba(255,68,68,0.2)', color:N.red, border:'1px solid rgba(255,68,68,0.3)' }}>LIVE</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          {btns.map((b,i) => (
            <button key={i} onClick={b.fn} className="py-2.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 text-left hover:brightness-125" style={ns}>{b.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main LiveScoring component ───────────────────────────────────────────────
export default function LiveScoring() {
  const { id } = useParams<{ id:string }>();
  const navigate = useNavigate();

  const [match,      setMatch]      = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [step,       setStep]       = useState<ScoreStep>('toss');
  const [panel,      setPanel]      = useState<ScoringPanel>('main');
  const [submitting, setSubmitting] = useState(false);
  const [lastBall,   setLastBall]   = useState('');
  const [error,      setError]      = useState('');
  const [isScorer,   setIsScorer]   = useState(false);
  const [tossData,   setTossData]   = useState<any>(null);
  const [isDecisionPending, setIsDecisionPending] = useState(false);
  const [wicketModal, setWicketModal] = useState<{ open:boolean; baseData:BallData }>({ open:false, baseData:{} });

  // ── Fetch match ────────────────────────────────────────────────────────────
  const fetchMatch = useCallback(async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      const m = res.data.data || res.data;
      setMatch(m);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setIsScorer(m.scorerId === u._id || u.role === 'admin');
      }
      if (m.status === 'completed') { setStep('done'); return; }
      if (m.status === 'live') {
        const inn = m.innings?.[m.currentInnings - 1];
        if (!inn || (!m.strikerName && !m.nonStrikerName)) setStep('players');
        else setStep('scoring');
      } else {
        setStep('toss');
      }
    } catch { setError('Failed to load match'); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    socket.joinMatch(id);
    const onScore   = (data: any) => { if (data.match) setMatch(data.match); };
    const onInnings = () => fetchMatch();
    const onEnd     = (data: any) => { setMatch(data); setStep('done'); };
    socket.on('scoreUpdate',   onScore);
    socket.on('inningsEnded',  onInnings);
    socket.on('matchEnded',    onEnd);
    return () => {
      socket.leaveMatch(id);
      socket.off('scoreUpdate',  onScore);
      socket.off('inningsEnded', onInnings);
      socket.off('matchEnded',   onEnd);
    };
  }, [id, fetchMatch]);

  // ── Fire overlay trigger ───────────────────────────────────────────────────
  const fireTrigger = useCallback((type: string, data: any = {}, duration = 6) => {
    if (!match?._id) return;
    const payload = { type, data: { ...data, isManual:true }, duration };
    socket.emit('manualOverlayTrigger', { matchId:match._id, trigger:payload });
    document.querySelectorAll('iframe').forEach(iframe => {
      try { iframe.contentWindow?.postMessage({ type:'OVERLAY_TRIGGER', payload }, '*'); } catch(_) {}
    });
  }, [match]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTossDone    = (data: any) => { setTossData(data); setStep('players'); };

  const handlePlayersDone = async (players: any) => {
    if (!id || !match) return;
    setSubmitting(true);
    try {
      if (match.status !== 'live') await matchAPI.startMatch(id, { ...tossData, ...players });
      else                         await matchAPI.selectPlayers(id, players);
      await fetchMatch(); setStep('scoring'); setPanel('main');
    } catch { setError('Failed to update players'); } finally { setSubmitting(false); }
  };

  const submitBall = async (data: BallData) => {
    if (!id || submitting || isDecisionPending || !isScorer) return;
    setSubmitting(true); setError('');
    try {
      const res    = await matchAPI.addBall(id, data);
      const result = res.data.data;
      await fetchMatch();
      setLastBall(result?.ballDescription || '');
      setPanel('main');
      if      (result?.matchEnded)          setStep('done');
      else if (result?.inningsEnded)        setStep('inningsBreak');
      else if (result?.needPlayerSelection) setStep('playerSelect');
    } catch { setError('Failed to record ball'); } finally { setSubmitting(false); }
  };

  const handleUndo = async () => {
    if (!id || submitting || isDecisionPending || !confirm('Undo last ball?')) return;
    setSubmitting(true);
    try { await matchAPI.undoBall(id); await fetchMatch(); setLastBall('↩ Undone'); setPanel('main'); }
    catch { setError('Cannot undo'); } finally { setSubmitting(false); }
  };

  const handleStrikeChange = async () => {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await matchAPI.selectPlayers(id, { striker:match?.nonStrikerName, nonStriker:match?.strikerName, bowler:match?.currentBowlerName });
      await fetchMatch(); setLastBall('⇄ Strike changed');
    } catch { setError('Strike change failed'); } finally { setSubmitting(false); }
  };

  const handleRetirement = async (type: 'striker'|'nonStriker') => {
    const retiredName = type === 'striker' ? match?.strikerName : match?.nonStrikerName;
    if (!retiredName) return;
    // Submit retired as a separate record — NOT a wicket, does NOT end over
    // Backend sets isOut=true outType='retired_hurt'; overlay-utils shows as not_out
    setPanel('main');
    setStep('playerSelect');
    await submitBall({ retired:true, outBatsmanName:retiredName });
  };

  const handleEndInnings = async () => {
    if (!confirm('End current innings?')) return;
    setSubmitting(true);
    try { await matchAPI.endInnings(id!); await fetchMatch(); setStep('inningsBreak'); }
    catch {} finally { setSubmitting(false); }
  };

  const toggleDecisionPending = () => {
    const next = !isDecisionPending;
    setIsDecisionPending(next);
    fireTrigger('DECISION_PENDING', { active:next }, 0);
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const innings       = match?.innings?.[match?.currentInnings - 1] || {};
  const safeBatsmen   = Array.isArray(innings?.batsmen) ? innings.batsmen : [];
  const safeBowlers   = Array.isArray(innings?.bowlers) ? innings.bowlers : [];
  const score         = innings.score   || 0;
  const wickets       = innings.wickets || 0;
  const oversNum      = Math.floor((innings?.balls || 0) / 6);
  const ballsNum      = (innings?.balls || 0) % 6;
  const oversDisplay  = `${oversNum}.${ballsNum}`;

  const currentBattingTeamId = innings?.teamId || tossData?.battingTeamId || match?.team1?._id || match?.team1;
  const activeStriker    = safeBatsmen.find((b:any) => b.name === match?.strikerName)    || safeBatsmen.find((b:any) => b?.isStriker && !b?.isOut);
  const activeNonStriker = safeBatsmen.find((b:any) => b.name === match?.nonStrikerName) || safeBatsmen.find((b:any) => !b?.isStriker && !b?.isOut && b?.enteredAt !== undefined);

  let defStriker = ''; let defNonStriker = ''; let defBowler = '';
  if (step !== 'players') {
    defStriker    = activeStriker?.name     || match?.strikerName    || '';
    defNonStriker = activeNonStriker?.name  || match?.nonStrikerName || '';
    defBowler     = match?.currentBowlerName || '';
  }

  // Runs in current over for display
  const currentOverBalls = (() => {
    if (!innings?.ballHistory?.length) return [];
    const balls = innings.ballHistory;
    const result: any[] = [];
    let validCount = 0;
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const isExtra = b.extras === 'wide' || b.extras === 'nb';
      result.unshift(b);
      if (!isExtra) validCount++;
      if (validCount >= 6) break;
      // Stop at over boundary
      if (validCount > 0 && !isExtra && validCount === (ballsNum || 6)) break;
    }
    return result.slice(-Math.max(ballsNum, result.length));
  })();

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-12 h-12 border-4 border-t-transparent border-green-500 rounded-full animate-spin" />
    </div>
  );
  if (!match) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-red-500 text-xl">Match not found</p>
    </div>
  );
  if (step === 'done') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background:N.bg }}>
      <div className="text-5xl">🏆</div>
      <h2 className="text-2xl font-black" style={{ color:N.accent }}>Match Completed</h2>
      {match.resultSummary && <p className="text-sm" style={{ color:N.textSecondary }}>{match.resultSummary}</p>}
      <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 rounded-xl font-bold text-sm" style={{ background:N.bgCard, border:`1px solid ${N.border}`, color:N.textPrimary }}>← Back</button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background:N.bg, color:N.textPrimary }}>

      {/* ── Decision Pending overlay ── */}
      {isDecisionPending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center p-10 rounded-3xl" style={{ border:`2px solid ${N.amber}`, background:N.bgCard, boxShadow:`0 0 80px ${N.amberDim}` }}>
            <AlertTriangle className="w-20 h-20 mx-auto mb-5 text-amber-500 animate-pulse" />
            <h2 className="text-3xl font-black text-amber-500 mb-2 uppercase tracking-widest">Decision Pending</h2>
            <p className="text-sm mb-8" style={{ color:N.textMuted }}>3rd Umpire Review in progress</p>
            <button onClick={toggleDecisionPending} className="px-10 py-4 bg-amber-500 text-black font-black text-lg rounded-2xl hover:scale-105 transition-all">
              RESUME SCORING
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {step === 'toss' && <TossModal match={match} onDone={handleTossDone} />}
      {(step === 'players' || step === 'playerSelect') && (
        <PlayerSelectModal
          match={match} battingTeamId={currentBattingTeamId}
          inningsNum={match.currentInnings || 1}
          title={step === 'players' ? 'Opening Players' : 'Player Selection'}
          defaultStriker={defStriker} defaultNonStriker={defNonStriker} defaultBowler={defBowler}
          currentInningsData={innings}
          onDone={handlePlayersDone}
          onClose={step === 'playerSelect' ? () => setStep('scoring') : undefined}
        />
      )}
      {step === 'inningsBreak' && <InningsBreak match={match} onContinue={() => setStep('playerSelect')} />}
      {wicketModal.open && (
        <WicketModal
          strikerName={activeStriker?.name || match?.strikerName || ''}
          nonStrikerName={activeNonStriker?.name || match?.nonStrikerName || ''}
          baseData={wicketModal.baseData}
          onConfirm={(d) => { setWicketModal({ open:false, baseData:{} }); submitBall(d); }}
          onClose={() => setWicketModal({ open:false, baseData:{} })}
        />
      )}

      {/* ── Header ── */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b" style={{ background:N.bgCard, borderColor:N.border }}>
        <div>
          <h1 className="font-black text-sm" style={{ color:N.accent }}>{match.name}</h1>
          <p className="text-xs" style={{ color:N.textMuted }}>{match.venue} · {match.format} · Inn {match.currentInnings}</p>
        </div>
        <button onClick={handleUndo} disabled={submitting || isDecisionPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
          style={{ background:N.amberDim, border:`1px solid ${N.amberBorder}`, color:N.amber }}>
          <RotateCcw className="w-3.5 h-3.5" /> Undo
        </button>
      </div>

      {/* ── Scoreboard ── */}
      <div className="px-4 py-4 shrink-0 border-b" style={{ background:N.bgCard, borderColor:N.border }}>
        {/* Score */}
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color:N.textMuted }}>{innings?.teamName || match.team1Name}</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black leading-none" style={{ color:N.accent }}>{score}/{wickets}</span>
            <span className="text-xl mb-0.5" style={{ color:N.textSecondary }}>({oversDisplay} ov)</span>
          </div>
          {match.currentInnings === 2 && innings?.targetScore && (
            <div className="flex gap-4 mt-1.5">
              <span className="text-xs" style={{ color:N.textMuted }}>Target <strong style={{ color:N.textPrimary }}>{innings.targetScore}</strong></span>
              <span className="text-xs" style={{ color:N.textMuted }}>Need <strong style={{ color:innings.requiredRuns <= 12 ? N.accent : N.textPrimary }}>{innings.requiredRuns}</strong> off <strong style={{ color:N.textPrimary }}>{(match.maxOvers*6) - (innings.balls||0)}</strong> balls</span>
            </div>
          )}
        </div>

        {/* Current over balls */}
        {ballsNum > 0 || currentOverBalls.length > 0 ? (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] uppercase tracking-wider mr-1" style={{ color:N.textMuted }}>This over:</span>
            {Array.from({ length: 6 }).map((_, i) => {
              const b = currentOverBalls[i];
              const bg = !b ? 'transparent' : b.wicket ? N.red : b.runs===4 ? '#1d4ed8' : b.runs===6 ? '#6d28d9' : b.extras==='wide'||b.extras==='nb' ? '#92400e' : '#1a2e35';
              const txt = !b ? '' : b.wicket ? 'W' : b.extras==='wide' ? 'Wd' : b.extras==='nb' ? 'Nb' : b.extras==='bye' ? `B${b.runs}` : b.extras==='lb' ? `L${b.runs}` : b.runs===0 ? '•' : String(b.runs);
              return (
                <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border"
                  style={{ background:bg, borderColor:bg||N.border, color:b?'#fff':N.textMuted, opacity:b?1:0.3 }}>
                  {txt}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Batsmen + bowler */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { icon:'🏏', label:'Striker',     name:activeStriker?.name || match.strikerName || '–', sub: activeStriker ? `${activeStriker.runs}(${activeStriker.balls})` : '' },
            { icon:'⬤',  label:'Non-Striker', name:activeNonStriker?.name || match.nonStrikerName || '–', sub: activeNonStriker ? `${activeNonStriker.runs}(${activeNonStriker.balls})` : '' },
            { icon:'🎳', label:'Bowler',      name:match.currentBowlerName || '–', sub: (() => { const b = safeBowlers.find((x:any)=>x.name===match.currentBowlerName); return b ? `${b.wickets}-${b.runs}` : ''; })() },
          ].map(p => (
            <div key={p.label} className="rounded-xl p-2.5" style={{ background:N.bgElevated, border:`1px solid ${N.border}` }}>
              <div className="text-[10px] mb-0.5" style={{ color:N.textMuted }}>{p.icon} {p.label}</div>
              <div className="font-bold truncate" style={{ color:N.textPrimary }}>{p.name}</div>
              {p.sub && <div className="text-[10px] mt-0.5" style={{ color:N.accentDim }}>{p.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Error / last ball toast ── */}
      {(error || lastBall) && (
        <div className="px-4 pt-2">
          {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg">{error}</p>}
          {lastBall && !error && <p className="text-xs px-3 py-1.5 rounded-lg" style={{ color:N.accent, background:N.accentGlow }}>{lastBall}</p>}
        </div>
      )}

      {/* ── Scoring panels ── */}
      <div className="flex-1 overflow-y-auto" style={{ background:N.bg }}>

        {/* MAIN panel */}
        {panel === 'main' && (
          <div className="p-4 space-y-4">
            <BroadcastPanel fire={fireTrigger} match={match} />

            {/* Run buttons 0–6 + 3rd umpire */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:N.textMuted }}>Runs</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[0,1,2,3,4,6].map(r => (
                  <button key={r} disabled={submitting||isDecisionPending} onClick={() => submitBall({ runs:r })}
                    className="py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 shadow-lg"
                    style={{ background:r===4?'#1d4ed8':r===6?'#6d28d9':N.bgElevated, border:`1px solid ${r===4?'#2563eb':r===6?'#7c3aed':N.border}`, color:r===4||r===6?'#fff':N.textPrimary }}>
                    {r===0?'•':r}
                  </button>
                ))}
                {/* 3rd Umpire toggle */}
                <button onClick={toggleDecisionPending}
                  className="py-3 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                  style={{ background:isDecisionPending?N.amber:N.amberDim, border:`1px solid ${N.amberBorder}`, color:isDecisionPending?N.bg:N.amber }}>
                  <AlertTriangle className="w-5 h-5" />
                  <span className="uppercase leading-tight text-center">3rd Umpire</span>
                </button>
              </div>
            </div>

            {/* Extras */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:N.textMuted }}>Extras</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:'Wide',    icon:'Wd', p:'wide'   as ScoringPanel, bg:'#92400e22', border:'#d97706', color:'#fcd34d' },
                  { label:'No Ball', icon:'NB', p:'noBall' as ScoringPanel, bg:'#7c2d1222', border:'#ea580c', color:'#fb923c' },
                  { label:'Bye',     icon:'B',  p:'bye'    as ScoringPanel, bg:'#0f3d3322', border:'#0d9488', color:'#5eead4' },
                  { label:'Leg Bye', icon:'LB', p:'legBye' as ScoringPanel, bg:'#0c2a3d22', border:'#0369a1', color:'#38bdf8' },
                ].map(btn => (
                  <button key={btn.label} disabled={submitting||isDecisionPending} onClick={() => setPanel(btn.p)}
                    className="py-3 px-4 rounded-xl font-bold text-sm border flex items-center gap-2 disabled:opacity-40"
                    style={{ background:btn.bg, borderColor:btn.border, color:btn.color }}>
                    <span className="font-black w-6 text-center">{btn.icon}</span> {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wicket + Others */}
            <div className="grid grid-cols-2 gap-3">
              <button disabled={submitting||isDecisionPending} onClick={() => setWicketModal({ open:true, baseData:{} })}
                className="py-4 rounded-2xl font-black text-lg active:scale-95 disabled:opacity-40 transition-all"
                style={{ background:N.red, color:'#fff', boxShadow:`0 4px 20px ${N.redBorder}` }}>
                OUT! 🎯
              </button>
              <button disabled={submitting||isDecisionPending} onClick={() => setPanel('others')}
                className="py-4 rounded-2xl font-bold text-sm disabled:opacity-40"
                style={{ background:N.bgElevated, border:`1px solid ${N.border}`, color:N.textSecondary }}>
                Others…
              </button>
            </div>
          </div>
        )}

        {/* WIDE panel */}
        {panel === 'wide' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setPanel('main')} style={{ color:N.textMuted }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color:N.textPrimary }}>Wide Ball</h3>
              <span className="text-xs ml-2 px-2 py-0.5 rounded" style={{ background:'#92400e22', color:'#fcd34d', border:'1px solid #d97706' }}>+1 run always</span>
            </div>
            <p className="text-xs" style={{ color:N.textMuted }}>Select additional runs run (if batters crossed)</p>
            <RunButtons onSelect={r => { setPanel('main'); submitBall({ wide:true, runs:r }); }} disabled={submitting||isDecisionPending} label="Wd" />
            <div className="border-t pt-4 space-y-2" style={{ borderColor:N.border }}>
              <button disabled={submitting||isDecisionPending} onClick={() => { setPanel('main'); setWicketModal({ open:true, baseData:{ wide:true } }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold w-full disabled:opacity-40"
                style={{ background:N.redDim, border:`1px solid ${N.redBorder}`, color:'#fca5a5' }}>
                Stumped / Run Out off Wide
              </button>
            </div>
          </div>
        )}

        {/* NO BALL panel */}
        {panel === 'noBall' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setPanel('main')} style={{ color:N.textMuted }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color:N.textPrimary }}>No Ball</h3>
              <span className="text-xs ml-2 px-2 py-0.5 rounded" style={{ background:'#7c2d1222', color:'#fb923c', border:'1px solid #ea580c' }}>+1 run + free hit</span>
            </div>
            <p className="text-xs" style={{ color:N.textMuted }}>Select runs scored off the bat (extra +1 NB run added automatically)</p>
            <RunButtons onSelect={r => { setPanel('main'); submitBall({ noBall:true, runs:r }); }} disabled={submitting||isDecisionPending} label="NB" />
            <div className="border-t pt-4 space-y-2" style={{ borderColor:N.border }}>
              <p className="text-xs font-semibold mb-2" style={{ color:N.textMuted }}>Byes / Leg Byes off No Ball</p>
              <div className="grid grid-cols-2 gap-2">
                <button disabled={submitting||isDecisionPending} onClick={() => { setPanel('main'); submitBall({ noBall:true, bye:1 }); }}
                  className="py-2 px-3 rounded-xl text-xs font-semibold disabled:opacity-40" style={{ background:'#0f3d3322', border:'1px solid #0d9488', color:'#5eead4' }}>
                  NB + Bye
                </button>
                <button disabled={submitting||isDecisionPending} onClick={() => { setPanel('main'); submitBall({ noBall:true, legBye:1 }); }}
                  className="py-2 px-3 rounded-xl text-xs font-semibold disabled:opacity-40" style={{ background:'#0c2a3d22', border:'1px solid #0369a1', color:'#38bdf8' }}>
                  NB + Leg Bye
                </button>
              </div>
              <button disabled={submitting||isDecisionPending} onClick={() => { setPanel('main'); setWicketModal({ open:true, baseData:{ noBall:true } }); }}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold w-full disabled:opacity-40"
                style={{ background:N.redDim, border:`1px solid ${N.redBorder}`, color:'#fca5a5' }}>
                Run Out off No Ball
              </button>
            </div>
          </div>
        )}

        {/* BYE panel */}
        {panel === 'bye' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setPanel('main')} style={{ color:N.textMuted }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color:N.textPrimary }}>Bye</h3>
            </div>
            <p className="text-xs" style={{ color:N.textMuted }}>Runs taken — ball missed bat AND body. Charged to fielding team, NOT the bowler.</p>
            <RunButtons onSelect={r => { if (r === 0) { setPanel('main'); return; } setPanel('main'); submitBall({ bye:r }); }} disabled={submitting||isDecisionPending} label="B" />
          </div>
        )}

        {/* LEG BYE panel */}
        {panel === 'legBye' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setPanel('main')} style={{ color:N.textMuted }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color:N.textPrimary }}>Leg Bye</h3>
            </div>
            <p className="text-xs" style={{ color:N.textMuted }}>Ball hit body (not bat). Valid only if batter attempted a shot or evaded. Not credited to bowler.</p>
            <RunButtons onSelect={r => { if (r === 0) { setPanel('main'); return; } setPanel('main'); submitBall({ legBye:r }); }} disabled={submitting||isDecisionPending} label="LB" />
          </div>
        )}

        {/* OTHERS panel */}
        {panel === 'others' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setPanel('main')} style={{ color:N.textMuted }}><X className="w-5 h-5" /></button>
              <h3 className="font-bold" style={{ color:N.textPrimary }}>Other Actions</h3>
            </div>
            {[
              { label:'⇄ Change Strike',                fn:() => { setPanel('main'); handleStrikeChange(); },         color:N.accentGlow, border:N.accentBorder, text:N.accent },
              { label:'🚶 Retired Hurt — Striker',      fn:() => handleRetirement('striker'),                         color:N.bgElevated, border:N.border,        text:N.textSecondary },
              { label:'🚶 Retired Hurt — Non-Striker',  fn:() => handleRetirement('nonStriker'),                      color:N.bgElevated, border:N.border,        text:N.textSecondary },
              { label:'🔄 Change Bowler / New Player',  fn:() => { setPanel('main'); setStep('playerSelect'); },      color:N.bgElevated, border:N.border,        text:N.textSecondary },
            ].map(b => (
              <button key={b.label} disabled={submitting||isDecisionPending} onClick={b.fn}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-left disabled:opacity-40"
                style={{ background:b.color, border:`1px solid ${b.border}`, color:b.text }}>
                {b.label}
              </button>
            ))}
            <div className="border-t pt-3" style={{ borderColor:N.border }}>
              <button onClick={handleEndInnings} disabled={submitting||isDecisionPending}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background:N.amberDim, border:`1px solid ${N.amberBorder}`, color:N.amber }}>
                🔚 End Innings Manually
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}