import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tournament, Match, Team } from './types';
import io, { Socket } from 'socket.io-client';
import TeamManagement from './TeamManagement';
import TournamentStats from './TournamentStats';
import ScoreboardUpdate from './ScoreboardUpdate';
import OverlayManager from './OverlayManager';
import { tournamentAPI, teamAPI, matchAPI } from '../services/api';



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
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  strikerIndex: number;
  nonStrikerIndex: number;
  lineup: CricketPlayer[];
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'teams' | 'stats' | 'overlays'>('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localMatchStatuses, setLocalMatchStatuses] = useState<Record<string, string>>({});
  const socketRef = useRef<Socket | null>(null);

  const [matchForm, setMatchForm] = useState({
    tournament: '',
    team1: '',
    team2: '',
    date: '',
    venue: '',
    tossWinner: '',
    tossChoice: '',
    matchType: 'T20',
    videoLink: '',
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [innings, setInnings] = useState<Innings>({
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
  });

  const [showTossModal, setShowTossModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [matchSetupStage, setMatchSetupStage] = useState<'toss' | 'players' | 'scoring' | 'complete'>('toss');
  const [pendingMatchForToss, setPendingMatchForToss] = useState<Match | null>(null);
  const [selectedTossWinner, setSelectedTossWinner] = useState<string>('');
  const [selectedTossDecision, setSelectedTossDecision] = useState<'bat' | 'bowl' | ''>('');
  const [selectedStriker, setSelectedStriker] = useState<string>('');
  const [selectedNonStriker, setSelectedNonStriker] = useState<string>('');
  const [selectedBowler, setSelectedBowler] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadData();
    }
    return () => {
      socketRef.current?.close();
    };
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTournament(),
        fetchMatches(),
        fetchTeams(),
      ]);
    } catch (err: any) {
      setError('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTournament = async () => {
    try {
      const response = await tournamentAPI.getTournament(id!);
      setTournament(response.data);
    } catch (error: any) {
      console.error('Tournament fetch failed:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await matchAPI.getMatches();
      const matchesArray = Array.isArray(response.data) ? response.data : response.data?.matches || [];
      setMatches(matchesArray.filter((m: Match) => m.tournamentId === id));
    } catch (error: any) {
      console.error('Matches fetch failed:', error);
      setMatches([]);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.getTeams();
      const teamsArray = Array.isArray(response.data) ? response.data : response.data?.teams || [];
      setTeams(teamsArray.filter((t: Team) => t.tournamentId === id));
    } catch (error) {
      console.error('Teams fetch failed:', error);
      setTeams([]);
    }
  };

  const handleStatusChange = async (match: Match, newStatus: string) => {
    const matchId = match._id;
    setLocalMatchStatuses(prev => ({ ...prev, [matchId]: newStatus }));
    
    try {
      await matchAPI.updateStatus(matchId, newStatus);  // FIXED: was updateMatchStatus
      await fetchMatches();
    } catch (error: any) {
      setLocalMatchStatuses(prev => {
        const copy = { ...prev };
        delete copy[matchId];
        return copy;
      });
      alert(`Status update failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleTossClick = (match: Match) => {
    if (match.status !== 'upcoming') {
      alert('Toss only for upcoming matches');
      return;
    }
    setPendingMatchForToss(match);
    setSelectedTossWinner('');
    setSelectedTossDecision('');
    setShowTossModal(true);
  };

  const handleTossSave = async () => {
    if (!pendingMatchForToss || !selectedTossWinner || !selectedTossDecision) {
      return alert('Complete all fields');
    }
    
    try {
      await matchAPI.updateMatch(pendingMatchForToss._id, {
        tossWinner: selectedTossWinner,
        tossDecision: selectedTossDecision
      });
      setShowTossModal(false);
      await fetchMatches();
    } catch (error: any) {
      alert(`Toss failed: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!tournament) return <div className="p-12 text-center text-gray-400">Tournament not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      {/* Tournament Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {tournament.name}
          </h1>
              <div className="flex items-center gap-4 text-xl text-gray-300 mb-6">
                <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                  tournament.status === 'live' ? 'bg-green-500 text-white' :
                  tournament.status === 'upcoming' ? 'bg-blue-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {tournament.status?.toUpperCase()}
                </span>
                <span>{tournament.format}</span>
                <span>{tournament.venue}</span>
                <span>{tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}</span>
              </div>
              <OverlayManager tournamentId={id!} matches={matches} />
          <p className="text-gray-400 text-lg">{tournament.description}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center">
          <div className="text-3xl font-bold text-blue-400">{matches.length}</div>
          <div className="text-gray-400">Matches</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center">
          <div className="text-3xl font-bold text-emerald-400">{teams.length}</div>
          <div className="text-gray-400">Teams</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center">
          <div className="text-3xl font-bold text-orange-400">
            {matches.filter(m => m.status === 'live').length}
          </div>
          <div className="text-gray-400">Live</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {tournament.bracket?.length || 0}
          </div>
          <div className="text-gray-400">Rounds</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-wrap gap-4 justify-center">
        <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all">
          + New Match
        </button>
        {tournament.status === 'upcoming' && (
          <button className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-orange-500/25 transition-all">
            Generate Bracket
          </button>
        )}
      </div>

      {/* Matches List */}
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-6">
          {matches.map(match => (
            <div key={match._id} className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                    match.status === 'live' ? 'bg-green-500 text-white' :
                    match.status === 'upcoming' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {match.status?.toUpperCase()}
                  </span>
                  <h3 className="text-2xl font-bold">{match.team1?.name} vs {match.team2?.name}</h3>
                </div>
                <div className="text-xl font-mono bg-gray-800 px-4 py-2 rounded-xl">
                  {match.team1Score}/{match.team1Wickets} ({match.team1Overs}) RRR {match.team1RRR?.toFixed(2)}
                </div>
              </div>
              <div className="flex gap-4">
                <select 
                  value={localMatchStatuses[match._id] || match.status || ''}
                  onChange={(e) => handleStatusChange(match, e.target.value)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-600 focus:border-blue-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                  View Scorecard
                </button>
                {match.status === 'upcoming' && (
                  <button 
                    onClick={() => handleTossClick(match)}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2"
                  >
                    Toss 🪙
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toss Modal */}
      {showTossModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-white text-center">Toss Decision</h2>
            <div className="space-y-4">
              <select 
                value={selectedTossWinner} 
                onChange={(e) => setSelectedTossWinner(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
              >
                <option value="">Select Toss Winner</option>
                <option value={pendingMatchForToss?.team1?._id}>{pendingMatchForToss?.team1?.name}</option>
                <option value={pendingMatchForToss?.team2?._id}>{pendingMatchForToss?.team2?.name}</option>
              </select>
              <select 
                value={selectedTossDecision} 
                onChange={(e) => setSelectedTossDecision(e.target.value as 'bat' | 'bowl')}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
              >
                <option value="">Toss Decision</option>
                <option value="bat">Bat First</option>
                <option value="bowl">Bowl First</option>
              </select>
              <div className="flex gap-3">
                <button 
                  onClick={handleTossSave}
                  disabled={!selectedTossWinner || !selectedTossDecision}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  Save Toss
                </button>
                <button 
                  onClick={() => setShowTossModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

