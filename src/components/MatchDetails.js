import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI, tournamentAPI } from '../services/api';
import ScoreboardUpdate from './ScoreboardUpdate';
import { ArrowLeft, Video, Save, Play, CheckCircle } from 'lucide-react';
export default function MatchDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    // Video Link State
    const [videoLink, setVideoLink] = useState('');
    const [isSavingLink, setIsSavingLink] = useState(false);
    useEffect(() => {
        fetchMatch();
    }, [id]);
    const fetchMatch = async () => {
        if (!id)
            return;
        try {
            const response = await matchAPI.getMatch(id);
            // Check if the response indicates the match wasn't found
            if (response.status === 404 || (response.data && response.data.message === 'Match not found')) {
                setMatch(null);
                setLoading(false);
                return;
            }
            // Handle potential API response structures - the backend returns { success: true, data: match }
            const data = response.data.data || response.data;
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
        }
        catch (error) {
            console.error('Failed to fetch match details', error);
            // Handle different error types
            if (error.response) {
                if (error.response.status === 404) {
                    setMatch(null);
                }
            }
        }
        finally {
            setLoading(false);
        }
    };
    const saveVideoLink = async () => {
        if (!match)
            return;
        setIsSavingLink(true);
        try {
            await matchAPI.updateMatch(match._id, { videoLink });
            alert("Stream link updated successfully!");
        }
        catch (e) {
            alert("Failed to save link");
        }
        finally {
            setIsSavingLink(false);
        }
    };
    const updateStatus = async (status) => {
        if (!match)
            return;
        if (!confirm(`Change status to ${status}?`))
            return;
        try {
            await matchAPI.updateMatch(match._id, { status });
            setMatch(prev => prev ? { ...prev, status } : null);
        }
        catch (e) {
            alert("Failed to update status");
        }
    };
    const refreshData = () => {
        fetchMatch();
    };
    if (loading)
        return _jsx("div", { className: "p-10 text-center", children: "Loading match details..." });
    if (!match)
        return _jsx("div", { className: "p-10 text-center", children: "Match not found." });
    return (_jsxs("div", { className: "p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate(-1), className: "p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700", children: _jsx(ArrowLeft, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold", children: [match.team1?.name, " ", _jsx("span", { className: "text-gray-400 text-lg", children: "vs" }), " ", match.team2?.name] }), _jsxs("p", { className: "text-sm text-gray-500", children: [tournament?.name, " \u2022 ", new Date(match.date).toLocaleDateString()] })] })] }), _jsxs("div", { className: "flex gap-2", children: [match.status === 'upcoming' && (_jsxs("button", { onClick: () => updateStatus('ongoing'), className: "flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 animate-pulse", children: [_jsx(Play, { className: "w-4 h-4" }), " Go Live"] })), match.status === 'live' && (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => updateStatus('completed'), className: "flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " End Match"] }), _jsxs("a", { href: `/live/${match._id}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700", children: [_jsx(Video, { className: "w-4 h-4" }), " Watch Live"] })] }))] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2 space-y-6", children: match.status === 'scheduled' ? (_jsxs("div", { className: "bg-white dark:bg-gray-800 p-10 rounded-xl text-center shadow-sm border border-gray-200 dark:border-gray-700", children: [_jsx(Play, { className: "w-16 h-16 mx-auto text-gray-300 mb-4" }), _jsx("h3", { className: "text-xl font-bold mb-2", children: "Match Not Started" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Start the match to enable the scoring console." }), _jsx("button", { onClick: () => updateStatus('ongoing'), className: "px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700", children: "Start Match Now" })] })) : (_jsx(ScoreboardUpdate, { tournament: { ...tournament, liveScores: match.liveScores }, matchId: match._id, onUpdate: refreshData })) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700", children: [_jsxs("h3", { className: "font-bold flex items-center gap-2 mb-4", children: [_jsx(Video, { className: "w-5 h-5 text-purple-500" }), " Live Stream"] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-xs text-gray-500 uppercase font-semibold", children: "YouTube / Twitch URL" }), _jsx("input", { type: "text", value: videoLink, onChange: (e) => setVideoLink(e.target.value), placeholder: "e.g. https://youtube.com/watch?v=...", className: "w-full p-2 rounded border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm" }), _jsx("button", { onClick: saveVideoLink, disabled: isSavingLink, className: "w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex justify-center items-center gap-2", children: isSavingLink ? 'Saving...' : _jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4" }), " Save Link"] }) })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700", children: [_jsx("h3", { className: "font-bold mb-4", children: "Match Details" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Status" }), _jsx("span", { className: "capitalize font-medium", children: match.status })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Venue" }), _jsx("span", { children: match.venue || 'N/A' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Format" }), _jsx("span", { children: match.matchType || 'T20' })] })] })] })] })] })] }));
}
