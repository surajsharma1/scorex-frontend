import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Match, Tournament } from './types';
import { matchAPI, tournamentAPI } from '../services/api';
import { 
  Radio, Loader, ArrowLeft, Video, Eye, Clock, MapPin, Trophy, 
  Activity, Share2, Youtube 
} from 'lucide-react';
import io, { Socket } from 'socket.io-client';

const LiveTournament: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    fetchMatchData();

    // Robust Socket Connection
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const socketUrl = apiBase.replace(/\/api\/v1\/?$/, '');
    
    socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
        console.log('Connected to live match socket');
        if (id) socket.emit('joinMatch', id);
    });

    // Handle Score Updates
    socket.on('scoreUpdate', (data: { matchId: string; match: Match }) => {
        if (data.matchId === id) {
            setMatch(data.match);
            setLastEvent(null); // Clear previous event toast
        }
    });

    // Handle Specific Events (Wickets, Boundaries)
    socket.on('matchEvent', (data: { type: string; message: string }) => {
        setLastEvent(data.message);
        // Auto-clear event message after 3 seconds
        setTimeout(() => setLastEvent(null), 3000);
    });

    return () => {
        if (socket) socket.disconnect();
    };
  }, [id]);

  const fetchMatchData = async () => {
    if (!id) return;
    try {
      const response = await matchAPI.getMatches(id);
      
      // Check if the response indicates the match wasn't found
      if (response.status === 404 || (response.data && response.data.message === 'Match not found')) {
        setError('Match not found. The match may have been deleted or the link is incorrect.');
        setLoading(false);
        return;
      }
      
      // Handle response structure variations
      const matchData = response.data.match || response.data;
      
      // Validate that we actually got match data
      if (!matchData || !matchData._id) {
        setError('Match data is invalid or unavailable.');
        setLoading(false);
        return;
      }
      
      setMatch(matchData);
      
      if (matchData.tournament) {
          const tId = typeof matchData.tournament === 'string' ? matchData.tournament : matchData.tournament._id;
          const tRes = await tournamentAPI.getTournament(tId);
          setTournament(tRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching match:', err);
      
      // Handle different error types
      if (err.response) {
        if (err.response.status === 404) {
          setError('Match not found. The match may have been deleted or the link is incorrect.');
        } else if (err.response.status === 401) {
          setError('You are not authorized to view this match.');
        } else if (err.response.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Failed to load match details');
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load match details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('twitch.tv')) {
      const channel = url.split('/').pop();
      return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
    }
    return url; // Return as is for direct links or iframes
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (!match) return <div className="text-center p-10">Match not found</div>;

  const embedUrl = getVideoEmbedUrl(match.videoLink || match.liveStreamUrl || '');
  const isTeam1Batting = match.battingTeam === 'team1';
  const battingTeam = isTeam1Batting ? match.team1 : match.team2;
  const bowlingTeam = isTeam1Batting ? match.team2 : match.team1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600">
                    <ArrowLeft className="h-5 w-5 mr-2" /> Back
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {tournament?.name || 'Live Match'}
                </h1>
                <div className="flex items-center gap-2">
                    {match.status === 'ongoing' && (
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <span className="text-sm font-medium text-red-500">{match.status === 'ongoing' ? 'LIVE' : match.status}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Video Player Section */}
        {embedUrl ? (
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                <iframe 
                    src={embedUrl} 
                    className="w-full h-full" 
                    allowFullScreen 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
            </div>
        ) : (
            <div className="aspect-video w-full bg-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500">
                <Video className="h-16 w-16 mb-4 opacity-50" />
                <p>No live stream available for this match</p>
            </div>
        )}

        {/* Live Scorecard */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
            {/* Event Toast (WICKET/SIX/FOUR) */}
            {lastEvent && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-red-600 to-orange-600 text-white text-center py-2 font-bold animate-pulse">
                    {lastEvent}
                </div>
            )}

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-center w-1/3">
                        <div className="h-16 w-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(match.team1?.name || 'T1').charAt(0)}</span>
                        </div>
                        <h2 className="font-bold text-lg dark:text-white truncate">{match.team1?.name}</h2>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{match.score1}/{match.wickets1}</p>
                        <p className="text-sm text-gray-500">{match.overs1} overs</p>
                    </div>

                    <div className="text-center w-1/3 flex flex-col items-center">
                        <div className="text-sm font-semibold text-gray-400 mb-1">VS</div>
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-1 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                            {match.matchType || 'T20'}
                        </div>
                        {(match.target || 0) > 0 && (
                            <div className="mt-4 text-sm font-medium text-orange-500">
                                Target: {match.target}
                            </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">CRR: {match.currentRunRate || '0.00'}</div>
                    </div>

                    <div className="text-center w-1/3">
                        <div className="h-16 w-16 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{(match.team2?.name || 'T2').charAt(0)}</span>
                        </div>
                        <h2 className="font-bold text-lg dark:text-white truncate">{match.team2?.name}</h2>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{match.score2}/{match.wickets2}</p>
                        <p className="text-sm text-gray-500">{match.overs2} overs</p>
                    </div>
                </div>

                {/* Batters & Bowlers Table */}
                {match.liveScores && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                        {/* Batting */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Batting</h3>
                            <div className="space-y-2">
                                {battingTeam?.batsmen?.map((b: any, i: number) => (
                                    <div key={i} className={`flex justify-between items-center p-2 rounded ${b.isStriker ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`}>
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">{b.name}</span>
                                            {b.isStriker && <span className="ml-2 text-blue-500 text-xs font-bold">*</span>}
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-bold text-gray-900 dark:text-white">{b.runs}</span>
                                            <span className="text-gray-500 text-xs ml-1">({b.balls})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bowling */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Bowling</h3>
                            {battingTeam?.bowler && (
                                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                    <span className="font-medium text-gray-900 dark:text-white">{battingTeam.bowler.name}</span>
                                    <div className="text-sm font-mono text-gray-600 dark:text-gray-300">
                                        {battingTeam.bowler.overs}-{battingTeam.bowler.maidens}-{battingTeam.bowler.runs}-{battingTeam.bowler.wickets}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Match Info Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3">
                <Clock className="text-gray-400" />
                <div>
                    <p className="text-xs text-gray-500">Date & Time</p>
                    <p className="font-medium dark:text-white">{new Date(match.date).toLocaleString()}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3">
                <MapPin className="text-gray-400" />
                <div>
                    <p className="text-xs text-gray-500">Venue</p>
                    <p className="font-medium dark:text-white">{match.venue || 'TBA'}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3">
                <Share2 className="text-gray-400" />
                <button className="text-blue-600 hover:underline font-medium">Share Match Link</button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LiveTournament;