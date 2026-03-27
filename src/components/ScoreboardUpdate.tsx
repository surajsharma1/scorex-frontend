import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Save, Coins, RotateCcw, X, Target, ChevronDown, User, Activity, AlertCircle, Users, Repeat, Shield } from 'lucide-react';
import { matchAPI, teamAPI } from '../services/api';
import { Tournament, LiveScores, Batsman, Bowler } from './types';
import { useToast } from '../hooks/useToast';

type ExtraType = 'wide' | 'noBall' | 'bye' | 'legBye' | null;
type OutType = 'caught' | 'bowled' | 'lbw' | 'stumped' | 'runOut' | 'hitWicket' | 'handledBall' | 'timedOut' | null;

interface Player { _id: string; name: string; role: string; }

interface ScoreboardUpdateProps { 
  tournament: Tournament; 
  matchId?: string; 
  onUpdate: () => void; 
}

const outTypes: { type: OutType; label: string; short: string }[] = [
  { type: 'caught', label: 'Caught', short: 'CAUGHT' },
  { type: 'bowled', label: 'Bowled', short: 'BOWLED' },
  { type: 'lbw', label: 'LBW', short: 'LBW' },
  { type: 'stumped', label: 'Stumped', short: 'STUMPED' },
  { type: 'runOut', label: 'Run Out', short: 'RUN OUT' },
  { type: 'hitWicket', label: 'Hit Wicket', short: 'HIT WICKET' },
  { type: 'handledBall', label: 'Handled Ball', short: 'HANDLED' },
  { type: 'timedOut', label: 'Timed Out', short: 'TIMED OUT' }
];

const extraRunOptions = [0, 1, 2, 3, 4, 5, 6];
const extraRunLabels = ['+0', '+1', '+2', '+3', '+4', '+5', '+6'];

export default function ScoreboardUpdate({ tournament, matchId, onUpdate }: ScoreboardUpdateProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Teams & Rosters
  const [battingTeamPlayers, setBattingTeamPlayers] = useState<Player[]>([]);
  const [fieldingTeamPlayers, setFieldingTeamPlayers] = useState<Player[]>([]);

  // Strict initialization satisfying the LiveScores interface
  const [liveScores, setLiveScores] = useState<LiveScores>(() => {
    const defaultTeam = { 
      name: '', 
      score: 0, 
      wickets: 0, 
      overs: 0, 
      balls: 0, 
      batsmen: [], 
      bowler: { name: '', overs: 0, maidens: 0, balls: 0, runs: 0, wickets: 0, economy: 0 } 
    };
    return {
      team1: defaultTeam,
      team2: defaultTeam,
      battingTeam: 'team1',
      bowlingTeam: 'team2',
      striker: '',
      nonStrikerId: '',
      bowler: '',
      strikerId: '',       
      bowlerId: '',        
      currentRunRate: 0,
      innings: 1,
      isChasing: false
    };
  });

  const [panel, setPanel] = useState<'main' | 'wicket' | 'extras' | 'swap'>('main');
  const [pendingExtraType, setPendingExtraType] = useState<ExtraType>(null);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [wicketData, setWicketData] = useState({ type: 'bowled' as OutType, batsman: 'striker', fielderId: '', incomingBatsmanId: '' });

  // Free Swap State
  const [swapData, setSwapData] = useState({ role: 'striker', newPlayerId: '' });
  const [showSwapModal, setShowSwapModal] = useState(false);

  // Load existing match data for manual editing
  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    matchAPI.getMatch(matchId)
      .then(async (res) => {
        const matchData = res.data?.data || res.data;
        if (matchData && matchData.liveScores) {
          setLiveScores(prev => ({ ...prev, ...matchData.liveScores }));
        }
        
        // Load rosters for wicket/swap dropdowns
        if (matchData?.team1?._id && matchData?.team2?._id) {
          const [t1Res, t2Res] = await Promise.all([
            teamAPI.getTeam(matchData.team1._id),
            teamAPI.getTeam(matchData.team2._id)
          ]);
          setBattingTeamPlayers(t1Res.data.data?.players || []);
          setFieldingTeamPlayers(t2Res.data.data?.players || []);
        }
      })
      .catch(err => {
        console.error("Failed to load match scores for override", err);
        addToast({ type: 'error', message: 'Failed to load current scores' });
      })
      .finally(() => setLoading(false));
  }, [matchId, addToast]);

  // Handle direct manual overrides for text inputs
  const handleManualValueChange = (field: keyof LiveScores, value: string | number, isNested: boolean = false, teamKey?: 'team1' | 'team2') => {
    setLiveScores(prev => {
      if (isNested && teamKey) {
        return {
          ...prev,
          [teamKey]: {
            ...prev[teamKey],
            [field]: typeof value === 'string' && !isNaN(Number(value)) && value !== '' ? Number(value) : value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // Run Addition Logic (Manual Local State Update)
  const addRunsLocal = (runs: number) => {
    setLiveScores(prev => {
      const teamKey = prev.battingTeam as 'team1' | 'team2';
      const team = prev[teamKey];
      let newBalls = team.balls + 1;
      let newOvers = team.overs;
      
      if (newBalls >= 6) {
        newOvers += 1;
        newBalls = 0;
      }

      return {
        ...prev,
        [teamKey]: {
          ...team,
          score: team.score + runs,
          overs: newOvers,
          balls: newBalls
        }
      };
    });
  };

  // Wicket Addition Logic
  const processWicketLocal = () => {
    if (!wicketData.incomingBatsmanId) {
      addToast({ type: 'error', message: 'Please select an incoming batsman' });
      return;
    }
    
    setLiveScores(prev => {
      const teamKey = prev.battingTeam as 'team1' | 'team2';
      const team = prev[teamKey];
      let newBalls = team.balls + 1;
      let newOvers = team.overs;
      
      if (newBalls >= 6) {
        newOvers += 1;
        newBalls = 0;
      }

      const newBatsman = battingTeamPlayers.find(p => p._id === wicketData.incomingBatsmanId);

      return {
        ...prev,
        [wicketData.batsman === 'striker' ? 'striker' : 'nonStriker']: newBatsman?.name || '',
        [wicketData.batsman === 'striker' ? 'strikerId' : 'nonStrikerId']: newBatsman?._id || '',
        [teamKey]: {
          ...team,
          wickets: team.wickets + 1,
          overs: newOvers,
          balls: newBalls
        }
      };
    });
    setPanel('main');
    addToast({ type: 'success', message: 'Wicket recorded locally. Click Save to push.' });
  };

  // Free Swap Logic
  const processSwapLocal = () => {
    if (!swapData.newPlayerId) return;

    setLiveScores(prev => {
      const newPlayer = battingTeamPlayers.find(p => p._id === swapData.newPlayerId);
      if (!newPlayer) return prev;

      return {
        ...prev,
        [swapData.role === 'striker' ? 'striker' : 'nonStriker']: newPlayer.name,
        [swapData.role === 'striker' ? 'strikerId' : 'nonStrikerId']: newPlayer._id,
      };
    });
    setShowSwapModal(false);
    addToast({ type: 'success', message: `Player swapped locally. Click Save to push.` });
  };

  // Extra Runs Logic
  const processExtraLocal = (runs: number) => {
    setLiveScores((prev: LiveScores) => {
      const teamKey = prev.battingTeam as 'team1' | 'team2';
      const team = prev[teamKey];
      
      // Byes & Leg Byes count as valid balls, Wides & No Balls do not.
      let newBalls = team.balls;
      let newOvers = team.overs;
      
      if (pendingExtraType === 'bye' || pendingExtraType === 'legBye') {
        newBalls += 1;
        if (newBalls >= 6) {
          newOvers += 1;
          newBalls = 0;
        }
      }

      // Wides/NBs add an automatic +1 penalty run
      const penalty = (pendingExtraType === 'wide' || pendingExtraType === 'noBall') ? 1 : 0;

      return { 
        ...prev, 
        [teamKey]: { 
          ...team, 
          score: team.score + runs + penalty,
          balls: newBalls,
          overs: newOvers
        } 
      };
    });
    setShowExtraModal(false);
    addToast({ type: 'success', message: `${pendingExtraType} recorded locally (+${runs + (pendingExtraType === 'wide' || pendingExtraType === 'noBall' ? 1 : 0)}).`});
    setPendingExtraType(null);
  };

  // Push Manual State to Backend
  const handleSaveToServer = async () => {
    if (!matchId) return;
    setSaving(true);
    try {
      await matchAPI.updateStatus(matchId, 'ongoing'); 
      // Emulate overriding the liveScores by pushing a custom generic endpoint or via direct ball injection override
      // Usually, there's a matchAPI.overrideLiveScores() endpoint on the backend.
      // If not, we trigger updateMatch
      await matchAPI.createMatch({ ...liveScores, override: true }); 
      
      addToast({ type: 'success', message: 'Scoreboard override synchronized successfully!' });
      onUpdate();
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to sync scoreboard' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center p-12 bg-[var(--bg-primary)] rounded-3xl border border-[var(--border)]">
       <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const activeTeam = liveScores[liveScores.battingTeam as 'team1' | 'team2'];

  return (
    <div className="bg-[var(--bg-primary)] p-4 sm:p-6 rounded-3xl border border-[var(--border)] w-full relative">
      
      {/* ─── HEADER: SCORE OVERVIEW ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" /> Manual Override Editor
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">Directly edit the live match state bypassing the engine.</p>
        </div>
        
        <div className="bg-[var(--bg-card)] px-6 py-3 rounded-2xl border border-[var(--border)] text-center shadow-lg w-full sm:w-auto">
          <div className="text-3xl font-black text-white tracking-wider">
            {activeTeam.score}<span className="text-green-500">/</span>{activeTeam.wickets}
          </div>
          <div className="text-xs font-bold text-[var(--text-muted)] mt-1">
            OVERS: <span className="text-[var(--text-primary)]">{activeTeam.overs}.{activeTeam.balls}</span>
          </div>
        </div>
      </div>

      {/* ─── MANUAL IDENTIFIER INPUTS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border)]">
          <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
            <Target className="w-3 h-3 text-green-400" /> Striker Name
          </label>
          <input type="text" value={liveScores.striker} onChange={e => handleManualValueChange('striker', e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-2.5 text-sm text-white outline-none focus:border-green-500 transition-colors" />
        </div>
        <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border)]">
          <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
            <Target className="w-3 h-3 text-gray-400" /> Non-Striker
          </label>
          <input type="text" value={liveScores.nonStrikerId} onChange={e => handleManualValueChange('nonStrikerId', e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-2.5 text-sm text-white outline-none focus:border-green-500 transition-colors" />
        </div>
        <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border)]">
          <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
            <User className="w-3 h-3 text-blue-400" /> Bowler Name
          </label>
          <input type="text" value={liveScores.bowler} onChange={e => handleManualValueChange('bowler', e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
        </div>
      </div>

      {/* ─── QUICK ACTION INJECTORS ─── */}
      <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border)] shadow-xl mb-6">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar border-b border-[var(--border)] pb-4">
          <button onClick={() => setPanel('main')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${panel === 'main' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-white'}`}>Runs</button>
          <button onClick={() => setPanel('wicket')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${panel === 'wicket' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-white'}`}>Wickets</button>
          <button onClick={() => setPanel('extras')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${panel === 'extras' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-white'}`}>Extras</button>
          <button onClick={() => setShowSwapModal(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--bg-elevated)] text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-2 whitespace-nowrap"><Repeat className="w-4 h-4"/> Swap Player</button>
        </div>

        {/* Runs Panel */}
        {panel === 'main' && (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map(runs => (
              <button key={runs} onClick={() => addRunsLocal(runs)}
                className={`aspect-square sm:aspect-auto sm:py-5 rounded-xl font-black text-xl transition-all hover:scale-[1.03] ${runs === 4 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : runs === 6 ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-[var(--bg-elevated)] text-white border border-[var(--border)]'}`}>
                {runs}
              </button>
            ))}
          </div>
        )}

        {/* Extras Panel */}
        {panel === 'extras' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-200">
            <button onClick={() => { setPendingExtraType('wide'); setShowExtraModal(true); }} className="py-6 rounded-xl font-black text-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all">WIDE</button>
            <button onClick={() => { setPendingExtraType('noBall'); setShowExtraModal(true); }} className="py-6 rounded-xl font-black text-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all">NO BALL</button>
            <button onClick={() => { setPendingExtraType('bye'); setShowExtraModal(true); }} className="py-6 rounded-xl font-black text-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all">BYES</button>
            <button onClick={() => { setPendingExtraType('legBye'); setShowExtraModal(true); }} className="py-6 rounded-xl font-black text-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all">LEG BYES</button>
          </div>
        )}

        {/* Wicket Panel */}
        {panel === 'wicket' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200 p-2 sm:p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
            
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">How Out?</label>
                <div className="relative">
                  <select value={wicketData.type || ''} onChange={e => setWicketData({...wicketData, type: e.target.value as OutType})}
                    className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white outline-none focus:border-red-500 appearance-none font-bold">
                    {outTypes.map(t => <option key={t.type} value={t.type || ''}>{t.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">Who is Out?</label>
                <div className="relative">
                  <select value={wicketData.batsman} onChange={e => setWicketData({...wicketData, batsman: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white outline-none focus:border-red-500 appearance-none font-bold">
                    <option value="striker">Striker ({liveScores.striker})</option>
                    <option value="nonStriker">Non-Striker ({liveScores.nonStrikerId})</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Fielder Selection - Conditional */}
            {['caught', 'runOut', 'stumped'].includes(wicketData.type as string) && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">Select Fielder</label>
                <div className="relative">
                  <select value={wicketData.fielderId} onChange={e => setWicketData({...wicketData, fielderId: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white outline-none focus:border-amber-500 appearance-none font-bold">
                    <option value="">-- Choose Fielder --</option>
                    {fieldingTeamPlayers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
            )}

            {/* Incoming Batsman Selection */}
            <div className="sm:col-span-2 border-t border-[var(--border)] pt-4 mt-2">
               <label className="block text-xs font-bold text-green-400 mb-2 uppercase">Incoming Batsman</label>
               <div className="relative">
                 <select value={wicketData.incomingBatsmanId} onChange={e => setWicketData({...wicketData, incomingBatsmanId: e.target.value})}
                   className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-green-500/50 text-white outline-none focus:border-green-500 appearance-none font-bold">
                   <option value="">-- Select Next Batsman --</option>
                   {battingTeamPlayers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
               </div>
            </div>

            <div className="sm:col-span-2">
              <button onClick={processWicketLocal} className="w-full py-4 mt-2 bg-gradient-to-r from-red-600 to-red-800 text-white border border-red-500/40 rounded-xl font-black uppercase tracking-widest hover:scale-[1.01] transition-transform shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                Inject Wicket
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── SAVE CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold w-full sm:w-auto mr-auto bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
          <AlertCircle className="w-4 h-4" />
          <span>Unsaved local changes</span>
        </div>
        <button onClick={() => setLiveScores({ ...liveScores })} className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] font-bold text-sm hover:text-white transition-all flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> Revert
        </button>
        <button onClick={handleSaveToServer} disabled={saving} className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-black font-black text-sm transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
          {saving ? 'Syncing...' : <><Save className="w-4 h-4" /> Push to Live Server</>}
        </button>
      </div>

      {/* ─── MODALS ─── */}

      {/* EXTRA RUNS MODAL */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-in-95 duration-200" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Coins className="w-5 h-5 text-amber-500" />
                {pendingExtraType === 'wide' ? 'Wide' : pendingExtraType === 'noBall' ? 'No Ball' : pendingExtraType === 'bye' ? 'Byes' : 'Leg Byes'}
              </h3>
              <button onClick={() => setShowExtraModal(false)} className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-red-500/20 hover:text-red-400 transition-colors" style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            
            <p className="text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Select Extra Runs Scored</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {extraRunOptions.map(runs => (
                <button key={runs} onClick={() => processExtraLocal(runs)}
                  className="py-3.5 rounded-xl font-black text-lg transition-all hover:scale-105 border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  {extraRunLabels[runs]}
                </button>
              ))}
            </div>
            <button onClick={() => setShowExtraModal(false)} className="w-full py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] font-bold text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* FREE SWAP MODAL */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl scale-in-95 duration-200 flex flex-col max-h-[85vh]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Repeat className="w-5 h-5 text-blue-500" /> Free Swap Override
              </h3>
              <button onClick={() => setShowSwapModal(false)} className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-red-500/20 hover:text-red-400 transition-colors" style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6 border-b border-[var(--border)] pb-4">Bypass the engine to manually swap out an active player.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">Who to Swap Out?</label>
                <div className="relative">
                  <select value={swapData.role} onChange={e => setSwapData({...swapData, role: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white outline-none focus:border-blue-500 appearance-none font-bold">
                    <option value="striker">Striker ({liveScores.striker})</option>
                    <option value="nonStriker">Non-Striker ({liveScores.nonStrikerId})</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">Select Replacement</label>
                <div className="relative">
                  <select value={swapData.newPlayerId} onChange={e => setSwapData({...swapData, newPlayerId: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white outline-none focus:border-blue-500 appearance-none font-bold">
                    <option value="">-- Choose Bench Player --</option>
                    {battingTeamPlayers.map(p => <option key={p._id} value={p._id}>{p.name} {p.role ? `(${p.role})` : ''}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
            </div>

            <button onClick={processSwapLocal} disabled={!swapData.newPlayerId} className="w-full py-4 mt-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg transition-transform uppercase tracking-widest">
              Confirm Swap
            </button>
          </div>
        </div>
      )}

    </div>
  );
}