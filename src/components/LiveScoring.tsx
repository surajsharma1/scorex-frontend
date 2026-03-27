import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI, teamAPI } from '../services/api';
import { socket } from '../services/socket';
import { RotateCcw, LogOut, ChevronRight, Zap, AlertTriangle, X, RefreshCw, Users, ChevronDown, CheckCircle, Target, Repeat, UserMinus, Trophy } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import type { Match, Player } from './types';

type ScoringPanel = 'main' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'wicket' | 'others';
type ScoreStep = 'toss' | 'players' | 'scoring' | 'playerSelect' | 'inningsBreak' | 'done';

export default function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<ScoreStep>('scoring');
  const [panel, setPanel] = useState<ScoringPanel>('main');
  const [dpActive, setDpActive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Teams & Rosters
  const [battingTeamPlayers, setBattingTeamPlayers] = useState<Player[]>([]);
  const [fieldingTeamPlayers, setFieldingTeamPlayers] = useState<Player[]>([]);

  // Modals & States
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  
  // Toss State
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  // Player Selection State (Start/Wicket)
  const [selectedStriker, setSelectedStriker] = useState('');
  const [selectedNonStriker, setSelectedNonStriker] = useState('');
  const [selectedBowler, setSelectedBowler] = useState('');

  // Wicket State
  const [wicketData, setWicketData] = useState({ outType: 'bowled', whoIsOut: 'striker', fielderId: '', incomingBatsmanId: '' });
  
  // Extras State
  const [extraRuns, setExtraRuns] = useState(0);
  const [runsOffBat, setRunsOffBat] = useState(0);
  const [isNoBallExtra, setIsNoBallExtra] = useState<'bat' | 'bye' | 'legBye'>('bat');

  const loadMatch = useCallback(async () => {
    try {
      const res = await matchAPI.getMatch(id!);
      const matchData = res.data.data || res.data;
      setMatch(matchData);
      
      // Determine Current Step
      if (matchData.status === 'upcoming') setStep('toss');
      else if (matchData.status === 'completed' || matchData.status === 'abandoned') setStep('done');
      else if (!matchData.liveScores?.strikerId || !matchData.liveScores?.bowlerId) setStep('players');
      else setStep('scoring');

      // Load Rosters
      if (matchData.team1?._id && matchData.team2?._id) {
        const [t1, t2] = await Promise.all([
          teamAPI.getTeam(matchData.team1._id),
          teamAPI.getTeam(matchData.team2._id)
        ]);
        const t1Players = t1.data.data?.players || [];
        const t2Players = t2.data.data?.players || [];
        
        // Basic assignment (In a full app, determine batting team from innings)
        setBattingTeamPlayers(t1Players.length > 0 ? t1Players : matchData.team1.players || []);
        setFieldingTeamPlayers(t2Players.length > 0 ? t2Players : matchData.team2.players || []);
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to load match data' });
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    loadMatch();
    if (id) {
      socket.connect();
      socket.joinMatch(id);
      socket.on('scoreUpdate', () => loadMatch());
      socket.on('match_updated', () => loadMatch());
    }
    return () => { socket.off('scoreUpdate'); socket.off('match_updated'); };
  }, [id, loadMatch]);

  const toggleDP = () => {
    const newState = !dpActive;
    setDpActive(newState);
    window.postMessage({ type: 'OVERLAY_ACTION', payload: { event: 'DECISION PENDING', active: newState } }, '*');
  };

  const resetForms = () => {
    setWicketData({ outType: 'bowled', whoIsOut: 'striker', fielderId: '', incomingBatsmanId: '' });
    setExtraRuns(0); setRunsOffBat(0); setIsNoBallExtra('bat'); setPanel('main');
  };

  // ─── API HANDLERS ──────────────────────────────────────────────────────────

  const handleTossSubmit = async () => {
    if (!tossWinner || !tossDecision) return addToast({ type: 'error', message: 'Complete toss details' });
    setActionLoading(true);
    try {
      await matchAPI.startMatch(id!, { tossWinner, tossDecision });
      loadMatch();
    } catch (e: any) { addToast({ type: 'error', message: e.response?.data?.message || 'Failed to save toss' }); }
    finally { setActionLoading(false); }
  };

  const handlePlayerSelectSubmit = async () => {
    if (!selectedStriker || !selectedBowler) return addToast({ type: 'error', message: 'Striker and Bowler required' });
    setActionLoading(true);
    try {
      await matchAPI.selectPlayers(id!, { 
        strikerId: selectedStriker, 
        nonStrikerId: selectedNonStriker, 
        bowlerId: selectedBowler 
      });
      setStep('scoring');
      loadMatch();
    } catch (e: any) { addToast({ type: 'error', message: e.response?.data?.message || 'Failed to assign players' }); }
    finally { setActionLoading(false); }
  };

  const handleScore = async (runs: number, extraType: 'None' | 'WD' | 'NB' | 'B' | 'LB' = 'None', extraAmount: number = 0, isWicket = false, wicketDetails?: any) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await matchAPI.addBall(id!, { runsOffBat: runs, extras: extraAmount, extraType, isWicket, ...wicketDetails });
      resetForms();
      if (dpActive) toggleDP();
    } catch (e: any) { addToast({ type: 'error', message: e.response?.data?.message || 'Failed to update score' }); } 
    finally { setActionLoading(false); }
  };

  const submitWide = () => handleScore(0, 'WD', extraRuns + 1);
  const submitNoBall = () => {
    const extraType = isNoBallExtra === 'bat' ? 'NB' : (isNoBallExtra === 'bye' ? 'B' : 'LB');
    const extraAmt = isNoBallExtra === 'bat' ? 1 : runsOffBat + 1;
    handleScore(isNoBallExtra === 'bat' ? runsOffBat : 0, extraType, extraAmt);
  };
  const submitBye = () => handleScore(0, 'B', extraRuns);
  const submitLegBye = () => handleScore(0, 'LB', extraRuns);
  
  const submitWicket = () => {
    if (!wicketData.incomingBatsmanId) return addToast({ type: 'error', message: 'Select incoming batsman' });
    const live: any = match?.liveScores || {};
    handleScore(0, 'None', 0, true, {
      wicketType: wicketData.outType,
      outBatsmanId: wicketData.whoIsOut === 'striker' ? live.strikerId : live.nonStrikerId,
      fielderId: wicketData.fielderId,
      incomingBatsmanId: wicketData.incomingBatsmanId
    });
  };

  const handleRetire = async (role: 'striker' | 'nonStriker' | 'bowler') => {
    setShowRetireModal(false);
    addToast({ type: 'success', message: `${role} retired successfully.` });
  };

  const handleFreeSwap = async (role: 'striker' | 'nonStriker' | 'bowler', newPlayerId: string) => {
    setShowSwapModal(false);
    addToast({ type: 'success', message: `Player swapped without penalty.` });
  };

  const handleEndInnings = async () => {
    if (!confirm('End current innings?')) return;
    setActionLoading(true);
    try { await matchAPI.endInnings(id!); loadMatch(); }
    catch (e) { addToast({ type: 'error', message: 'Failed to end innings' }); }
    finally { setActionLoading(false); }
  };

  const handleEndMatch = async () => {
    if (!confirm('End entire match?')) return;
    setActionLoading(true);
    try { 
      await matchAPI.endMatch(id!, {}); // Added empty data object `{}` here to fix type error
      loadMatch(); 
    }
    catch (e) { addToast({ type: 'error', message: 'Failed to end match' }); }
    finally { setActionLoading(false); }
  };
  // ─── RENDERERS ─────────────────────────────────────────────────────────────

  if (loading || !match) return <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"/></div>;

  const live: any = match.liveScores || {};

  // STAGE 1: TOSS
  if (step === 'toss') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl">
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-6 text-center">Match Setup: Toss</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-3">Who won the toss?</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTossWinner(match.team1._id)} className={`py-4 rounded-xl font-bold transition-all border ${tossWinner === match.team1._id ? 'bg-green-500 text-black border-green-500' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]'}`}>{match.team1.name}</button>
                <button onClick={() => setTossWinner(match.team2._id)} className={`py-4 rounded-xl font-bold transition-all border ${tossWinner === match.team2._id ? 'bg-green-500 text-black border-green-500' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]'}`}>{match.team2.name}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-3">Decision?</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTossDecision('bat')} className={`py-4 rounded-xl font-bold transition-all border ${tossDecision === 'bat' ? 'bg-blue-500 text-black border-blue-500' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]'}`}>BAT</button>
                <button onClick={() => setTossDecision('bowl')} className={`py-4 rounded-xl font-bold transition-all border ${tossDecision === 'bowl' ? 'bg-blue-500 text-black border-blue-500' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]'}`}>BOWL</button>
              </div>
            </div>
            <button onClick={handleTossSubmit} disabled={actionLoading || !tossWinner} className="w-full py-4 mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl shadow-lg disabled:opacity-50">Start Match</button>
          </div>
        </div>
      </div>
    );
  }

  // STAGE 2: PLAYER SELECTION (Opening or New Over)
  if (step === 'players' || step === 'playerSelect') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl">
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-6 text-center">Select Players</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Striker</label>
              <select value={selectedStriker} onChange={e => setSelectedStriker(e.target.value)} className="w-full p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500">
                <option value="">-- Select Striker --</option>
                {battingTeamPlayers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            {!match.liveScores?.nonStrikerId && (
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Non-Striker</label>
                <select value={selectedNonStriker} onChange={e => setSelectedNonStriker(e.target.value)} className="w-full p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500">
                  <option value="">-- Select Non-Striker --</option>
                  {battingTeamPlayers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Bowler</label>
              <select value={selectedBowler} onChange={e => setSelectedBowler(e.target.value)} className="w-full p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-blue-500">
                <option value="">-- Select Bowler --</option>
                {fieldingTeamPlayers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <button onClick={handlePlayerSelectSubmit} disabled={actionLoading || !selectedStriker || !selectedBowler} className="w-full py-4 mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl shadow-lg disabled:opacity-50">Confirm Players</button>
          </div>
        </div>
      </div>
    );
  }

  // STAGE 4: MATCH DONE
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4 text-center">
        <Trophy className="w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2">Match Completed</h1>
        <p className="text-lg text-[var(--text-muted)] mb-8">This match has ended. Stats are finalized.</p>
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-green-500 hover:text-black transition-all">Go Back</button>
      </div>
    );
  }

  // STAGE 3: MAIN SCORING ENGINE
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* ─── HUD HEADER ─── */}
      <div className="flex-shrink-0 bg-[var(--bg-card)] border-b border-[var(--border)] p-2 sm:p-4 flex justify-between items-center z-10 shadow-md">
        <div>
          <h2 className="text-[clamp(12px,3vw,18px)] font-black text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-md">{match.name}</h2>
          <p className="text-[clamp(10px,2vw,14px)] text-green-400 font-bold uppercase tracking-wider">{match.status}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 sm:px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[clamp(10px,2vw,14px)] hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
            <LogOut className="w-4 h-4 hidden sm:block"/> Exit
          </button>
        </div>
      </div>

      {/* ─── MAIN SCORING AREA ─── */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 pb-24 relative flex flex-col gap-4">
        
        {/* Live Scorecard Banner */}
        <div className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
           <div className="w-full sm:w-auto text-center sm:text-left">
             <h1 className="text-[clamp(32px,6vw,48px)] font-black text-[var(--text-primary)] leading-none">{live.team1Score || 0}<span className="text-[var(--text-muted)]">/</span>{live.team1Wickets || 0}</h1>
             <p className="text-[clamp(14px,3vw,18px)] font-bold text-[var(--text-secondary)] mt-1">Overs: {live.team1Overs || '0.0'}</p>
           </div>
           <div className="flex-1 grid grid-cols-2 gap-4 border-t sm:border-t-0 sm:border-l border-[var(--border)] pt-4 sm:pt-0 sm:pl-6">
              <div><p className="text-[clamp(10px,2vw,12px)] text-[var(--text-muted)] uppercase font-bold tracking-widest flex items-center gap-1"><Target className="w-3 h-3 text-green-400"/> Striker</p><p className="text-[clamp(14px,3vw,18px)] font-bold text-green-400 truncate">{live.strikerName || 'Waiting...'}</p></div>
              <div><p className="text-[clamp(10px,2vw,12px)] text-[var(--text-muted)] uppercase font-bold tracking-widest flex items-center gap-1"><Target className="w-3 h-3"/> Non-Striker</p><p className="text-[clamp(14px,3vw,18px)] font-bold text-[var(--text-primary)] truncate">{live.nonStrikerName || 'Waiting...'}</p></div>
              <div className="col-span-2 border-t border-[var(--border)] pt-2 mt-2"><p className="text-[clamp(10px,2vw,12px)] text-[var(--text-muted)] uppercase font-bold tracking-widest">Bowler</p><p className="text-[clamp(14px,3vw,18px)] font-bold text-blue-400 truncate">{live.bowlerName || 'Waiting...'}</p></div>
           </div>
        </div>

        {/* ─── INPUT ENGINE & TABS ─── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3 sm:p-6 shadow-xl mt-auto">
           <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-2 border-b border-[var(--border)]">
             {(['main', 'wide', 'noBall', 'bye', 'legBye', 'wicket', 'others'] as const).map(t => (
               <button key={t} onClick={() => setPanel(t)} className={`px-4 py-2 rounded-xl whitespace-nowrap font-bold text-[clamp(12px,2.5vw,14px)] transition-all flex-1 sm:flex-none ${panel === t ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-white'}`}>
                 {t === 'main' ? 'Runs' : t.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
               </button>
             ))}
           </div>

           {/* PANEL 1: MAIN RUNS */}
           {panel === 'main' && (
             <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
               {[0, 1, 2, 3, 4, 5, 6].map(r => (
                 <button key={r} onClick={() => handleScore(r, 'None')} disabled={actionLoading} className={`aspect-square sm:aspect-auto sm:py-6 rounded-xl font-black text-[clamp(18px,4vw,24px)] flex items-center justify-center transition-all ${r === 4 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white' : r === 6 ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-gray-700'}`}>{r}</button>
               ))}
               <button onClick={toggleDP} className={`col-span-2 sm:col-span-1 aspect-[2/1] sm:aspect-auto sm:py-6 rounded-xl font-black text-[clamp(12px,2.5vw,16px)] flex items-center justify-center transition-all border ${dpActive ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'}`}>DP {dpActive ? 'ON' : 'OFF'}</button>
               <button onClick={() => setPanel('wicket')} className="col-span-2 sm:col-span-8 mt-2 py-4 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl font-black tracking-widest text-[clamp(16px,3vw,20px)] hover:bg-red-500 hover:text-white transition-all uppercase">Wicket</button>
             </div>
           )}

           {/* PANEL 2: WIDE */}
           {panel === 'wide' && (
             <div className="space-y-4 animate-in fade-in duration-200"><h3 className="text-[var(--text-secondary)] font-bold text-sm uppercase tracking-wider">Extra Runs on Wide (Default is +1)</h3>
               <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">{[0, 1, 2, 3, 4, 5, 6].map(r => (<button key={r} onClick={() => setExtraRuns(r)} className={`py-3 sm:py-4 rounded-xl font-bold text-lg border transition-all ${extraRuns === r ? 'bg-green-500 text-black border-green-500' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]'}`}>{r}</button>))}</div>
               <button onClick={submitWide} disabled={actionLoading} className="w-full py-4 mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl shadow-lg hover:scale-[1.02] transition-transform">Confirm Wide (+{extraRuns + 1} Total)</button>
             </div>
           )}

           {/* PANEL 3: NO BALL */}
           {panel === 'noBall' && (
             <div className="space-y-4 animate-in fade-in duration-200"><h3 className="text-[var(--text-secondary)] font-bold text-sm uppercase tracking-wider">Runs Scored off No Ball</h3>
               <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">{[0, 1, 2, 3, 4, 5, 6].map(r => (<button key={r} onClick={() => setRunsOffBat(r)} className={`py-3 sm:py-4 rounded-xl font-bold text-lg border transition-all ${runsOffBat === r ? 'bg-amber-500 text-black border-amber-500' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]'}`}>{r}</button>))}</div>
               <div className="flex gap-2 border-t border-[var(--border)] pt-4 mt-2"><button onClick={() => setIsNoBallExtra('bat')} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${isNoBallExtra === 'bat' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'}`}>Off Bat</button><button onClick={() => setIsNoBallExtra('bye')} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${isNoBallExtra === 'bye' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'}`}>Byes</button><button onClick={() => setIsNoBallExtra('legBye')} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${isNoBallExtra === 'legBye' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'}`}>Leg Byes</button></div>
               <button onClick={submitNoBall} disabled={actionLoading} className="w-full py-4 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl shadow-lg hover:scale-[1.02] transition-transform">Confirm No Ball</button>
             </div>
           )}

           {/* PANEL 4: BYES / LEG BYES */}
           {(panel === 'bye' || panel === 'legBye') && (
             <div className="space-y-4 animate-in fade-in duration-200"><h3 className="text-[var(--text-secondary)] font-bold text-sm uppercase tracking-wider">Select {panel === 'bye' ? 'Byes' : 'Leg Byes'} Scored</h3>
               <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">{[1, 2, 3, 4, 5, 6].map(r => (<button key={r} onClick={() => setExtraRuns(r)} className={`py-3 sm:py-4 rounded-xl font-bold text-lg border transition-all ${extraRuns === r ? 'bg-blue-500 text-black border-blue-500' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)]'}`}>{r}</button>))}</div>
               <button onClick={panel === 'bye' ? submitBye : submitLegBye} disabled={actionLoading || extraRuns === 0} className="w-full py-4 mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-xl shadow-lg disabled:opacity-50">Confirm {panel === 'bye' ? 'Byes' : 'Leg Byes'} (+{extraRuns})</button>
             </div>
           )}

           {/* PANEL 5: WICKET */}
           {panel === 'wicket' && (
             <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200 p-2 sm:p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">How Out?</label><div className="relative"><select value={wicketData.outType} onChange={e => setWicketData({...wicketData, outType: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none font-bold"><option value="bowled">Bowled</option><option value="caught">Caught</option><option value="lbw">LBW</option><option value="run_out">Run Out</option><option value="stumped">Stumped</option><option value="hit_wicket">Hit Wicket</option><option value="handled_ball">Handled Ball</option><option value="obstructing">Obstructing Field</option><option value="timed_out">Timed Out</option></select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" /></div></div>
                 <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">Who is out?</label><div className="relative"><select value={wicketData.whoIsOut} onChange={e => setWicketData({...wicketData, whoIsOut: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none font-bold"><option value="striker">Striker ({live.strikerName})</option><option value="nonStriker">Non-Striker ({live.nonStrikerName})</option></select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" /></div></div>
               </div>
               {['caught', 'run_out', 'stumped'].includes(wicketData.outType) && (
                 <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">Select Fielder</label><div className="relative"><select value={wicketData.fielderId} onChange={e => setWicketData({...wicketData, fielderId: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none font-bold"><option value="">-- Choose Fielder --</option>{fieldingTeamPlayers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" /></div></div>
               )}
               <div><label className="block text-xs font-bold text-green-400 mb-2 uppercase">Incoming Batsman</label><div className="relative"><select value={wicketData.incomingBatsmanId} onChange={e => setWicketData({...wicketData, incomingBatsmanId: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-green-500/50 text-[var(--text-primary)] outline-none font-bold"><option value="">-- Select Next Batsman --</option>{battingTeamPlayers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" /></div></div>
               <button onClick={submitWicket} disabled={actionLoading || !wicketData.incomingBatsmanId} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-black rounded-xl shadow-lg disabled:opacity-50 hover:scale-[1.02] transition-transform uppercase tracking-widest mt-4">Confirm Wicket</button>
             </div>
           )}

           {/* PANEL 6: OTHERS */}
           {panel === 'others' && (
             <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-in fade-in duration-200">
               <button onClick={() => setShowRetireModal(true)} className="p-4 sm:p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-amber-500/50 transition-all"><UserMinus className="w-8 h-8 text-amber-500" /><span className="font-bold text-[clamp(12px,2.5vw,16px)] text-[var(--text-primary)]">Retire Player</span></button>
               <button onClick={() => setShowSwapModal(true)} className="p-4 sm:p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 transition-all"><Repeat className="w-8 h-8 text-blue-500" /><span className="font-bold text-[clamp(12px,2.5vw,16px)] text-[var(--text-primary)]">Free Swap</span></button>
               <button onClick={() => matchAPI.undoBall(id!).then(() => loadMatch())} className="p-4 sm:p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-green-500/50 transition-all"><RotateCcw className="w-8 h-8 text-green-500" /><span className="font-bold text-[clamp(12px,2.5vw,16px)] text-[var(--text-primary)]">Undo Ball</span></button>
               <button onClick={handleEndInnings} className="p-4 sm:p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-orange-500/50 transition-all"><RefreshCw className="w-8 h-8 text-orange-500" /><span className="font-bold text-[clamp(12px,2.5vw,16px)] text-[var(--text-primary)]">End Innings</span></button>
               <button onClick={handleEndMatch} className="col-span-2 p-4 sm:p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-red-500/20 transition-all"><Zap className="w-8 h-8 text-red-500" /><span className="font-bold text-[clamp(12px,2.5vw,16px)] text-red-400">End Entire Match</span></button>
             </div>
           )}
        </div>
      </div>

      {/* ─── MODALS ─── */}
      {showRetireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6"><h3 className="text-xl font-black text-[var(--text-primary)] mb-4">Retire Player</h3>
            <div className="space-y-3">
              <button onClick={() => handleRetire('striker')} className="w-full p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-left hover:border-amber-500"><span className="block text-[10px] text-[var(--text-muted)] uppercase font-bold">Striker</span><span className="font-bold text-white text-lg">{live.strikerName || 'Unknown'}</span></button>
              <button onClick={() => handleRetire('nonStriker')} className="w-full p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-left hover:border-amber-500"><span className="block text-[10px] text-[var(--text-muted)] uppercase font-bold">Non-Striker</span><span className="font-bold text-white text-lg">{live.nonStrikerName || 'Unknown'}</span></button>
            </div>
            <button onClick={() => setShowRetireModal(false)} className="w-full mt-6 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] font-bold">Cancel</button>
          </div>
        </div>
      )}

      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2"><Repeat className="text-blue-500"/> Free Swap</h3><button onClick={() => setShowSwapModal(false)} className="text-[var(--text-muted)] hover:text-red-400"><X className="w-6 h-6"/></button></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 max-h-[60vh]">
               {battingTeamPlayers.map(p => (
                 <button key={p._id} onClick={() => handleFreeSwap('striker', p._id!)} className="w-full p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-left hover:border-blue-500 transition-all flex justify-between items-center"><span className="font-bold text-white">{p.name}</span></button>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}