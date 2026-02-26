import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI, tournamentAPI } from '../services/api';
import { Match, Tournament } from './types';
import ScoreboardUpdate from './ScoreboardUpdate';
import { ArrowLeft, Video, Save, Play, CheckCircle } from 'lucide-react';

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Video Link State
  const [videoLink, setVideoLink] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    if (!id) return;
    try {
      const response = await matchAPI.getMatches(id);
      
      // Check if the response indicates the match wasn't found
      if (response.status === 404 || (response.data && response.data.message === 'Match not found')) {
        setMatch(null);
        setLoading(false);
        return;
      }
      
      // Handle potential API response structures
      const data = response.data.match || response.data;
      
      // Validate that we actually got match data
      if (!data || !data._id) {
        console.error('Invalid match data received');
        setMatch(null);
        setLoading(false);
        return;
      }
      
      setMatch(data);
      setVideoLink(data.videoLink || data.liveStreamUrl || '');
      
      // Load tournament
      if (data.tournament) {
        const tId = typeof data.tournament === 'string' ? data.tournament : data.tournament._id;
        const tRes = await tournamentAPI.getTournament(tId);
        setTournament(tRes.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch match details', error);
      
      // Handle different error types
      if (error.response) {
        if (error.response.status === 404) {
          setMatch(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveVideoLink = async () => {
      if(!match) return;
      setIsSavingLink(true);
      try {
          await matchAPI.updateMatch(match._id, { videoLink });
          alert("Stream link updated successfully!");
      } catch (e) {
          alert("Failed to save link");
      } finally {
          setIsSavingLink(false);
      }
  };

  const updateStatus = async (status: 'scheduled' | 'ongoing' | 'completed') => {
      if(!match) return;
      if(!confirm(`Change status to ${status}?`)) return;
      try {
          await matchAPI.updateMatch(match._id, { status });
          setMatch(prev => prev ? { ...prev, status } : null);
      } catch (e) {
          alert("Failed to update status");
      }
  };

  const refreshData = () => {
      fetchMatch();
  };

  if (loading) return <div className="p-10 text-center">Loading match details...</div>;
  if (!match) return <div className="p-10 text-center">Match not found.</div>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                  <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                  <h1 className="text-2xl font-bold">
                      {match.team1?.name} <span className="text-gray-400 text-lg">vs</span> {match.team2?.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                      {tournament?.name} • {new Date(match.date).toLocaleDateString()}
                  </p>
              </div>
          </div>
          
          <div className="flex gap-2">
              {match.status === 'scheduled' && (
                  <button 
                    onClick={() => updateStatus('ongoing')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                      <Play className="w-4 h-4" /> Start Match
                  </button>
              )}
              {match.status === 'ongoing' && (
                  <button 
                    onClick={() => updateStatus('completed')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                      <CheckCircle className="w-4 h-4" /> End Match
                  </button>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Scoring Area */}
          <div className="lg:col-span-2 space-y-6">
              {match.status === 'scheduled' ? (
                  <div className="bg-white dark:bg-gray-800 p-10 rounded-xl text-center shadow-sm border border-gray-200 dark:border-gray-700">
                      <Play className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-bold mb-2">Match Not Started</h3>
                      <p className="text-gray-500 mb-6">Start the match to enable the scoring console.</p>
                      <button 
                        onClick={() => updateStatus('ongoing')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                      >
                          Start Match Now
                      </button>
                  </div>
              ) : (
                  <ScoreboardUpdate 
                    tournament={{...tournament!, liveScores: match.liveScores}} 
                    onUpdate={refreshData}
                  />
              )}
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
              {/* Stream Config */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Video className="w-5 h-5 text-purple-500" /> Live Stream
                  </h3>
                  <div className="space-y-3">
                      <label className="text-xs text-gray-500 uppercase font-semibold">YouTube / Twitch URL</label>
                      <input 
                        type="text"
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        placeholder="e.g. https://youtube.com/watch?v=..."
                        className="w-full p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm"
                      />
                      <button 
                        onClick={saveVideoLink}
                        disabled={isSavingLink}
                        className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex justify-center items-center gap-2"
                      >
                          {isSavingLink ? 'Saving...' : <><Save className="w-4 h-4" /> Save Link</>}
                      </button>
                  </div>
              </div>

              {/* Match Info Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold mb-4">Match Details</h3>
                  <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <span className="capitalize font-medium">{match.status}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-500">Venue</span>
                          <span>{match.venue || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-500">Format</span>
                          <span>{match.matchType || 'T20'}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}