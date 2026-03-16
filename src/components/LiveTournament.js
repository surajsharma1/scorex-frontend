import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { matchAPI, tournamentAPI } from '../services/api';
import { Loader, ArrowLeft, Video, Clock, MapPin, Share2 } from 'lucide-react';
import io from 'socket.io-client';
const LiveTournament = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [match, setMatch] = useState(null);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const socketRef = useRef(null);
    const [lastEvent, setLastEvent] = useState(null);
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
            if (id)
                socket.emit('joinMatch', id);
        });
        // Handle Score Updates
        socket.on('scoreUpdate', (data) => {
            if (data.matchId === id) {
                setMatch(data.match);
                setLastEvent(null); // Clear previous event toast
            }
        });
        // Handle Specific Events (Wickets, Boundaries)
        socket.on('matchEvent', (data) => {
            setLastEvent(data.message);
            // Auto-clear event message after 3 seconds
            setTimeout(() => setLastEvent(null), 3000);
        });
        return () => {
            if (socket)
                socket.disconnect();
        };
    }, [id]);
    const fetchMatchData = async () => {
        if (!id)
            return;
        try {
            const response = await matchAPI.getMatch(id);
            // Check if the response indicates the match wasn't found
            if (response.status === 404 || (response.data && response.data.message === 'Match not found')) {
                setError('Match not found. The match may have been deleted or the link is incorrect.');
                setLoading(false);
                return;
            }
            // Handle response structure - backend returns { success: true, data: match }
            const matchData = response.data.data || response.data;
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
        }
        catch (err) {
            console.error('Error fetching match:', err);
            // Handle different error types
            if (err.response) {
                if (err.response.status === 404) {
                    setError('Match not found. The match may have been deleted or the link is incorrect.');
                }
                else if (err.response.status === 401) {
                    setError('You are not authorized to view this match.');
                }
                else if (err.response.status >= 500) {
                    setError('Server error. Please try again later.');
                }
                else {
                    setError('Failed to load match details');
                }
            }
            else if (err.request) {
                setError('Network error. Please check your connection.');
            }
            else {
                setError('Failed to load match details');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const getVideoEmbedUrl = (url) => {
        if (!url)
            return null;
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
    if (loading)
        return _jsx("div", { className: "flex h-screen items-center justify-center", children: _jsx(Loader, { className: "h-8 w-8 animate-spin text-blue-600" }) });
    if (!match)
        return _jsx("div", { className: "text-center p-10", children: "Match not found" });
    const embedUrl = getVideoEmbedUrl(match.videoLink || match.liveStreamUrl || '');
    const isTeam1Batting = match.battingTeam === 'team1';
    const battingTeam = isTeam1Batting ? match.team1 : match.team2;
    const bowlingTeam = isTeam1Batting ? match.team2 : match.team1;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 pb-20", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex items-center justify-between h-16", children: [_jsxs("button", { onClick: () => navigate(-1), className: "flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600", children: [_jsx(ArrowLeft, { className: "h-5 w-5 mr-2" }), " Back"] }), _jsx("h1", { className: "text-lg font-bold text-gray-900 dark:text-white truncate", children: tournament?.name || 'Live Match' }), _jsxs("div", { className: "flex items-center gap-2", children: [match.status === 'live' && (_jsxs("span", { className: "flex h-3 w-3 relative", children: [_jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" }), _jsx("span", { className: "relative inline-flex rounded-full h-3 w-3 bg-red-500" })] })), _jsx("span", { className: "text-sm font-medium text-red-500", children: match.status === 'live' ? 'LIVE' : match.status })] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6", children: [embedUrl ? (_jsx("div", { className: "aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl relative group", children: _jsx("iframe", { src: embedUrl, className: "w-full h-full", allowFullScreen: true, allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" }) })) : (_jsxs("div", { className: "aspect-video w-full bg-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500", children: [_jsx(Video, { className: "h-16 w-16 mb-4 opacity-50" }), _jsx("p", { children: "No live stream available for this match" })] })), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative", children: [lastEvent && (_jsx("div", { className: "absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-red-600 to-orange-600 text-white text-center py-2 font-bold animate-pulse", children: lastEvent })), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { className: "text-center w-1/3", children: [_jsx("div", { className: "h-16 w-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2", children: _jsx("span", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400", children: (match.team1?.name || 'T1').charAt(0) }) }), _jsx("h2", { className: "font-bold text-lg dark:text-white truncate", children: match.team1?.name }), _jsxs("p", { className: "text-3xl font-black text-gray-900 dark:text-white mt-1", children: [match.score1, "/", match.wickets1] }), _jsxs("p", { className: "text-sm text-gray-500", children: [match.overs1, " overs"] })] }), _jsxs("div", { className: "text-center w-1/3 flex flex-col items-center", children: [_jsx("div", { className: "text-sm font-semibold text-gray-400 mb-1", children: "VS" }), _jsx("div", { className: "bg-gray-100 dark:bg-gray-700 px-4 py-1 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300", children: match.matchType || 'T20' }), (match.target || 0) > 0 && (_jsxs("div", { className: "mt-4 text-sm font-medium text-orange-500", children: ["Target: ", match.target] })), _jsxs("div", { className: "mt-2 text-xs text-gray-500", children: ["CRR: ", match.currentRunRate || '0.00'] })] }), _jsxs("div", { className: "text-center w-1/3", children: [_jsx("div", { className: "h-16 w-16 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-2", children: _jsx("span", { className: "text-2xl font-bold text-yellow-600 dark:text-yellow-400", children: (match.team2?.name || 'T2').charAt(0) }) }), _jsx("h2", { className: "font-bold text-lg dark:text-white truncate", children: match.team2?.name }), _jsxs("p", { className: "text-3xl font-black text-gray-900 dark:text-white mt-1", children: [match.score2, "/", match.wickets2] }), _jsxs("p", { className: "text-sm text-gray-500", children: [match.overs2, " overs"] })] })] }), match.liveScores && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-gray-700", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3", children: "Batting" }), _jsx("div", { className: "space-y-2", children: battingTeam?.batsmen?.map((b, i) => (_jsxs("div", { className: `flex justify-between items-center p-2 rounded ${b.isStriker ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`, children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: b.name }), b.isStriker && _jsx("span", { className: "ml-2 text-blue-500 text-xs font-bold", children: "*" })] }), _jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "font-bold text-gray-900 dark:text-white", children: b.runs }), _jsxs("span", { className: "text-gray-500 text-xs ml-1", children: ["(", b.balls, ")"] })] })] }, i))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3", children: "Bowling" }), battingTeam?.bowler && (_jsxs("div", { className: "flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded", children: [_jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: battingTeam.bowler.name }), _jsxs("div", { className: "text-sm font-mono text-gray-600 dark:text-gray-300", children: [battingTeam.bowler.overs, "-", battingTeam.bowler.maidens, "-", battingTeam.bowler.runs, "-", battingTeam.bowler.wickets] })] }))] })] }))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3", children: [_jsx(Clock, { className: "text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Date & Time" }), _jsx("p", { className: "font-medium dark:text-white", children: new Date(match.date).toLocaleString() })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3", children: [_jsx(MapPin, { className: "text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Venue" }), _jsx("p", { className: "font-medium dark:text-white", children: match.venue || 'TBA' })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3", children: [_jsx(Share2, { className: "text-gray-400" }), _jsx("button", { className: "text-blue-600 hover:underline font-medium", children: "Share Match Link" })] })] })] })] }));
};
export default LiveTournament;
