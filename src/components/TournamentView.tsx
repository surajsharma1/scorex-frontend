import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { Tournament, Match, Team } from './types';
import { io, Socket } from 'socket.io-client';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import TeamManagement from './TeamManagement';
import OverlayEditor from './OverlayEditor';

export default function TournamentView() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreForm[]>([]);
  
  const [matchForm, setMatchForm] = useState({
    tournament: '',   
    team1: '',
    team2: '',
    date: '',
    venue: '',
    tossWinner: '',
    matchType: 'League',
  });

  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    description: '',
    format: 'T20',
    numberOfTeams: 8,
    startDate: '',
    status: 'upcoming',
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
   interface ScoreForm {
    score1: number;
    score2: number;
    wickets1: number;
    wickets2: number;
    overs1: number;
    overs2: number;
    status: string;
  }
  const [scoreForm, setScoreForm] = useState<ScoreForm>({
    score1: 0,
    score2: 0,
    wickets1: 0,
    wickets2: 0,
    overs1: 0,
    overs2: 0,
    status: 'ongoing',
  });
  const [selectedTeamForUpdate, setSelectedTeamForUpdate] = useState<'team1' | 'team2'>('team1');
  const updateScore = (newScoreForm: ScoreForm) => {

    setScoreHistory([...scoreHistory,scoreForm]);
    setScoreForm(newScoreForm);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (activeTab === 'matches' && selectedTournament) {
      fetchMatches();
      fetchTeams();
    }
  }, [activeTab, selectedTournament]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('scoreUpdate', (data: { matchId: string; match: Match }) => {
      setMatches((prevMatches) => {
        if (!Array.isArray(prevMatches)) return [];
        return prevMatches.map((match) =>
          match._id === data.matchId ? data.match : match
        );
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

const undoLastAction = () => {
  if (scoreHistory.length > 0) {
    const lastState = scoreHistory[scoreHistory.length - 1];
    setScoreForm(lastState);
    setScoreHistory(scoreHistory.slice(0, -1));
  }
};

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await tournamentAPI.getTournaments();
      const data = response.data;
      const tournamentsArray = Array.isArray(data) ? data : (Array.isArray(data?.tournaments) ? data.tournaments : []);
      setTournaments(tournamentsArray);
    } catch (error) {
      setError('Failed to fetch tournaments');
      setTournaments([]); // Ensure tournaments is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!selectedTournament) return;
    try {
      const response = await matchAPI.getMatches(selectedTournament._id);
      const matchesArray = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.matches) ? response.data.matches : []);
      setMatches(matchesArray);
    } catch (error) {
      setError('Failed to fetch matches');
      setMatches([]); // Ensure matches is always an array
    }
  };

  const fetchTeams = async () => {
    if (!selectedTournament) return;
    try {
      const response = await teamAPI.getTeams(selectedTournament._id);
      const teamsArray = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.teams) ? response.data.teams : []);
      setTeams(teamsArray);
    } catch (error) {
      setError('Failed to fetch teams');
      setTeams([]); // Ensure teams is always an array
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!tournamentForm.name || !tournamentForm.startDate) {
      setError('Name and Start Date are required');
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        ...tournamentForm,
        startDate: new Date(tournamentForm.startDate).toISOString(),
      };
      console.log('Sending tournament data:', dataToSend);
      await tournamentAPI.createTournament(dataToSend);
      setShowTournamentForm(false);
      setTournamentForm({
        name: '',
        description: '',
        format: 'T20',
        numberOfTeams: 8,
        startDate: '',
        status: 'upcoming',
      });
      fetchTournaments();
    } catch (error: any) {
      console.error('Create tournament error:', error);
      setError(error.response?.data?.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

const handleCreateMatch = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedTournament) return;
  setLoading(true);
  console.log('Creating match with data:', { ...matchForm, tournament: selectedTournament._id });
  try {
    await matchAPI.createMatch({
      ...matchForm,
      tournament: selectedTournament._id,
    });
    setShowMatchForm(false);
    setMatchForm({ tournament: '', team1: '', team2: '', date: '', venue: '', tossWinner: '', matchType: 'League' });

    fetchMatches();
  } catch (error: any) {
    console.error('Create match error:', error.response?.data || error);
    setError(error.response?.data?.message || 'Failed to create match');
  } finally {
    setLoading(false);
  }
};

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setLoading(true);
    try {
      await matchAPI.updateMatchScore(selectedMatch._id, scoreForm);
      setSelectedMatch(null);
      fetchMatches();
    } catch (error) {
      setError('Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      try {
        await tournamentAPI.deleteTournament(id);
        fetchTournaments();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete tournament');
      }
    }
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || tournament.status === statusFilter;
    const matchesFormat = !formatFilter || tournament.format === formatFilter;
    return matchesSearch && matchesStatus && matchesFormat;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient">All Tournaments</h1>
          <p className="text-gray-600 dark:text-dark-accent mt-2">
            View all current and live tournaments created by the community
          </p>
        </div>
        <button
          onClick={() => setShowTournamentForm(true)}
          className="btn-primary"
        >
          Create Tournament
        </button>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">

          {error}
        </div>
      )}

      {showTournamentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-dark-bg-alt p-6 rounded-lg w-full max-w-md border border-gray-200 dark:border-dark-primary/30">
            <h3 className="text-lg font-bold text-gray-900 dark:text-dark-light mb-4">Create New Tournament</h3>

            <form onSubmit={handleCreateTournament}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Name</label>
                <input
                  type="text"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                  className="w-full p-2 border rounded border-gray-300 dark:border-dark-primary/30 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Description</label>
                <textarea
                  value={tournamentForm.description}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                  className="w-full p-2 border rounded border-gray-300 dark:border-dark-primary/30 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Format</label>
                <select
                  value={tournamentForm.format}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, format: e.target.value })}
                  className="w-full p-2 border rounded border-gray-300 dark:border-dark-primary/30 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                >
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                  <option value="Test">Test</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Number of Teams</label>
                <input
                  type="number"
                  value={tournamentForm.numberOfTeams}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, numberOfTeams: Number(e.target.value) })}
                  className="w-full p-2 border rounded border-gray-300 dark:border-dark-primary/30 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                  min="2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Start Date</label>
                <input
                  type="date"
                  value={tournamentForm.startDate}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, startDate: e.target.value })}
                  className="w-full p-2 border rounded border-gray-300 dark:border-dark-primary/30 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                  required
                />
              </div>
              <div className="flex space-x-4">
                <button type="submit" disabled={loading} className="bg-light-primary dark:bg-dark-accent text-white px-4 py-2 rounded hover:bg-light-dark dark:hover:bg-dark-primary">
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowTournamentForm(false)} className="bg-gray-300 dark:bg-dark-bg text-gray-700 dark:text-dark-light px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-dark-bg-alt">Cancel</button>

              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search tournaments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-2 border rounded border-gray-300 dark:border-dark-primary/30 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white"
        >
          <option value="">All Formats</option>
          <option value="T20">T20</option>
          <option value="ODI">ODI</option>
          <option value="Test">Test</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-bg-alt rounded-xl shadow-sm border border-gray-200 dark:border-dark-primary/30 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-light mb-4">All Tournaments</h2>

            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} height={60} className="rounded-lg" />
                  ))}
                </div>
              ) : (
                Array.isArray(filteredTournaments) ? filteredTournaments.map((tournament) => (
                  <div key={tournament._id} className="flex justify-between items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg">
                    <button
                      onClick={() => navigate(`/tournaments/${tournament._id}`)}
                      className={`flex-1 text-left ${
                        selectedTournament && selectedTournament._id === tournament._id
                          ? 'bg-light-primary dark:bg-dark-accent text-white'
                          : 'text-gray-700 dark:text-dark-light'
                      }`}
                    >
                      <p className="font-semibold">{tournament.name}</p>
                      <p className="text-sm text-gray-500 dark:text-dark-accent/70">{tournament.status} - {tournament.format}</p>

                    </button>
                    <button
                      onClick={() => handleDeleteTournament(tournament._id)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 ml-4"
                    >

                      Delete
                    </button>
                  </div>
                )) : null
              )}
            </div>
          </div>
        </div>

        {selectedTournament && (
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-bg-alt rounded-xl shadow-sm border border-gray-200 dark:border-dark-primary/30 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-light">{selectedTournament.name}</h2>

              </div>

              <div className="tabs mb-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`tab ${activeTab === 'matches' ? 'tab-active' : ''}`}
                >
                  Matches
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`tab ${activeTab === 'teams' ? 'tab-active' : ''}`}
                >
                  Teams
                </button>
                <button
                  onClick={() => setActiveTab('overlays')}
                  className={`tab ${activeTab === 'overlays' ? 'tab-active' : ''}`}
                >
                  Overlays
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-100 dark:bg-dark-bg rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-dark-light">Format</h3>
                      <p className="text-gray-700 dark:text-dark-accent">{selectedTournament.format}</p>

                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-dark-bg rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-dark-light">Status</h3>
                      <p className="text-gray-700 dark:text-dark-accent">{selectedTournament.status}</p>

                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-dark-bg rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-dark-light">Start Date</h3>
                      <p className="text-gray-700 dark:text-dark-accent">{new Date(selectedTournament.startDate).toLocaleDateString()}</p>

                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-dark-bg rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-dark-light">Teams</h3>
                      <p className="text-gray-700 dark:text-dark-accent">{selectedTournament.numberOfTeams}</p>

                    </div>
                  </div>
                  <div className="p-4 bg-gray-100 dark:bg-dark-bg rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-dark-light">Description</h3>
                    <p className="text-gray-700 dark:text-dark-accent">{selectedTournament.description || 'No description available'}</p>

                  </div>
                </div>
              )}

              {activeTab === 'matches' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-dark-light">Matches</h3>

                    <button
                      onClick={() => setShowMatchForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Schedule Match
                    </button>
                  </div>

                  {showMatchForm && (
                    <form onSubmit={handleCreateMatch} className="mb-6 p-4 border border-gray-200 dark:border-dark-primary/30 rounded-lg bg-gray-50 dark:bg-dark-bg">
                      <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-light">Schedule New Match</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Team 1</label>
                            <select
                              value={matchForm.team1}
                              onChange={(e) => setMatchForm({ ...matchForm, team1: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                              required
                            >
                              <option value="">Select Team 1</option>
                              {Array.isArray(teams) && teams.map((team) => (
                                <option key={team._id} value={team._id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Team 2</label>
                            <select
                              value={matchForm.team2}
                              onChange={(e) => setMatchForm({ ...matchForm, team2: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                              required
                            >
                              <option value="">Select Team 2</option>
                              {Array.isArray(teams) && teams.map((team) => (
                                <option key={team._id} value={team._id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Date & Time</label>
                            <input
                              type="datetime-local"
                              value={matchForm.date}
                              onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Venue</label>
                            <input
                              type="text"
                              placeholder="Venue (optional)"
                              value={matchForm.venue}
                              onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"

                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Toss Winner</label>
                            <select
                              value={matchForm.tossWinner}
                              onChange={(e) => setMatchForm({ ...matchForm, tossWinner: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"
                            >
                              <option value="">Select Toss Winner</option>
                              {matchForm.team1 && (
                                <option value={matchForm.team1}>
                                  {teams.find(t => t._id === matchForm.team1)?.name || 'Team 1'}
                                </option>
                              )}
                              {matchForm.team2 && (
                                <option value={matchForm.team2}>
                                  {teams.find(t => t._id === matchForm.team2)?.name || 'Team 2'}
                                </option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Match Type</label>
                            <select
                              value={matchForm.matchType}
                              onChange={(e) => setMatchForm({ ...matchForm, matchType: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"
                              required
                            >
                              <option value="League">League</option>
                              <option value="Quarter-Final">Quarter-Final</option>
                              <option value="Semi-Final">Semi-Final</option>
                              <option value="Final">Final</option>
                              <option value="Playoff">Playoff</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex space-x-4 mt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Scheduling...' : 'Schedule Match'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowMatchForm(false)}
                            className="bg-gray-300 dark:bg-dark-bg text-gray-700 dark:text-dark-light px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-dark-bg-alt transition-colors"
                          >

                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-4">
                      {(Array.isArray(matches) ? matches : []).length === 0 ? (
                      <p className="text-gray-500 dark:text-dark-accent/70 text-center py-8">No matches scheduled yet.</p>

                      ) : (
                        (Array.isArray(matches) ? matches : []).map((match) => (
                          <div key={match._id} className="p-4 border border-gray-200 dark:border-dark-primary/30 rounded-lg hover:shadow-md transition-shadow bg-gray-50 dark:bg-dark-bg">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-dark-light">

                                  {match.team1?.name} vs {match.team2?.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-dark-accent/70">
                                  {new Date(match.date).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-dark-accent/70">Venue: {match.venue || 'TBD'}</p>

                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  match.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                  match.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                }`}>

                                  {match.status}
                                </span>
                                {match.matchType && (
                                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                    match.matchType === 'Final' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                    match.matchType === 'Semi-Final' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                    match.matchType === 'Quarter-Final' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {match.matchType}
                                  </span>
                                )}

                                {match.score1 !== undefined && match.score2 !== undefined && (
                                  <p className="text-sm text-gray-500 dark:text-dark-accent/70 mt-1">

                                    {match.score1}/{match.wickets1 || 0} ({match.overs1 || 0} overs) - {match.score2}/{match.wickets2 || 0} ({match.overs2 || 0} overs)
                                  </p>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedMatch(match);
                                    setScoreForm({
                                      score1: match.score1 || 0,
                                      score2: match.score2 || 0,
                                      wickets1: match.wickets1 || 0,
                                      wickets2: match.wickets2 || 0,
                                      overs1: match.overs1 || 0,
                                      overs2: match.overs2 || 0,
                                      status: match.status,
                                    });
                                  }}
                                  className="mt-2 bg-light-primary dark:bg-dark-accent text-white px-3 py-1 rounded text-sm hover:bg-light-dark dark:hover:bg-dark-primary"

                                >
                                  Update Score
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'teams' && (
                  <div>
                    <TeamManagement selectedTournament={selectedTournament} />
                  </div>
                )}

                {activeTab === 'overlays' && (
                  <div>
                    <OverlayEditor selectedTournament={selectedTournament} />
                  </div>
                )}
              </div>
            </div>
          )}

     {selectedMatch && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white dark:bg-dark-bg-alt p-6 rounded-lg w-full max-w-lg max-h-screen overflow-y-auto border border-gray-200 dark:border-dark-primary/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-dark-light">Update Score: {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}</h3>

        <button onClick={undoLastAction} disabled={scoreHistory.length === 0} className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Undo</button>
      </div>
        <div className="space-y-4">
        <div className="text-center">
          <p className="text-gray-900 dark:text-dark-light">Team 1 Score: {scoreForm.score1}/{scoreForm.wickets1} ({scoreForm.overs1} overs)</p>
          <p className="text-gray-900 dark:text-dark-light">Team 2 Score: {scoreForm.score2}/{scoreForm.wickets2} ({scoreForm.overs2} overs)</p>
        </div>

        {/* Team Selection Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-2">Select Team to Update</label>
          <select
            value={selectedTeamForUpdate}
            onChange={(e) => setSelectedTeamForUpdate(e.target.value as 'team1' | 'team2')}
            className="w-full p-2 border rounded border-gray-300 dark:border-dark-primary/30 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"
          >
            <option value="team1">{selectedMatch?.team1?.name || 'Team 1'}</option>
            <option value="team2">{selectedMatch?.team2?.name || 'Team 2'}</option>
          </select>
        </div>

        {/* Dynamic Team Actions */}
        <div>
          <h4 className="text-gray-900 dark:text-dark-light font-semibold mb-2">
            {selectedTeamForUpdate === 'team1' ? (selectedMatch?.team1?.name || 'Team 1') : (selectedMatch?.team2?.name || 'Team 2')} Actions
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {selectedTeamForUpdate === 'team1' ? (
              <>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 0 })} className="bg-gray-200 dark:bg-dark-bg text-gray-900 dark:text-dark-light py-2 rounded text-sm">0 Run</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1 })} className="bg-green-600 text-white py-2 rounded text-sm">+1 Run</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 2 })} className="bg-green-600 text-white py-2 rounded text-sm">+2 Runs</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 3 })} className="bg-green-600 text-white py-2 rounded text-sm">+3 Runs</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 4 })} className="bg-blue-600 text-white py-2 rounded text-sm">+4</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 6 })} className="bg-purple-600 text-white py-2 rounded text-sm">+6</button>
                <button onClick={() => updateScore({ ...scoreForm, wickets1: scoreForm.wickets1 + 1 })} className="bg-red-600 text-white py-2 rounded text-sm">Wicket</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1, overs1: scoreForm.overs1 + 0.1 })} className="bg-yellow-600 text-white py-2 rounded text-sm">No-ball</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm">Wide</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm">Bye</button>
                <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm">Leg-bye</button>
                <button onClick={() => updateScore({ ...scoreForm, overs1: scoreForm.overs1 + 0.1 })} className="bg-blue-600 text-white py-2 rounded text-sm">+0.1 Over</button>
                <button onClick={() => updateScore({ ...scoreForm, overs1: scoreForm.overs1 + 1 })} className="bg-blue-600 text-white py-2 rounded text-sm">+1 Over</button>
              </>
            ) : (
              <>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 0 })} className="bg-gray-200 dark:bg-dark-bg text-gray-900 dark:text-dark-light py-2 rounded text-sm">0 Run</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1 })} className="bg-green-600 text-white py-2 rounded text-sm">+1 Run</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 2 })} className="bg-green-600 text-white py-2 rounded text-sm">+2 Runs</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 3 })} className="bg-green-600 text-white py-2 rounded text-sm">+3 Runs</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 4 })} className="bg-blue-600 text-white py-2 rounded text-sm">+4</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 6 })} className="bg-purple-600 text-white py-2 rounded text-sm">+6</button>
                <button onClick={() => updateScore({ ...scoreForm, wickets2: scoreForm.wickets2 + 1 })} className="bg-red-600 text-white py-2 rounded text-sm">Wicket</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1, overs2: scoreForm.overs2 + 0.1 })} className="bg-yellow-600 text-white py-2 rounded text-sm">No-ball</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm">Wide</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm">Bye</button>
                <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm">Leg-bye</button>
                <button onClick={() => updateScore({ ...scoreForm, overs2: scoreForm.overs2 + 0.1 })} className="bg-blue-600 text-white py-2 rounded text-sm">+0.1 Over</button>
                <button onClick={() => updateScore({ ...scoreForm, overs2: scoreForm.overs2 + 1 })} className="bg-blue-600 text-white py-2 rounded text-sm">+1 Over</button>
              </>
            )}
          </div>
        </div>


        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-1">Match Status</label>
          <select value={scoreForm.status} onChange={(e) => updateScore({ ...scoreForm, status: e.target.value })} className="w-full p-2 border rounded border-gray-300 dark:border-dark-primary/30 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light">

            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleUpdateScore}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Updating...' : 'Update Score'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedMatch(null)}
            className="bg-gray-300 dark:bg-dark-bg text-gray-700 dark:text-dark-light px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-dark-bg-alt"
          >

            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      </div>

    </div>
  );
}
