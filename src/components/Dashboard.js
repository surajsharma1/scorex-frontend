import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { useAuth } from '../App';
import { Trophy, Activity, Users, Zap, Plus } from 'lucide-react';
export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({ tournaments: 0, matches: 0, teams: 0, live: 0 });
    const [liveMatches, setLiveMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = async () => {
            try {
                const [tRes, mRes, lRes] = await Promise.all([
                    tournamentAPI.getMyTournaments(),
                    matchAPI.getMatches({ limit: 5 }),
                    matchAPI.getLiveMatches()
                ]);
                const tournaments = tRes.data.data || [];
                const matches = mRes.data.data || [];
                const live = lRes.data.data || [];
                // Get teams count
                let teamsCount = 0;
                for (const t of tournaments.slice(0, 3)) {
                    const tRes2 = await teamAPI.getTeams(t._id).catch(() => ({ data: { data: [] } }));
                    teamsCount += (tRes2.data.data || []).length;
                }
                setStats({ tournaments: tournaments.length, matches: matches.length, teams: teamsCount, live: live.length });
                setLiveMatches(live.slice(0, 3));
            }
            catch (e) {
                console.error(e);
            }
            finally {
                setLoading(false);
            }
        };
        load();
        const iv = setInterval(load, 30000);
        return () => clearInterval(iv);
    }, []);
    const statCards = [
        { label: 'My Tournaments', value: stats.tournaments, icon: Trophy, color: 'from-amber-500 to-orange-600', action: () => navigate('/tournaments') },
        { label: 'Total Matches', value: stats.matches, icon: Activity, color: 'from-blue-500 to-blue-700', action: () => navigate('/tournaments') },
        { label: 'Teams', value: stats.teams, icon: Users, color: 'from-purple-500 to-purple-700', action: () => navigate('/tournaments') },
        { label: 'Live Now', value: stats.live, icon: Zap, color: 'from-red-500 to-red-700', action: () => navigate('/live') },
    ];
    return (_jsxs("div", { className: "p-6 max-w-5xl", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("h1", { className: "text-3xl font-black text-white", children: ["Welcome, ", user?.username, " \uD83D\uDC4B"] }), _jsx("p", { className: "text-slate-500 mt-1", children: "Here's what's happening with your tournaments" })] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8", children: statCards.map(card => (_jsxs("button", { onClick: card.action, className: "bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left hover:border-slate-700 transition-all group", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`, children: _jsx(card.icon, { className: "w-5 h-5 text-white" }) }), _jsx("p", { className: "text-3xl font-black text-white", children: loading ? '–' : card.value }), _jsx("p", { className: "text-slate-500 text-sm mt-0.5", children: card.label })] }, card.label))) }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-8", children: [_jsxs("button", { onClick: () => navigate('/tournaments'), className: "flex items-center gap-3 p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-2xl transition-all text-left", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0", children: _jsx(Plus, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-bold", children: "New Tournament" }), _jsx("p", { className: "text-slate-500 text-xs", children: "Create and organize a tournament" })] })] }), _jsxs("button", { onClick: () => navigate('/live'), className: "flex items-center gap-3 p-4 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-2xl transition-all text-left", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0", children: _jsx(Zap, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-bold", children: "Live Matches" }), _jsx("p", { className: "text-slate-500 text-xs", children: "View all ongoing matches" })] })] })] }), liveMatches.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: "text-white font-bold text-lg mb-3 flex items-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4 text-red-400" }), " Live Matches"] }), _jsx("div", { className: "space-y-3", children: liveMatches.map(m => (_jsxs("div", { className: "bg-slate-900 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white font-bold", children: m.name || `${m.team1Name} vs ${m.team2Name}` }), _jsxs("p", { className: "text-slate-500 text-xs", children: [m.team1Name, " ", m.team1Score, "/", m.team1Wickets, " vs ", m.team2Name, " ", m.team2Score, "/", m.team2Wickets] })] }), _jsxs("button", { onClick: () => navigate(`/matches/${m._id}/score`), className: "flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 text-red-400 text-xs font-semibold rounded-lg transition-all", children: [_jsx(Zap, { className: "w-3 h-3" }), " Score"] })] }, m._id))) })] }))] }));
}
