import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import { Zap, Activity, RefreshCw, MapPin, Shield } from 'lucide-react';
export default function LiveMatches() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadLive = async () => {
        try {
            const res = await matchAPI.getLiveMatches();
            setMatches(res.data.data || []);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadLive();
        const iv = setInterval(loadLive, 15000);
        socket.on('scoreUpdate', () => loadLive());
        return () => { clearInterval(iv); socket.off('scoreUpdate'); };
    }, []);
    return (_jsxs("div", { className: "p-6 max-w-4xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-black text-white flex items-center gap-2", children: [_jsx(Zap, { className: "w-6 h-6 text-red-400" }), " Live Matches"] }), _jsx("p", { className: "text-slate-500 text-sm mt-0.5", children: "Real-time scores \u2022 Updates every 15s" })] }), _jsxs("button", { onClick: loadLive, className: "flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-sm rounded-xl transition-all", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Refresh"] })] }), loading ? (_jsx("div", { className: "flex justify-center py-16", children: _jsx("div", { className: "w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" }) })) : matches.length === 0 ? (_jsxs("div", { className: "text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl", children: [_jsx(Activity, { className: "w-16 h-16 text-slate-700 mx-auto mb-4" }), _jsx("p", { className: "text-slate-400 text-lg font-semibold", children: "No live matches right now" }), _jsx("p", { className: "text-slate-600 text-sm mt-1", children: "Start scoring a match from your tournament page" })] })) : (_jsx("div", { className: "space-y-4", children: matches.map(m => {
                    const inn = m.innings?.[m.currentInnings - 1] || {};
                    const battingTeam = inn.teamName || m.team1Name;
                    return (_jsx("div", { className: "bg-slate-900 border border-red-500/20 rounded-2xl overflow-hidden hover:border-red-500/40 transition-all", children: _jsxs("div", { className: "px-5 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" }), " LIVE"] }), _jsxs("span", { className: "text-slate-500 text-xs flex items-center gap-1", children: [_jsx(Shield, { className: "w-3 h-3" }), m.format] }), m.venue && _jsxs("span", { className: "text-slate-500 text-xs flex items-center gap-1", children: [_jsx(MapPin, { className: "w-3 h-3" }), m.venue] })] }), _jsxs("span", { className: "text-slate-600 text-xs", children: ["Inn ", m.currentInnings] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 items-center mb-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-white font-black text-lg", children: m.team1Name }), _jsxs("p", { className: "text-slate-300 font-bold text-2xl", children: [m.team1Score, "/", m.team1Wickets] }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["(", typeof m.team1Overs === 'number' ? m.team1Overs.toFixed(1) : '0.0', " ov)"] })] }), _jsx("div", { className: "text-center text-slate-600 font-bold", children: "vs" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-white font-black text-lg", children: m.team2Name }), _jsxs("p", { className: "text-slate-300 font-bold text-2xl", children: [m.team2Score, "/", m.team2Wickets] }), _jsxs("p", { className: "text-slate-500 text-xs", children: ["(", typeof m.team2Overs === 'number' ? m.team2Overs.toFixed(1) : '0.0', " ov)"] })] })] }), m.strikerName && (_jsxs("div", { className: "bg-slate-800/60 rounded-xl p-3 text-xs grid grid-cols-3 gap-2 mb-3", children: [_jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "\uD83C\uDFCF " }), _jsxs("span", { className: "text-white", children: [m.strikerName, "*"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "\u2B24 " }), _jsx("span", { className: "text-white", children: m.nonStrikerName })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "\uD83C\uDFB3 " }), _jsx("span", { className: "text-white", children: m.currentBowlerName })] })] })), inn.targetScore && (_jsxs("div", { className: "bg-blue-900/20 border border-blue-700/30 rounded-xl px-3 py-2 mb-3 text-xs", children: [_jsxs("span", { className: "text-blue-400 font-semibold", children: ["Target: ", inn.targetScore] }), _jsxs("span", { className: "text-slate-500 ml-2", children: ["Need ", inn.requiredRuns, " @ RRR ", inn.requiredRunRate?.toFixed(2)] })] })), _jsxs("button", { onClick: () => navigate(`/matches/${m._id}/score`), className: "w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4" }), " Open Scoreboard"] })] }) }, m._id));
                }) }))] }));
}
