import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';
import { Trophy, BarChart2 } from 'lucide-react';
export default function Leaderboard() {
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState('');
    const [pointsTable, setPointsTable] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        tournamentAPI.getMyTournaments().then(r => {
            const list = r.data.data || [];
            setTournaments(list);
            if (list.length > 0)
                setSelectedTournament(list[0]._id);
        }).catch(() => { });
    }, []);
    useEffect(() => {
        if (!selectedTournament)
            return;
        setLoading(true);
        tournamentAPI.getPointsTable(selectedTournament)
            .then(r => setPointsTable(r.data.data || []))
            .catch(() => setPointsTable([]))
            .finally(() => setLoading(false));
    }, [selectedTournament]);
    return (_jsxs("div", { className: "p-6 max-w-5xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-black text-white flex items-center gap-2", children: [_jsx(Trophy, { className: "w-6 h-6 text-amber-400" }), " Leaderboard"] }), _jsx("p", { className: "text-slate-500 text-sm mt-0.5", children: "Tournament points table" })] }), tournaments.length > 0 && (_jsx("select", { value: selectedTournament, onChange: e => setSelectedTournament(e.target.value), className: "bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500", children: tournaments.map(t => _jsx("option", { value: t._id, children: t.name }, t._id)) }))] }), loading ? (_jsx("div", { className: "flex justify-center py-16", children: _jsx("div", { className: "w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" }) })) : !selectedTournament ? (_jsxs("div", { className: "text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl", children: [_jsx(Trophy, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500", children: "Create a tournament first to see its leaderboard" })] })) : (_jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-slate-800 flex items-center gap-2", children: [_jsx(BarChart2, { className: "w-5 h-5 text-amber-400" }), _jsx("h2", { className: "text-white font-bold", children: "Points Table" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-700 bg-slate-800/50", children: [_jsx("th", { className: "text-left py-3 px-4 text-slate-400 font-semibold", children: "#" }), _jsx("th", { className: "text-left py-3 px-4 text-slate-400 font-semibold", children: "Team" }), _jsx("th", { className: "text-center py-3 px-3 text-slate-400 font-semibold", children: "M" }), _jsx("th", { className: "text-center py-3 px-3 text-slate-400 font-semibold", children: "W" }), _jsx("th", { className: "text-center py-3 px-3 text-slate-400 font-semibold", children: "L" }), _jsx("th", { className: "text-center py-3 px-3 text-slate-400 font-semibold", children: "T/NR" }), _jsx("th", { className: "text-center py-3 px-3 text-slate-400 font-semibold", children: "NRR" }), _jsx("th", { className: "text-center py-3 px-3 text-blue-400 font-bold", children: "PTS" })] }) }), _jsxs("tbody", { children: [pointsTable.map((row, i) => (_jsxs("tr", { className: `border-b border-slate-800 transition-colors hover:bg-slate-800/40 ${i === 0 ? 'bg-yellow-500/5' : i === 1 ? 'bg-slate-800/20' : ''}`, children: [_jsx("td", { className: "py-4 px-4", children: _jsx("span", { className: `font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-600'}`, children: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1 }) }), _jsxs("td", { className: "py-4 px-4", children: [_jsx("p", { className: "text-white font-bold", children: row.name }), _jsx("p", { className: "text-slate-600 text-xs", children: row.shortName })] }), _jsx("td", { className: "py-4 px-3 text-center text-slate-300", children: row.played }), _jsx("td", { className: "py-4 px-3 text-center text-green-400 font-semibold", children: row.won }), _jsx("td", { className: "py-4 px-3 text-center text-red-400", children: row.lost }), _jsx("td", { className: "py-4 px-3 text-center text-slate-500", children: (row.tied || 0) + (row.nr || 0) }), _jsxs("td", { className: `py-4 px-3 text-center font-mono text-xs font-semibold ${row.nrr >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [row.nrr >= 0 ? '+' : '', (row.nrr || 0).toFixed(3)] }), _jsx("td", { className: "py-4 px-3 text-center", children: _jsx("span", { className: "text-blue-400 font-black text-lg", children: row.points }) })] }, row._id))), pointsTable.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "py-12 text-center text-slate-600", children: "No matches completed yet in this tournament" }) }))] })] }) })] }))] }));
}
