import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { matchAPI, tournamentAPI } from '../services/api';
import { Match, Tournament, Team } from './types';
import io, { Socket } from 'socket.io-client';
import { ArrowLeft, Save, RotateCcw, Users, Target, LogOut, Settings, ExternalLink } from 'lucide-react';

type Dismissal = 'bowled' | 'caught' | 'lbw' | 'runOut' | 'stumped' | 'hitWicket' | 'handledBall' | 'timedOut' | null;

interface CricketPlayer {
  id: string;
  name: string;
  runsScored: number;
  ballsFaced: number;
  isOut: boolean;
  dismissal?: Dismissal;
}

interface Innings {
  battingTeam: string;
  totalRuns: number;
  wickets: number;
  totalBalls: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  strikerIndex: number;
  nonStrikerIndex: number;
  lineup: CricketPlayer[];
}

interface Bowler {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
}

const outTypes = [
  { type: 'bowled', label: 'Bowled' },
  { type: 'caught', label: 'Caught' },
  { type: 'lbw', label: 'LBW' },
  { type: 'stumped', label: 'Stumped' },
  { type: 'runOut', label: 'Run Out' },
  { type: 'hitWicket', label: 'Hit Wicket' },
];

export default function LiveScoring() {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Innings state
  const [innings, setInnings] = useState<Innings>(() => createDefaultInnings());
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2'>('team1');
  const [scoreHistory, setScoreHistory] = useState<Innings[]>([]);
  
  // Bowler state
  const [bowler, setBowler] = useState<Bowler>({ name: '', overs: 0, maidens: 0, runs: 0, wickets: 0 });
  const [bowlerTeam, setBowlerTeam] = useState<'team1' | 'team2'>('team2');
  
  // Modal states
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<'wide' | 'noBall' | 'bye' | 'legBye' | null>(null);
  const [showOutOptionsInExtra, setShowOutOptionsInExtra] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBatsmanSelect, setShowBatsmanSelect] = useState(false);
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  
  // Player selection
  const [battingPlayers, setBattingPlayers] = useState<{ striker: string; nonStriker: string }>({ striker: '', nonStriker: '' });

  function createDefaultInnings(): Innings {
    return {
      battingTeam: 'team1',
      totalRuns: 0,
      wickets: 0,
      totalBalls: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      strikerIndex: 0,
      nonStrikerIndex: 1,
      lineup: Array.from({ length: 11 }, (_, i) => ({
        id: String(i + 1),
        name: `Player ${i + 1}`,
        runsScored: 0,
        ballsFaced: 0,
        isOut: false,
      })),
    };
  }

  // Fetch match data
  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  // Socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('scoreUpdate', (data: { matchId: string; match: any }) => {
      if (matchId && data.matchId === matchId) {
        setMatch((prev) => prev ? { ...prev, ...data.match } : null);
        // Update innings from socket
        if (selectedTeam === 'team1' && data.match.score1 !== undefined) {
          const newInnings = { ...innings };
          newInnings.totalRuns = data.match.score1 || 0;
          newInnings.wickets = data.match.wickets1 || 0;
          const overs = data.match.overs1 || 0;
          newInnings.totalBalls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
          setInnings(newInnings);
        } else if (selectedTeam === 'team2' && data.match.score2 !== undefined) {
          const newInnings = { ...innings };
          newInnings.totalRuns = data.match.score2 || 0;
          newInnings.wickets = data.match.wickets2 || 0;
          const overs = data.match.overs2 || 0;
          newInnings.totalBalls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
          setInnings(newInnings);
        }
      }
    });

    return () => { newSocket.close(); };
  }, [matchId, selectedTeam]);

  const fetchMatch = async () => {
    if (!matchId) return;
    try {
      const response = await matchAPI.getMatches(matchId);
      const matchData = response.data.match || response.data;
      setMatch(matchData);
      
      if (matchData.tournament) {
        const tourResponse = await tournamentAPI.getTournament(
          typeof matchData.tournament === 'string' ? matchData.tournament : matchData.tournament._id
        );
        setTournament(tourResponse.data);
      }
      
      // Load existing scores
      if (matchData.score1 !== undefined) {
        setInnings({
          ...createDefaultInnings(),
          totalRuns: matchData.score1 || 0,
          wickets: matchData.wickets1 || 0,
          totalBalls: Math.floor((matchData.overs1 || 0)) * 6 + Math.round(((matchData.overs1 || 0) % 1) * 10),
          strikerIndex: 0,
          nonStrikerIndex: 1,
        });
      }
      
      // Load player names
      if (matchData.strikerName) {
        setBattingPlayers(prev => ({ ...prev, striker: matchData.strikerName }));
      }
      if (matchData.nonStrikerName) {
        setBattingPlayers(prev => ({ ...prev, nonStriker: matchData.nonStrikerName }));
      }
      if (matchData.bowlerName) {
        setBowler(prev => ({ ...prev, name: matchData.bowlerName }));
      }
    } catch (err) {
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save function - FIXED overs calculation to avoid floating point issues
  const autoSaveScore = async (inningsData: Innings) => {
    if (!match) return;
    try {
      // Calculate overs properly: overs.balls format (e.g., 5.3 = 5 overs 3 balls)
      const overs = Math.floor(inningsData.totalBalls / 6);
      const balls = inningsData.totalBalls % 6;
      const oversFormatted = parseFloat(`${overs}.${balls}`);
      
      const strikerName = inningsData.lineup[inningsData.strikerIndex]?.name || battingPlayers.striker || '';
      const nonStrikerName = inningsData.lineup[inningsData.nonStrikerIndex]?.name || battingPlayers.nonStriker || '';
      
      await matchAPI.updateMatchScore(match._id, {
        score1: selectedTeam === 'team1' ? inningsData.totalRuns : (match.score1 || 0),
        score2: selectedTeam === 'team2' ? inningsData.totalRuns : (match.score2 || 0),
        wickets1: selectedTeam === 'team1' ? inningsData.wickets : (match.wickets1 || 0),
        wickets2: selectedTeam === 'team2' ? inningsData.wickets : (match.wickets2 || 0),
        overs1: selectedTeam === 'team1' ? oversFormatted : (match.overs1 || 0),
        overs2: selectedTeam === 'team2' ? oversFormatted : (match.overs2 || 0),
        status: 'ongoing',
        strikerName,
        nonStrikerName,
        bowlerName: bowler.name,
      });
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  // Process delivery
  const processDelivery = (runs: number, deliveryType: 'normal' | 'wide' | 'noBall' | 'bye' | 'legBye', wicket: Dismissal = null) => {
    setScoreHistory([...scoreHistory, { ...innings }]);
    
    let newInnings = { ...innings };
    let striker = newInnings.lineup[newInnings.strikerIndex];

    if (deliveryType === 'wide') {
      newInnings.totalRuns += (1 + runs);
      newInnings.extras.wides += 1;
    } else if (deliveryType === 'noBall') {
      newInnings.totalRuns += (1 + runs);
      newInnings.extras.noBalls += 1;
    } else if (deliveryType === 'bye') {
      newInnings.totalRuns += runs;
      newInnings.extras.byes += runs;
      newInnings.totalBalls += 1;
    } else if (deliveryType === 'legBye') {
      newInnings.totalRuns += runs;
      newInnings.extras.legByes += runs;
      newInnings.totalBalls += 1;
    } else {
      newInnings.totalRuns += runs;
      striker.runsScored += runs;
      striker.ballsFaced += 1;
      newInnings.totalBalls += 1;
      
      // Update bowler
      setBowler(prev => ({
        ...prev,
        runs: prev.runs + runs,
        overs: prev.overs + 0.1,
      }));
    }

    // Handle wicket
    if (wicket) {
      newInnings.wickets += 1;
      striker.isOut = true;
      striker.dismissal = wicket;
      striker.name = battingPlayers.striker;
      
      // Update bowler wickets
      setBowler(prev => ({ ...prev, wickets: prev.wickets + 1 }));
    }

    // Handle over completion
    if (deliveryType === 'normal' && newInnings.totalBalls % 6 === 0) {
      setBowler(prev => ({ ...prev, overs: Math.floor(prev.overs) + 1 + (prev.overs % 1) }));
    }

    // Swap strike on odd runs
    if (deliveryType === 'normal' && runs % 2 !== 0) {
      const temp = newInnings.strikerIndex;
      newInnings.strikerIndex = newInnings.nonStrikerIndex;
      newInnings.nonStrikerIndex = temp;
    }

    setInnings(newInnings);
    autoSaveScore(newInnings);
  };

  const handleWicket = (dismissal: Dismissal, deliveryKind: 'normal' | 'noBall' | 'wide' = 'normal') => {
    if (deliveryKind === 'noBall' || deliveryKind === 'wide') {
      if (dismissal === 'stumped' || dismissal === 'runOut') {
        processDelivery(0, deliveryKind, dismissal);
      } else {
        processDelivery(0, deliveryKind, 'runOut');
      }
    } else {
      processDelivery(0, 'normal', dismissal);
    }
    setShowWicketModal(false);
  };

  const formatOvers = (): string => {
    const overs = Math.floor(innings.totalBalls / 6);
    const balls = innings.totalBalls % 6;
    return `${overs}.${balls}`;
  };

  const undoLastAction = () => {
    if (scoreHistory.length > 0) {
      const lastState = scoreHistory[scoreHistory.length - 1];
      setInnings(lastState);
      setScoreHistory(scoreHistory.slice(0, -1));
      autoSaveScore(lastState);
    }
  };

  const resetInnings = () => {
    setInnings(createDefaultInnings());
    setScoreHistory([]);
    setBowler({ name: '', overs: 0, maidens: 0, runs: 0, wickets: 0 });
    autoSaveScore(createDefaultInnings());
  };

  // Get team players
  const getTeamPlayers = (teamKey: 'team1' | 'team2') => {
    const team = teamKey === 'team1' ? match?.team1 : match?.team2;
    return team?.players || [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const team1Players = getTeamPlayers('team1');
  const team2Players = getTeamPlayers('team2');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-300 hover:text-white">
            <LogOut className="w-5 h-5" />
            <span>Leave</span>
          </button>
          <h1 className="text-xl font-bold">{match?.team1?.name} vs {match?.team2?.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/match/${match?._id}`} className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700">
            <ExternalLink className="w-4 h-4" />
            Full Scorecard
          </Link>
        </div>
      </div>

      {/* Overlay Display - Top Half */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 min-h-[40vh]">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-300">{tournament?.name}</div>
            <div className="bg-red-600 px-3 py-1 rounded text-sm font-bold animate-pulse">LIVE</div>
          </div>
          
          <div className="flex justify-center items-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{match?.team1?.name}</div>
              <div className="text-6xl font-bold text-yellow-400">{selectedTeam === 'team1' ? innings.totalRuns : (match?.score1 || 0)}/{selectedTeam === 'team1' ? innings.wickets : (match?.wickets1 || 0)}</div>
            </div>
            <div className="text-3xl text-gray-300">vs</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{match?.team2?.name}</div>
              <div className="text-6xl font-bold text-yellow-400">{selectedTeam === 'team2' ? innings.totalRuns : (match?.score2 || 0)}/{selectedTeam === 'team2' ? innings.wickets : (match?.wickets2 || 0)}</div>
            </div>
          </div>

          <div className="flex justify-center gap-8 text-lg">
            <div className="text-center">
              <div className="text-gray-400 text-sm">Overs</div>
              <div className="font-bold">{selectedTeam === 'team1' ? formatOvers() : (match?.overs2?.toFixed(1) || '0.0')}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Run Rate</div>
              <div className="font-bold">
                {innings.totalBalls > 0 
                  ? ((innings.totalRuns) / (innings.totalBalls / 6)).toFixed(2)
                  : '0.00'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">This Over</div>
              <div className="font-bold text-green-400">0 0 0 0 0 0</div>
            </div>
          </div>

          {/* Batters Display */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${selectedTeam === 'team1' ? 'bg-green-800 border-2 border-green-400' : 'bg-gray-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold">{battingPlayers.striker || 'Striker'}</span>
                <span className="text-yellow-400 text-xl">*</span>
              </div>
              <div className="text-gray-300">{innings.lineup[innings.strikerIndex]?.runsScored || 0} ({innings.lineup[innings.strikerIndex]?.ballsFaced || 0})</div>
            </div>
            <div className={`p-3 rounded-lg ${selectedTeam === 'team2' ? 'bg-green-800 border-2 border-green-400' : 'bg-gray-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold">{battingPlayers.nonStriker || 'Non-Striker'}</span>
              </div>
              <div className="text-gray-300">{innings.lineup[innings.nonStrikerIndex]?.runsScored || 0} ({innings.lineup[innings.nonStrikerIndex]?.ballsFaced || 0})</div>
            </div>
          </div>

          {/* Bowler Display */}
          <div className="mt-4 p-3 rounded-lg bg-gray-800">
            <div className="flex justify-between items-center">
              <span className="font-bold">{bowler.name || 'Bowler'}</span>
              <span className="text-yellow-400">{bowler.overs}.{Math.round((bowler.overs % 1) * 10)} - {bowler.runs}/{bowler.wickets}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard - Bottom Half */}
      <div className="p-4 bg-gray-800 min-h-[60vh]">
        <div className="max-w-4xl mx-auto">
          {/* Team Selection */}
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setSelectedTeam('team1')} 
              className={`flex-1 py-3 rounded-lg font-bold ${selectedTeam === 'team1' ? 'bg-green-600' : 'bg-gray-700'}`}
            >
              {match?.team1?.name || 'Team 1'} Batting
            </button>
            <button 
              onClick={() => setSelectedTeam('team2')} 
              className={`flex-1 py-3 rounded-lg font-bold ${selectedTeam === 'team2' ? 'bg-green-600' : 'bg-gray-700'}`}
            >
              {match?.team2?.name || 'Team 2'} Batting
            </button>
          </div>

          {/* Score Display */}
          <div className="bg-gray-900 p-4 rounded-lg mb-4 text-center">
            <div className="text-5xl font-bold text-yellow-400">{innings.totalRuns}/{innings.wickets}</div>
            <div className="text-2xl text-gray-300">{formatOvers()} overs</div>
          </div>

          {/* Player Selection */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button 
              onClick={() => setShowBatsmanSelect(!showBatsmanSelect)}
              className="p-3 bg-gray-700 rounded-lg flex items-center justify-between"
            >
              <div className="text-left">
                <div className="text-xs text-gray-400">Striker</div>
                <div className="font-bold">{battingPlayers.striker || 'Select'}</div>
              </div>
              <Users className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowBowlerSelect(!showBowlerSelect)}
              className="p-3 bg-gray-700 rounded-lg flex items-center justify-between"
            >
              <div className="text-left">
                <div className="text-xs text-gray-400">Bowler</div>
                <div className="font-bold">{bowler.name || 'Select'}</div>
              </div>
              <Target className="w-5 h-5" />
            </button>
          </div>

          {/* Batsman Selection Modal */}
          {showBatsmanSelect && (
            <div className="mb-4 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-bold mb-2">Select Batsmen</h3>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={battingPlayers.striker}
                  onChange={(e) => setBattingPlayers(prev => ({ ...prev, striker: e.target.value }))}
                  className="p-2 bg-gray-600 rounded"
                >
                  <option value="">Striker</option>
                  {(selectedTeam === 'team1' ? team1Players : team2Players).map((p: any, i: number) => (
                    <option key={i} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <select 
                  value={battingPlayers.nonStriker}
                  onChange={(e) => setBattingPlayers(prev => ({ ...prev, nonStriker: e.target.value }))}
                  className="p-2 bg-gray-600 rounded"
                >
                  <option value="">Non-Striker</option>
                  {(selectedTeam === 'team1' ? team1Players : team2Players).map((p: any, i: number) => (
                    <option key={i} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setShowBatsmanSelect(false)} className="mt-2 w-full py-2 bg-blue-600 rounded">Done</button>
            </div>
          )}

          {/* Bowler Selection Modal */}
          {showBowlerSelect && (
            <div className="mb-4 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-bold mb-2">Select Bowler</h3>
              <select 
                value={bowler.name}
                onChange={(e) => setBowler(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 bg-gray-600 rounded"
              >
                <option value="">Select Bowler</option>
                {(selectedTeam === 'team1' ? team2Players : team1Players).map((p: any, i: number) => (
                  <option key={i} value={p.name}>{p.name}</option>
                ))}
              </select>
              <button onClick={() => setShowBowlerSelect(false)} className="mt-2 w-full py-2 bg-blue-600 rounded">Done</button>
            </div>
          )}

          {/* Run Buttons */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">RUNS</h4>
            <div className="grid grid-cols-6 gap-2">
              <button onClick={() => processDelivery(0, 'normal')} className="py-4 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold text-lg">0</button>
              <button onClick={() => processDelivery(1, 'normal')} className="py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg">1</button>
              <button onClick={() => processDelivery(2, 'normal')} className="py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg">2</button>
              <button onClick={() => processDelivery(3, 'normal')} className="py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg">3</button>
              <button onClick={() => processDelivery(4, 'normal')} className="py-4 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-lg">4</button>
              <button onClick={() => processDelivery(6, 'normal')} className="py-4 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-lg">6</button>
            </div>
          </div>

          {/* Extra Buttons - 4 Main Buttons */}
          <div className="mb-4">
            <h4 className="text-xs text-gray-400 uppercase mb-2 tracking-wider">Extras</h4>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { setPendingExtraType('wide'); setShowExtraModal(true); }}
                className="py-4 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-lg"
              >
                Wide
              </button>
              <button 
                onClick={() => { setPendingExtraType('noBall'); setShowExtraModal(true); }}
                className="py-4 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold text-lg"
              >
                No Ball
              </button>
              <button 
                onClick={() => { setPendingExtraType('bye'); setShowExtraModal(true); }}
                className="py-4 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-lg"
              >
                Bye
              </button>
              <button 
                onClick={() => { setPendingExtraType('legBye'); setShowExtraModal(true); }}
                className="py-4 bg-pink-600 hover:bg-pink-500 rounded-lg font-bold text-lg"
              >
                Leg Bye
              </button>
            </div>
          </div>

          {/* OUT Button */}
          <div className="mb-4">
            <button 
              onClick={() => setShowWicketModal(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-xl"
            >
              OUT
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={undoLastAction} disabled={scoreHistory.length === 0} className="flex-1 py-3 bg-gray-600 rounded-lg font-bold">
              <RotateCcw className="w-5 h-5 inline mr-2" /> Undo
            </button>
            <button onClick={resetInnings} className="flex-1 py-3 bg-red-700 rounded-lg font-bold">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Extra Modal */}
      {showExtraModal && pendingExtraType && !showOutOptionsInExtra && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-4 rounded-lg w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-center">
              {pendingExtraType === 'wide' ? 'Wide' : 
               pendingExtraType === 'noBall' ? 'No Ball' : 
               pendingExtraType === 'bye' ? 'Bye' : 'Leg Bye'}
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {pendingExtraType === 'wide' ? (
                <>
                  <button onClick={() => { processDelivery(1, 'wide'); setShowExtraModal(false); }} className="bg-yellow-600 py-3 rounded-lg font-bold">+1</button>
                  <button onClick={() => { processDelivery(2, 'wide'); setShowExtraModal(false); }} className="bg-yellow-600 py-3 rounded-lg font-bold">+2</button>
                  <button onClick={() => { processDelivery(3, 'wide'); setShowExtraModal(false); }} className="bg-yellow-600 py-3 rounded-lg font-bold">+3</button>
                  <button onClick={() => { processDelivery(4, 'wide'); setShowExtraModal(false); }} className="bg-yellow-600 py-3 rounded-lg font-bold">+4</button>
                  <button onClick={() => { processDelivery(5, 'wide'); setShowExtraModal(false); }} className="bg-yellow-600 py-3 rounded-lg font-bold">+5</button>
                  <button onClick={() => { processDelivery(0, 'wide'); setShowExtraModal(false); }} className="bg-yellow-600 py-3 rounded-lg font-bold">+0</button>
                </>
              ) : (
                <>
                  <button onClick={() => { processDelivery(0, pendingExtraType); setShowExtraModal(false); }} className="bg-gray-600 py-3 rounded-lg font-bold">+0</button>
                  <button onClick={() => { processDelivery(1, pendingExtraType); setShowExtraModal(false); }} className="bg-gray-600 py-3 rounded-lg font-bold">+1</button>
                  <button onClick={() => { processDelivery(2, pendingExtraType); setShowExtraModal(false); }} className="bg-gray-600 py-3 rounded-lg font-bold">+2</button>
                  <button onClick={() => { processDelivery(3, pendingExtraType); setShowExtraModal(false); }} className="bg-gray-600 py-3 rounded-lg font-bold">+3</button>
                  <button onClick={() => { processDelivery(4, pendingExtraType); setShowExtraModal(false); }} className="bg-gray-600 py-3 rounded-lg font-bold">+4</button>
                  <button onClick={() => { processDelivery(6, pendingExtraType); setShowExtraModal(false); }} className="bg-gray-600 py-3 rounded-lg font-bold">+6</button>
                </>
              )}
            </div>
            {(pendingExtraType === 'wide' || pendingExtraType === 'noBall') && (
              <button onClick={() => setShowOutOptionsInExtra(true)} className="w-full bg-red-600 py-3 rounded-lg font-bold">OUT</button>
            )}
            <button onClick={() => setShowExtraModal(false)} className="w-full mt-2 bg-gray-600 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* OUT Options Modal for Wide/NoBall */}
      {showExtraModal && pendingExtraType && showOutOptionsInExtra && (pendingExtraType === 'wide' || pendingExtraType === 'noBall') && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[60] p-4">
          <div className="bg-gray-800 p-4 rounded-lg w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-center">{pendingExtraType === 'wide' ? 'Wide + Out' : 'No Ball + Out'}</h3>
            <div className="space-y-2">
              <button 
                onClick={() => { handleWicket('runOut', pendingExtraType as 'wide' | 'noBall'); setShowOutOptionsInExtra(false); setShowExtraModal(false); }} 
                className="w-full py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700"
              >
                {pendingExtraType === 'wide' ? 'Wide + Run Out' : 'No Ball + Run Out'}
              </button>
              <button 
                onClick={() => { handleWicket('stumped', pendingExtraType as 'wide' | 'noBall'); setShowOutOptionsInExtra(false); setShowExtraModal(false); }} 
                className="w-full py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700"
              >
                {pendingExtraType === 'wide' ? 'Wide + Stumped' : 'No Ball + Stumped'}
              </button>
            </div>
            <button onClick={() => setShowOutOptionsInExtra(false)} className="w-full mt-3 bg-gray-600 py-2 rounded-lg">Back</button>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-4 rounded-lg w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-center">Select Dismissal</h3>
            <div className="space-y-2">
              {outTypes.map((out) => (
                <button 
                  key={out.type}
                  onClick={() => handleWicket(out.type as Dismissal)} 
                  className="w-full py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700"
                >
                  {out.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowWicketModal(false)} className="w-full mt-3 bg-gray-600 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
