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
  economy: 0,
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
    
    let playersList: Player[] = [];
    
    if (battingTeamObj && battingTeamObj.players) {
      const playersArray = Array.isArray(battingTeamObj.players) 
        ? battingTeamObj.players 
        : [];
      
      playersList = playersArray.map((p: any) => ({
        id: p._id || p.id || Math.random().toString(),
        name: p.name || 'Unknown Player',
        role: p.role || 'Player'
      }));
    }
    
    setAvailablePlayers(playersList);
  }, [liveScores.battingTeam, teams, tournament]);

  const saveScoresToBackend = useCallback(async (scores: LiveScores) => {
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
        await tournamentAPI.updateTournament(tournament._id, { liveScores: scores });
      }
      setLastSaved(new Date());
      onUpdate();
    } catch (err) { 
      console.error('Auto-save failed:', err); 
    } finally { 
      isSavingRef.current = false; 
    }
  }, [tournament._id, matchId, onUpdate]);

  useEffect(() => {
    if (!tossWinner || loading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveScoresToBackend(liveScores), 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [liveScores, tossWinner, loading, saveScoresToBackend]);

  const currentTeam = liveScores[liveScores.battingTeam] || {
    name: 'Batting Team',
    score: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    batsmen: [],
    bowler: createDefaultBowler(),
  };

  const createOverlayData = useMemo(() => {
    const isBattingTeam1 = liveScores.battingTeam === 'team1';
    const battingTeamData = liveScores[liveScores.battingTeam];
    const bowlingTeamData = isBattingTeam1 ? liveScores.team2 : liveScores.team1;
    const t1Name = teams[0]?.name || 'Team 1';
    const t2Name = teams[1]?.name || 'Team 2';
    return {
      tournament: { name: tournament.name || 'Tournament', id: tournament._id },
      team1: {
        name: t1Name, 
        shortName: t1Name.substring(0, 3).toUpperCase(),
        score: isBattingTeam1 ? (battingTeamData?.score || 0) : (bowlingTeamData?.score || 0),
        wickets: isBattingTeam1 ? (battingTeamData?.wickets || 0) : (bowlingTeamData?.wickets || 0),
        overs: isBattingTeam1 ? `${battingTeamData?.overs || 0}.${battingTeamData?.balls || 0}` : `${bowlingTeamData?.overs || 0}.${bowlingTeamData?.balls || 0}`,
        color: '#004BA0', 
        isBatting: isBattingTeam1
      },
      team2: {
        name: t2Name, 
        shortName: t2Name.substring(0, 3).toUpperCase(),
        score: !isBattingTeam1 ? (battingTeamData?.score || 0) : (bowlingTeamData?.score || 0),
        wickets: !isBattingTeam1 ? (battingTeamData?.wickets || 0) : (bowlingTeamData?.wickets || 0),
        overs: !isBattingTeam1 ? `${battingTeamData?.overs || 0}.${battingTeamData?.balls || 0}` : `${bowlingTeamData?.overs || 0}.${bowlingTeamData?.balls || 0}`,
        color: '#FCCA06', 
        isBatting: !isBattingTeam1
      },
      striker: { 
        name: battingTeamData?.batsmen?.[0]?.name || 'Striker', 
        runs: battingTeamData?.batsmen?.[0]?.runs || 0, 
        balls: battingTeamData?.batsmen?.[0]?.balls || 0, 
        fours: battingTeamData?.batsmen?.[0]?.fours || 0, 
        sixes: battingTeamData?.batsmen?.[0]?.sixes || 0, 
        status: '*' 
      },
      nonStriker: { 
        name: battingTeamData?.batsmen?.[1]?.name || 'Non-Striker', 
        runs: battingTeamData?.batsmen?.[1]?.runs || 0, 
        balls: battingTeamData?.batsmen?.[1]?.balls || 0, 
        fours: battingTeamData?.batsmen?.[1]?.fours || 0, 
        sixes: battingTeamData?.batsmen?.[1]?.sixes || 0, 
        status: '' 
      },
      bowler: { 
        name: battingTeamData?.bowler?.name || 'Bowler', 
        overs: battingTeamData?.bowler?.overs || 0, 
        maidens: battingTeamData?.bowler?.maidens || 0, 
        runs: battingTeamData?.bowler?.runs || 0, 
        wickets: battingTeamData?.bowler?.wickets || 0 
      },
      stats: { 
        currentRunRate: liveScores.currentRunRate || 0, 
        requiredRunRate: liveScores.requiredRunRate || 0, 
        target: liveScores.target || 0, 
        last5Overs: liveScores.lastFiveOvers || '' 
      },
      battingTeam: liveScores.battingTeam, 
      innings: liveScores.innings || 1, 
  status: liveScores.target ? 'Chasing' : 'Batting', 
      result: ''
    };
  }, [liveScores, tournament, teams]);

  useEffect(() => {
    if (channelRef.current && tossWinner) {
      channelRef.current.postMessage(createOverlayData);
    }
  }, [createOverlayData, tossWinner]);

  const triggerWicketAnimation = (message: string) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'WICKET', message, ...createOverlayData });
    }
  };

  const updateStats = (field: string, value: unknown) => {
    setLiveScores((prev: LiveScores) => ({ ...prev, [field]: value }));
  };

const handleToss = (team: 'team1' | 'team2', choice: 'bat' | 'bowl') => {
  setTossWinner(team);
  setLiveScores(prev => ({
    ...prev,
    battingTeam: choice === 'bat' ? team : (team === 'team1' ? 'team2' : 'team1')
  }));
};

const addRuns = (runs: number) => {
    setLiveScores((prev: LiveScores) => {
      const teamKey = prev.battingTeam;
      const team = prev[teamKey];
      const newScore = team.score + runs;
      const newBatsmen = [...team.batsmen];
      const strikerIdx = newBatsmen.findIndex((b) => b.isStriker);
      if (strikerIdx !== -1) {
        newBatsmen[strikerIdx] = {
          ...newBatsmen[strikerIdx],
          runs: newBatsmen[strikerIdx].runs + runs,
          balls: newBatsmen[strikerIdx].balls + 1,
          fours: runs === 4 ? newBatsmen[strikerIdx].fours + 1 : newBatsmen[strikerIdx].fours,
          sixes: runs === 6 ? newBatsmen[strikerIdx].sixes + 1 : newBatsmen[strikerIdx].sixes,
        };
      }
      let newBalls = team.balls + 1,
        newOvers = team.overs;
      if (newBalls === 6) {
        newOvers = team.overs + 1;
        newBalls = 0;
      }
      const newBowler = team.bowler
        ? { ...team.bowler, runs: team.bowler.runs + runs, overs: newOvers }
        : null;
      if (runs % 2 === 1) {
        const temp = newBatsmen[0];
        newBatsmen[0] = newBatsmen[1];
        newBatsmen[1] = temp;
        newBatsmen[0].isStriker = true;
        newBatsmen[1].isStriker = false;
      }
      const totalBalls = newOvers * 6 + newBalls;
      const rr = totalBalls > 0 ? newScore / (totalBalls / 6) : 0;
      return {
        ...prev,
        [teamKey]: {
          ...team,
          score: newScore,
          balls: newBalls,
          overs: newOvers,
          batsmen: newBatsmen,
          bowler: newBowler,
        },
        currentRunRate: parseFloat(rr.toFixed(2)),
      };
    });
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'RUN', runs, team: liveScores.battingTeam });
    }
  };

  // ... rest of component unchanged
  return (
    <div className="space-y-4 max-w-md mx-auto p-2">
      {/* Toss Section */}
      {!tossWinner && (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" /> Toss
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleToss('team1', 'bat')}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              {getTeamName(teams, 0)} Bat
            </button>
            <button
              onClick={() => handleToss('team2', 'bat')}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              {getTeamName(teams, 1)} Bat
            </button>
            <button
              onClick={() => handleToss('team1', 'bowl')}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
            >
              {getTeamName(teams, 0)} Bowl
            </button>
            <button
              onClick={() => handleToss('team2', 'bowl')}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
            >
              {getTeamName(teams, 1)} Bowl
            </button>
          </div>
        </div>
      )}

      {/* Rest of component follows similar pattern... */}
    </div>
  );
}

