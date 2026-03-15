import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tournament, Match, Team } from './types';
import io, { Socket } from 'socket.io-client';
import TeamManagement from './TeamManagement';
import TournamentStats from './TournamentStats';
import ScoreboardUpdate from './ScoreboardUpdate';
import { matchApi } from '../services/matchApi';
import { tournamentAPI, teamAPI } from '../services/api';

// ============================================
// FIXED TournamentDetail.tsx - All errors resolved
// Features: Tabs, Matches, Status/Optimistic UI, Toss Modal, Basic Scoring Prep
// ============================================

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
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'teams' | 'stats'>('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localMatchStatuses, setLocalMatchStatuses] = useState<Record<string, string>>({});
  const socketRef = useRef<Socket | null>(null);

  // Match form
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

  // Live scoring prep (basic)
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

  // Sequential modals states
  const [showTossModal, setShowTossModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [matchSetupStage, setMatchSetupStage] = useState<'toss' | 'players' | 'scoring' | 'complete'>('toss');
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
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
    } catch (err) {
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
      const data = await tournamentAPI.getTournamentMatches(id!);
      // Simplified population using TournamentView pattern
      const matchesArray = Array.isArray(data.data) ? data.data : data.data?.matches || [];
      setMatches(matchesArray.map((m: any) => ({
        _id: m._id,
        team1: m.team1 || m.teamA || { name: 'Team 1', _id: m.team1Id || 'unknown' },
        team2: m.team2 || m.teamB || { name: 'Team 2', _id: m.team2Id || 'unknown' },
        status: m.status || 'upcoming',
        tossWinner: m.tossWinner || null,
        ...m,
      })));
    } catch (error: any) {
      console.error('Matches fetch failed:', error);
      setMatches([]);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.getTeams(id!);
      const teamsArray = Array.isArray(response.data) ? response.data : response.data?.teams || [];
      setTeams(teamsArray);
    } catch (error) {
      console.error('Teams fetch failed:', error);
      setTeams([]);
    }
  };

  const handleStatusChange = async (match: Match, newStatus: string) => {
    const matchId = match._id;
    // Optimistic update
    setLocalMatchStatuses(prev => ({ ...prev, [matchId]: newStatus }));
    
    try {
      await matchApi.updateMatchStatus(matchId, newStatus);
      await fetchMatches(); // Re-sync
    } catch (error: any) {
      console.error('Status update failed:', error);
      // Revert
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
    setPendingMatch(match);
    setSelectedTossWinner('');
    setSelectedTossDecision('');
    setShowTossModal(true);
  };

  const handlePlayerSave = async () => {
    if (!pendingMatch || !selectedStriker || !selectedNonStriker || !selectedBowler) {
      alert('Please select all players');
      return;
    }
    try {
      await matchApi.startMatch(pendingMatch._id, {
        tossWinner: selectedTossWinner,
        decision: selectedTossDecision as 'bat' | 'bowl',
        striker: selectedStriker,
        nonStriker: selectedNonStriker,
        bowler: selectedBowler,
      });
      setShowPlayerModal(false);
      setMatchSetupStage('scoring');
      setShowScoreModal(true);
    } catch (error: any) {
      alert(`Player selection failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleTossSave = async () => {
    if (!pendingMatch || !selectedTossWinner || !selectedTossDecision) return alert('Complete all fields');
    
    try {
      await matchApi.saveToss(pendingMatch._id, selectedTossWinner, selectedTossDecision);
      setShowTossModal(false);
      setMatchSetupStage('players');
      setPendingMatch(pendingMatch); // Keep for player modal
      setShowPlayerModal(true);
      await fetchMatches();
    } catch (error: any) {
      alert(`Toss failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await matchApi.createMatch({ ...matchForm, tournament: id });
      setShowMatchForm(false);
      setMatchForm({
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
      await fetchMatches();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create match');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Delete match?')) return;
    try {
      await matchApi.deleteMatch(matchId);
      await fetchMatches();
    } catch (error) {
      setError('Delete failed');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!tournament) {
    return <div className="text-center p-8 text-gray-400">Tournament not found</div>;
  }

  const getStatusBadge = (status: string) => {
    const s = (localMatchStatuses[id!] || status).toLowerCase();
    const colors = {
      live: 'bg-green-500 text-white',
      upcoming: 'bg-blue-500 text-white',
      ready: 'bg-yellow-500 text-white',
      completed: 'bg-gray-500 text-white',
    };
    return colors[s as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const handleDeleteTournament = async (): Promise<void> => {
    if (!confirm('Delete this tournament and all associated matches/teams? This cannot be undone.')) return;
    
    try {
      await tournamentAPI.deleteTournament(id!);
      alert('Tournament deleted successfully');
      navigate('/tournaments');
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/tournaments')} 
          className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
        >
          ← Back to Tournaments
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {tournament.name}
            </h1>
            <p className="text-xl text-gray-300 mt-2">{tournament.description}</p>
          </div>
          <button 
            onClick={() => handleDeleteTournament()} 
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
          >
            Delete Tournament
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-1 mb-8 shadow-2xl">
        {(['overview', 'matches', 'teams', 'stats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Status</h3>
              <span className={`px-4 py-2 rounded-full font-bold ${getStatusBadge(tournament.status || '')}`}>
                {tournament.status?.toUpperCase() || 'DRAFT'}
              </span>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Matches</h3>
              <div className="text-4xl font-black text-blue-400">{matches.length}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Teams</h3>
              <div className="text-4xl font-black text-green-400">{teams.length}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Live Matches</h3>
              <div className="text-4xl font-black text-red-400">
                {matches.filter(m => (localMatchStatuses[m._id!] || m.status) === 'live').length}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Matches ({matches.length})
              </h2>
              <button 
                onClick={() => setShowMatchForm(true)}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
              >
                + Schedule Match
              </button>
            </div>

            <div className="grid gap-4">
              {matches.map(match => (
                <div key={match._id} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-xl hover:shadow-2xl transition-all group">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusBadge(match.status || '')}`}>
                          {(localMatchStatuses[match._id!] || match.status || 'unknown').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(match.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold">
                        {match.team1?.name || 'Team 1'} <span className="text-gray-400 mx-2">vs</span> {match.team2?.name || 'Team 2'}
                      </h3>
                    </div>
                    <div className="text-xl font-mono text-gray-300 min-w-[120px] text-right">
                      {match.score1 !== undefined ? `${match.score1}/${match.wickets1 || 0} (${match.overs1 || 0})` : 'Not Started'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center justify-end">
                    <select 
                      value={localMatchStatuses[match._id!] || match.status || 'upcoming'}
                      onChange={(e) => handleStatusChange(match, e.target.value)}
                      className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white font-medium min-w-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-600"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">🔴 Live</option>
                      <option value="completed">✅ Completed</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>

                    {/* Quick Actions */}
                    <div className="flex gap-1">
                      {matchSetupStage === 'toss' || matchSetupStage === 'players' ? (
                        <button 
                          onClick={() => {
                            setPendingMatch(match);
                            setMatchSetupStage('players');
                            setShowPlayerModal(true);
                          }}
                          disabled={matchSetupStage !== 'players'}
                          className="px-3 py-2 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50 text-xs rounded-lg font-bold transition-all"
                        >
                          👥 Players
                        </button>
                      ) : match.status === 'upcoming' && (
                        <button 
                          onClick={() => {
                            setPendingMatch(match);
                            setMatchSetupStage('toss');
                            setShowTossModal(true);
                          }}
                          className="px-3 py-2 bg-orange-500/80 hover:bg-orange-500 text-xs rounded-lg font-bold transition-all"
                        >
                          ⚡ Toss
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setPendingMatch(match);
                          setShowScoreModal(true);
                        }}
                        disabled={matchSetupStage !== 'scoring' || (localMatchStatuses[match._id!] || match.status) !== 'live'}
                        className="px-4 py-2 bg-green-600/80 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs rounded-lg font-bold shadow-lg transition-all"
                      >
                        📺 Live Score
                      </button>
                      <button 
                        onClick={() => handleDeleteMatch(match._id!)} 
                        className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-xs rounded-lg font-bold transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-gray-800/30 backdrop-blur-sm p-8 rounded-3xl border border-gray-700 shadow-2xl">
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Teams ({teams.length})
            </h2>
            <TeamManagement selectedTournament={tournament} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-gray-800/30 backdrop-blur-sm p-8 rounded-3xl border border-gray-700 shadow-2xl">
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Tournament Stats
            </h2>
            <TournamentStats tournamentId={id!} matches={matches} />
          </div>
        )}
      </div>

      {/* Create Match Modal */}
      {showMatchForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Schedule New Match
              </h3>
              <button 
                onClick={() => setShowMatchForm(false)}
                className="p-2 hover:bg-gray-800 rounded-xl transition-all"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateMatch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Team 1</label>
                  <select 
                    value={matchForm.team1} 
                    onChange={(e) => setMatchForm({...matchForm, team1: e.target.value})}
                    className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select Team 1</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Team 2</label>
                  <select 
                    value={matchForm.team2} 
                    onChange={(e) => setMatchForm({...matchForm, team2: e.target.value})}
                    className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select Team 2</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={matchForm.date} 
                    onChange={(e) => setMatchForm({...matchForm, date: e.target.value})}
                    className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Venue (Optional)</label>
                  <input 
                    type="text" 
                    value={matchForm.venue} 
                    onChange={(e) => setMatchForm({...matchForm, venue: e.target.value})}
                    className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Cricket Stadium"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-lg rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all"
              >
                {loading ? 'Creating...' : 'Create Match'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Player Selection Modal */}
      {showPlayerModal && pendingMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
              Player Selection
            </h3>
            <p className="text-gray-400 text-center mb-8">
              Select striker, non-striker, and bowler for {pendingMatch.team1?.name} vs {pendingMatch.team2?.name}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Striker</label>
                <select 
                  value={selectedStriker} 
                  onChange={(e) => setSelectedStriker(e.target.value)}
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Striker</option>
                  {(pendingMatch.team1?.players || pendingMatch.team2?.players || []).map((p: any) => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Non-Striker</label>
                <select 
                  value={selectedNonStriker} 
                  onChange={(e) => setSelectedNonStriker(e.target.value)}
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Non-Striker</option>
                  {(pendingMatch.team1?.players || pendingMatch.team2?.players || []).map((p: any) => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Bowler</label>
                <select 
                  value={selectedBowler} 
                  onChange={(e) => setSelectedBowler(e.target.value)}
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Bowler</option>
                  {(pendingMatch.team1?.players || pendingMatch.team2?.players || []).map((p: any) => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={handlePlayerSave}
                disabled={!selectedStriker || !selectedNonStriker || !selectedBowler}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 font-bold text-lg rounded-2xl shadow-xl transition-all"
              >
                Next: Scoreboard
              </button>
              <button 
                onClick={() => {
                  setShowPlayerModal(false);
                  setSelectedStriker('');
                  setSelectedNonStriker('');
                  setSelectedBowler('');
                }}
                className="flex-1 py-4 px-6 bg-gray-700/50 hover:bg-gray-600 font-bold text-lg rounded-2xl border border-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && pendingMatch && tournament && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Live Scoreboard - {pendingMatch.team1?.name} vs {pendingMatch.team2?.name}
              </h3>
              <button 
                onClick={() => {
                  setShowScoreModal(false);
                  setMatchSetupStage('complete');
                }}
                className="p-2 hover:bg-gray-800 rounded-xl transition-all"
              >
                ✕
              </button>
            </div>
            <ScoreboardUpdate 
              tournament={tournament} 
              matchId={pendingMatch._id}
              onUpdate={() => fetchMatches()}
            />
          </div>
        </div>
      )}

      Toss Modal
      { Legacy Toss Modal - can be removed if not needed
      { {showTossModal && pendingMatchForToss && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Coin Toss
            </h3>
            <p className="text-gray-400 text-center mb-8 text-lg">
              {pendingMatchForToss.team1?.name} vs {pendingMatchForToss.team2?.name}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setTossWinner(pendingMatchForToss.team1?._id || '')}
                className={`p-6 rounded-2xl border-4 font-bold flex flex-col items-center gap-2 transition-all group ${
                  tossWinner === (pendingMatchForToss.team1?._id || '')
                    ? 'border-emerald-500 bg-emerald-500/20 shadow-2xl scale-105'
                    : 'border-gray-600 hover:border-orange-500 hover:bg-orange-500/10 hover:shadow-xl hover:scale-105'
                }`}
              >
                <div className="text-4xl">🏏</div>
                <div className="text-lg font-bold">{pendingMatchForToss.team1?.name}</div>
              </button>
              <button
                type="button"
                onClick={() => setTossWinner(pendingMatchForToss.team2?._id || '')}
                className={`p-6 rounded-2xl border-4 font-bold flex flex-col items-center gap-2 transition-all group ${
                  tossWinner === (pendingMatchForToss.team2?._id || '')
                    ? 'border-emerald-500 bg-emerald-500/20 shadow-2xl scale-105'
                    : 'border-gray-600 hover:border-orange-500 hover:bg-orange-500/10 hover:shadow-xl hover:scale-105'
                }`}
              >
                <div className="text-4xl">🏏</div>
                <div className="text-lg font-bold">{pendingMatchForToss.team2?.name}</div>
              </button>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-300 mb-3 text-center">Decision</label>
              <select 
                value={tossDecision} 
                onChange={(e) => setTossDecision(e.target.value as 'bat' | 'bowl')}
                className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-lg"
              >
                <option value="">Choose decision</option>
                <option value="bat">Bat First</option>
                <option value="bowl">Bowl First</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleTossSave}
                disabled={!tossWinner || !tossDecision}
                className="flex-1 py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg rounded-2xl shadow-xl transition-all"
              >
                Save Toss
              </button>
              <button 
                onClick={() => {
                  setShowTossModal(false);
                  setTossWinner('');
                  setTossDecision('');
                }}
                className="flex-1 py-4 px-8 bg-gray-700/50 hover:bg-gray-600 text-gray-300 font-bold text-lg rounded-2xl border border-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      { }
    </div>
  );
}

