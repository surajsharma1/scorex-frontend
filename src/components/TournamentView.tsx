import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { Tournament, Match, Team } from './types';
import { Calendar, Users, Trophy, Plus, Edit, Trash2, ExternalLink, PlayCircle, CheckCircle } from 'lucide-react';
import TeamManagement from './TeamManagement';
import BracketView from './BracketView';

export default function TournamentView() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Forms
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchForm, setMatchForm] = useState({
    team1: '',
    team2: '',
    date: '',
    venue: '',
    matchType: 'League'
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentDetails(selectedTournament._id);
    }
  }, [selectedTournament, activeTab]);

  const loadTournaments = async () => {
    try {
      const res = await tournamentAPI.getTournaments();
      const list = res.data.tournaments || res.data || [];
      setTournaments(list);
      if (list.length > 0 && !selectedTournament) {
        setSelectedTournament(list[0]);
      }
    } catch (e) {
      console.error("Failed to load tournaments");
    }
  };

  const loadTournamentDetails = async (id: string) => {
    setLoading(true);
    try {
      // Load Matches
      if (activeTab === 'matches' || activeTab === 'overview') {
        const resMatches = await matchAPI.getAllMatches(); // Ideally filter by tournament ID API side
        // Client side filter if API doesn't support it yet
        const tMatches = (resMatches.data.matches || []).filter((m: Match) => 
            typeof m.tournament === 'string' ? m.tournament === id : m.tournament?._id === id
        );
        setMatches(tMatches);
      }

      // Load Teams
      if (activeTab === 'teams' || activeTab === 'overview' || showMatchForm) {
        const resTeams = await teamAPI.getTeams(id); // Assuming API supports tournament filter
        setTeams(resTeams.data.teams || []);
      }
    } catch (e) {
      console.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    try {
      await matchAPI.createMatch({
        ...matchForm,
        tournament: selectedTournament._id
      });
      setShowMatchForm(false);
      loadTournamentDetails(selectedTournament._id); // Refresh
      alert("Match scheduled successfully!");
    } catch (err) {
      alert("Failed to create match");
    }
  };

  const deleteMatch = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
      await matchAPI.deleteMatch(id);
      setMatches(prev => prev.filter(m => m._id !== id));
    } catch(e) {
       console.error(e);
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ongoing': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
          case 'completed': return 'text-green-500 bg-green-100 dark:bg-green-900/20';
          default: return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
      {/* Header & Selection */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold flex items-center gap-2">
             <Trophy className="text-yellow-500" /> Tournament Manager
           </h1>
           <p className="text-gray-500 dark:text-gray-400">Manage schedules, teams, and brackets</p>
        </div>
        
        <select 
            className="p-3 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 min-w-[250px]"
            onChange={(e) => {
                const t = tournaments.find(x => x._id === e.target.value);
                if(t) setSelectedTournament(t);
            }}
            value={selectedTournament?._id || ''}
        >
            <option value="">Select Tournament</option>
            {tournaments.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
            ))}
        </select>
      </div>

      {selectedTournament ? (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
             {['overview', 'matches', 'teams', 'bracket'].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 font-medium capitalize whitespace-nowrap ${
                        activeTab === tab 
                        ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                 >
                    {tab}
                 </button>
             ))}
          </div>

          {/* Content Areas */}
          <div className="min-h-[400px]">
              {loading && <div className="text-center py-10">Loading data...</div>}

              {/* OVERVIEW TAB */}
              {!loading && activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-bold mb-2">Total Matches</h3>
                          <p className="text-4xl font-black text-blue-600">{matches.length}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-bold mb-2">Registered Teams</h3>
                          <p className="text-4xl font-black text-green-600">{teams.length}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-bold mb-2">Status</h3>
                          <p className="text-xl font-medium uppercase tracking-wider">{selectedTournament.status}</p>
                      </div>
                  </div>
              )}

              {/* MATCHES TAB */}
              {!loading && activeTab === 'matches' && (
                  <div>
                      <div className="flex justify-between mb-4">
                          <h3 className="text-xl font-bold">Match Schedule</h3>
                          <button 
                            onClick={() => setShowMatchForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                             <Plus className="w-4 h-4" /> Add Match
                          </button>
                      </div>
                      
                      <div className="space-y-3">
                          {matches.length === 0 && <p className="text-gray-500">No matches scheduled.</p>}
                          {matches.map(match => (
                              <div key={match._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-1">
                                          <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${getStatusColor(match.status)}`}>
                                              {match.status}
                                          </span>
                                          <span className="text-sm text-gray-500">{new Date(match.date).toLocaleDateString()}</span>
                                      </div>
                                      <h4 className="text-lg font-bold">
                                          {match.team1?.name || 'TBA'} <span className="text-gray-400 px-2">vs</span> {match.team2?.name || 'TBA'}
                                      </h4>
                                      <p className="text-sm text-gray-500">{match.venue || 'No Venue'}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => navigate(`/match/${match._id}`)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg tooltip"
                                        title="Scoring Console"
                                      >
                                          <Edit className="w-5 h-5" />
                                      </button>
                                      <button 
                                        onClick={() => navigate(`/live-tournament/${match._id}`)}
                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg tooltip"
                                        title="View Live Page"
                                      >
                                          <ExternalLink className="w-5 h-5" />
                                      </button>
                                      <button 
                                        onClick={() => deleteMatch(match._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg tooltip"
                                        title="Delete Match"
                                      >
                                          <Trash2 className="w-5 h-5" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* TEAMS TAB */}
              {!loading && activeTab === 'teams' && (
                  <TeamManagement selectedTournament={selectedTournament} />
              )}

              {/* BRACKET TAB */}
              {!loading && activeTab === 'bracket' && (
                  <BracketView />
              )}
          </div>

          {/* CREATE MATCH MODAL */}
          {showMatchForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                      <h3 className="text-xl font-bold mb-4">Schedule Match</h3>
                      <form onSubmit={handleCreateMatch} className="space-y-4">
                          <div>
                              <label className="block text-sm mb-1">Team 1</label>
                              <select 
                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                                value={matchForm.team1}
                                onChange={e => setMatchForm({...matchForm, team1: e.target.value})}
                                required
                              >
                                  <option value="">Select Team</option>
                                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm mb-1">Team 2</label>
                              <select 
                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                                value={matchForm.team2}
                                onChange={e => setMatchForm({...matchForm, team2: e.target.value})}
                                required
                              >
                                  <option value="">Select Team</option>
                                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm mb-1">Date & Time</label>
                              <input 
                                type="datetime-local" 
                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                                value={matchForm.date}
                                onChange={e => setMatchForm({...matchForm, date: e.target.value})}
                                required
                              />
                          </div>
                          <div>
                              <label className="block text-sm mb-1">Venue</label>
                              <input 
                                type="text" 
                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                                value={matchForm.venue}
                                onChange={e => setMatchForm({...matchForm, venue: e.target.value})}
                                placeholder="Stadium Name"
                              />
                          </div>
                          <div className="flex gap-3 mt-6">
                              <button 
                                type="button"
                                onClick={() => setShowMatchForm(false)}
                                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200"
                              >
                                  Cancel
                              </button>
                              <button 
                                type="submit"
                                className="flex-1 py-2 bg-blue-600 text-white rounded font-bold"
                              >
                                  Create Match
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">Please select a tournament to manage</p>
        </div>
      )}
    </div>
  );
}