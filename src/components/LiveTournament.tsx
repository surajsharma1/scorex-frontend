import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Match, Tournament } from './types';
import { matchAPI, liveMatchAPI, tournamentAPI } from '../services/api';
import { 
  Radio, Loader, Play, ExternalLink, ArrowLeft, 
  Link as LinkIcon, Save, Video, Eye, Clock, MapPin, Trophy 
} from 'lucide-react';
import io, { Socket } from 'socket.io-client';

// Helper to get current user ID from token
const getCurrentUserId = (): string => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.userId || decoded.id || decoded._id || '';
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
  return '';
};

const LiveTournament: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveStreamUrl, setLiveStreamUrl] = useState<string>('');
  const [showStreamInput, setShowStreamInput] = useState(false);
  const [savingStream, setSavingStream] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    if (id) {
      loadMatchDetails();
    }
    
    // Setup socket for real-time updates
    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('scoreUpdate', (data: { matchId: string; match: Match }) => {
      if (data.matchId === id) {
        setMatch(data.match);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [id]);

  const loadMatchDetails = async () => {
    setLoading(true);
    try {
      // Try to get live match details first
      const response = await matchAPI.getAllMatches();
      const matchesData = response.data?.matches || response.data || [];
      const matchesArray = Array.isArray(matchesData) ? matchesData : [];
      const foundMatch = matchesArray.find((m: Match) => m._id === id);
      
      if (foundMatch) {
        setMatch(foundMatch);
        // Check if current user is the creator
        setIsCreator(foundMatch.createdBy === currentUserId);
        
        // Load tournament details if available
        if (foundMatch.tournament) {
          try {
            const tournamentId = typeof foundMatch.tournament === 'string' 
              ? foundMatch.tournament 
              : foundMatch.tournament._id;
            const tournamentRes = await tournamentAPI.getTournament(tournamentId);
            setTournament(tournamentRes.data);
            setLiveStreamUrl(tournamentRes.data?.liveStreamUrl || '');
          } catch (err) {
            console.error('Failed to load tournament details');
          }
        }
      } else {
        setError('Match not found');
      }
    } catch (err) {
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStreamUrl = async () => {
    if (!match || !liveStreamUrl.trim()) return;
    
    setSavingStream(true);
    try {
      await liveMatchAPI.updateStreamUrl(match._id, liveStreamUrl.trim());
      setShowStreamInput(false);
    } catch (err) {
      setError('Failed to save stream URL');
    } finally {
      setSavingStream(false);
    }
  };

  const handleWatchStream = () => {
    if (liveStreamUrl) {
      window.open(liveStreamUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getEmbedUrl = (url: string): string | null => {
    // YouTube embed
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
    }
    
    // Twitch embed
    const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    if (twitchMatch) {
      return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader className="animate-spin h-8 w-8 text-light-primary dark:text-dark-accent" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400 mb-4">{error || 'Match not found'}</p>
        <button
          onClick={() => navigate('/live-matches')}
          className="px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-lg"
        >
          Back to Live Matches
        </button>
      </div>
    );
  }

  const embedUrl = liveStreamUrl ? getEmbedUrl(liveStreamUrl) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/live-matches')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-primary/20 transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-dark-light" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-light flex items-center">
            <Radio className="h-6 w-6 mr-2 text-red-500 animate-pulse" />
            {match.team1?.name} vs {match.team2?.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-accent/70">
            {tournament?.name || 'Tournament Match'} • {match.matchType || 'League'}
          </p>
        </div>
        {match.status === 'ongoing' && (
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
            LIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Stream Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-dark-bg-alt rounded-xl shadow-sm border border-gray-200 dark:border-dark-primary/30 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-primary/30 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-light flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Live Stream
              </h2>
              {isCreator && (
                <button
                  onClick={() => setShowStreamInput(!showStreamInput)}
                  className="text-sm text-light-primary dark:text-dark-accent hover:underline flex items-center"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  {liveStreamUrl ? 'Update' : 'Add'} Stream Link
                </button>
              )}
            </div>

            {/* Stream Input (for creators) */}
            {showStreamInput && isCreator && (
              <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-primary/30">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-accent mb-2">
                  Stream URL (YouTube or Twitch)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={liveStreamUrl}
                    onChange={(e) => setLiveStreamUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://twitch.tv/..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-primary/30 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"
                  />
                  <button
                    onClick={handleSaveStreamUrl}
                    disabled={savingStream || !liveStreamUrl.trim()}
                    className="px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-lg flex items-center disabled:opacity-50"
                  >
                    {savingStream ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Stream Player */}
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : liveStreamUrl ? (
                <div className="text-center">
                  <p className="text-white mb-4">Stream URL provided but cannot be embedded</p>
                  <button
                    onClick={handleWatchStream}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg flex items-center mx-auto hover:bg-red-600 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Watch on External Site
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No live stream available</p>
                  <p className="text-sm mt-2">
                    {isCreator
                      ? 'Click "Add Stream Link" to add a YouTube or Twitch stream'
                      : 'The organizer has not added a live stream yet'}
                  </p>
                </div>
              )}
            </div>

            {/* External Watch Button */}
            {liveStreamUrl && (
              <div className="p-4 border-t border-gray-200 dark:border-dark-primary/30">
                <button
                  onClick={handleWatchStream}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg flex items-center justify-center gap-2 hover:from-red-600 hover:to-orange-600 transition-all"
                >
                  <ExternalLink className="h-5 w-5" />
                  Watch on {liveStreamUrl.includes('youtube') ? 'YouTube' : liveStreamUrl.includes('twitch') ? 'Twitch' : 'External Site'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Score & Match Info */}
        <div className="space-y-4">
          {/* Live Score Card */}
          <div className="bg-white dark:bg-dark-bg-alt rounded-xl shadow-sm border border-gray-200 dark:border-dark-primary/30 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Live Score
              </h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Team 1 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-light-primary dark:bg-dark-primary rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {(match.team1?.name || 'T1').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-dark-light">
                    {match.team1?.name || 'Team 1'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-light">
                    {match.score1 || 0}/{match.wickets1 || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-dark-accent/70">
                    ({match.overs1 || 0} overs)
                  </p>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-dark-primary/30"></div>
                <span className="text-gray-400 dark:text-dark-accent/50 font-medium">VS</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-dark-primary/30"></div>
              </div>

              {/* Team 2 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-light-secondary dark:bg-dark-secondary rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {(match.team2?.name || 'T2').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-dark-light">
                    {match.team2?.name || 'Team 2'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-light">
                    {match.score2 || 0}/{match.wickets2 || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-dark-accent/70">
                    ({match.overs2 || 0} overs)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="bg-white dark:bg-dark-bg-alt rounded-xl shadow-sm border border-gray-200 dark:border-dark-primary/30 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-light mb-4">
              Match Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-dark-accent">
                <Clock className="h-4 w-4" />
                <span>{new Date(match.date).toLocaleString()}</span>
              </div>
              {match.venue && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-dark-accent">
                  <MapPin className="h-4 w-4" />
                  <span>{match.venue}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600 dark:text-dark-accent">
                <Trophy className="h-4 w-4" />
                <span>{match.matchType || 'League Match'}</span>
              </div>
              {match.status === 'ongoing' && (
                <div className="flex items-center gap-2 text-red-500">
                  <Eye className="h-4 w-4" />
                  <span>Live Now</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTournament;
