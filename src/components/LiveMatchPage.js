import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { ArrowLeft, Play, ExternalLink, RefreshCw, Tv } from 'lucide-react';
export default function LiveMatchPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showEmbed, setShowEmbed] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    useEffect(() => {
        if (id) {
            fetchMatch();
            // Auto-refresh every 5 seconds
            const interval = setInterval(fetchMatch, 5000);
            return () => clearInterval(interval);
        }
    }, [id]);
    const fetchMatch = async () => {
        if (!id)
            return;
        try {
            const response = await matchAPI.getMatch(id);
            // Handle different response formats - backend returns { success: true, data: match }
            let data;
            if (response.data && response.data.data) {
                // { success: true, data: { ... } }
                data = response.data.data;
            }
            else if (response.data && response.data._id) {
                // { success: true, data: ... } where data is the match directly
                data = response.data;
            }
            else {
                data = response.data;
            }
            // Transform backend data to frontend format
            if (data && data._id) {
                const transformedMatch = {
                    ...data,
                    // Map backend field names to frontend expectations
                    team1: data.teamA,
                    team2: data.teamB,
                    tournament: data.tournamentId,
                    date: data.matchDate,
                    matchType: data.format,
                    status: data.status?.toLowerCase() || 'scheduled',
                    // Live scores from innings data
                    score1: data.firstInnings?.totalRuns,
                    wickets1: data.firstInnings?.totalWickets,
                    overs1: data.firstInnings?.totalOversBowled,
                    score2: data.secondInnings?.totalRuns,
                    wickets2: data.secondInnings?.totalWickets,
                    overs2: data.secondInnings?.totalOversBowled,
                };
                setMatch(transformedMatch);
                setLastUpdate(new Date());
            }
            else {
                setMatch(null);
            }
        }
        catch (error) {
            console.error('Failed to fetch match:', error);
            setMatch(null);
        }
        finally {
            setLoading(false);
        }
    };
    // Helper to convert YouTube/Twitch URLs to embed URLs
    const getEmbedUrl = (url) => {
        if (!url)
            return '';
        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('youtu.be')
                ? url.split('/').pop()
                : new URL(url).searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : url;
        }
        // Twitch
        if (url.includes('twitch.tv')) {
            const channel = url.split('/').pop()?.replace('?channel=', '');
            return channel ? `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true` : url;
        }
        // Direct embed
        return url;
    };
    // Check if URL is embeddable
    const isEmbeddable = (url) => {
        if (!url)
            return false;
        return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('twitch.tv');
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-900 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" }), _jsx("p", { className: "text-white", children: "Loading match..." })] }) }));
    }
    if (!match) {
        return (_jsx("div", { className: "min-h-screen bg-gray-900 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-white text-xl mb-4", children: "Match not found" }), _jsx(Link, { to: "/matches", className: "text-red-400 hover:underline", children: "Back to Matches" })] }) }));
    }
    const hasVideo = match.videoLink || (match.videoLinks && match.videoLinks.length > 0);
    const videoUrl = match.videoLink || (match.videoLinks && match.videoLinks[0]) || '';
    return (_jsxs("div", { className: "min-h-screen bg-gray-900 text-white", children: [_jsx("div", { className: "bg-gray-800 border-b border-gray-700 p-4", children: _jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate(-1), className: "p-2 rounded-full hover:bg-gray-700 transition", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("h1", { className: "text-xl font-bold", children: [match.team1?.name, " ", _jsx("span", { className: "text-gray-400", children: "vs" }), " ", match.team2?.name] }), _jsxs("p", { className: "text-sm text-gray-400", children: [typeof match.tournament === 'string' ? 'Tournament Match' : match.tournament?.name, _jsx("span", { className: "mx-2", children: "\u2022" }), _jsxs("span", { className: "text-red-500 flex items-center gap-1 inline-flex", children: [_jsx("span", { className: "w-2 h-2 bg-red-500 rounded-full animate-pulse" }), "LIVE"] })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: fetchMatch, className: "p-2 rounded-full hover:bg-gray-700 transition", title: "Refresh", children: _jsx(RefreshCw, { className: "w-5 h-5" }) }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Updated: ", lastUpdate.toLocaleTimeString()] })] })] }) }), _jsx("div", { className: "max-w-7xl mx-auto p-4", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [hasVideo ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between bg-gray-800 p-3 rounded-t-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Tv, { className: "w-5 h-5 text-purple-500" }), _jsx("span", { className: "font-medium", children: "Live Stream" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setShowEmbed(!showEmbed), className: `px-3 py-1 rounded text-sm ${showEmbed ? 'bg-purple-600' : 'bg-gray-700'}`, children: showEmbed ? 'Embed' : 'Embed' }), videoUrl && (_jsxs("a", { href: videoUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700", children: [_jsx(ExternalLink, { className: "w-4 h-4" }), " Open"] }))] })] }), _jsx("div", { className: "bg-black rounded-b-lg overflow-hidden aspect-video", children: showEmbed && isEmbeddable(videoUrl) ? (_jsx("iframe", { src: getEmbedUrl(videoUrl), className: "w-full h-full", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true, title: "Live Stream" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(Play, { className: "w-16 h-16 text-gray-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-400 mb-4", children: "Stream is not available for embedding" }), videoUrl && (_jsxs("a", { href: videoUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700", children: [_jsx(ExternalLink, { className: "w-4 h-4" }), " Watch Live"] }))] }) })) }), match.videoLinks && match.videoLinks.length > 1 && (_jsxs("div", { className: "bg-gray-800 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium mb-2", children: "Available Streams" }), _jsx("div", { className: "flex flex-wrap gap-2", children: match.videoLinks.map((url, index) => (_jsxs("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: `px-3 py-1 rounded text-sm ${index === 0 ? 'bg-purple-600' : 'bg-gray-700'} hover:opacity-80`, children: ["Stream ", index + 1] }, index))) })] }))] })) : (_jsxs("div", { className: "bg-gray-800 p-8 rounded-lg text-center", children: [_jsx(Tv, { className: "w-16 h-16 text-gray-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-400", children: "No live stream available" })] })), _jsx("div", { className: "bg-gray-800 p-4 rounded-lg", children: _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Venue:" }), " ", match.venue || 'Not specified'] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Match Type:" }), " ", match.matchType || 'T20'] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Date:" }), " ", new Date(match.date).toLocaleDateString()] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Status:" }), _jsx("span", { className: "text-red-500 ml-1 capitalize", children: match.status })] })] }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-red-600 to-red-700 p-4 text-center", children: _jsxs("span", { className: "text-white font-bold flex items-center justify-center gap-2", children: [_jsx("span", { className: "w-3 h-3 bg-white rounded-full animate-pulse" }), "LIVE SCORE"] }) }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { className: "text-center flex-1", children: [_jsx("div", { className: "w-14 h-14 mx-auto bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl mb-2", children: match.team1?.shortName || match.team1?.name?.substring(0, 2) || 'T1' }), _jsx("h3", { className: "font-bold truncate", children: match.team1?.name || 'Team 1' })] }), _jsxs("div", { className: "text-center px-4", children: [_jsxs("div", { className: "text-3xl font-bold", children: [match.score1 || 0, _jsxs("span", { className: "text-lg text-gray-400", children: ["/", match.wickets1 || 0] })] }), _jsxs("div", { className: "text-sm text-gray-400", children: [match.overs1 || 0, " overs"] })] })] }), _jsx("div", { className: "text-center text-gray-500 font-bold text-sm my-2", children: "VS" }), _jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { className: "text-center px-4", children: [_jsxs("div", { className: "text-3xl font-bold", children: [match.score2 || 0, _jsxs("span", { className: "text-lg text-gray-400", children: ["/", match.wickets2 || 0] })] }), _jsxs("div", { className: "text-sm text-gray-400", children: [match.overs2 || 0, " overs"] })] }), _jsxs("div", { className: "text-center flex-1", children: [_jsx("div", { className: "w-14 h-14 mx-auto bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl mb-2", children: match.team2?.shortName || match.team2?.name?.substring(0, 2) || 'T2' }), _jsx("h3", { className: "font-bold truncate", children: match.team2?.name || 'Team 2' })] })] }), match.status === 'ongoing' && (_jsxs("div", { className: "bg-gray-700 p-3 rounded-lg text-center mt-4", children: [match.target ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-sm", children: ["Target: ", _jsx("span", { className: "font-bold", children: match.target })] }), _jsx("p", { className: "text-sm text-gray-300", children: match.battingTeam === 'team1'
                                                                        ? `${match.team1?.name} need ${(match.target || 0) - (match.score1 || 0)} runs`
                                                                        : `${match.team2?.name} need ${(match.target || 0) - (match.score2 || 0)} runs` })] })) : (_jsx("p", { className: "text-sm text-gray-300", children: "First innings in progress" })), match.currentRunRate && (_jsxs("p", { className: "text-xs text-gray-400 mt-1", children: ["CRR: ", match.currentRunRate] }))] }))] })] }), match.status === 'ongoing' && (_jsxs("div", { className: "bg-gray-800 rounded-lg p-4", children: [_jsx("h3", { className: "font-bold mb-3", children: "Batsmen" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: `p-2 rounded ${match.battingTeam === 'team1' ? 'bg-green-900 border border-green-500' : 'bg-gray-700'}`, children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "font-medium", children: match.strikerName || 'Striker' }), _jsx("span", { className: "text-yellow-400", children: "*" })] }), _jsx("div", { className: "text-sm text-gray-400", children: "0 (0)" })] }), _jsxs("div", { className: "p-2 rounded bg-gray-700", children: [_jsx("div", { className: "flex justify-between", children: _jsx("span", { className: "font-medium", children: match.nonStrikerName || 'Non-Striker' }) }), _jsx("div", { className: "text-sm text-gray-400", children: "0 (0)" })] })] })] })), match.status === 'ongoing' && match.bowlerName && (_jsxs("div", { className: "bg-gray-800 rounded-lg p-4", children: [_jsx("h3", { className: "font-bold mb-3", children: "Bowler" }), _jsxs("div", { className: "p-2 rounded bg-gray-700", children: [_jsx("div", { className: "flex justify-between", children: _jsx("span", { className: "font-medium", children: match.bowlerName }) }), _jsx("div", { className: "text-sm text-gray-400", children: "0/0 (0.0)" })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Link, { to: `/match/${match._id}`, className: "block w-full text-center py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium", children: "Full Scorecard" }), _jsx(Link, { to: `/tournaments/${typeof match.tournament === 'string' ? match.tournament : match.tournament?._id}`, className: "block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium", children: "Tournament Details" })] })] })] }) })] }));
}
