import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import {
  RotateCcw, X, Users, LogOut,
} from 'lucide-react';

const N = {
  accent: '#00ff88', accentDim: '#00cc6a', accentGlow: 'rgba(0,255,136,0.12)', accentBorder: 'rgba(0,255,136,0.3)',
  bg: '#070d0f', bgCard: '#0c1418', bgElevated: '#111c20', border: '#1a2e35',
  textPrimary: '#e8f5f0', textSecondary: '#8ba89e', textMuted: '#4a6560',
  red: '#ff4444', redDim: 'rgba(255,68,68,0.12)', redBorder: 'rgba(255,68,68,0.3)',
  amber: '#f59e0b', amberDim: 'rgba(245,158,11,0.12)', amberBorder: 'rgba(245,158,11,0.3)',
};

interface BallData {
  runs?: number; wide?: boolean; noBall?: boolean;
  bye?: number; legBye?: number;
  wicket?: boolean; outType?: string; outBatsmanName?: string; outFielder?: string;
  retired?: boolean; retiredOut?: boolean; penalty?: number;
}

type SelectContext =
  | { reason: 'innings_start' }
  | { reason: 'wicket'; outRole: 'striker' | 'nonStriker'; outName: string }
  | { reason: 'retired'; retiredRole: 'striker' | 'nonStriker'; retiredName: string }
  | { reason: 'over_end' }
  | { reason: 'bowler_change' }
  | { reason: 'manual' };

type ScoringPanel = 'main' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'others';
type ScoreStep = 'toss' | 'players' | 'scoring' | 'playerSelect' | 'overEnd' | 'inningsBreak' | 'done';

const ALL_WICKET_TYPES = [
  { id: 'bowled', label: 'Bowled' }, { id: 'caught', label: 'Caught' },
  { id: 'lbw', label: 'LBW' }, { id: 'run_out', label: 'Run Out' },
  { id: 'stumped', label: 'Stumped' }, { id: 'hit_wicket', label: 'Hit Wicket' },
  { id: 'handled_ball', label: 'Handled Ball' }, { id: 'obstructing', label: 'Obstructing' },
  { id: 'timed_out', label: 'Timed Out' },
];

function RunButtons({ onSelect, disabled = false, label = '' }: { onSelect: (r: number) => void; disabled?: boolean; label?: string; }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[0, 1, 2, 3, 4, 5, 6].map(r => (
        <button key={r} disabled={disabled} onClick={() => onSelect(r)}
          className="py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: N.bgElevated, border: `1px solid ${N.border}`, color: N.textPrimary }}>
          {label ? (r === 0 ? label : `${label}+${r}`) : (r === 0 ? '•' : r)}
        </button>
      ))}
    </div>
  );
}

function TossModal({ match, onDone }: { match: any; onDone: (d: any) => void }) {
  const [winner, setWinner] = useState('');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');
  const submit = () => {
    if (!winner) return;
    const t1Id = match.team1?._id || match.team1;
    const winTeam = t1Id === winner ? match.team1 : match.team2;
    const loseTeam = winTeam === match.team1 ? match.team2 : match.team1;
    const bat = decision === 'bat' ? winTeam : loseTeam;
    const bowl = decision === 'bat' ? loseTeam : winTeam;
    onDone({ tossWinnerId: winner, tossWinnerName: winTeam.name, tossDecision: decision, battingTeamId: bat._id || bat, battingTeamName: bat.name, bowlingTeamId: bowl._id || bowl, bowlingTeamName: bowl.name });
  };
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: N.bgCard, border: `1px solid ${N.accentBorder}`, boxShadow: `0 0 40px ${N.accentGlow}` }}>
        <h2 className="text-2xl font-black mb-5 text-center" style={{ color: N.accent }}>🪙 Toss</h2>
        <p className="text-xs text-center mb-3" style={{ color: N.textMuted }}>Who won the toss?</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[match.team1, match.team2].map(t => { const id = t?._id || t; return <button key={id} onClick={() => setWinner(id)} className="py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all" style={{ borderColor: winner === id ? N.accent : N.border, background: winner === id ? N.accentGlow : N.bgElevated, color: winner === id ? N.accent : N.textSecondary }}>{t?.name || 'Team'}</button>; })}
        </div>
        <p className="text-xs text-center mb-3" style={{ color: N.textMuted }}>Elected to…</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['bat', 'bowl'] as const).map(d => (<button key={d} onClick={() => setDecision(d)} className="py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all" style={{ borderColor: decision === d ? N.accent : N.border, background: decision === d ? N.accentGlow : N.bgElevated, color: decision === d ? N.accent : N.textSecondary }}>{d === 'bat' ? '🏏 Bat' : '🎳 Bowl'}</button>))}
        </div>
        <button onClick={submit} disabled={!winner} className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40" style={{ background: N.accent, color: N.bg }}>Continue →</button>
      </div>
    </div>
  );
}

function PlayerSelectModal({ match, battingTeamId, inningsNum, context, onDone, onClose, currentInningsData }: { match: any; battingTeamId: string; inningsNum: number; context: SelectContext; onDone: (d: any) => void; onClose?: () => void; currentInningsData: any; }) {
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  // Track selected player by index (not name) to handle duplicate names correctly
  const [strikerIdx, setStrikerIdx] = useState(-1);
  const [nonStrikerIdx, setNonStrikerIdx] = useState(-1);

  const t1Id = match.team1?._id || match.team1;
  const battingTeam = t1Id === battingTeamId ? match.team1 : match.team2;
  const bowlingTeam = battingTeam === match.team1 ? match.team2 : match.team1;
  const batPlayers: any[] = battingTeam?.players || [];
  const bowlPlayers: any[] = bowlingTeam?.players || [];

  // Build fully-out set from names (still needed to exclude dismissed batters)
  const fullyOut = new Set<string>(
    (currentInningsData?.batsmen || [])
      .filter((b: any) => b.isOut && b.outType !== 'retired_hurt' && b.outType !== 'retired')
      .map((b: any) => b.name)
  );

  // Returns players eligible for a role, excluding the player selected in the OTHER role by index
  const getBatOptions = (excludeIdx: number) =>
    batPlayers
      .map((p: any, i: number) => ({ ...p, _idx: i, _key: `${i}::${p.name}` }))
      .filter((p: any) => !fullyOut.has(p.name) && p._idx !== excludeIdx);

  useEffect(() => { if (context.reason === 'bowler_change' || context.reason === 'over_end') setBowler(''); }, [context]);

  // Sel now uses index-based value so duplicate names work
  const SelIdx = ({ label, value, onChange, opts }: {
    label: string; value: number; onChange: (idx: number, name: string) => void; opts: any[];
  }) => (
    <div>
      <label className="text-sm font-semibold mb-1.5 block" style={{ color: N.textSecondary }}>{label}</label>
      <select
        value={value >= 0 ? value : ''}
        onChange={e => {
          const idx = parseInt(e.target.value, 10);
          const name = isNaN(idx) ? '' : (opts.find((p: any) => p._idx === idx)?.name || '');
          onChange(isNaN(idx) ? -1 : idx, name);
        }}
        className="w-full rounded-xl px-3 py-2.5 text-sm"
        style={{ background: N.bgElevated, border: `1px solid ${N.border}`, color: N.textPrimary }}
      >
        <option value="">-- Select --</option>
        {opts.map((p: any) => (
          <option key={p._key} value={p._idx}>{p.name}</option>
        ))}
      </select>
    </div>
  );
  const Sel = ({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: any[] }) => (
    <div>
      <label className="text-sm font-semibold mb-1.5 block" style={{ color: N.textSecondary }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: N.bgElevated, border: `1px solid ${N.border}`, color: N.textPrimary }}>
        <option value="">-- Select --</option>
        {opts.map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
      </select>
    </div>
  );
  let title = 'Player Selection'; let showStriker = false, showNonStriker = false, showBowler = false, isValid = false;
  switch (context.reason) {
    case 'innings_start': title = `Innings ${inningsNum} — Opening Players`; showStriker = true; showNonStriker = true; showBowler = true; isValid = !!(strikerIdx >= 0 && nonStrikerIdx >= 0 && bowler && strikerIdx !== nonStrikerIdx); break;
    case 'wicket': title = context.outRole === 'striker' ? `New Striker (replacing ${context.outName})` : `New Non-Striker (replacing ${context.outName})`; if (context.outRole === 'striker') { showStriker = true; isValid = strikerIdx >= 0; } else { showNonStriker = true; isValid = nonStrikerIdx >= 0; } break;
    case 'retired': title = `${context.retiredName} Retired — Select Replacement`; if (context.retiredRole === 'striker') { showStriker = true; isValid = strikerIdx >= 0; } else { showNonStriker = true; isValid = nonStrikerIdx >= 0; } break;
    case 'over_end': case 'bowler_change': title = 'New Bowler'; showBowler = true; isValid = !!bowler; break;
    case 'manual': title = 'Change Players / Bowler'; showStriker = true; showNonStriker = true; showBowler = true; isValid = !!(strikerIdx >= 0 || nonStrikerIdx >= 0 || bowler); break;
  }
  const handleConfirm = () => {
    if (!isValid) return;
    const payload: any = {};
    if (showStriker && strikerIdx >= 0) payload.striker = batPlayers[strikerIdx]?.name;
    if (showNonStriker && nonStrikerIdx >= 0) payload.nonStriker = batPlayers[nonStrikerIdx]?.name;
    if (showBowler && bowler) payload.bowler = bowler;
    onDone(payload);
  };
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="rounded-2xl p-6 w-full max-w-lg my-4 relative" style={{ background: N.bgCard, border: `1px solid ${N.accentBorder}` }}>
        {onClose && <button onClick={onClose} className="absolute top-4 right-4" style={{ color: N.textMuted }}><X className="w-5 h-5" /></button>}
        <h2 className="text-lg font-black mb-1 flex items-center gap-2" style={{ color: N.accent }}><Users className="w-5 h-5" /> {title}</h2>
        <p className="text-xs mb-5" style={{ color: N.textMuted }}>Innings {inningsNum} · {battingTeam?.name} batting</p>
        <div className="space-y-4">
          {showStriker && <SelIdx label="🏏 Striker (facing)" value={strikerIdx} onChange={(idx, _name) => setStrikerIdx(idx)} opts={getBatOptions(nonStrikerIdx)} />}
          {showNonStriker && <SelIdx label="⬤ Non-Striker (other end)" value={nonStrikerIdx} onChange={(idx, _name) => setNonStrikerIdx(idx)} opts={getBatOptions(strikerIdx)} />}
          {showBowler && <Sel label="🎳 Bowler" value={bowler} onChange={setBowler} opts={bowlPlayers} />}
          <button onClick={handleConfirm} disabled={!isValid} className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40" style={{ background: N.accent, color: N.bg }}>Confirm ✓</button>
        </div>
      </div>
    </div>
  );
}

function OverEndModal({ match, onSubstitute, onBowlerOnly }: { match: any; onSubstitute: () => void; onBowlerOnly: () => void }) {
  const inn = match?.innings?.[match?.currentInnings - 1];
  const overs = Math.floor((inn?.balls || 0) / 6);
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm text-center" style={{ background: N.bgCard, border: `1px solid ${N.accentBorder}` }}>
        <div className="text-4xl mb-3">⚡</div>
        <h2 className="text-xl font-black mb-1" style={{ color: N.accent }}>End of Over {overs}</h2>
        <p className="text-xs mb-6" style={{ color: N.textMuted }}>Do you need to change any batters as well as the bowler?</p>
        <div className="space-y-3">
          <button onClick={onSubstitute} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: N.bgElevated, border: `1px solid ${N.border}`, color: N.textPrimary }}>Yes — Change Batter(s) + Bowler</button>
          <button onClick={onBowlerOnly} className="w-full py-3 rounded-xl font-black text-sm" style={{ background: N.accent, color: N.bg }}>Bowler Only →</button>
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
        <h2 className="text-2xl font-black mb-4" style={{ color: N.accent }}>Innings Break</h2>
        <div className="rounded-xl p-4 mb-3" style={{ background: N.bgElevated }}>
          <p className="text-xs mb-1" style={{ color: N.textMuted }}>{inn1?.teamName || 'Team 1'} scored</p>
          <p className="text-4xl font-black" style={{ color: N.textPrimary }}>{inn1?.score ?? 0}/{inn1?.wickets ?? 0}</p>
          <p className="text-xs mt-1" style={{ color: N.textMuted }}>({Math.floor((inn1?.balls || 0) / 6)}.{(inn1?.balls || 0) % 6} ov)</p>
        </div>
        <div className="rounded-xl p-4 mb-6" style={{ background: N.accentGlow, border: `1px solid ${N.accentBorder}` }}>
          <p className="font-bold text-lg" style={{ color: N.accent }}>Target: {target}</p>
          <p className="text-xs mt-1" style={{ color: N.textMuted }}>{match.team2Name || 'Team 2'} needs {target} runs to win</p>
        </div>
        <button onClick={onContinue} className="w-full py-3 rounded-xl font-black text-sm" style={{ background: N.accent, color: N.bg }}>Select Players for 2nd Innings →</button>
      </div>
    </div>
  );
}

function WicketModal({ strikerName, nonStrikerName, baseData, onConfirm, onClose }: { strikerName: string; nonStrikerName: string; baseData: BallData; onConfirm: (d: BallData, outRole: 'striker' | 'nonStriker') => void; onClose: () => void; }) {
  const [outType, setOutType] = useState('');
  const [outPerson, setOutPerson] = useState<'striker' | 'nonStriker'>('striker');
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: N.bgCard, border: `1px solid ${N.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black" style={{ color: N.red }}>⚡ Wicket</h3>
          <button onClick={onClose} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: N.textMuted }}>How out?</p>
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {ALL_WICKET_TYPES.map(wt => (<button key={wt.id} onClick={() => setOutType(wt.id)} className="py-2 rounded-lg text-xs font-semibold border transition-all" style={{ background: outType === wt.id ? N.red : N.redDim, borderColor: outType === wt.id ? N.red : N.redBorder, color: outType === wt.id ? '#fff' : '#fca5a5' }}>{wt.label}</button>))}
        </div>
        {outType && (
          <>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: N.textMuted }}>Who is out?</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['striker', 'nonStriker'] as const).map(role => (<button key={role} onClick={() => setOutPerson(role)} className="py-2.5 rounded-xl text-sm font-bold border transition-all" style={{ background: outPerson === role ? N.redDim : N.bgElevated, borderColor: outPerson === role ? N.red : N.border, color: outPerson === role ? N.red : N.textSecondary }}>{role === 'striker' ? (strikerName || 'Striker') : (nonStrikerName || 'Non-Striker')}</button>))}
            </div>
            <button onClick={() => onConfirm({ ...baseData, wicket: true, outType, outBatsmanName: outPerson === 'striker' ? strikerName : nonStrikerName }, outPerson)} className="w-full py-3 rounded-xl font-black text-sm" style={{ background: N.red, color: '#fff' }}>Confirm Wicket ⚡</button>
          </>
        )}
      </div>
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
  const [tossData, setTossData] = useState<any>(null);
  const [selectContext, setSelectContext] = useState<SelectContext>({ reason: 'innings_start' });
  const [wicketModal, setWicketModal] = useState<{ open: boolean; baseData: BallData }>({ open: false, baseData: {} });

  const fetchMatch = useCallback(async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      const m = res.data.data || res.data;
      setMatch(m);
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setIsScorer(m.scorerId === u._id || u.role === 'admin');
      if (m.status === 'completed') { setStep('done'); return; }
      if (m.status === 'live') {
        const inn = m.innings?.[m.currentInnings - 1];
        if (!inn || (!m.strikerName && !m.nonStrikerName)) { setSelectContext({ reason: 'innings_start' }); setStep('players'); }
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
    socket.on('scoreUpdate', onScore); socket.on('inningsEnded', onInnings); socket.on('matchEnded', onEnd);
    return () => { socket.leaveMatch(id); socket.off('scoreUpdate', onScore); socket.off('inningsEnded', onInnings); socket.off('matchEnded', onEnd); };
  }, [id, fetchMatch]);

  const handleTossDone = (data: any) => { setTossData(data); setSelectContext({ reason: 'innings_start' }); setStep('players'); };

  const handlePlayersDone = async (players: any) => {
    if (!id || !match) return;
    const currentReason = selectContext.reason;
    setSubmitting(true);
    try {
      if (match.status !== 'live') await matchAPI.startMatch(id, { ...tossData, ...players });
      else await matchAPI.selectPlayers(id, players);
      await fetchMatch();
      setStep('scoring'); setPanel('main');
    } catch { setError('Failed to update players'); } finally { setSubmitting(false); }
  };


  const fireBroadcast = (type: string, duration = 6, data: any = {}) => {
    const matchId = match?._id || id;
    if (!matchId) return;
    const payload = { type, data: { ...data, isManual: true }, duration };
    socket.emit('manualOverlayTrigger', { matchId, trigger: payload });
    fetch(`${(import.meta as any).env?.VITE_API_URL || ''}/api/v1/overlays/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: JSON.stringify({ matchId, trigger: payload }),
    }).catch(() => {});
  };

  const submitBall = async (data: BallData) => {
    if (!id || submitting || !isScorer) return;
    setSubmitting(true); setError('');
    try {
      const res = await matchAPI.addBall(id, data);
      const result = res.data.data;
      await fetchMatch();
      setLastBall(result?.ballDescription || '');
      setPanel('main');
      if (result?.matchEnded) { setStep('done'); }
      else if (result?.inningsEnded) { setStep('inningsBreak'); }
      else if (result?.isWicket && result?.outBatsmanName) { const outName = result.outBatsmanName || ''; const outRole: 'striker' | 'nonStriker' = outName === match?.strikerName ? 'striker' : 'nonStriker'; setSelectContext({ reason: 'wicket', outRole, outName }); setStep('playerSelect'); }
      else if (result?.overChanged) { setStep('overEnd'); }
      else if (result?.needPlayerSelection) { const outName = result.outBatsmanName || ''; const outRole: 'striker' | 'nonStriker' = outName === match?.strikerName ? 'striker' : 'nonStriker'; setSelectContext({ reason: 'wicket', outRole, outName }); setStep('playerSelect'); }
    } catch { setError('Failed to record ball'); } finally { setSubmitting(false); }
  };

  const handleWicketConfirm = (ballData: BallData, outRole: 'striker' | 'nonStriker') => { setWicketModal({ open: false, baseData: {} }); const outName = ballData.outBatsmanName || ''; setSelectContext({ reason: 'wicket', outRole, outName }); submitBall(ballData); };

  const handleUndo = async () => { if (!id || submitting || !confirm('Undo last ball?')) return; setSubmitting(true); try { await matchAPI.undoBall(id); await fetchMatch(); setLastBall('↩ Undone'); setPanel('main'); if (step === 'playerSelect' || step === 'overEnd') setStep('scoring'); } catch { setError('Cannot undo'); } finally { setSubmitting(false); } };

  const handleStrikeChange = async () => { if (!id || submitting) return; setSubmitting(true); try { await matchAPI.selectPlayers(id, { striker: match?.nonStrikerName, nonStriker: match?.strikerName, bowler: match?.currentBowlerName }); await fetchMatch(); setLastBall('⇄ Strike changed'); } catch { setError('Strike change failed'); } finally { setSubmitting(false); } };

  const handleRetirementHurt = async (role: 'striker' | 'nonStriker') => {
    const inn = match?.innings?.[match?.currentInnings - 1];
    const retiredName = role === 'striker' ? match?.strikerName : match?.nonStrikerName;
    const retiredStats = (inn?.batsmen || []).find((b: any) => b.name === retiredName);
    if (!retiredName || submitting) return;
    setSubmitting(true);
    try {
      const res = await matchAPI.addBall(id!, { retired: true, outBatsmanName: retiredName });
      const result = res.data.data;
      await fetchMatch();
      setLastBall(result?.ballDescription || `Retired Hurt (${retiredName})`);
      setPanel('main');
      setSelectContext({ reason: 'retired', retiredRole: role, retiredName });
      setStep('playerSelect');
    } catch { setError('Failed to record retirement'); } finally { setSubmitting(false); }
  };

  // Retired Out — counts as wicket, triggers WICKET_SWITCH animation
  const handleRetiredOut = async (role: 'striker' | 'nonStriker') => {
    const inn = match?.innings?.[match?.currentInnings - 1];
    const retiredName = role === 'striker' ? match?.strikerName : match?.nonStrikerName;
    const retiredStats = (inn?.batsmen || []).find((b: any) => b.name === retiredName);
    if (!retiredName || submitting) return;
    setSubmitting(true);
    try {
      const res = await matchAPI.addBall(id!, { retiredOut: true, wicket: true, outType: 'retired_out', outBatsmanName: retiredName });
      const result = res.data.data;
      await fetchMatch();
      setLastBall(result?.ballDescription || `Retired Out (${retiredName})`);
      setPanel('main');
      setSelectContext({ reason: 'wicket', outRole: role, outName: retiredName });
      setStep('playerSelect');
    } catch { setError('Failed to record retired out'); } finally { setSubmitting(false); }
  };

  const handleEndInnings = async () => { if (!confirm('End current innings?')) return; setSubmitting(true); try { await matchAPI.endInnings(id!); await fetchMatch(); setStep('inningsBreak'); } catch { } finally { setSubmitting(false); } };


  const innings = match?.innings?.[match?.currentInnings - 1] || {};
  const safeBatsmen = Array.isArray(innings?.batsmen) ? innings.batsmen : [];
  const safeBowlers = Array.isArray(innings?.bowlers) ? innings.bowlers : [];
  const score = innings.score || 0; const wickets = innings.wickets || 0;
  const ballsTotal = innings?.balls || 0;
  const oversDisplay = `${Math.floor(ballsTotal / 6)}.${ballsTotal % 6}`;
  const ballsNum = ballsTotal % 6;
  const currentBattingTeamId = innings?.teamId || tossData?.battingTeamId || match?.team1?._id || match?.team1;
  const activeStriker = safeBatsmen.find((b: any) => b.name === match?.strikerName);
  const activeNonStriker = safeBatsmen.find((b: any) => b.name === match?.nonStrikerName);
  const activeBowler = safeBowlers.find((b: any) => b.name === match?.currentBowlerName);
  const target = innings?.targetScore; const requiredRuns = innings?.requiredRuns;
  const remainingBalls = (match?.maxOvers || 20) * 6 - ballsTotal;
  const overBalls: any[] = (() => {
    if (!innings?.ballHistory?.length || ballsNum === 0) return [];
    const hist = innings.ballHistory; const result: any[] = []; let legal = 0;
    for (let i = hist.length - 1; i >= 0 && legal < 6; i--) { const b = hist[i]; result.unshift(b); if (b.extras !== 'wide' && b.extras !== 'nb') legal++; if (legal >= ballsNum) break; }
    return result;
  })();
  const locked = submitting;

  if (loading) return (<div className="min-h-screen flex items-center justify-center bg-black"><div className="w-12 h-12 border-4 border-t-transparent border-green-500 rounded-full animate-spin" /></div>);
  if (!match) return (<div className="min-h-screen flex items-center justify-center bg-black"><p className="text-red-500 text-xl">Match not found</p></div>);
  if (step === 'done') return (<div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: N.bg }}><div className="text-5xl">🏆</div><h2 className="text-2xl font-black" style={{ color: N.accent }}>Match Completed</h2>{match.resultSummary && <p className="text-sm" style={{ color: N.textSecondary }}>{match.resultSummary}</p>}<button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 rounded-xl font-bold text-sm" style={{ background: N.bgCard, border: `1px solid ${N.border}`, color: N.textPrimary }}>← Back</button></div>);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: N.bg, color: N.textPrimary }}>
      {step === 'toss' && <TossModal match={match} onDone={handleTossDone} />}
      {(step === 'players' || step === 'playerSelect') && <PlayerSelectModal match={match} battingTeamId={currentBattingTeamId} inningsNum={match.currentInnings || 1} context={step === 'players' ? { reason: 'innings_start' } : selectContext} onDone={handlePlayersDone} onClose={step === 'playerSelect' ? () => setStep('scoring') : undefined} currentInningsData={innings} />}
      {step === 'overEnd' && <OverEndModal match={match} onSubstitute={() => { setSelectContext({ reason: 'manual' }); setStep('playerSelect'); }} onBowlerOnly={() => { setSelectContext({ reason: 'over_end' }); setStep('playerSelect'); }} />}
      {step === 'inningsBreak' && <InningsBreak match={match} onContinue={() => { setSelectContext({ reason: 'innings_start' }); setStep('playerSelect'); }} />}
      {wicketModal.open && <WicketModal strikerName={activeStriker?.name || match?.strikerName || ''} nonStrikerName={activeNonStriker?.name || match?.nonStrikerName || ''} baseData={wicketModal.baseData} onConfirm={handleWicketConfirm} onClose={() => setWicketModal({ open: false, baseData: {} })} />}

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b" style={{ background: N.bgCard, borderColor: N.border }}>
        <div>
          <h1 className="font-black text-sm" style={{ color: N.accent }}>{match.name}</h1>
          <p className="text-xs" style={{ color: N.textMuted }}>{match.venue} · {match.format} · Inn {match.currentInnings}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: N.redDim, border: `1px solid ${N.redBorder}`, color: N.red }}><LogOut className="w-3.5 h-3.5" /> Leave</button>
          <button onClick={handleUndo} disabled={submitting} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: N.amberDim, border: `1px solid ${N.amberBorder}`, color: N.amber }}><RotateCcw className="w-3.5 h-3.5" /> Undo</button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="px-4 py-4 shrink-0 border-b" style={{ background: N.bgCard, borderColor: N.border }}>
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: N.textMuted }}>{innings?.teamName || match.team1Name}</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black leading-none" style={{ color: N.accent }}>{score}/{wickets}</span>
            <span className="text-xl mb-0.5" style={{ color: N.textSecondary }}>({oversDisplay} ov)</span>
          </div>
          {match.currentInnings === 2 && target && (
            <div className="flex flex-wrap gap-4 mt-1.5">
              <span className="text-xs" style={{ color: N.textMuted }}>Target <strong style={{ color: N.textPrimary }}>{target}</strong></span>
              <span className="text-xs" style={{ color: N.textMuted }}>Need <strong style={{ color: (requiredRuns || 0) <= 12 ? N.accent : N.textPrimary }}>{requiredRuns ?? '–'}</strong> off <strong style={{ color: N.textPrimary }}>{remainingBalls}</strong> balls</span>
            </div>
          )}
        </div>
        {overBalls.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider mr-1" style={{ color: N.textMuted }}>This over:</span>
            {Array.from({ length: 6 }).map((_, i) => { const b = overBalls[i]; const bg = !b ? 'transparent' : b.wicket ? N.red : b.runs === 4 ? '#1d4ed8' : b.runs === 6 ? '#6d28d9' : (b.extras === 'wide' || b.extras === 'nb') ? '#92400e' : N.bgElevated; const txt = !b ? '' : b.wicket ? 'W' : b.extras === 'wide' ? 'Wd' : b.extras === 'nb' ? 'NB' : b.extras === 'bye' ? `B${b.runs}` : b.extras === 'lb' ? `L${b.runs}` : b.runs === 0 ? '•' : String(b.runs); return (<div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border" style={{ background: bg, borderColor: b ? bg : N.border, color: b ? '#fff' : N.textMuted, opacity: b ? 1 : 0.25 }}>{txt}</div>); })}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { icon: '🏏', label: 'Striker', name: activeStriker?.name || match.strikerName || '–', sub: activeStriker ? `${activeStriker.runs}(${activeStriker.balls})${activeStriker.fours ? ` ${activeStriker.fours}×4` : ''}${activeStriker.sixes ? ` ${activeStriker.sixes}×6` : ''}`.trim() : '' },
            { icon: '⬤', label: 'Non-Striker', name: activeNonStriker?.name || match.nonStrikerName || '–', sub: activeNonStriker ? `${activeNonStriker.runs}(${activeNonStriker.balls})` : '' },
            { icon: '🎳', label: 'Bowler', name: match.currentBowlerName || '–', sub: activeBowler ? `${activeBowler.wickets}-${activeBowler.runs} (${Math.floor((activeBowler.balls || 0) / 6)}.${(activeBowler.balls || 0) % 6}ov)` : '' },
          ].map(p => (<div key={p.label} className="rounded-xl p-2.5" style={{ background: N.bgElevated, border: `1px solid ${N.border}` }}><div className="text-[10px] mb-0.5" style={{ color: N.textMuted }}>{p.icon} {p.label}</div><div className="font-bold truncate" style={{ color: N.textPrimary }}>{p.name}</div>{p.sub && <div className="text-[10px] mt-0.5 font-mono" style={{ color: N.accentDim }}>{p.sub}</div>}</div>))}
        </div>
      </div>

      {(error || lastBall) && (<div className="px-4 pt-2">{error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg mb-1">{error}</p>}{lastBall && !error && <p className="text-xs px-3 py-1.5 rounded-lg" style={{ color: N.accent, background: N.accentGlow }}>{lastBall}</p>}</div>)}

      <div className="flex-1 overflow-y-auto" style={{ background: N.bg }}>
        {panel === 'main' && (
          <div className="p-4 space-y-4">



            {/* Runs */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: N.textMuted }}>Runs</p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 6].map(r => (<button key={r} disabled={locked} onClick={() => submitBall({ runs: r })} className="py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: r === 4 ? '#1d4ed8' : r === 6 ? '#6d28d9' : N.bgElevated, border: `1px solid ${r === 4 ? '#2563eb' : r === 6 ? '#7c3aed' : N.border}`, color: r === 4 || r === 6 ? '#fff' : N.textPrimary }}>{r === 0 ? '•' : r}</button>))}
              </div>
            </div>
            {/* Extras */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: N.textMuted }}>Extras</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Wide', icon: 'Wd', p: 'wide' as ScoringPanel, bg: '#92400e22', bdr: '#d97706', clr: '#fcd34d' }, { label: 'No Ball', icon: 'NB', p: 'noBall' as ScoringPanel, bg: '#7c2d1222', bdr: '#ea580c', clr: '#fb923c' }, { label: 'Bye', icon: 'B', p: 'bye' as ScoringPanel, bg: '#0f3d3322', bdr: '#0d9488', clr: '#5eead4' }, { label: 'Leg Bye', icon: 'LB', p: 'legBye' as ScoringPanel, bg: '#0c2a3d22', bdr: '#0369a1', clr: '#38bdf8' }].map(btn => (<button key={btn.label} disabled={locked} onClick={() => setPanel(btn.p)} className="py-3 px-4 rounded-xl font-bold text-sm border flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: btn.bg, borderColor: btn.bdr, color: btn.clr }}><span className="font-black w-6 text-center">{btn.icon}</span> {btn.label}</button>))}
              </div>
            </div>
            {/* Run Out + Others */}
            <div className="grid grid-cols-2 gap-3">
              <button disabled={locked} onClick={() => setWicketModal({ open: true, baseData: {} })} className="py-4 rounded-2xl font-black text-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all" style={{ background: N.red, color: '#fff', boxShadow: `0 4px 20px ${N.redBorder}` }}>OUT! 🎯</button>
              <button disabled={locked} onClick={() => setPanel('others')} className="py-4 rounded-2xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: N.bgElevated, border: `1px solid ${N.border}`, color: N.textSecondary }}>Others…</button>
            </div>
          </div>
        )}

        {panel === 'wide' && (<div className="p-4 space-y-4"><div className="flex items-center gap-2"><button onClick={() => setPanel('main')} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button><h3 className="font-bold" style={{ color: N.textPrimary }}>Wide Ball</h3><span className="text-xs px-2 py-0.5 rounded ml-2" style={{ background: '#92400e22', color: '#fcd34d', border: '1px solid #d97706' }}>+1 auto</span></div><RunButtons onSelect={r => { setPanel('main'); submitBall({ wide: true, runs: r }); }} disabled={submitting} label="Wd" /><div className="border-t pt-4" style={{ borderColor: N.border }}><button disabled={submitting} onClick={() => { setPanel('main'); setWicketModal({ open: true, baseData: { wide: true } }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold w-full disabled:opacity-40" style={{ background: N.redDim, border: `1px solid ${N.redBorder}`, color: '#fca5a5' }}>Run Out / Stumped off Wide</button></div></div>)}
        {panel === 'noBall' && (<div className="p-4 space-y-4"><div className="flex items-center gap-2"><button onClick={() => setPanel('main')} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button><h3 className="font-bold" style={{ color: N.textPrimary }}>No Ball</h3><span className="text-xs px-2 py-0.5 rounded ml-2" style={{ background: '#7c2d1222', color: '#fb923c', border: '1px solid #ea580c' }}>+1 + Free Hit</span></div><RunButtons onSelect={r => { setPanel('main'); submitBall({ noBall: true, runs: r }); }} disabled={submitting} label="NB" /><div className="border-t pt-4 space-y-2" style={{ borderColor: N.border }}><div className="grid grid-cols-2 gap-2"><button disabled={submitting} onClick={() => { setPanel('main'); submitBall({ noBall: true, bye: 1 }); }} className="py-2 px-3 rounded-xl text-xs font-semibold disabled:opacity-40" style={{ background: '#0f3d3322', border: '1px solid #0d9488', color: '#5eead4' }}>NB + Bye</button><button disabled={submitting} onClick={() => { setPanel('main'); submitBall({ noBall: true, legBye: 1 }); }} className="py-2 px-3 rounded-xl text-xs font-semibold disabled:opacity-40" style={{ background: '#0c2a3d22', border: '1px solid #0369a1', color: '#38bdf8' }}>NB + Leg Bye</button></div><button disabled={submitting} onClick={() => { setPanel('main'); setWicketModal({ open: true, baseData: { noBall: true } }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold w-full disabled:opacity-40" style={{ background: N.redDim, border: `1px solid ${N.redBorder}`, color: '#fca5a5' }}>Run Out off No Ball</button></div></div>)}
        {panel === 'bye' && (<div className="p-4 space-y-4"><div className="flex items-center gap-2"><button onClick={() => setPanel('main')} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button><h3 className="font-bold" style={{ color: N.textPrimary }}>Bye</h3></div><RunButtons onSelect={r => { if (r === 0) { setPanel('main'); return; } setPanel('main'); submitBall({ bye: r }); }} disabled={submitting} label="B" /></div>)}
        {panel === 'legBye' && (<div className="p-4 space-y-4"><div className="flex items-center gap-2"><button onClick={() => setPanel('main')} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button><h3 className="font-bold" style={{ color: N.textPrimary }}>Leg Bye</h3></div><RunButtons onSelect={r => { if (r === 0) { setPanel('main'); return; } setPanel('main'); submitBall({ legBye: r }); }} disabled={submitting} label="LB" /></div>)}

        {panel === 'others' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2"><button onClick={() => setPanel('main')} style={{ color: N.textMuted }}><X className="w-5 h-5" /></button><h3 className="font-bold" style={{ color: N.textPrimary }}>Other Actions</h3></div>

            {/* RETIRED OUT — RED, TOP, counts as wicket */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: N.red }}>⚠ Retired Out (Counts as Wicket)</p>
              <button disabled={locked} onClick={() => { setPanel('main'); handleRetiredOut('striker'); }} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-left disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: N.redDim, border: `1px solid ${N.redBorder}`, color: N.red }}>🚫 Retired Out — Striker</button>
              <button disabled={locked} onClick={() => { setPanel('main'); handleRetiredOut('nonStriker'); }} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-left disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: N.redDim, border: `1px solid ${N.redBorder}`, color: N.red }}>🚫 Retired Out — Non-Striker</button>
            </div>

            <div className="border-t" style={{ borderColor: N.border }} />

            {[
              { label: '⇄ Change Strike', fn: () => { setPanel('main'); handleStrikeChange(); }, color: N.accentGlow, border: N.accentBorder, text: N.accent },
              { label: '🚶 Retired Hurt — Striker', fn: () => { setPanel('main'); handleRetirementHurt('striker'); }, color: N.bgElevated, border: N.border, text: N.textSecondary },
              { label: '🚶 Retired Hurt — Non-Striker', fn: () => { setPanel('main'); handleRetirementHurt('nonStriker'); }, color: N.bgElevated, border: N.border, text: N.textSecondary },
              { label: '🎳 Change Bowler', fn: () => { setPanel('main'); setSelectContext({ reason: 'bowler_change' }); setStep('playerSelect'); }, color: N.bgElevated, border: N.border, text: N.textSecondary },
            ].map(b => (<button key={b.label} disabled={locked} onClick={b.fn} className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-left disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: b.color, border: `1px solid ${b.border}`, color: b.text }}>{b.label}</button>))}

            <div className="border-t pt-3" style={{ borderColor: N.border }}>
              <button onClick={handleEndInnings} disabled={submitting} className="w-full py-3 px-4 rounded-xl text-sm font-semibold disabled:opacity-40" style={{ background: N.amberDim, border: `1px solid ${N.amberBorder}`, color: N.amber }}>🔚 End Innings Manually</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
