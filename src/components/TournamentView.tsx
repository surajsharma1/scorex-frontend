import { useState, useEffect } from 'react';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { Tournament, Match, Team } from './types';
import io, { Socket } from 'socket.io-client';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function TournamentView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [matchForm, setMatchForm] = useState({
    tournament: '',
    team1: '',
    team2: '',
    date: '',
    venue: '',
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
  const [scoreForm, setScoreForm] = useState({
    score1: 0,
    score2: 0,
    wickets1: 0,
    wickets2: 0,
    overs1: 0,
    overs2: 0,
    status: 'ongoing',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');

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
      setMatches((prevMatches) =>
        prevMatches.map((match) =>
          match._id === data.matchId ? data.match : match
        )
      );
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await tournamentAPI.getTournaments();
      setTournaments(response.data);
    } catch (error) {
      setError('Failed to fetch tournaments');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!selectedTournament) return;
    try {
      const response = await matchAPI.getMatches(selectedTournament._id);
      setMatches(response.data);
    } catch (error) {
      setError('Failed to fetch matches');
    }
  };

  const fetchTeams = async () => {
    if (!selectedTournament) return;
    try {
      const response = await teamAPI.getTeams(selectedTournament._id);
      setTeams(response.data);
    } catch (error) {
      setError('Failed to fetch teams');
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
    try {
      await matchAPI.createMatch({
        ...matchForm,
        tournament: selectedTournament._id,
      });
      setShowMatchForm(false);
      setMatchForm({ tournament: '', team1: '', team2: '', date: '', venue: '' });
      fetchMatches();
    } catch (error) {
      setError('Failed to create match');
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

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || tournament.status === statusFilter;
    const matchesFormat = !formatFilter || tournament.format === formatFilter;
    return matchesSearch && matchesStatus && matchesFormat;
  });

  return (
    <div className="space-y-8 p-6 bg-gray-900 dark:bg-gray-900 text-white dark:text-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-100 dark:text-gray-100">All Tournaments</h1>
          <p className="text-gray-300 dark:text-gray-300 mt-2">
            View all current and live tournaments created by the community
          </p>
        </div>
        <button
          onClick={() => setShowTournamentForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Create Tournament
        </button>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showTournamentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold text-white dark:text-white mb-4">Create New Tournament</h3>
            <form onSubmit={handleCreateTournament}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Description</label>
                <textarea
                  value={tournamentForm.description}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Format</label>
                <select
                  value={tournamentForm.format}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, format: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white"
                >
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                  <option value="Test">Test</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Number of Teams</label>
                <input
                  type="number"
                  value={tournamentForm.numberOfTeams}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, numberOfTeams: Number(e.target.value) })}
                  className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white"
                  min="2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Start Date</label>
                <input
                  type="date"
                  value={tournamentForm.startDate}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, startDate: e.target.value })}
                  className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowTournamentForm(false)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
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
          className="flex-1 p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white"
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
          <div className="bg-gray-800 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-100 dark:text-gray-100 mb-4">All Tournaments</h2>
            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} height={60} className="rounded-lg" />
                  ))}
                </div>
              ) : (
                filteredTournaments.map((tournament) => (
                  <button
                    key={tournament._id}
                    onClick={() => setSelectedTournament(tournament)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedTournament && selectedTournament._id === tournament._id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300 dark:text-gray-300'
                    }`}
                  >
                    <p className="font-semibold">{tournament.name}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-400">{tournament.status} - {tournament.format}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {selectedTournament && (
          <div className="lg:col-span-2">
            <div className="bg-gray-800 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100 dark:text-gray-100">{selectedTournament.name}</h2>
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
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-700 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-100 dark:text-gray-100">Format</h3>
                      <p className="text-gray-300 dark:text-gray-300">{selectedTournament.format}</p>
                    </div>
                    <div className="p-4 bg-gray-700 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-100 dark:text-gray-100">Status</h3>
                      <p className="text-gray-300 dark:text-gray-300">{selectedTournament.status}</p>
                    </div>
                    <div className="p-4 bg-gray-700 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-100 dark:text-gray-100">Start Date</h3>
                      <p className="text-gray-300 dark:text-gray-300">{new Date(selectedTournament.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="p-4 bg-gray-700 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-100 dark:text-gray-100">Teams</h3>
                      <p className="text-gray-300 dark:text-gray-300">{selectedTournament.numberOfTeams}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-700 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-semibold text-gray-100 dark:text-gray-100">Description</h3>
                    <p className="text-gray-300 dark:text-gray-300">{selectedTournament.description || 'No description available'}</p>
                  </div>
                </div>
              )}

              {activeTab === 'matches' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-100 dark:text-gray-100">Matches</h3>
                    <button
                      onClick={() => setShowMatchForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Schedule Match
                    </button>
                  </div>

                  {showMatchForm && (
                    <form onSubmit={handleCreateMatch} className="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-700 dark:bg-gray-700">
                      <h4 className="text-lg font-semibold mb-4 text-white dark:text-white">Schedule New Match</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">Team 1</label>
                          <select
                            value={matchForm.team1}
                            onChange={(e) => setMatchForm({ ...matchForm, team1: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 dark:bg-gray-600 text-white dark:text-white"
                            required
                          >
                            <option value="">Select Team 1</option>
                            {teams.map((team) => (
                              <option key={team._id} value={team._id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">Team 2</label>
                          <select
                            value={matchForm.team2}
                            onChange={(e) => setMatchForm({ ...matchForm, team2: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 dark:bg-gray-600 text-white dark:text-white"
                            required
                          >
                            <option value="">Select Team 2</option>
                            {teams.map((team) => (
                              <option key={team._id} value={team._id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">Date & Time</label>
                          <input
                            type="datetime-local"
                            value={matchForm.date}
                            onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 dark:bg-gray-600 text-white dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">Venue</label>
                          <input
                            type="text"
                            placeholder="Venue (optional)"
                            value={matchForm.venue}
                            onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 dark:bg-gray-600 text-white dark:text-white"
                          />
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
                          className="bg-gray-600 text-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-4">
                    {matches.length === 0 ? (
                      <p className="text-gray-400 dark:text-gray-400 text-center py-8">No matches scheduled yet.</p>
                    ) : (
                      matches.map((match) => (
                        <div key={match._id} className="p-4 border border-gray-600 rounded-lg hover:shadow-md transition-shadow bg-gray-700 dark:bg-gray-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-100 dark:text-gray-100">
                                {match.team1?.name} vs {match.team2?.name}
                              </h4>
                              <p className="text-sm text-gray-400 dark:text-gray-400">
                                {new Date(match.date).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-400 dark:text-gray-400">Venue: {match.venue || 'TBD'}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                match.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {match.status}
                              </span>
                              {match.score1 !== undefined && match.score2 !== undefined && (
                                <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">
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
                                className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
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
            </div>
          </div>
        )}
      </div>
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold text-white dark:text-white mb-4">Update Score: {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}</h3>
            <form onSubmit={handleUpdateScore}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Team 1 Score</label>
                  <input type="number" value={scoreForm.score1} onChange={(e) => setScoreForm({ ...scoreForm, score1: Number(e.target.value) })} className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Team 1 Wickets</label>
                  <input type="number" value={scoreForm.wickets1} onChange={(e) => setScoreForm({ ...scoreForm, wickets1: Number(e.target.value) })} className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Team 1 Overs</label>
                  <input type="number" step="0.1" value={scoreForm.overs1} onChange={(e) => setScoreForm({ ...scoreForm, overs1: Number(e.target.value) })} className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Team 2 Score</label>
                  <input type="number" value={scoreForm.score2} onChange={(e) => setScoreForm({ ...scoreForm, score2: Number(e.target.value) })} className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Team 2 Wickets</label>
                  <input type="number" value={scoreForm.wickets2} onChange={(e) => setScoreForm({ ...scoreForm, wickets2: Number(e.target.value) })} className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Team 2 Overs</label>
                  <input type="number" step="0.1" value={scoreForm.overs2} onChange={(e) => setScoreForm({ ...scoreForm, overs2: Number(e.target.value) })} className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">Status</label>
                <select value={scoreForm.status} onChange={(e) => setScoreForm({ ...scoreForm, status: e.target.value })} className="w-full p-2 border rounded bg-gray-700 dark:bg-gray-700 text-white dark:text-white">
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex space-x-4 mt-4">
                <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
                  {loading ? 'Updating...' : 'Update'}
                </button>
                <button type="button" onClick={() => setSelectedMatch(null)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}