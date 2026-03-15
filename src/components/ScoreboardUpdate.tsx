import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Save, Coins, RotateCcw, X, Target } from 'lucide-react';
import { tournamentAPI, matchAPI } from '../services/api';
import { Tournament, Team, LiveScores, Batsman, Bowler } from './types';

// Types for cricket scoring
type ExtraType = 'wide' | 'noBall' | 'bye' | 'legBye' | null;
type OutType = 'caught' | 'bowled' | 'lbw' | 'stumped' | 'runOut' | 'hitWicket' | 'handledBall' | 'timedOut' | null;

interface Player {
  id: string;
  name: string;
  role: string;
}

interface ScoreboardUpdateProps {
  tournament: Tournament;
  matchId?: string;
  onUpdate: () => void;
}

// Out type labels
const outTypes: { type: OutType; label: string; short: string }[] = [
  { type: 'caught', label: 'Caught', short: 'CAUGHT' },
  { type: 'bowled', label: 'Bowled', short: 'BOWLED' },
  { type: 'lbw', label: 'LBW', short: 'LBW' },
  { type: 'stumped', label: 'Stumped', short: 'STUMPED' },
  { type: 'runOut', label: 'Run Out', short: 'RUN OUT' },
  { type: 'hitWicket', label: 'Hit Wicket', short: 'HIT WICKET' },
  { type: 'handledBall', label: 'Handled Ball', short: 'HANDLED' },
  { type: 'timedOut', label: 'Timed Out', short: 'TIMED OUT' },
];

// Scoring options for extras modal
const extraRunOptions = [0, 1, 2, 3, 4, 5, 6];

const extraRunLabels: Record<number, string> = {
  0: 'Dot',
  1: 'Single',
  2: 'Double',
  3: 'Triple',
  4: 'Four',
  5: 'Five',
  6: 'Six',
};

const formatOvers = (overs: number, balls: number) => `${overs}.${balls}`;
const getTeamName = (teams: Team[], index: number) => teams[index]?.name || `Team ${index + 1}`;

const createDefaultBatsmen = (): Batsman[] => [
  { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: true },
  { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: false },
];

const createDefaultBowler = (): Bowler => ({
  name: 'Bowler',
  overs: 0,
  maidens: 0,
  runs: 0,
  wickets: 0,
});

export default function ScoreboardUpdate({ tournament, matchId, onUpdate }: ScoreboardUpdateProps) {
  const teams = Array.isArray(tournament.teams) ? tournament.teams : [];
  const channelRef = useRef<BroadcastChannel | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const [liveScores, setLiveScores] = useState<LiveScores>(() => {
    const existing = tournament.liveScores;
    const getTeamData = (teamKey: 'team1' | 'team2', index: number) => ({
      name: existing?.[teamKey]?.name || getTeamName(teams, index),
      score: existing?.[teamKey]?.score || 0,
      wickets: existing?.[teamKey]?.wickets || 0,
      overs: existing?.[teamKey]?.overs || 0,
      balls: existing?.[teamKey]?.balls || 0,
      batsmen: existing?.[teamKey]?.batsmen?.length ? existing[teamKey].batsmen : createDefaultBatsmen(),
      bowler: existing?.[teamKey]?.bowler || createDefaultBowler(),
    });
    return {
      team1: getTeamData('team1', 0),
      team2: getTeamData('team2', 1),
      battingTeam: existing?.battingTeam || 'team1',
      currentRunRate: existing?.currentRunRate || 0,
      requiredRunRate: existing?.requiredRunRate || 0,
      target: existing?.target || 0,
      lastFiveOvers: existing?.lastFiveOvers || '',
      innings: existing?.innings || 1,
      isChasing: existing?.isChasing || false,
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(0);
  const [bowlerIndex, setBowlerIndex] = useState(0);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<ExtraType>(null);
  const [showOutOptionsInExtra, setShowOutOptionsInExtra] = useState(false);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('cricket_score_updates');
    return () => { if (channelRef.current) channelRef.current.close(); };
  }, []);

  useEffect(() => {
    if (!teams || teams.length === 0) return;
    const battingTeamIndex = liveScores.battingTeam === 'team1' ? 0 : 1;
    const battingTeamObj = teams[battingTeamIndex];
    
    // Handle different player data formats - could be ObjectIds, populated objects, or mixed
    let playersList: Player[] = [];
    
    if (battingTeamObj && battingTeamObj.players) {
      const playersArray = Array.isArray(battingTeamObj.players) 
        ? battingTeamObj.players 
        : [];
      
      playersList = playersArray.map((p: any) => {
        // Handle case where player is just an ObjectId string
        if (typeof p === 'string') {
          return {
            id: p,
            name: `Player (${p.substring(0, 6)})`,
            role: 'Player'
          };
        }
        // Handle populated player object
        return {
          id: p._id || p.id || Math.random().toString(),
          name: p.name || 'Unknown Player',
          role: p.role || 'Player'
        };
      });
    }
    
    // If no players found from team, try to get from tournament.teams
    if (playersList.length === 0 && tournament?.teams) {
      const tournamentTeams = Array.isArray(tournament.teams) ? tournament.teams : [];
      const teamFromTournament = tournamentTeams[battingTeamIndex];
      if (teamFromTournament?.players) {
        playersList = (Array.isArray(teamFromTournament.players) ? teamFromTournament.players : []).map((p: any) => ({
          id: p._id || p.id || Math.random().toString(),
          name: p.name || 'Unknown Player',
          role: p.role || 'Player'
        }));
      }
    }
    
    // If still no players, provide fallback for testing
    if (playersList.length === 0) {
      console.warn('No players found for team:', battingTeamObj?.name);
    }
    
    setAvailablePlayers(playersList);
  }, [liveScores.battingTeam, teams, tournament]);

  const saveScoresToBackend = useCallback(async (scores: LiveScores) => {
    // Validate matchId before making API call
    if (!matchId || matchId === 'undefined' || matchId === 'null') {
      console.warn('Cannot save scores: invalid matchId', matchId);
      return;
    }
    
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      if (matchId) {
await matchAPI.updateMatch(matchId, scores);
      } else {
await tournamentAPI.updateTournament(tournament._id, scores);
      }
      setLastSaved(new Date());
      onUpdate();
    } catch (err) { console.error('Auto-save failed:', err); }
    finally { isSavingRef.current = false; }
  }, [tournament._id, matchId, onUpdate]);

  useEffect(() => {
    if (!tossWinner || loading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveScoresToBackend(liveScores), 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [liveScores, tossWinner, loading, saveScoresToBackend]);

  const currentTeam = liveScores[liveScores.battingTeam];

  const createOverlayData = useMemo(() => {
    const isBattingTeam1 = liveScores.battingTeam === 'team1';
    const battingTeamData = liveScores[liveScores.battingTeam];
    const bowlingTeamData = isBattingTeam1 ? liveScores.team2 : liveScores.team1;
    const t1Name = teams[0]?.name || 'Team 1';
    const t2Name = teams[1]?.name || 'Team 2';
    return {
      tournament: { name: tournament.name || 'Tournament', id: tournament._id || '' },
      team1: {
        name: t1Name, shortName: t1Name.substring(0, 3).toUpperCase(),
        score: isBattingTeam1 ? (battingTeamData?.score || 0) : (bowlingTeamData?.score || 0),
        wickets: isBattingTeam1 ? (battingTeamData?.wickets || 0) : (bowlingTeamData?.wickets || 0),
        overs: isBattingTeam1 ? `${battingTeamData?.overs || 0}.${battingTeamData?.balls || 0}` : `${bowlingTeamData?.overs || 0}.${bowlingTeamData?.balls || 0}`,
        color: '#004BA0', isBatting: isBattingTeam1
      },
      team2: {
        name: t2Name, shortName: t2Name.substring(0, 3).toUpperCase(),
        score: !isBattingTeam1 ? (battingTeamData?.score || 0) : (bowlingTeamData?.score || 0),
        wickets: !isBattingTeam1 ? (battingTeamData?.wickets || 0) : (bowlingTeamData?.wickets || 0),
        overs: !isBattingTeam1 ? `${battingTeamData?.overs || 0}.${battingTeamData?.balls || 0}` : `${bowlingTeamData?.overs || 0}.${bowlingTeamData?.balls || 0}`,
        color: '#FCCA06', isBatting: !isBattingTeam1
      },
      striker: { name: battingTeamData?.batsmen[0]?.name || 'Striker', runs: battingTeamData?.batsmen[0]?.runs || 0, balls: battingTeamData?.batsmen[0]?.balls || 0, fours: battingTeamData?.batsmen[0]?.fours || 0, sixes: battingTeamData?.batsmen[0]?.sixes || 0, status: '*' },
      nonStriker: { name: battingTeamData?.batsmen[1]?.name || 'Non-Striker', runs: battingTeamData?.batsmen[1]?.runs || 0, balls: battingTeamData?.batsmen[1]?.balls || 0, fours: battingTeamData?.batsmen[1]?.fours || 0, sixes: battingTeamData?.batsmen[1]?.sixes || 0, status: '' },
      bowler: { name: battingTeamData?.bowler?.name || 'Bowler', overs: battingTeamData?.bowler?.overs || 0, maidens: battingTeamData?.bowler?.maidens || 0, runs: battingTeamData?.bowler?.runs || 0, wickets: battingTeamData?.bowler?.wickets || 0 },
      stats: { currentRunRate: liveScores.currentRunRate || 0, requiredRunRate: liveScores.requiredRunRate || 0, target: liveScores.target || 0, last5Overs: liveScores.lastFiveOvers || '' },
      battingTeam: liveScores.battingTeam, innings: liveScores.innings || 1, status: liveScores.target > 0 ? 'Chasing' : 'Batting', result: ''
    };
  }, [liveScores, tournament, teams]);

  useEffect(() => {
    if (channelRef.current && tossWinner) channelRef.current.postMessage(createOverlayData);
  }, [createOverlayData, tossWinner]);

  const triggerWicketAnimation = (message: string) => {
    if (channelRef.current) channelRef.current.postMessage({ type: 'WICKET', message, ...createOverlayData });
  };

  const updateStats = (field: string, value: unknown) => setLiveScores(prev => ({ ...prev, [field]: value }));

  const addRuns = (runs: number) => {
    setLiveScores(prev => {
      const team = prev[prev.battingTeam];
      const newScore = team.score + runs;
      const newBatsmen = [...team.batsmen];
      const strikerIdx = newBatsmen.findIndex(b => b.isStriker);
      if (strikerIdx !== -1) {
        newBatsmen[strikerIdx] = {
          ...newBatsmen[strikerIdx],
          runs: newBatsmen[strikerIdx].runs + runs,
          balls: newBatsmen[strikerIdx].balls + 1,
          fours: runs === 4 ? newBatsmen[strikerIdx].fours + 1 : newBatsmen[strikerIdx].fours,
          sixes: runs === 6 ? newBatsmen[strikerIdx].sixes + 1 : newBatsmen[strikerIdx].sixes,
        };
      }
      let newBalls = team.balls + 1, newOvers = team.overs;
      if (newBalls === 6) { newOvers = team.overs + 1; newBalls = 0; }
      const newBowler = team.bowler ? { ...team.bowler, runs: team.bowler.runs + runs, overs: newOvers } : null;
      if (runs % 2 === 1) {
        const temp = newBatsmen[0]; newBatsmen[0] = newBatsmen[1]; newBatsmen[1] = temp;
        newBatsmen[0].isStriker = true; newBatsmen[1].isStriker = false;
      }
      const totalBalls = newOvers * 6 + newBalls;
      const rr = totalBalls > 0 ? (newScore / (totalBalls / 6)) : 0;
      return { ...prev, [prev.battingTeam]: { ...team, score: newScore, balls: newBalls, overs: newOvers, batsmen: newBatsmen, bowler: newBowler }, currentRunRate: parseFloat(rr.toFixed(2)) };
    });
    if (channelRef.current) channelRef.current.postMessage({ type: 'RUN', runs, team: liveScores.battingTeam });
  };

  const addExtraRuns = (runs: number) => {
    if (!pendingExtraType) return;
    setLiveScores(prev => {
      const team = prev[prev.battingTeam];
      const penalty = (pendingExtraType === 'wide' || pendingExtraType === 'noBall') ? 1 : 0;
      const totalRunsToAdd = runs + penalty;
      const newScore = team.score + totalRunsToAdd;
      let newBalls = team.balls, newOvers = team.overs;
      if (pendingExtraType === 'bye' || pendingExtraType === 'legBye') {
        newBalls = team.balls + 1;
        if (newBalls >= 6) { newOvers = team.overs + 1; newBalls = 0; }
      }
      const newBowler = team.bowler ? { ...team.bowler, runs: team.bowler.runs + totalRunsToAdd, overs: newOvers } : null;
      const totalBalls = newOvers * 6 + newBalls;
      const rr = totalBalls > 0 ? (newScore / (totalBalls / 6)) : 0;
      return { ...prev, [prev.battingTeam]: { ...team, score: newScore, balls: newBalls, overs: newOvers, bowler: newBowler }, currentRunRate: parseFloat(rr.toFixed(2)) };
    });
    if (channelRef.current) channelRef.current.postMessage({ type: 'EXTRA', extraType: pendingExtraType, runs, team: liveScores.battingTeam });
    setShowExtraModal(false); setPendingExtraType(null);
  };

  const processWicket = (outType: OutType) => {
    const outMessages: Record<string, string> = { caught: 'CAUGHT', bowled: 'BOWLED', lbw: 'LBW', stumped: 'STUMPED', runOut: 'RUN OUT', hitWicket: 'HIT WICKET', handledBall: 'HANDLED BALL', timedOut: 'TIMED OUT' };
    const message = outMessages[outType || 'caught'] || 'OUT!';
    setLiveScores(prev => {
      const team = prev[prev.battingTeam];
      const newWickets = team.wickets + 1;
      const remainingBatsman = team.batsmen.find(b => !b.isStriker);
      const newBatsman: Batsman = { name: 'New Batter', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: true };
      const newBatsmen = remainingBatsman ? [newBatsman, { ...remainingBatsman, isStriker: false }] : [newBatsman, createDefaultBatsmen()[1]];
      let newBalls = team.balls, newOvers = team.overs;
      if (outType !== 'timedOut') { newBalls = team.balls + 1; if (newBalls >= 6) { newOvers = team.overs + 1; newBalls = 0; } }
      const newBowler = team.bowler ? { ...team.bowler, wickets: team.bowler.wickets + 1, overs: newOvers } : null;
      return { ...prev, [prev.battingTeam]: { ...team, wickets: newWickets, balls: newBalls, overs: newOvers, batsmen: newBatsmen, bowler: newBowler } };
    });
    triggerWicketAnimation(message); setShowOutModal(false);
  };

  const handleToss = (winner: 'team1' | 'team2', choice: 'bat' | 'bowl') => {
    setTossWinner(winner);
    const battingTeam = choice === 'bat' ? winner : (winner === 'team1' ? 'team2' : 'team1');
    updateStats('battingTeam', battingTeam);
    updateStats('isChasing', choice === 'bowl');
  };

  const switchBatting = () => {
    updateStats('battingTeam', liveScores.battingTeam === 'team1' ? 'team2' : 'team1');
    setLiveScores(prev => ({ ...prev, [prev.battingTeam === 'team1' ? 'team2' : 'team1']: { ...prev[prev.battingTeam === 'team1' ? 'team2' : 'team1'], batsmen: createDefaultBatsmen() } }));
  };

  const resetInnings = (team?: 'team1' | 'team2') => {
    const teamName = team ? (team === 'team1' ? getTeamName(teams, 0) : getTeamName(teams, 1)) : 'all';
    if (window.confirm(`Are you sure you want to reset ${teamName} scores?`)) {
      if (team) {
        setLiveScores(prev => ({ ...prev, [team]: { ...prev[team], score: 0, wickets: 0, overs: 0, balls: 0, batsmen: createDefaultBatsmen(), bowler: createDefaultBowler() } }));
      } else {
        setLiveScores(prev => ({
          ...prev, team1: { ...prev.team1, score: 0, wickets: 0, overs: 0, balls: 0, batsmen: createDefaultBatsmen(), bowler: createDefaultBowler() },
          team2: { ...prev.team2, score: 0, wickets: 0, overs: 0, balls: 0, batsmen: createDefaultBatsmen(), bowler: createDefaultBowler() },
          currentRunRate: 0, requiredRunRate: 0, target: 0, lastFiveOvers: ''
        }));
      }
    }
  };

  const handleScoreUpdate = async () => {
    try { 
      setLoading(true); 
      setError('');
      if (matchId) {
        await matchAPI.updateMatch(matchId!, liveScores);
      } else {
        await tournamentAPI.updateTournament(tournament._id, { liveScores });
      }
      onUpdate(); 
      setLastSaved(new Date());
    }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to update scores'); }
    finally { setLoading(false); }
  };

  const handlePlayerSelect = (slotIndex: number, playerIdx: number) => {
    const selectedPlayer = availablePlayers[playerIdx];
    if (selectedPlayer) {
      setLiveScores(prev => {
        const team = prev[prev.battingTeam];
        const newBatsmen = [...team.batsmen];
        if (!newBatsmen[slotIndex]) newBatsmen[slotIndex] = { name: '', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: slotIndex === 0 };
        newBatsmen[slotIndex] = { ...newBatsmen[slotIndex], name: selectedPlayer.name };
        return { ...prev, [prev.battingTeam]: { ...team, batsmen: newBatsmen } };
      });
      if (slotIndex === 0) setStrikerIndex(playerIdx); else setNonStrikerIndex(playerIdx);
    }
  };

  const handleBowlerSelect = (playerIdx: number) => {
    const selectedPlayer = availablePlayers[playerIdx];
    if (selectedPlayer) {
      setLiveScores(prev => {
        const team = prev[prev.battingTeam];
        const currentBowler = team.bowler || createDefaultBowler();
        return { ...prev, [prev.battingTeam]: { ...team, bowler: { ...currentBowler, name: selectedPlayer.name } } };
      });
      setBowlerIndex(playerIdx);
    }
  };

  // ============== MODERN CARD DESIGN (OPTION 3) ==============
  return (
    <div className="space-y-4 max-w-md mx-auto p-2">
      {/* Toss Section */}
      {!tossWinner && (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" /> Toss
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleToss('team1', 'bat')} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">{getTeamName(teams, 0)} Bat</button>
            <button onClick={() => handleToss('team2', 'bat')} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">{getTeamName(teams, 1)} Bat</button>
            <button onClick={() => handleToss('team1', 'bowl')} className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">{getTeamName(teams, 0)} Bowl</button>
            <button onClick={() => handleToss('team2', 'bowl')} className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">{getTeamName(teams, 1)} Bowl</button>
          </div>
        </div>
      )}

      {/* Team Selection */}
      {tossWinner && (
        <div className="flex gap-2">
          <button onClick={() => updateStats('battingTeam', 'team1')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${liveScores.battingTeam === 'team1' ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{getTeamName(teams, 0)}</button>
          <button onClick={() => updateStats('battingTeam', 'team2')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${liveScores.battingTeam === 'team2' ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{getTeamName(teams, 1)}</button>
        </div>
      )}

      {/* MODERN GRADIENT SCORE CARD */}
      <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-2xl p-5 text-center shadow-lg">
        <div className="text-slate-900 text-sm font-medium mb-1">{currentTeam.name} - Batting</div>
        <div className="text-6xl font-black text-slate-900">{currentTeam.score}/{currentTeam.wickets}</div>
        <div className="text-2xl font-bold text-slate-800">({formatOvers(currentTeam.overs, currentTeam.balls)})</div>
      </div>

      {/* Batsmen & Bowler Info */}
      {tossWinner && (
        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="font-semibold">{currentTeam.batsmen[0]?.name || 'Striker'}</span>
              <span className="text-yellow-400">*</span>
            </div>
            <span className="text-lg font-bold">{currentTeam.batsmen[0]?.runs || 0} ({currentTeam.batsmen[0]?.balls || 0})</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <span className="font-semibold">{currentTeam.batsmen[1]?.name || 'Non-Striker'}</span>
            </div>
            <span className="text-lg font-bold">{currentTeam.batsmen[1]?.runs || 0} ({currentTeam.batsmen[1]?.balls || 0})</span>
          </div>
          <div className="border-t border-slate-700 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-red-400">{currentTeam.bowler?.name || 'Bowler'}</span>
              <span className="font-mono">{currentTeam.bowler?.overs || 0}-{currentTeam.bowler?.maidens || 0}-{currentTeam.bowler?.runs || 0}-{currentTeam.bowler?.wickets || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Run Rate Display */}
      {tossWinner && (
        <div className="flex justify-center gap-8 py-3 bg-slate-800 rounded-xl">
          <div><span className="text-slate-400 text-xs">CRR</span><div className="text-2xl font-bold">{liveScores.currentRunRate.toFixed(2)}</div></div>
          {liveScores.target > 0 && (<><div><span className="text-slate-400 text-xs">Target</span><div className="text-2xl font-bold text-yellow-400">{liveScores.target}</div></div><div><span className="text-slate-400 text-xs">Req</span><div className="text-2xl font-bold text-green-400">{liveScores.requiredRunRate.toFixed(2)}</div></div></>)}
        </div>
      )}

      {/* Player Selection */}
      {tossWinner && (
        <div className="grid grid-cols-3 gap-2 bg-slate-800 p-3 rounded-xl">
          <select value={strikerIndex} onChange={(e) => handlePlayerSelect(0, parseInt(e.target.value))} className="p-2 bg-slate-700 rounded text-xs text-white">
            <option value={-1}>Striker</option>
            {availablePlayers.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
          </select>
          <select value={nonStrikerIndex} onChange={(e) => handlePlayerSelect(1, parseInt(e.target.value))} className="p-2 bg-slate-700 rounded text-xs text-white">
            <option value={-1}>Non-Str</option>
            {availablePlayers.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
          </select>
          <select value={bowlerIndex} onChange={(e) => handleBowlerSelect(parseInt(e.target.value))} className="p-2 bg-slate-700 rounded text-xs text-white">
            <option value={-1}>Bowler</option>
            {availablePlayers.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* BUTTONS SECTION - OPTION 3: Modern Card Style */}
      {tossWinner && (
        <div className="space-y-3">
          {/* 6-Column Run Buttons */}
          <div className="grid grid-cols-6 gap-1">
            {[0, 1, 2, 3, 4, 6].map(run => (
              <button key={run} onClick={() => addRuns(run)}
                className={`py-4 rounded-lg font-bold text-lg transition-all active:scale-95 ${
                  run === 0 ? 'bg-slate-700 text-white hover:bg-slate-600' :
                  run === 4 ? 'bg-blue-600 text-white hover:bg-blue-500' :
                  run === 6 ? 'bg-emerald-600 text-white hover:bg-emerald-500' :
                  'bg-slate-600 text-white hover:bg-slate-500'
                }`}>
                {run}
              </button>
            ))}
          </div>

          {/* Extras Section - Compact Grid */}
          <div>
            <div className="text-xs text-slate-400 uppercase mb-2 tracking-wider">Extras</div>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => { setPendingExtraType('wide'); setShowExtraModal(true); }}
                className="py-3 bg-amber-500 hover:bg-amber-400 rounded-lg font-bold text-black text-sm">Wide</button>
              <button onClick={() => { setPendingExtraType('noBall'); setShowExtraModal(true); }}
                className="py-3 bg-orange-500 hover:bg-orange-400 rounded-lg font-bold text-white text-sm">NB</button>
              <button onClick={() => { setPendingExtraType('bye'); setShowExtraModal(true); }}
                className="py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-bold text-white text-sm">Bye</button>
              <button onClick={() => { setPendingExtraType('legBye'); setShowExtraModal(true); }}
                className="py-3 bg-pink-500 hover:bg-pink-400 rounded-lg font-bold text-white text-sm">LB</button>
            </div>
          </div>

          {/* OUT Button */}
          <button onClick={() => setShowOutModal(true)}
            className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-xl text-white shadow-lg active:scale-98 transition-all">
            OUT!
          </button>
        </div>
      )}

      {/* Match Stats Inputs */}
      {tossWinner && (
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="Target" value={liveScores.target || ''} onChange={(e) => updateStats('target', parseInt(e.target.value) || 0)}
            className="p-2 bg-slate-800 rounded-lg text-center text-white text-sm" />
          <input type="number" step="0.01" placeholder="Req RR" value={liveScores.requiredRunRate || ''} onChange={(e) => updateStats('requiredRunRate', parseFloat(e.target.value) || 0)}
            className="p-2 bg-slate-800 rounded-lg text-center text-white text-sm" />
          <input type="text" placeholder="Last 5 overs" value={liveScores.lastFiveOvers} onChange={(e) => updateStats('lastFiveOvers', e.target.value)}
            className="p-2 bg-slate-800 rounded-lg text-center text-white text-sm" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {error && <p className="text-red-400 text-sm self-center">{error}</p>}
        {lastSaved && <p className="text-green-400 text-xs self-center">✓ {lastSaved.toLocaleTimeString()}</p>}
        <button onClick={() => resetInnings()} className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold text-white">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
        {tossWinner && <button onClick={switchBatting} className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold text-white"><Target className="w-4 h-4" /> Switch</button>}
        <button onClick={handleScoreUpdate} disabled={loading} className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded-lg font-bold text-white">
          {loading ? 'Saving...' : <><Save className="w-4 h-4" /> SAVE</>}
        </button>
      </div>

      {/* Extra Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-4 rounded-2xl w-full max-w-sm border-2 border-cyan-400 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-cyan-400">
                {pendingExtraType === 'wide' ? 'Wide' : pendingExtraType === 'noBall' ? 'No Ball' : pendingExtraType === 'bye' ? 'Bye' : 'Leg Bye'}
              </h3>
              <button onClick={() => { setShowExtraModal(false); setPendingExtraType(null); setShowOutOptionsInExtra(false); }} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            {!showOutOptionsInExtra ? (
              <>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(pendingExtraType === 'wide' ? [1, 2, 3, 4, 5] : extraRunOptions).map(run => (
                    <button key={run} onClick={() => addExtraRuns(run)} className="py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white flex flex-col items-center">
                      <span>+{run}</span><span className="text-xs font-normal opacity-70">{extraRunLabels[run]}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowOutOptionsInExtra(true)} className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-white">OUT!</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowOutOptionsInExtra(false)} className="mb-3 text-slate-400 hover:text-white text-sm">← Back</button>
                <p className="text-sm text-slate-400 mb-2">{pendingExtraType === 'wide' ? 'Wide + ' : pendingExtraType === 'noBall' ? 'NB + ' : pendingExtraType === 'bye' ? 'Bye + ' : 'LB + '}Select OUT:</p>
                <div className="grid grid-cols-2 gap-2">
                  {outTypes.map(out => (
                    <button key={out.type} onClick={() => {
                      const extraLabel = pendingExtraType === 'wide' ? 'Wide' : pendingExtraType === 'noBall' ? 'No Ball' : pendingExtraType === 'bye' ? 'Bye' : 'Leg Bye';
                      triggerWicketAnimation(`${extraLabel} + ${out.label}`);
                      processWicket(out.type);
                      setShowExtraModal(false); setPendingExtraType(null); setShowOutOptionsInExtra(false);
                    }} className="py-3 bg-red-700 hover:bg-red-600 rounded-lg font-semibold text-white text-sm">
                      {pendingExtraType === 'wide' ? 'W+' : pendingExtraType === 'noBall' ? 'NB+' : pendingExtraType === 'bye' ? 'Bye+' : 'LB+'}{out.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

{/* OUT Modal */}
      {showOutModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-4 rounded-2xl w-full max-w-sm border-2 border-red-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-400">Select OUT Type</h3>
              <button onClick={() => setShowOutModal(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {outTypes.map(out => (
                <button key={out.type} onClick={() => processWicket(out.type)} className="py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold text-white">
                  {out.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
