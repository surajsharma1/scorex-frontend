import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { Tournament, Match, Team } from './types';
import io, { Socket } from 'socket.io-client';
import TeamManagement from './TeamManagement';
import OverlayEditor from './OverlayEditor';

// ============================================
// CRICKET ENGINE - COMPLETE IMPLEMENTATION
// ============================================

type Dismissal = 'bowled' | 'caught' | 'lbw' | 'runOut' | 'stumped' | 'hitWicket' | 'handledBall' | 'timedOut' | null;

interface Player {
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
  totalBalls: number; // Cumulative legal balls
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  strikerIndex: number;
  nonStrikerIndex: number;
  lineup: Player[];
}

// Out type options with constraints
const outTypes = [
  { type: 'bowled', label: 'Bowled', canBeNoBall: false, canBeWide: false },
  { type: 'caught', label: 'Caught', canBeNoBall: false, canBeWide: false },
  { type: 'lbw', label: 'LBW', canBeNoBall: false, canBeWide: false },
  { type: 'stumped', label: 'Stumped', canBeNoBall: true, canBeWide: true },
  { type: 'runOut', label: 'Run Out', canBeNoBall: true, canBeWide: true },
  { type: 'hitWicket', label: 'Hit Wicket', canBeNoBall: false, canBeWide: false },
];

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [scoreHistory, setScoreHistory] = useState<Innings[]>([]);

  const [matchForm, setMatchForm] = useState({
    tournament: '',
    team1: '',
    team2: '',
    date: '',
    venue: '',
    tossWinner: '',
    tossChoice: '',
    matchType: 'League',
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wicket selection modal
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [pendingWicketType, setPendingWicketType] = useState<string>('');
  const [isNoBallOrWide, setIsNoBallOrWide] = useState(false);

  // Cricket innings state
  const [innings, setInnings] = useState<Innings>(() => createDefaultInnings());
  const [selectedTeamForUpdate, setSelectedTeamForUpdate] = useState<'team1' | 'team2'>('team1');

  function createDefaultInnings(): Innings {
    return {
      battingTeam: 'team1',
      totalRuns: 0,
      wickets: 0,
      totalBalls: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      strikerIndex: 0,
      nonStrikerIndex: 1,
      lineup: [
        { id: '1', name: 'Batsman 1', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '2', name: 'Batsman 2', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '3', name: 'Batsman 3', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '4', name: 'Batsman 4', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '5', name: 'Batsman 5', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '6', name: 'Batsman 6', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '7', name: 'Batsman 7', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '8', name: 'Batsman 8', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '9', name: 'Batsman 9', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '10', name: 'Batsman 10', runsScored: 0, ballsFaced: 0, isOut: false },
        { id: '11', name: 'Batsman 11', runsScored: 0, ballsFaced: 0, isOut: false },
      ],
    };
  }

  // Safe array length check helper
  const safeLength = (arr: any[] | undefined | null): number => {
    return Array.isArray(arr) ? arr.length : 0;
  };

  // Safe array access helper
  const safeAccess = <T,>(arr: T[] | undefined | null, index: number): T | undefined => {
    return Array.isArray(arr) ? arr[index] : undefined;
  };

  // ============================================
  // CRICKET ENGINE CORE LOGIC
  // ============================================
  
  const processDelivery = (runs: number, deliveryType: 'normal' | 'wide' | 'noBall' | 'bye' | 'legBye', wicket: Dismissal = null) => {
    setScoreHistory([...scoreHistory, { ...innings }]);
    
    let newInnings = { ...innings };
    let striker = newInnings.lineup[newInnings.strikerIndex];
    let nonStriker = newInnings.lineup[newInnings.nonStrikerIndex];

    // 1. Handle Extras and Scoring
    if (deliveryType === 'wide') {
      // Wide: runs + 1 (the wide itself), NO ball counted
      newInnings.totalRuns += (1 + runs);
      newInnings.extras.wides += 1;
    } else if (deliveryType === 'noBall') {
      // No Ball: runs + 1 (the no ball itself), NO ball counted
      newInnings.totalRuns += (1 + runs);
      newInnings.extras.noBalls += 1;
    } else if (deliveryType === 'bye') {
      // Bye: runs added, ball counted, but NOT to striker
      newInnings.totalRuns += runs;
      newInnings.extras.byes += runs;
      newInnings.totalBalls += 1;
    } else if (deliveryType === 'legBye') {
      // Leg Bye: runs added, ball counted, but NOT to striker
      newInnings.totalRuns += runs;
      newInnings.extras.legByes += runs;
      newInnings.totalBalls += 1;
    } else {
      // Normal delivery
      newInnings.totalRuns += runs;
      striker.runsScored += runs;
      striker.ballsFaced += 1;
      newInnings.totalBalls += 1;
    }

    // 2. Handle Wicket
    if (wicket) {
      newInnings.wickets += 1;
      striker.isOut = true;
      striker.dismissal = wicket;
      
      // Bring next player to crease
      const nextPlayerIndex = Math.max(newInnings.strikerIndex, newInnings.nonStrikerIndex) + 1;
      if (nextPlayerIndex < newInnings.lineup.length) {
        newInnings.strikerIndex = nextPlayerIndex;
      }
    }

    // 3. Strike Rotation (odd runs)
    if (deliveryType === 'normal' && runs % 2 !== 0) {
      const temp = newInnings.strikerIndex;
      newInnings.strikerIndex = newInnings.nonStrikerIndex;
      newInnings.nonStrikerIndex = temp;
    }

    // 4. Over End (6 legal balls) - swap striker
    if (deliveryType === 'normal' && newInnings.totalBalls % 6 === 0) {
      const temp = newInnings.strikerIndex;
      newInnings.strikerIndex = newInnings.nonStrikerIndex;
      newInnings.nonStrikerIndex = temp;
    }

    setInnings(newInnings);
  };

  // Handle wicket with selection
  const handleWicket = (dismissal: Dismissal) => {
    // Determine if this is a legal ball delivery
    if (isNoBallOrWide) {
      // On no-ball or wide, only certain dismissals allowed
      if (dismissal === 'stumped' || dismissal === 'runOut') {
        processDelivery(0, isNoBallOrWide === 'noBall' ? 'noBall' : 'wide', dismissal);
      } else {
        // Can't be bowled, caught, lbw on no-ball/wide - treat as run out if they try
        processDelivery(0, isNoBallOrWide === 'noBall' ? 'noBall' : 'wide', 'runOut');
      }
    } else {
      processDelivery(0, 'normal', dismissal);
    }
    setShowWicketModal(false);
    setIsNoBallOrWide(false);
    setPendingWicketType('');
  };

  // Open wicket modal
  const openWicketModal = (type: 'normal' | 'runOut', isNBorWide: boolean = false) => {
    setPendingWicketType(type);
    setIsNoBallOrWide(isNBorWide);
    setShowWicketModal(true);
  };

  // Undo last action
  const undoLastAction = () => {
    if (scoreHistory.length > 0) {
      const lastState = scoreHistory[scoreHistory.length - 1];
      setInnings(lastState);
      setScoreHistory(scoreHistory.slice(0, -1));
    }
  };

  // Format overs for display
  const formatOvers = (): string => {
    const overs = Math.floor(innings.totalBalls / 6);
    const balls = innings.totalBalls % 6;
    return `${overs}.${balls}`;
  };

  // Reset innings
  const resetInnings = () => {
    setInnings(createDefaultInnings());
    setScoreHistory([]);
  };

  // Switch batting team
  const switchInnings = () => {
    setInnings({
      ...createDefaultInnings(),
      battingTeam: selectedTeamForUpdate === 'team1' ? 'team2' : 'team1',
    });
    setScoreHistory([]);
  };

  useEffect(() => {
    if (id) {
      fetchTournament();
      fetchMatches();
      fetchTeams();
    }
  }, [id]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []);

  const fetchTournament = async () => {
    if (!id) return;
    try {
      const response = await tournamentAPI.getTournament(id);
      setTournament(response.data);
    } catch (error) {
      setError('Failed to fetch tournament');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely extract array from API response
  const extractArray = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.matches)) return response.data.matches;
    if (Array.isArray(response.data?.teams)) return response.data.teams;
    if (Array.isArray(response)) return response;
    return [];
  };

  const fetchMatches = async () => {
    if (!id) return;
    try {
      const response = await matchAPI.getMatches(id);
      const matchesArray = extractArray(response);
      setMatches(matchesArray);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setError('Failed to fetch matches');
      setMatches([]);
    }
  };

  const fetchTeams = async () => {
    if (!id) return;
    try {
      const response = await teamAPI.getTeams(id);
      const teamsArray = extractArray(response);
      setTeams(teamsArray);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      setError('Failed to fetch teams');
      setTeams([]);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      await matchAPI.createMatch({ ...matchForm, tournament: id });
      setShowMatchForm(false);
      setMatchForm({ tournament: '', team1: '', team2: '', date: '', venue: '', tossWinner: '', tossChoice: '', matchType: 'League' });
      fetchMatches();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    if (!selectedMatch) return;
    setLoading(true);
    try {
      const overs = Math.floor(innings.totalBalls / 6) + (innings.totalBalls % 6) / 10;
      await matchAPI.updateMatchScore(selectedMatch._id, {
        score1: selectedTeamForUpdate === 'team1' ? innings.totalRuns : 0,
        score2: selectedTeamForUpdate === 'team2' ? innings.totalRuns : 0,
        wickets1: selectedTeamForUpdate === 'team1' ? innings.wickets : 0,
        wickets2: selectedTeamForUpdate === 'team2' ? innings.wickets : 0,
        overs1: selectedTeamForUpdate === 'team1' ? parseFloat(overs.toFixed(1)) : 0,
        overs2: selectedTeamForUpdate === 'team2' ? parseFloat(overs.toFixed(1)) : 0,
        status: 'ongoing'
      });
      setSelectedMatch(null);
      fetchMatches();
    } catch (error) {
      setError('Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (window.confirm('Delete this match?')) {
      setLoading(true);
      try {
        await matchAPI.deleteMatch(matchId);
        fetchMatches();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete match');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteTournament = async () => {
    if (window.confirm('Delete this tournament?')) {
      setLoading(true);
      try {
        await tournamentAPI.deleteTournament(id!);
        navigate('/tournaments');
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete tournament');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!tournament) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-gray-900 text-white min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/tournaments')} className="btn-secondary mb-4">← Back</button>
        <h1 className="text-3xl font-bold text-gradient">{tournament.name}</h1>
        <p className="text-gray-300">{tournament.description}</p>
      </div>

      {error && <div className="bg-red-900 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {['overview', 'matches', 'teams', 'overlays'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab ? 'bg-primary-600' : 'bg-gray-700'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Tournament Details</h2>
            <div className="space-y-2">
              <p>Format: {tournament.format}</p>
              <p>Status: {tournament.status}</p>
              <p>Teams: {tournament.numberOfTeams}</p>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-700 rounded">
                <div className="text-2xl font-bold">{matches.length}</div>
                <div className="text-sm text-gray-400">Matches</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded">
                <div className="text-2xl font-bold">{teams.length}</div>
                <div className="text-sm text-gray-400">Teams</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Matches</h2>
            <button onClick={() => setShowMatchForm(true)} className="btn-primary">Schedule Match</button>
          </div>

          {/* Match List */}
          <div className="space-y-4">
            {matches.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No matches yet</p>
            ) : (
              matches.map((match) => (
                <div key={match._id} className="p-4 bg-gray-700 rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{match.team1?.name} vs {match.team2?.name}</h4>
                    <p className="text-sm text-gray-400">
                      {match.score1 !== undefined ? `${match.score1}/${match.wickets1} (${match.overs1})` : 'Not started'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedMatch(match);
                        resetInnings();
                      }}
                      className="btn-secondary text-sm"
                    >
                      Score
                    </button>
                    <button onClick={() => handleDeleteMatch(match._id)} className="bg-red-600 px-3 py-1 rounded text-sm">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <TeamManagement selectedTournament={tournament} />
        </div>
      )}

      {activeTab === 'overlays' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <OverlayEditor />
        </div>
      )}

      {/* ============================================ */}
      {/* CRICKET SCOREBOARD MODAL - COMPLETE DESIGN */}
      {/* ============================================ */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}
              </h3>
              <div className="flex gap-2">
                <button onClick={undoLastAction} disabled={scoreHistory.length === 0} className="btn-secondary text-sm">Undo</button>
                <button onClick={() => setSelectedMatch(null)} className="bg-gray-600 px-3 py-1 rounded">Close</button>
              </div>
            </div>

            {/* Team Selection */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => { setSelectedTeamForUpdate('team1'); resetInnings(); }}
                className={`flex-1 py-2 rounded-lg font-bold ${selectedTeamForUpdate === 'team1' ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                {selectedMatch.team1?.name || 'Team 1'}
              </button>
              <button
                onClick={() => { setSelectedTeamForUpdate('team2'); resetInnings(); }}
                className={`flex-1 py-2 rounded-lg font-bold ${selectedTeamForUpdate === 'team2' ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                {selectedMatch.team2?.name || 'Team 2'}
              </button>
            </div>

            {/* Score Display */}
            <div className="bg-gray-900 p-4 rounded-lg mb-4 text-center">
              <div className="text-5xl font-bold text-yellow-400">
                {innings.totalRuns}/{innings.wickets}
              </div>
              <div className="text-2xl text-gray-300">
                {formatOvers()} overs
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Extras: Wd({innings.extras.wides}) NB({innings.extras.noBalls}) B({innings.extras.byes}) LB({innings.extras.legByes})
              </div>
            </div>

            {/* Batsmen Display */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${innings.strikerIndex >= 0 ? 'bg-green-900 border-2 border-green-500' : 'bg-gray-700'}`}>
                <div className="text-sm text-gray-400">Striker</div>
                <div className="font-bold">{innings.lineup[innings.strikerIndex]?.name || '...'}</div>
                <div className="text-lg">
                  {innings.lineup[innings.strikerIndex]?.runsScored || 0} ({innings.lineup[innings.strikerIndex]?.ballsFaced || 0})
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-700">
                <div className="text-sm text-gray-400">Non-Striker</div>
                <div className="font-bold">{innings.lineup[innings.nonStrikerIndex]?.name || '...'}</div>
                <div className="text-lg">
                  {innings.lineup[innings.nonStrikerIndex]?.runsScored || 0} ({innings.lineup[innings.nonStrikerIndex]?.ballsFaced || 0})
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* SCORING BUTTONS - COMPLETE SET */}
            {/* ============================================ */}
            
            {/* Normal Runs */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">RUNS</h4>
              <div className="grid grid-cols-6 gap-2">
                <button onClick={() => processDelivery(0, 'normal')} className="btn-secondary py-3">0</button>
                <button onClick={() => processDelivery(1, 'normal')} className="btn-primary py-3">1</button>
                <button onClick={() => processDelivery(2, 'normal')} className="btn-primary py-3">2</button>
                <button onClick={() => processDelivery(3, 'normal')} className="btn-primary py-3">3</button>
                <button onClick={() => processDelivery(4, 'normal')} className="btn-accent py-3">4</button>
                <button onClick={() => processDelivery(6, 'normal')} className="btn-accent py-3">6</button>
              </div>
            </div>

            {/* WIDE - Opens modal with run options */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">WIDE</h4>
              <div className="grid grid-cols-6 gap-2">
                <button onClick={() => processDelivery(0, 'wide')} className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded font-bold">Wd+0</button>
                <button onClick={() => processDelivery(1, 'wide')} className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded font-bold">Wd+1</button>
                <button onClick={() => processDelivery(2, 'wide')} className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded font-bold">Wd+2</button>
                <button onClick={() => processDelivery(3, 'wide')} className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded font-bold">Wd+3</button>
                <button onClick={() => processDelivery(4, 'wide')} className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded font-bold">Wd+4</button>
                <button onClick={() => openWicketModal('runOut', true)} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold">Wd+Wkt</button>
              </div>
            </div>

            {/* NO BALL - Opens modal with run options */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">NO BALL</h4>
              <div className="grid grid-cols-6 gap-2">
                <button onClick={() => processDelivery(0, 'noBall')} className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-bold">NB+0</button>
                <button onClick={() => processDelivery(1, 'noBall')} className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-bold">NB+1</button>
                <button onClick={() => processDelivery(2, 'noBall')} className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-bold">NB+2</button>
                <button onClick={() => processDelivery(3, 'noBall')} className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-bold">NB+3</button>
                <button onClick={() => processDelivery(4, 'noBall')} className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-bold">NB+4</button>
                <button onClick={() => processDelivery(6, 'noBall')} className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-bold">NB+6</button>
              </div>
            </div>

            {/* BYE */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">BYE</h4>
              <div className="grid grid-cols-6 gap-2">
                <button onClick={() => processDelivery(0, 'bye')} className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-bold">B+0</button>
                <button onClick={() => processDelivery(1, 'bye')} className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-bold">B+1</button>
                <button onClick={() => processDelivery(2, 'bye')} className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-bold">B+2</button>
                <button onClick={() => processDelivery(3, 'bye')} className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-bold">B+3</button>
                <button onClick={() => processDelivery(4, 'bye')} className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-bold">B+4</button>
                <button onClick={() => openWicketModal('runOut', false)} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold">B+Wkt</button>
              </div>
            </div>

            {/* LEG BYE */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">LEG BYE</h4>
              <div className="grid grid-cols-6 gap-2">
                <button onClick={() => processDelivery(0, 'legBye')} className="bg-pink-600 hover:bg-pink-700 text-white py-3 rounded font-bold">LB+0</button>
                <button onClick={() => processDelivery(1, 'legBye')} className="bg-pink-600 hover:bg-pink-700 text-white py-3 rounded font-bold">LB+1</button>
                <button onClick={() => processDelivery(2, 'legBye')} className="bg-pink-600 hover:bg-pink-700 text-white py-3 rounded font-bold">LB+2</button>
                <button onClick={() => processDelivery(3, 'legBye')} className="bg-pink-600 hover:bg-pink-700 text-white py-3 rounded font-bold">LB+3</button>
                <button onClick={() => processDelivery(4, 'legBye')} className="bg-pink-600 hover:bg-pink-700 text-white py-3 rounded font-bold">LB+4</button>
                <button onClick={() => openWicketModal('runOut', false)} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold">LB+Wkt</button>
              </div>
            </div>

            {/* WICKET BUTTON */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">WICKET (Legal Delivery)</h4>
              <button
                onClick={() => openWicketModal('normal', false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-xl"
              >
                OUT - Select Dismissal Type
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <button onClick={resetInnings} className="flex-1 bg-red-700 hover:bg-red-800 py-3 rounded-lg font-bold">Reset</button>
              <button onClick={switchInnings} className="flex-1 bg-purple-700 hover:bg-purple-800 py-3 rounded-lg font-bold">Switch Innings</button>
              <button onClick={handleUpdateScore} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold">
                {loading ? 'Saving...' : 'Save Score'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* WICKET SELECTION MODAL */}
      {/* ============================================ */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[60] p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center">
              Select Dismissal Type
              {isNoBallOrWide && <span className="text-yellow-400 block text-sm">(No Ball/Wide)</span>}
            </h3>
            
            <div className="space-y-2">
              {outTypes.map((out) => {
                // Filter based on whether it's no-ball/wide
                const isAllowed = isNoBallOrWide ? out.canBeNoBall : true;
                
                return (
                  <button
                    key={out.type}
                    onClick={() => handleWicket(out.type as Dismissal)}
                    disabled={!isAllowed}
                    className={`w-full py-3 rounded-lg font-bold ${
                      isAllowed 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {out.label}
                    {!isAllowed && <span className="text-xs block">(Not allowed on {isNoBallOrWide ? 'No Ball/Wide' : 'legal ball'})</span>}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { setShowWicketModal(false); setIsNoBallOrWide(false); }}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
