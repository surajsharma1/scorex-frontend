import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import { RotateCcw, LogOut, ChevronRight, Zap, AlertTriangle, X, RefreshCw, Users, MonitorPlay, Layers, TrendingUp, XCircle } from 'lucide-react';

interface BallData { runs?: number; wide?: boolean; noBall?: boolean; bye?: number; legBye?: number; wicket?: boolean; outType?: string; outBatsmanName?: string; outFielder?: string; retired?: boolean; penalty?: number; }
type ScoringPanel = 'main' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'wicket' | 'others';
type ScoreStep = 'toss' | 'players' | 'scoring' | 'playerSelect' | 'inningsBreak' | 'done';

function RunButtons({ onSelect, disabled = false, extraLabel = '' }: { onSelect: (runs: number) => void; disabled?: boolean; extraLabel?: string; }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
      {[0, 1, 2, 3, 4, 5, 6].map(r => (
        <button key={r} disabled={disabled} onClick={() => onSelect(r)} className="py-4 sm:py-3 md:py-4 rounded-xl font-bold text-lg sm:text-base lg:text-lg bg-slate-700 hover:bg-slate-600 text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
          {extraLabel ? `${extraLabel}+${r}` : (r === 0 ? '•' : r)}
        </button>
      ))}
    </div>
  );
}

const WICKET_TYPES = [{ id: 'bowled', label: 'Bowled' }, { id: 'caught', label: 'Caught' }, { id: 'lbw', label: 'LBW' }, { id: 'run_out', label: 'Run Out' }, { id: 'stumped', label: 'Stumped' }, { id: 'hit_wicket', label: 'Hit Wicket' }, { id: 'handled_ball', label: 'Handled Ball' }, { id: 'obstructing', label: 'Obstructing' }, { id: 'timed_out', label: 'Timed Out' }];

function TossModal({ match, onDone }: { match: any; onDone: (data: any) => void }) {
  const [tossWinner, setTossWinner] = useState('');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');
  const submit = () => {
    if (!tossWinner) return;
    const t1Id = match.team1?._id || match.team1;
    const team = t1Id === tossWinner ? match.team1 : match.team2;
    const other = team._id === t1Id ? match.team2 : match.team1;
    onDone({ tossWinnerId: tossWinner, tossWinnerName: team.name || team.team1Name, tossDecision: decision, battingTeamId: decision === 'bat' ? team._id || team : other._id || other, battingTeamName: decision === 'bat' ? team.name : other.name, bowlingTeamId: decision === 'bat' ? other._id || other : team._id || team, bowlingTeamName: decision === 'bat' ? other.name : team.name });
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
                const id = team?._id || team; const name = team?.name || `Team ${id}`;
                return <button key={id} onClick={() => setTossWinner(id)} className={`py-3 px-4 rounded-xl font-bold text-sm border-2 ${tossWinner === id ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-700 text-slate-400'}`}>{name}</button>;
              })}
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-2 block">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              {(['bat', 'bowl'] as const).map(d => (
                <button key={d} onClick={() => setDecision(d)} className={`py-3 px-4 rounded-xl font-bold text-sm border-2 capitalize ${decision === d ? 'border-green-500 bg-green-500/20 text-white' : 'border-slate-700 text-slate-400'}`}>{d === 'bat' ? '🏏 Bat' : '🎳 Bowl'}</button>
              ))}
            </div>
          </div>
          <button onClick={submit} disabled={!tossWinner} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl mt-4">Continue</button>
        </div>
      </div>
    </div>
  );
}

function PlayerSelectModal({ match, battingTeamId, bowlingTeamId, inningsNum, title, defaultStriker = '', defaultNonStriker = '', defaultBowler = '', onDone, onClose, currentInningsData }: any) {
  const [striker, setStriker] = useState(defaultStriker);
  const [nonStriker, setNonStriker] = useState(defaultNonStriker);
  const [bowler, setBowler] = useState(defaultBowler);

  useEffect(() => {
    setStriker(defaultStriker); setNonStriker(defaultNonStriker); setBowler(defaultBowler);
  }, [defaultStriker, defaultNonStriker, defaultBowler]);

  const t1Id = match.team1?._id || match.team1;
  const battingTeam = t1Id === battingTeamId ? match.team1 : match.team2;
  const bowlingTeam = battingTeam === match.team1 ? match.team2 : match.team1;
  const allBPlayers: any[] = battingTeam?.players || [];
  const bowlPlayers: any[] = bowlingTeam?.players || [];

  const outPlayerNames = new Set<string>(
    (currentInningsData?.batsmen || [])
      .filter((b: any) => b.isOut || b.dismissal || (b.outType && b.outType !== ''))
      .map((b: any) => b.name)
  );

  const availableBatsmen = allBPlayers.filter((p: any) => !outPlayerNames.has(p.name));
  const isValid = () => striker && nonStriker && bowler && striker !== nonStriker;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg my-4 relative">
        {onClose && <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>}
        <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> {title}</h2>
        <p className="text-slate-500 text-xs mb-1">Innings {inningsNum} | {battingTeam?.name || 'Batting Team'} vs {bowlingTeam?.name || 'Bowling Team'}</p>
        {outPlayerNames.size > 0 && (
          <p className="text-amber-500/70 text-xs mb-4">⚠ {outPlayerNames.size} dismissed player{outPlayerNames.size > 1 ? 's' : ''} hidden from selection</p>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🏏 Striker</label>
            <select value={striker} onChange={e => setStriker(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm">
              <option value="">-- Select Player --</option>
              {availableBatsmen.map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-1.5 block">⬤ Non-Striker</label>
            <select value={nonStriker} onChange={e => setNonStriker(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm">
              <option value="">-- Select Player --</option>
              {availableBatsmen.filter((p: any) => p.name !== striker).map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-sm font-semibold mb-1.5 block">🎳 Bowler</label>
            <select value={bowler} onChange={e => setBowler(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm">
              <option value="">-- Select Bowler --</option>
              {bowlPlayers.map((p: any) => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={() => isValid() && onDone({ striker, nonStriker, bowler })} disabled={!isValid()} className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold rounded-xl mt-2">Confirm Selection</button>
        </div>
      </div>
    </div>
  );
}

function InningsBreak({ match, onContinue }: { match: any; onContinue: () => void }) {
  const innings1 = match.innings?.[0]; 
  const target = (innings1?.score || 0) + 1;
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🏏</div>
        <h2 className="text-2xl font-black text-white mb-2">Innings Break</h2>
        <div className="bg-slate-800 rounded-xl p-4 mb-6"><p className="text-slate-400 text-sm">{innings1?.teamName || 'Team 1'} scored</p><p className="text-4xl font-black text-white">{innings1?.score}/{innings1?.wickets}</p><p className="text-slate-400 text-sm mt-1">{innings1?.overs?.toFixed ? innings1.overs.toFixed(1) : 0} overs</p></div>
        <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 mb-6"><p className="text-blue-400 font-bold text-lg">Target: {target}</p></div>
        <button onClick={onContinue} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">Select Players for 2nd Innings →</button>
      </div>
    </div>
  );
}

// --- NEW BROADCAST DIRECTOR PANEL ---
const BroadcastDirectorPanel = ({ matchId, socket }: { matchId: string, socket: any }) => {
  
  const fireManualTrigger = (type: string, data: any = {}) => {
    if (socket) {
      socket.emit('manualOverlayTrigger', {
        matchId,
        trigger: { type, duration: 15, data }
      });
    }
  };

  return (
    <div className="mt-4 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <h3 className="font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider text-sm">
          <MonitorPlay className="w-4 h-4 text-blue-400" /> Broadcast Director
        </h3>
        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded animate-pulse font-bold">LIVE</span>
      </div>
      
      <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => fireManualTrigger('SHOW_SQUADS')} className="flex flex-col items-center justify-center p-3 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/50 rounded-lg transition-colors text-purple-300">
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase">Playing XI</span>
        </button>

        <button onClick={() => fireManualTrigger('SHOW_TOSS')} className="flex flex-col items-center justify-center p-3 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/50 rounded-lg transition-colors text-purple-300">
          <div className="w-5 h-5 mb-1 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black">T</div>
          <span className="text-[10px] font-bold uppercase">Toss Result</span>
        </button>

        <button onClick={() => fireManualTrigger('BATTING_CARD')} className="flex flex-col items-center justify-center p-3 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700/50 rounded-lg transition-colors text-blue-300">
          <Layers className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase">Batting Card</span>
        </button>

        <button onClick={() => fireManualTrigger('BOWLING_CARD')} className="flex flex-col items-center justify-center p-3 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700/50 rounded-lg transition-colors text-blue-300">
          <Layers className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase">Bowling Card</span>
        </button>

        <button onClick={() => fireManualTrigger('BOTH_CARDS')} className="flex flex-col items-center justify-center p-3 bg-indigo-900/30 hover:bg-indigo-800/50 border border-indigo-700/50 rounded-lg transition-colors text-indigo-300">
          <TrendingUp className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase text-center">Match Summary<br/>(Both Cards)</span>
        </button>

        <button onClick={() => fireManualTrigger('DECISION_PENDING')} className="flex flex-col items-center justify-center p-3 bg-yellow-900/30 hover:bg-yellow-800/50 border border-yellow-700/50 rounded-lg transition-colors text-yellow-300">
          <AlertTriangle className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase">3rd Umpire</span>
        </button>

        <button onClick={() => fireManualTrigger('RESTORE')} className="col-span-2 flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors text-slate-300">
          <XCircle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Clear Graphics (Restore Live Score)</span>
        </button>
      </div>
    </div>
  );
};

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
  const [isScorer, setIsScorer] = useState(false);
  const [scorerError, setScorerError] = useState('');
  const [tossData, setTossData] = useState<any>(null);
  
  // Decision Pending State
  const [isDecisionPending, setIsDecisionPending] = useState(false);
  
  const [wicketModal, setWicketModal] = useState<{ open: boolean; baseData: BallData }>({ open: false, baseData: {} });
  const [selectedWicketType, setSelectedWicketType] = useState<string>('');
  const [outBatsman, setOutBatsman] = useState<'striker' | 'nonStriker'>('striker');

  const toggleDecisionPending = () => {
    const newState = !isDecisionPending;
    setIsDecisionPending(newState);
    
    socket.emit('updateMatchState', { 
      match, 
      decisionPending: newState 
    });
  };

  // Derived state to lock out all actions
  const isActionDisabled = submitting || isDecisionPending;

  const fetchMatch = useCallback(async () => {
    if (!id) return;
    try {
      const res = await matchAPI.getMatch(id);
      const m = res.data.data || res.data;
      setMatch(m);
      
      // Check scorer authorization
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsScorer(m.scorerId === user._id || m.tournament?.createdBy?._id === user._id || user.role === 'admin');
        if (!isScorer && m.scorerId) {
          setScorerError('Only assigned scorer or tournament organizer can score');
        } else {
          setScorerError('');
        }
      }
      
      if (m.status === 'completed') setStep('done');
      else if (m.status === 'live') {
        const innings = m.innings?.[m.currentInnings - 1];
        if (!innings || (!m.strikerName && !m.nonStrikerName)) {
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
    const handleScoreUpdate = (data: any) => { if (data.match) setMatch(data.match); };
    const handleInningsEnded = () => fetchMatch();
    const handleMatchEnded = (data: any) => { setMatch(data); setStep('done'); };
    
    socket.on('scoreUpdate', handleScoreUpdate);
    socket.on('inningsEnded', handleInningsEnded);
    socket.on('matchEnded', handleMatchEnded);
    
    return () => {
      socket.leaveMatch(id);
      socket.off('scoreUpdate', handleScoreUpdate);
      socket.off('inningsEnded', handleInningsEnded);
      socket.off('matchEnded', handleMatchEnded);
    };
  }, [id, fetchMatch]);

  const handleTossDone = (data: any) => { setTossData(data); setStep('players'); };

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
    if (!id || isActionDisabled || !isScorer) {
      setScorerError('Scorer authorization required');
      return; 
    }
    setSubmitting(true); 
    setError('');
    try {
      const res = await matchAPI.addBall(id, data);
      await fetchMatch(); 
      setLastBall(res.data.data?.ballDescription || 'Ball Recorded');
      setPanel('main');
      if (res.data.data?.matchEnded) setStep('done');
      else if (res.data.data?.inningsEnded) setStep('inningsBreak');
      else if (res.data.data?.needPlayerSelection) setStep('playerSelect');
    } catch (e: any) { 
      if (e.response?.status === 403) {
        setScorerError('Scoring permission denied. Assign scorer or contact organizer.');
      } else {
        setError(e.response?.data?.message || 'Failed to record ball');
      }
    } finally { setSubmitting(false); }
  };

  const handleStrikeChange = async () => {
    if (!id || isActionDisabled) return;
    setSubmitting(true);
    try {
      await matchAPI.selectPlayers(id, {
        striker: match?.nonStrikerName,
        nonStriker: match?.strikerName,
        bowler: match?.currentBowlerName,
      });
      await fetchMatch();
      setLastBall('⇄ Strike Changed');
    } catch (e: any) { setError('Failed to change strike'); }
    finally { setSubmitting(false); }
  };

  const handleRetirement = (type: 'striker' | 'nonStriker') => {
    setPanel('main');
    setStep('playerSelect');
    submitBall({ retired: true, outBatsmanName: type === 'striker' ? match?.strikerName : match?.nonStrikerName });
  };

  const handleUndo = async () => {
    if (!id || isActionDisabled || !confirm('Undo last ball?')) return; 
    setSubmitting(true);
    try { await matchAPI.undoBall(id); await fetchMatch(); setLastBall('↩ Undone'); setPanel('main'); } catch (e: any) { setError('Cannot undo'); } finally { setSubmitting(false); }
  };

  const handleEndInnings = async () => {
    if (!confirm('End current innings?')) return; 
    setSubmitting(true);
    try { await matchAPI.endInnings(id!); await fetchMatch(); setStep('inningsBreak'); } catch (e: any) {} finally { setSubmitting(false); }
  };

  const handleEndMatch = async () => {
    if (!confirm('End the match?')) return; 
    setSubmitting(true);
    try { await matchAPI.endMatch(id!, {}); await fetchMatch(); setStep('done'); } catch (e: any) {} finally { setSubmitting(false); }
  };

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

  const activeStriker = safeBatsmen.find((b: any) => b.name === match?.strikerName) || safeBatsmen.find((b: any) => b?.isStriker && !b?.isOut);
  const activeNonStriker = safeBatsmen.find((b: any) => b.name === match?.nonStrikerName) || safeBatsmen.find((b: any) => !b?.isStriker && !b?.isOut && b?.enteredAt !== undefined);

  let defStriker = activeStriker ? activeStriker.name : '';
  let defNonStriker = activeNonStriker ? activeNonStriker.name : '';
  let defBowler = match?.currentBowlerName || '';

  if (step === 'players') { defStriker = ''; defNonStriker = ''; defBowler = ''; }

  const openWicketModal = (baseData: BallData = {}) => { 
    setSelectedWicketType(''); 
    setWicketModal({ open: true, baseData }); 
    setOutBatsman('striker'); 
  };

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
          title={step === 'players' ? 'Select Opening Players' : 'Player Selection'}
          defaultStriker={defStriker} defaultNonStriker={defNonStriker} defaultBowler={defBowler}
          currentInningsData={innings}
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
            
            <label className="text-slate-400 text-sm font-semibold mb-2 block">How did they get out?</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {WICKET_TYPES.map(wt => (
                <button key={wt.id} onClick={() => setSelectedWicketType(wt.id)} className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${selectedWicketType === wt.id ? 'bg-red-600 border-red-500 text-white' : 'bg-red-900/40 hover:bg-red-700/60 border-red-700/40 text-red-200'}`}>
                  {wt.label}
                </button>
              ))}
            </div>

            {selectedWicketType && (
              <div className="pt-3 border-t border-slate-700 animate-in fade-in">
                <label className="text-slate-400 text-sm font-semibold mb-2 block">Who is out?</label>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setOutBatsman('striker')} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${outBatsman === 'striker' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-700 text-slate-400'}`}>
                    Striker ({activeStriker?.name || 'Unknown'})
                  </button>
                  <button onClick={() => setOutBatsman('nonStriker')} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${outBatsman === 'nonStriker' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-slate-700 text-slate-400'}`}>
                    Non-Striker ({activeNonStriker?.name || 'Unknown'})
                  </button>
                </div>

                {selectedWicketType === 'run_out' ? (
                  <>
                    <label className="text-slate-400 text-sm font-semibold mb-2 block">Runs completed before run out?</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0,1,2,3].map(r => (
                        <button key={r} onClick={() => {
                          setWicketModal({ open: false, baseData: {} });
                          submitBall({ ...wicketModal.baseData, runs: r, wicket: true, outType: 'run_out', outBatsmanName: outBatsman === 'striker' ? activeStriker?.name : activeNonStriker?.name });
                        }} className="py-2 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white">
                          {r}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <button onClick={() => {
                    setWicketModal({ open: false, baseData: {} });
                    submitBall({ ...wicketModal.baseData, wicket: true, outType: selectedWicketType, outBatsmanName: outBatsman === 'striker' ? activeStriker?.name : activeNonStriker?.name });
                  }} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">
                    Confirm Wicket
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header & Score Display ────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div><h1 className="font-bold text-white text-sm">{match.name}</h1><p className="text-slate-500 text-xs">{match.venue} · {match.format}</p></div>
          <div className="flex gap-2">
            <button onClick={handleUndo} disabled={isActionDisabled} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 text-xs font-semibold disabled:opacity-40"><RotateCcw className="w-3.5 h-3.5" /> Undo</button>
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
            {match.currentBowlerName && <div className="text-slate-400 mt-0.5">{safeBowlers.find((b:any)=>b.name===match.currentBowlerName)?.overs}.{safeBowlers.find((b:any)=>b.name===match.currentBowlerName)?.balls % 6}ov {safeBowlers.find((b:any)=>b.name===match.currentBowlerName)?.runs}R</div>}
          </div>
        </div>

        {lastBall && <div className="mt-3 text-center"><span className="text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-slate-300">Last: {lastBall}</span></div>}
        {error && <div className="mt-2 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-red-300 text-xs">{error}</span><button onClick={() => setError('')} className="ml-auto text-red-400"><X className="w-3.5 h-3.5" /></button></div>}
      </div>

      {/* ── Scoring Panels ───────────────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-950 px-4 py-4 overflow-y-auto">
        
        {/* Toggle Decision Pending (Highest Priority Above Runs) */}
        <button 
          onClick={toggleDecisionPending}
          className={`w-full py-4 mb-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
            isDecisionPending 
              ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse' 
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          {isDecisionPending ? 'RESUME MATCH (DECISION PENDING)' : 'THIRD UMPIRE / DECISION PENDING'}
        </button>

        {panel === 'main' && (
          <div className="space-y-4">
            <div><p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Runs</p>
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3, 4, 6].map(r => (
                  <button key={r} disabled={isActionDisabled} onClick={() => submitBall({ runs: r })} className={`py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${r === 4 ? 'bg-blue-600 shadow-blue-600/30' : r === 6 ? 'bg-purple-600 shadow-purple-600/30' : r === 0 ? 'bg-slate-800 text-slate-300' : 'bg-slate-700'}`}>{r === 0 ? '•' : r}</button>
                ))}
              </div>
            </div>
            <div><p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Extras & Wickets</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Wide', icon: '↔', panel: 'wide' as ScoringPanel, color: 'bg-amber-600/20 border-amber-600/40 text-amber-300' }, { label: 'No Ball', icon: '⊘', panel: 'noBall' as ScoringPanel, color: 'bg-orange-600/20 border-orange-600/40 text-orange-300' }, { label: 'Bye', icon: 'B', panel: 'bye' as ScoringPanel, color: 'bg-teal-600/20 border-teal-600/40 text-teal-300' }, { label: 'Leg Bye', icon: 'LB', panel: 'legBye' as ScoringPanel, color: 'bg-cyan-600/20 border-cyan-600/40 text-cyan-300' }].map(btn => (
                  <button key={btn.label} disabled={isActionDisabled} onClick={() => setPanel(btn.panel)} className={`py-3 px-4 rounded-xl font-bold text-sm border flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${btn.color}`}><span className="font-black">{btn.icon}</span> {btn.label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={isActionDisabled} onClick={() => openWicketModal({})} className="py-4 rounded-2xl font-black text-lg bg-red-700 hover:bg-red-600 text-white shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">OUT! 🎯</button>
              <button disabled={isActionDisabled} onClick={() => setPanel('others')} className="py-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">Others…</button>
            </div>
          </div>
        )}

        {panel === 'wide' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button disabled={isActionDisabled} onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">Wide Ball</h3></div>
            <RunButtons onSelect={r => submitBall({ wide: true, runs: r })} disabled={isActionDisabled} extraLabel="Wd" />
            <div className="border-t border-slate-800 pt-4"><button disabled={isActionDisabled} onClick={() => { setPanel('main'); openWicketModal({ wide: true }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full disabled:opacity-40">Wicket (Off Wide)</button></div>
          </div>
        )}

        {panel === 'noBall' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button disabled={isActionDisabled} onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">No Ball</h3></div>
            <RunButtons onSelect={r => submitBall({ noBall: true, runs: r })} disabled={isActionDisabled} extraLabel="NB" />
            <div className="border-t border-slate-800 pt-4"><button disabled={isActionDisabled} onClick={() => { setPanel('main'); openWicketModal({ noBall: true }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full disabled:opacity-40">Run Out (Off No Ball)</button></div>
          </div>
        )}

        {panel === 'bye' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button disabled={isActionDisabled} onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">Byes</h3></div>
            <div className="grid grid-cols-4 gap-2">{[1, 2, 3, 4].map(r => <button key={r} disabled={isActionDisabled} onClick={() => { setPanel('main'); submitBall({ bye: r }); }} className="py-4 rounded-xl font-bold text-lg bg-teal-900/40 hover:bg-teal-700/60 border border-teal-700/40 text-teal-200 disabled:opacity-40 disabled:cursor-not-allowed">B{r}</button>)}</div>
            <div className="border-t border-slate-800 pt-4"><button disabled={isActionDisabled} onClick={() => { setPanel('main'); openWicketModal({ bye: 0 }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full disabled:opacity-40">Run Out (Off Bye)</button></div>
          </div>
        )}

        {panel === 'legBye' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button disabled={isActionDisabled} onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">Leg Byes</h3></div>
            <div className="grid grid-cols-4 gap-2">{[1, 2, 3, 4].map(r => <button key={r} disabled={isActionDisabled} onClick={() => { setPanel('main'); submitBall({ legBye: r }); }} className="py-4 rounded-xl font-bold text-lg bg-cyan-900/40 hover:bg-cyan-700/60 border border-cyan-700/40 text-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed">LB{r}</button>)}</div>
            <div className="border-t border-slate-800 pt-4"><button disabled={isActionDisabled} onClick={() => { setPanel('main'); openWicketModal({ legBye: 0 }); }} className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 w-full disabled:opacity-40">Run Out (Off Leg Bye)</button></div>
          </div>
        )}

        {panel === 'others' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4"><button disabled={isActionDisabled} onClick={() => setPanel('main')} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button><h3 className="text-white font-bold">Other Actions</h3></div>
            <button onClick={() => { setPanel('main'); handleStrikeChange(); }} disabled={isActionDisabled} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-900/30 hover:bg-blue-700/40 text-left border border-blue-700/40 text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed">⇄ Change Strike (Swap Batsmen)</button>
            <button onClick={() => handleRetirement('striker')} disabled={isActionDisabled} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed">🚶 Retired Hurt (Striker)</button>
            <button onClick={() => handleRetirement('nonStriker')} disabled={isActionDisabled} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed">🚶 Retired Hurt (Non-Striker)</button>
            <button onClick={() => { setPanel('main'); setStep('playerSelect'); }} disabled={isActionDisabled} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed">🔄 Change Bowler Mid-Over</button>
            <div className="pt-3 border-t border-slate-800 mt-2">
              <p className="text-slate-500 text-xs mb-2">Penalty Runs</p>
              <div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map(p => <button key={p} disabled={isActionDisabled} onClick={() => { setPanel('main'); submitBall({ penalty: p }); }} className="py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed">+{p}</button>)}</div>
            </div>
            <div className="border-t border-slate-800 pt-3 mt-4">
              <button onClick={handleEndInnings} disabled={isActionDisabled} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 mb-2 disabled:opacity-40 disabled:cursor-not-allowed">🔚 End Innings Manually</button>
              <button onClick={handleEndMatch} disabled={isActionDisabled} className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/40 border border-red-700/40 text-red-300 disabled:opacity-40 disabled:cursor-not-allowed">🏁 End Match</button>
            </div>
          </div>
        )}
      </div>

      <BroadcastDirectorPanel matchId={match._id} socket={socket} />

      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 grid grid-cols-2 gap-3">
        <button onClick={handleEndInnings} disabled={isActionDisabled} className="py-3 rounded-xl font-semibold text-sm bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"><RefreshCw className="w-4 h-4" /> Change Inning</button>
        <button onClick={() => navigate(-1)} className="py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex justify-center items-center gap-2"><LogOut className="w-4 h-4" /> Leave & Save</button>
      </div>

      {submitting && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-300 flex items-center gap-2 shadow-xl z-40"><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Recording...</div>
      )}
    </div>
  );
}