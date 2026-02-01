import { useState, useEffect } from 'react';
import { Plus, Trophy, Users } from 'lucide-react';
import { bracketAPI, tournamentAPI, teamAPI } from '../services/api';
import { Bracket, Tournament, Team } from './types';

export default function BracketView() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedBracket, setSelectedBracket] = useState<Bracket | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tournament: '',
    type: 'single-elimination',
    numberOfTeams: 8,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bracketsRes, tournamentsRes] = await Promise.all([
        bracketAPI.getBrackets(),
        tournamentAPI.getTournaments(),
      ]);
      setBrackets(bracketsRes.data);
      setTournaments(tournamentsRes.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch data');
    }
  };

  const fetchTeamsForTournament = async (tournamentId: string) => {
    try {
      const teamsRes = await teamAPI.getTeams(tournamentId);
      setTeams(teamsRes.data);
    } catch (error: any) {
      console.error('Error fetching teams:', error);
      setError('Failed to fetch teams for tournament');
    }
  };

  const handleCreateBracket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await bracketAPI.createBracket(formData);
      setShowCreateForm(false);
      setFormData({ tournament: '', type: 'single-elimination', numberOfTeams: 8 });
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create bracket');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBracket = async (bracketId: string) => {
    if (teams.length === 0) {
      setError('No teams found for this tournament. Please add teams first.');
      return;
    }

    if (teams.length < formData.numberOfTeams) {
      setError(`Not enough teams. Need ${formData.numberOfTeams} teams, but only ${teams.length} available.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const teamsForBracket = teams.slice(0, formData.numberOfTeams);
      await bracketAPI.generateBracket(bracketId, { teams: teamsForBracket });
      fetchData();
      setSelectedBracket(brackets.find((bracket) => bracket._id === bracketId) || null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate bracket');
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentChange = (tournamentId: string) => {
    setFormData({ ...formData, tournament: tournamentId });
    fetchTeamsForTournament(tournamentId);
  };

  const renderBracket = (bracket: Bracket) => {
    if (!bracket.rounds || bracket.rounds.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No bracket generated yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Available teams: {teams.length} (Need at least {formData.numberOfTeams})
          </p>
          <button
            onClick={() => handleGenerateBracket(bracket._id)}
            disabled={loading || teams.length < formData.numberOfTeams}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Bracket'}
          </button>
        </div>
      );
    }

    const roundNames = ['Round 1', 'Quarter Finals', 'Semi Finals', 'Final'];

    return (
      <div className="flex justify-between items-center min-w-max space-x-8 overflow-x-auto">
        {bracket.rounds.map((round: any, roundIndex: number) => (
          <div key={roundIndex} className="space-y-16">
            <h3 className="text-center font-bold text-gray-600 mb-4">
              {roundNames[roundIndex] || `Round ${roundIndex + 1}`}
            </h3>
            {round.matches.map((match: any, matchIndex: number) => (
              <div key={matchIndex} className="space-y-2">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 px-6 py-3 rounded-r-lg min-w-[200px] hover:shadow-md transition-shadow">
                  <p className="font-semibold text-gray-900">{match.team1?.name || 'TBD'}</p>
                  <p className="text-xs text-gray-600">Score: {match.score1 || 0}/0</p>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-400 px-6 py-3 rounded-r-lg min-w-[200px] hover:shadow-md transition-shadow">
                  <p className="font-semibold text-gray-900">{match.team2?.name || 'TBD'}</p>
                  <p className="text-xs text-gray-600">Score: {match.score2 || 0}/0</p>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="flex flex-col justify-center items-center">
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-8 rounded-xl shadow-lg">
            <Trophy className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
            <p className="text-white font-bold text-center text-lg">Champion</p>
            <p className="text-green-200 text-center text-sm mt-2">TBD</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Tournament Bracket</h1>
          <p className="text-gray-600 mt-2">
            Create and visualize tournament brackets
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>Create Bracket</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Bracket Configuration
          </h2>
          <form onSubmit={handleCreateBracket}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tournament
                </label>
                <select
                  value={formData.tournament}
                  onChange={(e) => handleTournamentChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament._id} value={tournament._id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bracket Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="single-elimination">Single Elimination</option>
                  <option value="double-elimination">Double Elimination</option>
                  <option value="round-robin">Round Robin</option>
                  <option value="group-knockout">Group Stage + Knockout</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Teams
                </label>
                <select
                  value={formData.numberOfTeams}
                  onChange={(e) => setFormData({ ...formData, numberOfTeams: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option>4</option>
                  <option>8</option>
                  <option>16</option>
                  <option>32</option>
                </select>
              </div>
            </div>
            {teams.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Available teams: {teams.length} teams found for this tournament
                </p>
              </div>
            )}
            <div className="mt-6 flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Bracket'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Available Brackets</h2>
          <div className="space-y-2">
            {brackets.map((bracket) => (
              <button
                key={bracket._id}
                onClick={() => setSelectedBracket(bracket)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedBracket && selectedBracket._id === bracket._id
                    ? 'bg-green-100 text-green-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="font-semibold">{bracket.tournament?.name || 'Tournament'}</p>
                <p className="text-sm text-gray-600">{bracket.type}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedBracket && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedBracket.tournament?.name} Bracket
              </h2>
              <button
                onClick={() => setSelectedBracket(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
            {renderBracket(selectedBracket)}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h3 className="font-bold text-gray-900 mb-3">Bracket Features</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Add unlimited teams to create custom bracket sizes</li>
          <li>✓ Support for multiple tournament formats</li>
          <li>✓ Real-time score updates during matches</li>
          <li>✓ Automatic advancement of winners</li>
          <li>✓ Export bracket for overlay generation</li>
        </ul>
      </div>
    </div>
  );
}