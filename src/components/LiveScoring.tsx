
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, RotateCcw, Save, Settings, Users, 
  AlertTriangle, CheckCircle, XCircle, ChevronDown,
  Home, ArrowRight, Battery, Zap
} from 'lucide-react';
import { matchApi, BallPayload } from '../services/matchApi';
import { socket } from '../services/socket';

// Types matching backend algorithm
interface Player {
  _id: string;
  name: string;
  role?: string;
}

interface Match {
  _id: string;
  name: string;
  team1: { _id: string; name: string; shortName?: string };
  team2: { _id: string; name: string; shortName?: string };
  venue: string;
  date: string;
  format: string;
  status: string;
  currentInnings: number;
  innings?: {
    teamId: string;
    score: number;
    wickets: number;
    overs: number;
    balls: number;
    runRate: number;
    extras: {
      wides: number;
      noBalls: number;
      byes: number;
      legByes: number;
      total: number;
    };
  }[];
  team1Score?: number;
  team1Wickets?: number;
  team1Overs?: number;
  team2Score?: number;
  team2Wickets?: number;
  team2Overs?: number;
  striker?: Player;
  nonStriker?: Player;
  lastBowler?: Player;
}

// Out types per algorithm
const OUT_TYPES = [
  { value: 'caught', label: 'Caught' },
  { value: 'bowled', label: 'Bowled' },
  { value: 'lbw', label: 'LBW' },
  { value: 'run out', label: 'Run Out' },
  { value: 'stumped', label: 'Stumped' },
  { value: 'hit wicket', label: 'Hit Wicket' },
  { value: 'obstructing the field', label: 'Obstructing' },
  { value: 'handled the ball', label: 'Handled' },
];

// Extra types per algorithm
const EXTRA_TYPES = [
  { value: 'wide', label: 'Wide', runs: [0, 1, 2, 3, 4, 5, 6] },
  { value: 'noBall', label: 'No Ball', runs: [0, 1, 2, 3, 4, 5, 6] },
  { value: 'bye', label: 'Bye', runs: [0, 1, 2, 3, 4, 5, 6] },
  { value: 'legBye', label: 'Leg Bye', runs: [0, 1, 2, 3, 4, 5, 6] },
];

export default function LiveScoring() {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Player selection state
  const [battingTeamPlayers, setBattingTeamPlayers] = useState<Player[]>([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState<Player[]>([]);
  const [selectedStriker, setSelectedStriker] = useState<Player | null>(null);
  const [selectedNonStriker, setSelectedNonStriker] = useState<Player | null>(null);
  const [selectedBowler, setSelectedBowler] = useState<Player | null>(null);
  
  // Match state
  const [tossDone, setTossDone] = useState(false);
  const [tossWinner, setTossWinner] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | ''>('');
  const [inningsStarted, setInningsStarted] = useState(false);
  
  // Scoring state
  const [currentOver, setCurrentOver] = useState(0);
  const [currentBall, setCurrentBall] = useState(0);
  const [teamScore, setTeamScore] = useState(0);
  const [teamWickets, setTeamWickets] = useState(0);
  const [extras, setExtras] = useState({ wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });
  
  // UI state
  const [showOutModal, setShowOutModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraType, setExtraType] = useState<string>('');
  const [extraRuns, setExtraRuns] = useState(0);
  const [lastAction, setLastAction] = useState<string>('');

  // Load match data
  useEffect(() => {
    if (!matchId) return;
    
    const loadMatch = async () => {
      try {
        setLoading(true);
        const res = await matchApi.getMatch(matchId);
        const matchData = res.data?.data || res.data;
        
        if (matchData) {
          setMatch(matchData);
          
          // Load existing scores if match already started
          if (matchData.status === 'live') {
            setTossDone(true);
            setInningsStarted(true);
            setTossWinner(matchData.tossWinner?._id || '');
            setTossDecision(matchData.tossDecision || '');
            
            if (matchData.innings && matchData.innings.length > 0) {
              const inn = matchData.innings[0];
              setTeamScore(inn.score || 0);
              setTeamWickets(inn.wickets || 0);
              setExtras(inn.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });
              setCurrentOver(Math.floor((inn.balls || 0) / 6));
              setCurrentBall((inn.balls || 0) % 6);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load match:', err);
        setError('Failed to load match');
      } finally {
        setLoading(false);
      }
    };
    
    loadMatch();
  }, [matchId]);

  // Socket listeners
  useEffect(() => {
    if (!matchId) return;
    
    socket.emit('join_match', matchId);
    
    const handleUpdate = (updatedMatch: any) => {
      console.log('Match updated:', updatedMatch);
      // Update local state with server data
      if (updatedMatch.innings && updatedMatch.innings.length > 0) {
        const inn = updatedMatch.innings[0];
        setTeamScore(inn.score);
        setTeamWickets(inn.wickets);
        setExtras(inn.extras);
         socket.on('scoreUpdate', handleUpdate);
 }
    };
    
    socket.on('match_updated', handleUpdate);
    
    return () => {
      socket.emit('leave_match', matchId);
      socket.off('scoreUpdate', handleUpdate);
      socket.off('match_updated', handleUpdate);
    };
  }, [matchId]);

  // Start match after toss
  const handleToss = async () => {
    if (!matchId || !tossWinner || !tossDecision) return;
    
    try {
      setSyncing(true);
      await matchApi.startMatch(matchId, {
        tossWinner,
        decision: tossDecision,
        striker: selectedStriker?._id,
        nonStriker: selectedNonStriker?._id,
        bowler: selectedBowler?._id
      });
      
      setTossDone(true);
      setInningsStarted(true);
    } catch (err) {
      console.error('Failed to start match:', err);
      setError('Failed to start match');
    } finally {
      setSyncing(false);
    }
  };

  // Score runs (0, 1, 2, 3, 4, 6)
  const handleScore = async (runs: number, isBoundary = false) => {
    if (!matchId || !inningsStarted) return;
    
    // Optimistic update
    const newScore = teamScore + runs;
    const newBall = currentBall + 1;
    let newOver = currentOver;
    let newExtras = { ...extras };
    
    if (newBall >= 6) {
      newOver++;
      setCurrentOver(newOver);
      setCurrentBall(0);
    } else {
      setCurrentBall(newBall);
    }
    
    setTeamScore(newScore);
    setLastAction(`${runs} runs`);
    
    // Sync to backend
    try {
      setSyncing(true);
      await matchApi.scoreBall(matchId, {
        overNumber: currentOver,
        ballNumber: currentBall + 1,
        bowler: selectedBowler?._id || '',
        striker: selectedStriker?._id || '',
        nonStriker: selectedNonStriker?._id || '',
        runsOffBat: runs,
        extras: 0,
        extraType: 'None',
        isWicket: false,
        wicketType: 'None'
      });
    } catch (err) {
      console.error('Failed to sync:', err);
      // Revert on error
      setTeamScore(teamScore);
      setCurrentBall(currentBall);
      setCurrentOver(currentOver);
    } finally {
      setSyncing(false);
    }
  };

  // Handle wicket
  const handleWicket = async (outType: string) => {
    if (!matchId || !inningsStarted) return;
    
    const newWickets = teamWickets + 1;
    setTeamWickets(newWickets);
    setShowOutModal(false);
    setLastAction(`OUT - ${outType}`);
    
    try {
      setSyncing(true);
      await matchApi.scoreBall(matchId, {
        overNumber: currentOver,
        ballNumber: currentBall + 1,
        bowler: selectedBowler?._id || '',
        striker: selectedStriker?._id || '',
        nonStriker: selectedNonStriker?._id || '',
        runsOffBat: 0,
        extras: 0,
        extraType: 'None',
        isWicket: true,
        wicketType: outType
      });
      
      // Check if all out
      if (newWickets >= 10) {
        alert('All out! Innings ended.');
      }
    } catch (err) {
      console.error('Failed to record wicket:', err);
      setTeamWickets(teamWickets);
    } finally {
      setSyncing(false);
    }
  };

  // Handle extras (wide, no ball, bye, leg bye)
  const handleExtra = async () => {
    if (!matchId || !inningsStarted || !extraType) return;
    
    let extraRun = extraRuns;
    let newExtras = { ...extras };
    
    if (extraType === 'wide') {
      newExtras.wides += 1;
      newExtras.total += extraRun + 1;
      extraRun = extraRun + 1;
    } else if (extraType === 'noBall') {
      newExtras.noBalls += 1;
      newExtras.total += extraRun + 1;
      extraRun = extraRun + 1;
    } else if (extraType === 'bye') {
      newExtras.byes += extraRun;
      newExtras.total += extraRun;
    } else if (extraType === 'legBye') {
      newExtras.legByes += extraRun;
      newExtras.total += extraRun;
    }
    
    setExtras(newExtras);
    setTeamScore(teamScore + extraRun);
    setShowExtraModal(false);
    setLastAction(`${extraType}: +${extraRun}`);
    
    try {
      setSyncing(true);
      await matchApi.scoreBall(matchId, {
        overNumber: currentOver,
        ballNumber: currentBall + 1,
        bowler: selectedBowler?._id || '',
        striker: selectedStriker?._id || '',
        nonStriker: selectedNonStriker?._id || '',
        runsOffBat: 0,
        extras: extraRun,
        extraType: extraType,
        isWicket: false,
        wicketType: 'None'
      });
    } catch (err) {
      console.error('Failed to sync extra:', err);
      setExtras(extras);
      setTeamScore(teamScore);
    } finally {
      setSyncing(false);
    }
  };

  // Undo last ball
  const handleUndo = async () => {
    if (!matchId) return;
    
    try {
      setSyncing(true);
      await matchApi.undoBall(matchId);
      // Reload match to get correct state
      const res = await matchApi.getMatch(matchId);
      const matchData = res.data?.data || res.data;
      if (matchData && matchData.innings) {
        const inn = matchData.innings[0];
        setTeamScore(inn.score || 0);
        setTeamWickets(inn.wickets || 0);
        setExtras(inn.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });
        setCurrentOver(Math.floor((inn.balls || 0) / 6));
        setCurrentBall((inn.balls || 0) % 6);
      }
      setLastAction('Undo');
    } catch (err) {
      console.error('Failed to undo:', err);
    } finally {
      setSyncing(false);
    }
  };

  // End innings
  const handleEndInnings = async () => {
    if (!matchId || !confirm('End innings?')) return;
    
    try {
      setSyncing(true);
      await matchApi.endInnings(matchId);
      alert('Innings ended!');
    } catch (err) {
      console.error('Failed to end innings:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Get current over display
  const overDisplay = `${currentOver}.${currentBall}`;
  
  // Calculate run rate
  const totalBalls = currentOver * 6 + currentBall;
  const runRate = totalBalls > 0 ? (teamScore / (totalBalls / 6)).toFixed(2) : '0.00';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Match</h2>
          <p className="text-gray-400">{error || 'Match not found'}</p>
          <button onClick={() => navigate('/tournaments')} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg">
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 md:p-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h1 className="text-lg md:text-xl font-bold">{match.name}</h1>
            <p className="text-gray-400 text-sm">{match.venue} • {match.format}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              match.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
            }`}>
              {match.status === 'live' ? '🔴 LIVE' : match.status.toUpperCase()}
            </span>
            <button onClick={() => navigate(`/tournament/${match.tournamentId?._id || match.tournamentId}`)} 
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="bg-gray-800 rounded-xl p-4 mb-4">
        <div className="text-center mb-6">
          <div className="text-5xl md:text-7xl font-black text-green-400 tracking-tight">
            {teamScore}
            <span className="text-gray-500 text-3xl md:text-5xl">/{teamWickets}</span>
          </div>
          <div className="flex justify-center items-center gap-4 mt-2">
            <span className="text-2xl font-bold">Overs: {overDisplay}</span>
            <span className="text-gray-500">|</span>
            <span className="text-xl">RR: {runRate}</span>
          </div>
        </div>
        
        {/* Extras Display */}
        <div className="flex justify-center gap-4 text-sm mb-4">
          <span className="text-yellow-400">WD: {extras.wides}</span>
          <span className="text-yellow-400">NB: {extras.noBalls}</span>
          <span className="text-blue-400">B: {extras.byes}</span>
          <span className="text-blue-400">LB: {extras.legByes}</span>
          <span className="text-white">Total: {extras.total}</span>
        </div>
        
        {/* Last Action */}
        {lastAction && (
          <div className="text-center mb-4">
            <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">{lastAction}</span>
          </div>
        )}
      </div>

      {/* Match Setup (Before Start) */}
      {!inningsStarted && (
        <div className="bg-gray-800 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-4 text-center">Match Setup</h2>
          
          {!tossDone ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Toss Winner</label>
                <select 
                  value={tossWinner}
                  onChange={(e) => setTossWinner(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3"
                >
                  <option value="">Select Team</option>
                  <option value={match.team1._id}>{match.team1.name}</option>
                  <option value={match.team2._id}>{match.team2.name}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Decision</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTossDecision('bat')}
                    className={`p-3 rounded-lg border ${tossDecision === 'bat' ? 'border-green-500 bg-green-500/20' : 'border-gray-600'}`}
                  >
                    🏏 Bat First
                  </button>
                  <button
                    onClick={() => setTossDecision('bowl')}
                    className={`p-3 rounded-lg border ${tossDecision === 'bowl' ? 'border-green-500 bg-green-500/20' : 'border-gray-600'}`}
                  >
                    🎯 Bowl First
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleToss}
                disabled={!tossWinner || !tossDecision || syncing}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg font-bold"
              >
                Start Match
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-green-400 font-bold mb-2">Match in Progress!</p>
              <p className="text-gray-400">{tossDecision === 'bat' ? 'Batting' : 'Bowling'} team is currently batting</p>
            </div>
          )}
        </div>
      )}

      {/* Scoring Controls */}
      {inningsStarted && (
        <>
          {/* Run Buttons */}
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">RUNS</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 6].map((run) => (
                <button
                  key={run}
                  onClick={() => handleScore(run, run === 4 || run === 6)}
                  disabled={syncing}
                  className={`py-4 rounded-lg font-bold text-xl transition-all ${
                    run === 0 ? 'bg-gray-700 hover:bg-gray-600' :
                    run === 4 ? 'bg-blue-600 hover:bg-blue-500' :
                    run === 6 ? 'bg-green-600 hover:bg-green-500' :
                    'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {run}
                </button>
              ))}
            </div>
          </div>

          {/* Wicket & Extras */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Wicket Button */}
            <button
              onClick={() => setShowOutModal(true)}
              disabled={syncing || teamWickets >= 10}
              className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 p-4 rounded-xl font-bold text-lg"
            >
              OUT
            </button>
            
            {/* Extras Button */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setExtraType('wide'); setShowExtraModal(true); }}
                disabled={syncing}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold p-2 rounded-lg"
              >
                WD
              </button>
              <button
                onClick={() => { setExtraType('noBall'); setShowExtraModal(true); }}
                disabled={syncing}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold p-2 rounded-lg"
              >
                NB
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleUndo}
              disabled={syncing}
              className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Undo
            </button>
            <button
              onClick={handleEndInnings}
              disabled={syncing}
              className="bg-orange-600 hover:bg-orange-500 p-3 rounded-xl font-bold"
            >
              End Innings
            </button>
          </div>
        </>
      )}

      {/* Sync Status */}
      {syncing && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          Syncing...
        </div>
      )}

      {/* Wicket Modal */}
      {showOutModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Select Dismissal Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {OUT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleWicket(type.value)}
                  className="p-3 bg-gray-700 hover:bg-red-600 rounded-lg font-medium transition"
                >
                  {type.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowOutModal(false)}
              className="w-full mt-4 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Extra Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add {extraType === 'wide' ? 'Wide' : extraType === 'noBall' ? 'No Ball' : extraType === 'bye' ? 'Bye' : 'Leg Bye'}</h3>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(EXTRA_TYPES.find(e => e.value === extraType)?.runs || []).map((run) => (
                <button
                  key={run}
                  onClick={() => setExtraRuns(run)}
                  className={`p-3 rounded-lg font-bold ${extraRuns === run ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  +{run}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleExtra}
                className="flex-1 p-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold"
              >
                Add Extra
              </button>
              <button
                onClick={() => setShowExtraModal(false)}
                className="flex-1 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

