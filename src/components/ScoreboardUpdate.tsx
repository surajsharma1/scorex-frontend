import { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Coins, RotateCcw, X, Target } from 'lucide-react';
import { tournamentAPI } from '../services/api';
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

// Wide run options (0 to 4)
const wideRunOptions = [0, 1, 2, 3, 4];

// Scoring options for extras modal (0 to 6)
const extraRunOptions = [0, 1, 2, 3, 4, 5, 6];

// Labels for extra run options
const extraRunLabels: Record<number, string> = {
  0: 'Dot',
  1: 'Single',
  2: 'Double',
  3: 'Triple',
  4: 'Four',
  5: 'Five',
  6: 'Six',
};

// Helper to format overs display
const formatOvers = (overs: number, balls: number) => {
  return `${overs}.${balls}`;
};

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

export default function ScoreboardUpdate({ tournament, onUpdate }: ScoreboardUpdateProps) {
  // Ensure teams is treated as an array
  const teams = Array.isArray(tournament.teams) ? tournament.teams : [];
  
  // Use a ref for the BroadcastChannel to persist across renders
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [liveScores, setLiveScores] = useState<LiveScores>(() => {
    const existing = tournament.liveScores;
    // Helper to safely get nested data
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
  
  // Toss states
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | null>(null);
  
  // Player selection states
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(0);
  const [bowlerIndex, setBowlerIndex] = useState(0);
  
  // Selected batsman for scoring (0 = striker, 1 = non-striker)
  const [selectedBatsmanIndex, setSelectedBatsmanIndex] = useState(0);

  // Modal states
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<ExtraType>(null);

  // Initialize Broadcast Channel once
  useEffect(() => {
    channelRef.current = new BroadcastChannel('cricket_score_updates');
    
    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // Update available players when batting team changes
  useEffect(() => {
    if (!teams || teams.length === 0) return;

    const battingTeamIndex = liveScores.battingTeam === 'team1' ? 0 : 1;
    const battingTeamObj = teams[battingTeamIndex];

    if (battingTeamObj && Array.isArray(battingTeamObj.players)) {
        // Map team players to Player interface
        const playersList = battingTeamObj.players.map((p: any) => ({
            id: p._id || p.id || Math.random().toString(),
            name: p.name || 'Unknown Player',
            role: p.role || 'Player'
        }));
        setAvailablePlayers(playersList);
    }
  }, [liveScores.battingTeam, teams]);

  // Get current batting team
  const currentTeam = liveScores[liveScores.battingTeam];
  
  // Create comprehensive overlay data
  const createOverlayData = useMemo(() => {
    const isBattingTeam1 = liveScores.battingTeam === 'team1';
    const battingTeamData = liveScores[liveScores.battingTeam];
    const bowlingTeamData = isBattingTeam1 ? liveScores.team2 : liveScores.team1;
    
    // Get actual team names
    const t1Name = teams[0]?.name || 'Team 1';
    const t2Name = teams[1]?.name || 'Team 2';

    return {
      // Tournament info
      tournament: {
        name: tournament.name || 'Tournament',
        id: tournament._id || ''
      },
      // Team 1 data
      team1: {
        name: t1Name,
        shortName: t1Name.substring(0, 3).toUpperCase(),
        score: isBattingTeam1 ? (battingTeamData?.score || 0) : (bowlingTeamData?.score || 0),
        wickets: isBattingTeam1 ? (battingTeamData?.wickets || 0) : (bowlingTeamData?.wickets || 0),
        overs: isBattingTeam1 ? `${battingTeamData?.overs || 0}.${battingTeamData?.balls || 0}` : `${bowlingTeamData?.overs || 0}.${bowlingTeamData?.balls || 0}`,
        color: '#004BA0',
        isBatting: isBattingTeam1
      },
      // Team 2 data
      team2: {
        name: t2Name,
        shortName: t2Name.substring(0, 3).toUpperCase(),
        score: !isBattingTeam1 ? (battingTeamData?.score || 0) : (bowlingTeamData?.score || 0),
        wickets: !isBattingTeam1 ? (battingTeamData?.wickets || 0) : (bowlingTeamData?.wickets || 0),
        overs: !isBattingTeam1 ? `${battingTeamData?.overs || 0}.${battingTeamData?.balls || 0}` : `${bowlingTeamData?.overs || 0}.${bowlingTeamData?.balls || 0}`,
        color: '#FCCA06',
        isBatting: !isBattingTeam1
      },
      // Striker batsman
      striker: {
        name: battingTeamData?.batsmen[0]?.name || 'Striker',
        runs: battingTeamData?.batsmen[0]?.runs || 0,
        balls: battingTeamData?.batsmen[0]?.balls || 0,
        fours: battingTeamData?.batsmen[0]?.fours || 0,
        sixes: battingTeamData?.batsmen[0]?.sixes || 0,
        status: '*'
      },
      // Non-striker batsman
      nonStriker: {
        name: battingTeamData?.batsmen[1]?.name || 'Non-Striker',
        runs: battingTeamData?.batsmen[1]?.runs || 0,
        balls: battingTeamData?.batsmen[1]?.balls || 0,
        fours: battingTeamData?.batsmen[1]?.fours || 0,
        sixes: battingTeamData?.batsmen[1]?.sixes || 0,
        status: ''
      },
      // Bowler
      bowler: {
        name: battingTeamData?.bowler?.name || 'Bowler',
        overs: battingTeamData?.bowler?.overs || 0,
        maidens: battingTeamData?.bowler?.maidens || 0,
        runs: battingTeamData?.bowler?.runs || 0,
        wickets: battingTeamData?.bowler?.wickets || 0
      },
      // Match stats
      stats: {
        currentRunRate: liveScores.currentRunRate || 0,
        requiredRunRate: liveScores.requiredRunRate || 0,
        target: liveScores.target || 0,
        last5Overs: liveScores.lastFiveOvers || ''
      },
      // Match status
      battingTeam: liveScores.battingTeam,
      innings: liveScores.innings || 1,
      status: liveScores.target > 0 ? 'Chasing' : 'Batting',
      result: ''
    };
  }, [liveScores, tournament, teams]);

  // Broadcast comprehensive score data whenever liveScores changes
  useEffect(() => {
    if (channelRef.current) {
        channelRef.current.postMessage(createOverlayData);
    }
  }, [createOverlayData]);

  // Trigger Wicket Animation
  const triggerWicketAnimation = (message: string) => {
    if (channelRef.current) {
        channelRef.current.postMessage({ 
            type: 'WICKET', 
            message,
            ...createOverlayData
        });
    }
  };

  const updateStats = (field: string, value: unknown) => {
    setLiveScores(prev => ({ ...prev, [field]: value }));
  };

  const updateTeamStats = (team: 'team1' | 'team2', field: string, value: unknown) => {
    setLiveScores(prev => ({
      ...prev,
      [team]: { ...prev[team], [field]: value }
    }));
  };

  // Add runs (0, 1, 2, 3, 4, 6)
  const addRuns = (runs: number) => {
    setLiveScores(prev => {
      const team = prev[prev.battingTeam];
      const newScore = team.score + runs;
      
      // Update batsmen
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
      
      // Update ball count
      let newBalls = team.balls + 1;
      let newOvers = team.overs;
      if (newBalls === 6) {
        newOvers = team.overs + 1;
        newBalls = 0;
      }
      
      // Update bowler
      const newBowler = team.bowler ? {
        ...team.bowler,
        runs: team.bowler.runs + runs,
        overs: newOvers, // Use integer overs, not float
        wickets: team.bowler.wickets
      } : null;
      
      // Swap striker on odd runs
      if (runs % 2 === 1) {
        const temp = newBatsmen[0];
        newBatsmen[0] = newBatsmen[1];
        newBatsmen[1] = temp;
        // Toggle isStriker flag for correctness (visual swap already done by array swap)
        newBatsmen[0].isStriker = true;
        newBatsmen[1].isStriker = false;
      }
      
      // Calculate run rate
      const totalBalls = newOvers * 6 + newBalls;
      const rr = totalBalls > 0 ? (newScore / (totalBalls / 6)) : 0;
      
      return {
        ...prev,
        [prev.battingTeam]: {
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

  // Handle extra (Wide, No-ball, Bye, Leg-bye)
  const handleExtra = (extraType: ExtraType) => {
    setPendingExtraType(extraType);
    setShowExtraModal(true);
  };

  // Add extra runs
  const addExtraRuns = (runs: number) => {
    if (!pendingExtraType) return;
    
    setLiveScores(prev => {
      const team = prev[prev.battingTeam];
      // Logic: If it's Wide or No-ball, usually +1 run is added by default plus any runs run.
      // e.g., Wide + 4 means 5 runs total. 
      const penalty = (pendingExtraType === 'wide' || pendingExtraType === 'noBall') ? 1 : 0;
      const totalRunsToAdd = runs + penalty;
      const newScore = team.score + totalRunsToAdd;
      
      let newBalls = team.balls;
      let newOvers = team.overs;
      
      // Wide and No-ball: ball does NOT count (usually).
      // Bye and Leg-bye: ball DOES count.
      if (pendingExtraType === 'bye' || pendingExtraType === 'legBye') {
        newBalls = team.balls + 1;
        if (newBalls >= 6) {
          newOvers = team.overs + 1;
          newBalls = 0;
        }
      }
      
      // Update bowler
      const newBowler = team.bowler ? {
        ...team.bowler,
        runs: team.bowler.runs + totalRunsToAdd,
        overs: newOvers,
      } : null;
      
      // Calculate run rate
      const totalBalls = newOvers * 6 + newBalls;
      const rr = totalBalls > 0 ? (newScore / (totalBalls / 6)) : 0;
      
      return {
        ...prev,
        [prev.battingTeam]: {
          ...team,
          score: newScore,
          balls: newBalls,
          overs: newOvers,
          bowler: newBowler,
        },
        currentRunRate: parseFloat(rr.toFixed(2)),
      };
    });
    
    if(channelRef.current) {
        channelRef.current.postMessage({ type: 'EXTRA', extraType: pendingExtraType, runs, team: liveScores.battingTeam });
    }
    
    setShowExtraModal(false);
    setPendingExtraType(null);
  };

  // Handle OUT
  const handleOut = () => {
    setShowOutModal(true);
  };

  // Process wicket
  const processWicket = (outType: OutType) => {
    const outMessages: Record<string, string> = {
      caught: 'CAUGHT',
      bowled: 'BOWLED',
      lbw: 'LBW',
      stumped: 'STUMPED',
      runOut: 'RUN OUT',
      hitWicket: 'HIT WICKET',
      handledBall: 'HANDLED BALL',
      timedOut: 'TIMED OUT',
    };
    
    const message = outMessages[outType || 'caught'] || 'OUT!';
    
    setLiveScores(prev => {
      const team = prev[prev.battingTeam];
      const newWickets = team.wickets + 1;
      
      // LOGIC FIX: Keep the non-striker, remove the striker
      // Filter returns array of kept elements. We want to keep !isStriker
      const remainingBatsman = team.batsmen.find(b => !b.isStriker);
      
      // Create a new fresh batsman placeholder
      const newBatsman: Batsman = {
          name: 'New Batter',
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isStriker: true // New batter typically takes strike (unless cross logic, kept simple here)
      };

      // Construct new batsmen array [New Striker, Old Non-Striker]
      const newBatsmen = remainingBatsman 
          ? [newBatsman, { ...remainingBatsman, isStriker: false }] 
          : [newBatsman, createDefaultBatsmen()[1]];
      
      // If wickets fall, update ball count (except for run out usually, but simplifying)
      let newBalls = team.balls;
      let newOvers = team.overs;
      
      if (outType !== 'timedOut') { // Timed out doesn't count ball? usually ball counts for most outs
        newBalls = team.balls + 1;
        if (newBalls >= 6) {
          newOvers = team.overs + 1;
          newBalls = 0;
        }
      }
      
      // Update bowler wicket count
      const newBowler = team.bowler ? {
        ...team.bowler,
        wickets: team.bowler.wickets + 1,
        overs: newOvers,
      } : null;
      
      return {
        ...prev,
        [prev.battingTeam]: {
          ...team,
          wickets: newWickets,
          balls: newBalls,
          overs: newOvers,
          batsmen: newBatsmen,
          bowler: newBowler,
        },
      };
    });
    
    // Trigger wicket animation
    triggerWicketAnimation(message);
    setShowOutModal(false);
  };

  // Handle toss
  const handleToss = (winner: 'team1' | 'team2', choice: 'bat' | 'bowl') => {
    setTossWinner(winner);
    const battingTeam = choice === 'bat' ? winner : (winner === 'team1' ? 'team2' : 'team1');
    updateStats('battingTeam', battingTeam);
    updateStats('isChasing', choice === 'bowl');
  };

  // Switch batting team
  const switchBatting = () => {
    updateStats('battingTeam', liveScores.battingTeam === 'team1' ? 'team2' : 'team1');
    // Reset batsmen for new innings
    setLiveScores(prev => ({
      ...prev,
      [prev.battingTeam === 'team1' ? 'team2' : 'team1']: {
        ...prev[prev.battingTeam === 'team1' ? 'team2' : 'team1'],
        batsmen: createDefaultBatsmen(),
      }
    }));
  };

  // Reset innings
  const resetInnings = (team?: 'team1' | 'team2') => {
    const teamName = team 
      ? (team === 'team1' ? getTeamName(teams, 0) : getTeamName(teams, 1))
      : 'all';
      
    if (window.confirm(`Are you sure you want to reset ${teamName} scores?`)) {
      if (team) {
        setLiveScores(prev => ({
          ...prev,
          [team]: { 
            ...prev[team], 
            score: 0, 
            wickets: 0, 
            overs: 0, 
            balls: 0,
            batsmen: createDefaultBatsmen(),
            bowler: createDefaultBowler(),
          }
        }));
      } else {
        setLiveScores(prev => ({
          ...prev,
          team1: { ...prev.team1, score: 0, wickets: 0, overs: 0, balls: 0, batsmen: createDefaultBatsmen(), bowler: createDefaultBowler() },
          team2: { ...prev.team2, score: 0, wickets: 0, overs: 0, balls: 0, batsmen: createDefaultBatsmen(), bowler: createDefaultBowler() },
          currentRunRate: 0,
          requiredRunRate: 0,
          target: 0,
          lastFiveOvers: '',
        }));
      }
    }
  };

  // Save scores
  const handleScoreUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      await tournamentAPI.updateLiveScores(tournament._id, liveScores);
      onUpdate();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update scores';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update player at crease via dropdown
  const handlePlayerSelect = (slotIndex: number, playerIdx: number) => {
      const selectedPlayer = availablePlayers[playerIdx];
      if (selectedPlayer) {
          setLiveScores(prev => {
              const team = prev[prev.battingTeam];
              const newBatsmen = [...team.batsmen];
              // Ensure we have an object to update
              if (!newBatsmen[slotIndex]) {
                  newBatsmen[slotIndex] = { 
                      name: '', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: slotIndex === 0 
                  };
              }
              newBatsmen[slotIndex] = { ...newBatsmen[slotIndex], name: selectedPlayer.name };
              return {
                  ...prev,
                  [prev.battingTeam]: { ...team, batsmen: newBatsmen }
              };
          });
          
          if (slotIndex === 0) setStrikerIndex(playerIdx);
          else setNonStrikerIndex(playerIdx);
      }
  };
  
  // Update bowler via dropdown
  const handleBowlerSelect = (playerIdx: number) => {
      const selectedPlayer = availablePlayers[playerIdx];
      if (selectedPlayer) {
          setLiveScores(prev => {
              const team = prev[prev.battingTeam];
              const currentBowler = team.bowler || createDefaultBowler();
              return {
                  ...prev,
                  [prev.battingTeam]: { 
                      ...team, 
                      bowler: { ...currentBowler, name: selectedPlayer.name }
                  }
              };
          });
          setBowlerIndex(playerIdx);
      }
  };

// Render scoring buttons
  const renderScoringButtons = () => (
    <div className="space-y-3">
      {/* Batsman Selection */}
      <div className="flex gap-2 items-center">
        <label className="text-sm text-gray-400">Scoring for:</label>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedBatsmanIndex(0)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              selectedBatsmanIndex === 0 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {currentTeam.batsmen[0]?.name || 'Striker'}
          </button>
          <button
            onClick={() => setSelectedBatsmanIndex(1)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              selectedBatsmanIndex === 1 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {currentTeam.batsmen[1]?.name || 'Non-Striker'}
          </button>
        </div>
      </div>
      
      {/* Run Buttons */}
      <div className="grid grid-cols-7 gap-2">
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button
            key={run}
            onClick={() => addRuns(run)}
            className={`py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105 ${
              run === 0 ? 'bg-gray-500 hover:bg-gray-400 text-white' :
              run === 4 ? 'bg-blue-600 hover:bg-blue-500 text-white' :
              run === 6 ? 'bg-green-600 hover:bg-green-500 text-white' :
              'bg-gray-600 hover:bg-gray-500 text-white'
            }`}
          >
            {run}
          </button>
        ))}
      </div>
    </div>
  );

// Render extra buttons
  const renderExtraButtons = () => (
    <div className="space-y-2 mt-2">
      <div>
        <label className="text-xs text-gray-400 uppercase mb-1 block">Wide (Run + Wide)</label>
        <div className="grid grid-cols-5 gap-1">
          {wideRunOptions.map((run) => (
            <button
              key={`wide-${run}`}
              onClick={() => {
                setPendingExtraType('wide');
                addExtraRuns(run);
              }}
              className="py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-semibold text-white text-sm"
            >
              W+{run}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 mt-2">
        <div className="relative flex-1">
          <button
            onClick={() => setShowExtrasModal(!showExtrasModal)}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
          >
            <span>Extras</span>
            <span className="text-xs">▼</span>
          </button>
          
          {showExtrasModal && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg border border-gray-600 p-2 shadow-xl z-10">
              <button
                onClick={() => {
                  setPendingExtraType('noBall');
                  setShowExtrasModal(false);
                  setShowExtraModal(true);
                }}
                className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-medium text-white mb-1"
              >
                No Ball (+0 to +6)
              </button>
              <button
                onClick={() => {
                  setPendingExtraType('bye');
                  setShowExtrasModal(false);
                  setShowExtraModal(true);
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium text-white mb-1"
              >
                Bye (+0 to +6)
              </button>
              <button
                onClick={() => {
                  setPendingExtraType('legBye');
                  setShowExtrasModal(false);
                  setShowExtraModal(true);
                }}
                className="w-full py-2 bg-pink-600 hover:bg-pink-500 rounded-lg font-medium text-white"
              >
                Leg Bye (+0 to +6)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render OUT button and modal
  const renderOutButton = () => (
    <>
      <button
        onClick={handleOut}
        className="mt-2 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-xl text-white w-full"
      >
        OUT!
      </button>

      {/* OUT Modal */}
      {showOutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-red-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-400">Select OUT Type</h3>
              <button onClick={() => setShowOutModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {outTypes.map((out) => (
                <button
                  key={out.type}
                  onClick={() => processWicket(out.type)}
                  className="py-3 bg-red-700 hover:bg-red-600 rounded-lg font-semibold text-white transition"
                >
                  {out.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Render extra runs modal
  const renderExtraModal = () => (
    showExtraModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-yellow-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-yellow-400">
              {pendingExtraType === 'wide' ? 'Wide' : 
               pendingExtraType === 'noBall' ? 'No Ball' : 
               pendingExtraType === 'bye' ? 'Bye' : 'Leg Bye'} - Select Runs
            </h3>
            <button onClick={() => { setShowExtraModal(false); setPendingExtraType(null); }} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {extraRunOptions.map((run) => (
              <button
                key={run}
                onClick={() => addExtraRuns(run)}
                className="py-4 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-xl text-white flex flex-col items-center"
              >
                <span>+{run}</span>
                <span className="text-xs font-normal">{extraRunLabels[run]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  );

  // Render player selection dropdown
  const renderPlayerDropdown = (
    label: string,
    value: number,
    _onChange: (idx: number) => void,
    isBowler: boolean = false
  ) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 uppercase">{label}</label>
      <select
        value={value}
        onChange={(e) => isBowler 
            ? handleBowlerSelect(parseInt(e.target.value)) 
            : handlePlayerSelect(label === 'Striker' ? 0 : 1, parseInt(e.target.value))
        }
        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
      >
        <option value={-1}>Select Player</option>
        {availablePlayers.map((player, idx) => (
           <option key={player.id} value={idx}>
              {player.name}
           </option>
        ))}
      </select>
    </div>
  );

  // Main render
  return (
    <div className="space-y-6">
      {/* Toss Section */}
      {!tossWinner && (
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" /> Toss Decision
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleToss('team1', 'bat')}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              {getTeamName(teams, 0)} won & Batting
            </button>
            <button 
              onClick={() => handleToss('team2', 'bat')}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              {getTeamName(teams, 1)} won & Batting
            </button>
            <button 
              onClick={() => handleToss('team1', 'bowl')}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              {getTeamName(teams, 0)} won & Bowling
            </button>
            <button 
              onClick={() => handleToss('team2', 'bowl')}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              {getTeamName(teams, 1)} won & Bowling
            </button>
          </div>
        </div>
      )}

      {/* Team Selection Buttons (Active indicator) */}
      {tossWinner && (
        <div className="flex gap-2">
          <button
            onClick={() => updateStats('battingTeam', 'team1')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              liveScores.battingTeam === 'team1' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {getTeamName(teams, 0)}
          </button>
          <button
            onClick={() => updateStats('battingTeam', 'team2')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              liveScores.battingTeam === 'team2' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {getTeamName(teams, 1)}
          </button>
        </div>
      )}

      {/* Score Display */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white">{currentTeam.name}</h2>
            <span className="text-green-400 text-sm">Batting</span>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-white">
              {currentTeam.score}/{currentTeam.wickets}
            </div>
            <div className="text-xl text-gray-400">
              ({formatOvers(currentTeam.overs, currentTeam.balls)})
            </div>
          </div>
        </div>

        {/* Batsmen Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-yellow-400 font-bold">Striker</span>
              <span className="text-green-400 text-xs">ON STRIKE</span>
            </div>
            <div className="text-lg font-semibold text-white">{currentTeam.batsmen[0]?.name || 'Not Selected'}</div>
            <div className="text-sm text-gray-400">
              {currentTeam.batsmen[0]?.runs || 0} ({currentTeam.batsmen[0]?.balls || 0})
              {currentTeam.batsmen[0]?.fours > 0 && ` | ${currentTeam.batsmen[0].fours}f`}
              {currentTeam.batsmen[0]?.sixes > 0 && ` ${currentTeam.batsmen[0].sixes}s`}
            </div>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-blue-400 font-bold">Non-Striker</span>
            </div>
            <div className="text-lg font-semibold text-white">{currentTeam.batsmen[1]?.name || 'Not Selected'}</div>
            <div className="text-sm text-gray-400">
              {currentTeam.batsmen[1]?.runs || 0} ({currentTeam.batsmen[1]?.balls || 0})
            </div>
          </div>
        </div>

        {/* Bowler Info */}
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-red-400 font-bold">Bowler</span>
            <span className="text-gray-400 text-sm">{currentTeam.bowler?.name || 'Not Selected'}</span>
          </div>
          <div className="text-sm text-gray-400">
            {currentTeam.bowler?.overs || 0}-{currentTeam.bowler?.maidens || 0}-{currentTeam.bowler?.runs || 0}-{currentTeam.bowler?.wickets || 0}
          </div>
        </div>

        {/* Run Rate */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-600">
          <div>
            <span className="text-gray-400 text-sm">CRR</span>
            <div className="text-2xl font-bold text-white">{liveScores.currentRunRate.toFixed(2)}</div>
          </div>
          {liveScores.target > 0 && (
            <>
              <div>
                <span className="text-gray-400 text-sm">Target</span>
                <div className="text-2xl font-bold text-yellow-400">{liveScores.target}</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Req RRR</span>
                <div className="text-2xl font-bold text-green-400">{liveScores.requiredRunRate.toFixed(2)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Player Selection */}
      {tossWinner && (
        <div className="grid grid-cols-3 gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
          {renderPlayerDropdown('Striker', strikerIndex, setStrikerIndex)}
          {renderPlayerDropdown('Non-Striker', nonStrikerIndex, setNonStrikerIndex)}
          {renderPlayerDropdown('Bowler', bowlerIndex, setBowlerIndex, true)}
        </div>
      )}

      {/* Scoring Controls */}
      {tossWinner && (
        <div className="space-y-4">
          {/* Main Run Buttons */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Runs</h3>
            {renderScoringButtons()}
          </div>

          {/* Extra Buttons */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Extras</h3>
            {renderExtraButtons()}
          </div>

          {/* OUT Button */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            {renderOutButton()}
          </div>
        </div>
      )}

      {/* Match Stats */}
      {tossWinner && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Target</label>
            <input
              type="number"
              value={liveScores.target}
              onChange={(e) => updateStats('target', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Required Run Rate</label>
            <input
              type="number"
              step="0.01"
              value={liveScores.requiredRunRate}
              onChange={(e) => updateStats('requiredRunRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Last 5 Overs</label>
            <input
              type="text"
              placeholder="e.g., 1 4 W 0 6 1"
              value={liveScores.lastFiveOvers}
              onChange={(e) => updateStats('lastFiveOvers', e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4">
        {error && <p className="text-red-400 self-center mr-auto">{error}</p>}
        <button
          onClick={() => resetInnings()}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition-all"
        >
          <RotateCcw className="w-5 h-5" /> Reset All
        </button>
        {tossWinner && (
          <button
            onClick={switchBatting}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-white transition-all"
          >
            <Target className="w-5 h-5" /> Switch Innings
          </button>
        )}
        <button
          onClick={handleScoreUpdate}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-bold text-white transition-all shadow-lg"
        >
          {loading ? 'Saving...' : <><Save className="w-5 h-5" /> UPDATE LIVE SCORE</>}
        </button>
      </div>

      {/* Modals */}
      {renderExtraModal()}
    </div>
  );
}