import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { Tournament, Match, Team } from './types';
import io, { Socket } from 'socket.io-client';
import TeamManagement from './TeamManagement';
import OverlayEditor from './OverlayEditor';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [matchForm, setMatchForm] = useState({
    tournament: '',
    team1: '',
    team2: '',
    date: '',
    venue: '',
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const updateScore = (newScoreForm: ScoreForm) => {
    setScoreHistory([...scoreHistory, scoreForm]);
    setScoreForm(newScoreForm);
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

  const fetchTournament = async () => {
    if (!id) return;
    try {
      const response = await tournamentAPI.getTournament(id);
      setTournament(response.data);
    } catch (error) {
      setError('Failed to fetch tournament');
    }
  };

  const fetchMatches = async () => {
    if (!id) return;
    try {
      const response = await matchAPI.getMatches(id);
      const matchesArray = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.matches) ? response.data.matches : []);
      setMatches(matchesArray);
    } catch (error) {
      setError('Failed to fetch matches');
      setMatches([]);
    }
  };

  const fetchTeams = async () => {
    if (!id) return;
    try {
      const response = await teamAPI.getTeams(id);
      const teamsArray = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.teams) ? response.data.teams : []);
      setTeams(teamsArray);
    } catch (error) {
      setError('Failed to fetch teams');
      setTeams([]);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    console.log('Creating match with data:', { ...matchForm, tournament: id });
    try {
      await matchAPI.createMatch({
        ...matchForm,
        tournament: id,
      });
      setShowMatchForm(false);
      setMatchForm({ tournament: '', team1: '', team2: '', date: '', venue: '' });
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

  if (!tournament) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading tournament...</p>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in bg-gray-900 text-white min-h-screen p-4 md:p-6">
      {/* Mobile Header */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => navigate('/tournaments')}
          className="btn-secondary mb-4"
        >
          ← Back to Tournaments
        </button>
        <h1 className="text-3xl font-bold text-gradient mb-2">{tournament.name}</h1>
        <p className="text-gray-300">{tournament.description}</p>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-center mb-8">
        <div>
          <button
            onClick={() => navigate('/tournaments')}
            className="btn-secondary mb-4"
          >
            ← Back to Tournaments
          </button>
          <h1 className="text-4xl font-bold text-gradient mb-2">{tournament.name}</h1>
          <p className="text-gray-300">{tournament.description}</p>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-primary-300">Format</h3>
              <p className="text-white">{tournament.format}</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-accent-300">Status</h3>
              <p className="text-white">{tournament.status}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Mobile Tabs */}
      <div className="lg:hidden mb-6">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          {['overview', 'matches', 'teams', 'overlays'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden lg:block mb-8">
        <div className="tabs">
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
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tournament Info */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Tournament Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Format</span>
                  <span className="text-white font-semibold">{tournament.format}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Status</span>
                  <span className="text-white font-semibold">{tournament.status}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Start Date</span>
                  <span className="text-white font-semibold">{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Teams</span>
                  <span className="text-white font-semibold">{tournament.numberOfTeams}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-primary-400">{matches.length}</div>
                  <div className="text-sm text-gray-300">Total Matches</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-accent-400">{teams.length}</div>
                  <div className="text-sm text-gray-300">Teams</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {matches.filter(m => m.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-300">Completed</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">
                    {matches.filter(m => m.status === 'ongoing').length}
                  </div>
                  <div className="text-sm text-gray-300">Live</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-white">Matches</h2>
              <button
                onClick={() => setShowMatchForm(true)}
                className="btn-primary w-full sm:w-auto"
              >
                Schedule Match
              </button>
            </div>

            {showMatchForm && (
              <form onSubmit={handleCreateMatch} className="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-700">
                <h4 className="text-lg font-semibold mb-4 text-white">Schedule New Match</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Team 1</label>
                    <select
                      value={matchForm.team1}
                      onChange={(e) => setMatchForm({ ...matchForm, team1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 text-white"
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">Team 2</label>
                    <select
                      value={matchForm.team2}
                      onChange={(e) => setMatchForm({ ...matchForm, team2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 text-white"
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={matchForm.date}
                      onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Venue</label>
                    <input
                      type="text"
                      placeholder="Venue (optional)"
                      value={matchForm.venue}
                      onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 sm:flex-none"
                  >
                    {loading ? 'Scheduling...' : 'Schedule Match'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMatchForm(false)}
                    className="btn-secondary flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {(Array.isArray(matches) ? matches : []).length === 0 ? (
                <p className="text-gray-400 text-center py-8">No matches scheduled yet.</p>
              ) : (
                (Array.isArray(matches) ? matches : []).map((match) => (
                  <div key={match._id} className="p-4 border border-gray-600 rounded-lg hover:shadow-md transition-shadow bg-gray-700">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-lg mb-2">
                          {match.team1?.name} vs {match.team2?.name}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                          <span>{new Date(match.date).toLocaleString()}</span>
                          <span>Venue: {match.venue || 'TBD'}</span>
                        </div>
                        {match.score1 !== undefined && match.score2 !== undefined && (
                          <p className="text-white font-medium mt-2">
                            {match.score1}/{match.wickets1 || 0} ({match.overs1 || 0} overs) - {match.score2}/{match.wickets2 || 0} ({match.overs2 || 0} overs)
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          match.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {match.status}
                        </span>
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
                          className="btn-secondary text-sm"
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
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <TeamManagement selectedTournament={tournament} />
          </div>
        )}

        {activeTab === 'overlays' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <OverlayEditor selectedTournament={tournament} />
          </div>
        )}
      </div>

      {/* Score Update Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Update Score: {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}</h3>
              <button onClick={undoLastAction} disabled={scoreHistory.length === 0} className="btn-secondary text-sm disabled:opacity-50">Undo</button>
            </div>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <p className="text-white text-lg">Team 1 Score: {scoreForm.score1}/{scoreForm.wickets1} ({scoreForm.overs1} overs)</p>
                <p className="text-white text-lg">Team 2 Score: {scoreForm.score2}/{scoreForm.wickets2} ({scoreForm.overs2} overs)</p>
              </div>

              {/* Team 1 Buttons */}
              <div>
                <h4 className="text-white font-semibold mb-2">Team 1 Actions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 0 })} className="btn-secondary text-sm py-2">0 Run</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1 })} className="btn-primary text-sm py-2">+1 Run</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 2 })} className="btn-primary text-sm py-2">+2 Runs</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 3 })} className="btn-primary text-sm py-2">+3 Runs</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 4 })} className="btn-accent text-sm py-2">+4</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 6 })} className="btn-accent text-sm py-2">+6</button>
                  <button onClick={() => updateScore({ ...scoreForm, wickets1: scoreForm.wickets1 + 1 })} className="bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700">Wicket</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1, overs1: scoreForm.overs1 + 0.1 })} className="bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700">No-ball</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700">Wide</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700">Bye</button>
                  <button onClick={() => updateScore({ ...scoreForm, score1: scoreForm.score1 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700">Leg-bye</button>
                  <button onClick={() => updateScore({ ...scoreForm, overs1: scoreForm.overs1 + 0.1 })} className="btn-accent text-sm py-2">+0.1 Over</button>
                  <button onClick={() => updateScore({ ...scoreForm, overs1: scoreForm.overs1 + 1 })} className="btn-accent text-sm py-2">+1 Over</button>
                </div>
              </div>

              {/* Team 2 Buttons */}
              <div>
                <h4 className="text-white font-semibold mb-2">Team 2 Actions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 0 })} className="btn-secondary text-sm py-2">0 Run</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1 })} className="btn-primary text-sm py-2">+1 Run</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 2 })} className="btn-primary text-sm py-2">+2 Runs</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 3 })} className="btn-primary text-sm py-2">+3 Runs</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 4 })} className="btn-accent text-sm py-2">+4</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 6 })} className="btn-accent text-sm py-2">+6</button>
                  <button onClick={() => updateScore({ ...scoreForm, wickets2: scoreForm.wickets2 + 1 })} className="bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700">Wicket</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1, overs2: scoreForm.overs2 + 0.1 })} className="bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700">No-ball</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700">Wide</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700">Bye</button>
                  <button onClick={() => updateScore({ ...scoreForm, score2: scoreForm.score2 + 1 })} className="bg-yellow-600 text-white py-2 rounded text-sm hover:bg-yellow-700">Leg-bye</button>
                  <button onClick={() => updateScore({ ...scoreForm, overs2: scoreForm.overs2 + 0.1 })} className="btn-accent text-sm py-2">+0.1 Over</button>
                  <button onClick={() => updateScore({ ...scoreForm, overs2: scoreForm.overs2 + 1 })} className="btn-accent text-sm py-2">+1 Over</button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Match Status</label>
                <select value={scoreForm.status} onChange={(e) => updateScore({ ...scoreForm, status: e.target.value })} className="w-full p-2 border rounded bg-gray-700 text-white">
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                <button
                  onClick={handleUpdateScore}
                  disabled={loading}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  {loading ? 'Updating...' : 'Update Score'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="btn-secondary flex-1 sm:flex-none"
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
