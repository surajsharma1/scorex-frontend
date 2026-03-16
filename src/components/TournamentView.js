import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { useAuth } from '../App';
import { Plus, Trash2, Zap, Users, Trophy, Shield, Calendar, MapPin, X, Activity, Layers, CheckCircle, Clock } from 'lucide-react';
import TeamManagement from './TeamManagement';
import MatchDetail from './MatchDetail';
// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        live: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
        completed: 'bg-green-500/20 text-green-400 border-green-500/30',
        ongoing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return (_jsx("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${map[status] || map['upcoming']}`, children: status === 'live' ? '● LIVE' : status }));
};
// ─── Create Tournament Modal ──────────────────────────────────────────────────
function CreateTournamentModal({ onClose, onCreated }) {
    const [form, setForm] = useState({
        name: '', type: 'round_robin', format: 'T20',
        startDate: '', venue: '', rules: '', prizePool: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await tournamentAPI.createTournament({
                ...form,
                startDate: new Date(form.startDate).toISOString(),
                prizePool: Number(form.prizePool) || 0
            });
            onCreated();
            onClose();
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed to create tournament');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md my-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsx("h2", { className: "text-xl font-black text-white", children: "New Tournament" }), _jsx("button", { onClick: onClose, className: "text-slate-500 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) })] }), error && _jsx("div", { className: "mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm", children: error }), _jsxs("form", { onSubmit: submit, className: "space-y-4", children: [[
                            { label: 'Tournament Name', key: 'name', type: 'text', required: true, placeholder: 'e.g. IPL Season 1' },
                            { label: 'Venue / Location', key: 'venue', type: 'text', required: true, placeholder: 'e.g. Wankhede Stadium' },
                            { label: 'Start Date', key: 'startDate', type: 'date', required: true },
                            { label: 'Prize Pool (₹)', key: 'prizePool', type: 'number', placeholder: '0' },
                        ].map(f => (_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: f.label }), _jsx("input", { type: f.type, value: form[f.key], required: f.required, placeholder: f.placeholder, onChange: e => setForm({ ...form, [f.key]: e.target.value }), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" })] }, f.key))), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Type" }), _jsxs("select", { value: form.type, onChange: e => setForm({ ...form, type: e.target.value }), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "round_robin", children: "Round Robin" }), _jsx("option", { value: "knockout", children: "Knockout" }), _jsx("option", { value: "league", children: "League" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Format" }), _jsx("select", { value: form.format, onChange: e => setForm({ ...form, format: e.target.value }), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500", children: ['T10', 'T20', 'ODI', 'Test'].map(f => _jsx("option", { children: f }, f)) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Rules (optional)" }), _jsx("textarea", { value: form.rules, onChange: e => setForm({ ...form, rules: e.target.value }), rows: 2, placeholder: "Tournament rules...", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all", children: loading ? 'Creating...' : 'Create Tournament' })] })] }) }));
}
// ─── Create Match Modal ───────────────────────────────────────────────────────
function CreateMatchModal({ tournamentId, teams, onClose, onCreated }) {
    const [form, setForm] = useState({ team1: '', team2: '', date: '', venue: '', format: 'T20', name: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        if (form.team1 === form.team2) {
            setError('Teams must be different');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await matchAPI.createMatch({ ...form, tournamentId, date: new Date(form.date).toISOString() });
            onCreated();
            onClose();
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed to create match');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md my-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsx("h2", { className: "text-xl font-black text-white", children: "Schedule Match" }), _jsx("button", { onClick: onClose, className: "text-slate-500 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) })] }), error && _jsx("div", { className: "mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm", children: error }), _jsxs("form", { onSubmit: submit, className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-2 gap-3", children: ['team1', 'team2'].map((t, i) => (_jsxs("div", { children: [_jsxs("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: ["Team ", i + 1] }), _jsxs("select", { value: form[t], onChange: e => setForm({ ...form, [t]: e.target.value }), required: true, className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "-- Select --" }), teams.map(tm => _jsx("option", { value: tm._id, children: tm.name }, tm._id))] })] }, t))) }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Match Name (optional)" }), _jsx("input", { value: form.name, onChange: e => setForm({ ...form, name: e.target.value }), placeholder: "Auto-generated if empty", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Date & Time" }), _jsx("input", { type: "datetime-local", value: form.date, onChange: e => setForm({ ...form, date: e.target.value }), required: true, className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Format" }), _jsx("select", { value: form.format, onChange: e => setForm({ ...form, format: e.target.value }), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500", children: ['T10', 'T20', 'ODI', 'Test'].map(f => _jsx("option", { children: f }, f)) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Venue" }), _jsx("input", { value: form.venue, onChange: e => setForm({ ...form, venue: e.target.value }), placeholder: "e.g. Home Ground", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all", children: loading ? 'Scheduling...' : 'Schedule Match' })] })] }) }));
}
// ─── Points Table ─────────────────────────────────────────────────────────────
function PointsTable({ tournamentId }) {
    const [table, setTable] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        tournamentAPI.getPointsTable(tournamentId)
            .then(r => setTable(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [tournamentId]);
    if (loading)
        return _jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }) });
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-700", children: [_jsx("th", { className: "text-left py-3 px-3 text-slate-400 font-semibold", children: "#" }), _jsx("th", { className: "text-left py-3 px-3 text-slate-400 font-semibold", children: "Team" }), _jsx("th", { className: "text-center py-3 px-2 text-slate-400 font-semibold", children: "P" }), _jsx("th", { className: "text-center py-3 px-2 text-slate-400 font-semibold", children: "W" }), _jsx("th", { className: "text-center py-3 px-2 text-slate-400 font-semibold", children: "L" }), _jsx("th", { className: "text-center py-3 px-2 text-slate-400 font-semibold", children: "T/NR" }), _jsx("th", { className: "text-center py-3 px-2 text-slate-400 font-semibold", children: "NRR" }), _jsx("th", { className: "text-center py-3 px-2 text-blue-400 font-bold", children: "Pts" })] }) }), _jsxs("tbody", { children: [table.map((row, idx) => (_jsxs("tr", { className: `border-b border-slate-800 hover:bg-slate-800/40 transition-colors ${idx === 0 ? 'bg-yellow-500/5' : ''}`, children: [_jsx("td", { className: "py-3 px-3 text-slate-400 font-semibold", children: idx + 1 }), _jsx("td", { className: "py-3 px-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [idx === 0 && _jsx("span", { className: "text-yellow-500", children: "\uD83D\uDC51" }), _jsxs("div", { children: [_jsx("div", { className: "text-white font-semibold", children: row.name }), _jsx("div", { className: "text-slate-600 text-xs", children: row.shortName })] })] }) }), _jsx("td", { className: "py-3 px-2 text-center text-slate-300", children: row.played }), _jsx("td", { className: "py-3 px-2 text-center text-green-400 font-semibold", children: row.won }), _jsx("td", { className: "py-3 px-2 text-center text-red-400", children: row.lost }), _jsx("td", { className: "py-3 px-2 text-center text-slate-400", children: row.tied + row.nr }), _jsxs("td", { className: `py-3 px-2 text-center font-mono text-xs ${row.nrr >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [row.nrr >= 0 ? '+' : '', row.nrr?.toFixed(3)] }), _jsx("td", { className: "py-3 px-2 text-center text-blue-400 font-black text-base", children: row.points })] }, row._id))), table.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "py-8 text-center text-slate-600", children: "No matches completed yet" }) }))] })] }) }));
}
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TournamentView() {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const { user } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [selected, setSelected] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTournament, setShowCreateTournament] = useState(false);
    const [showCreateMatch, setShowCreateMatch] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [statusMenu, setStatusMenu] = useState(null);
    // Load user's tournaments (account-distinct)
    const loadTournaments = useCallback(async () => {
        try {
            const res = await tournamentAPI.getMyTournaments();
            const list = res.data.data || [];
            setTournaments(list);
            if (paramId) {
                const found = list.find((t) => t._id === paramId);
                if (found)
                    setSelected(found);
            }
            else if (list.length > 0 && !selected) {
                setSelected(list[0]);
            }
        }
        catch (e) {
            console.error('Failed to load tournaments', e);
        }
        finally {
            setLoading(false);
        }
    }, [paramId]);
    useEffect(() => { loadTournaments(); }, [loadTournaments]);
    // Load tournament details when selected changes
    useEffect(() => {
        if (!selected?._id)
            return;
        const loadDetails = async () => {
            try {
                const [matchRes, teamRes] = await Promise.all([
                    matchAPI.getMatches({ tournament: selected._id, limit: 100 }),
                    teamAPI.getTeams(selected._id)
                ]);
                setMatches(matchRes.data.data || []);
                setTeams(teamRes.data.data || []);
            }
            catch (e) {
                console.error(e);
            }
        };
        loadDetails();
    }, [selected, activeTab]);
    const handleDeleteMatch = async (matchId) => {
        if (!confirm('Delete this match?'))
            return;
        try {
            await matchAPI.deleteMatch(matchId);
            setMatches(prev => prev.filter(m => m._id !== matchId));
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleStatusChange = async (matchId, status) => {
        try {
            await matchAPI.updateStatus(matchId, status);
            setMatches(prev => prev.map(m => m._id === matchId ? { ...m, status } : m));
            setStatusMenu(null);
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleDeleteTournament = async (id) => {
        if (!confirm('Delete this tournament? This cannot be undone.'))
            return;
        try {
            await tournamentAPI.deleteTournament(id);
            setTournaments(prev => prev.filter(t => t._id !== id));
            if (selected?._id === id)
                setSelected(null);
        }
        catch (e) {
            console.error(e);
        }
    };
    // If a match is selected, show MatchDetail
    if (selectedMatch) {
        return (_jsx(MatchDetail, { matchId: selectedMatch._id, onBack: () => setSelectedMatch(null), openScoreboard: () => navigate(`/matches/${selectedMatch._id}/score`) }));
    }
    const tabs = ['overview', 'matches', 'teams', 'overlays', 'leaderboard'];
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 flex", children: [showCreateTournament && (_jsx(CreateTournamentModal, { onClose: () => setShowCreateTournament(false), onCreated: loadTournaments })), showCreateMatch && selected && (_jsx(CreateMatchModal, { tournamentId: selected._id, teams: teams, onClose: () => setShowCreateMatch(false), onCreated: async () => {
                    const res = await matchAPI.getMatches({ tournament: selected._id, limit: 100 });
                    setMatches(res.data.data || []);
                } })), _jsxs("div", { className: "w-72 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0", children: [_jsxs("div", { className: "p-4 border-b border-slate-800 flex items-center justify-between", children: [_jsx("h2", { className: "text-white font-black text-lg", children: "Tournaments" }), _jsx("button", { onClick: () => setShowCreateTournament(true), className: "w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all", children: _jsx(Plus, { className: "w-4 h-4 text-white" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-2 space-y-1", children: loading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : tournaments.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Trophy, { className: "w-10 h-10 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-600 text-sm", children: "No tournaments yet" }), _jsx("button", { onClick: () => setShowCreateTournament(true), className: "mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold", children: "+ Create First Tournament" })] })) : (tournaments.map(t => (_jsx("button", { onClick: () => { setSelected(t); setActiveTab('overview'); }, className: `w-full text-left p-3 rounded-xl transition-all group ${selected?._id === t._id ? 'bg-blue-600/20 border border-blue-500/40' : 'hover:bg-slate-800 border border-transparent'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: `font-semibold text-sm truncate ${selected?._id === t._id ? 'text-white' : 'text-slate-300'}`, children: t.name }), _jsxs("p", { className: "text-slate-600 text-xs mt-0.5", children: [t.format, " \u00B7 ", t.type?.replace('_', ' ')] })] }), _jsxs("div", { className: "flex items-center gap-1 flex-shrink-0 ml-2", children: [_jsx(StatusBadge, { status: t.status || 'upcoming' }), _jsx("button", { onClick: e => { e.stopPropagation(); handleDeleteTournament(t._id); }, className: "opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] })] }) }, t._id)))) })] }), _jsx("div", { className: "flex-1 overflow-auto", children: !selected ? (_jsx("div", { className: "flex-1 flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx(Trophy, { className: "w-16 h-16 text-slate-800 mx-auto mb-4" }), _jsx("p", { className: "text-slate-600 text-lg", children: "Select or create a tournament" })] }) })) : (_jsxs("div", { children: [_jsxs("div", { className: "bg-slate-900 border-b border-slate-800 px-6 py-5", children: [_jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-black text-white", children: selected.name }), _jsxs("div", { className: "flex items-center gap-4 mt-1.5 text-slate-500 text-sm", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3.5 h-3.5" }), " ", selected.startDate ? new Date(selected.startDate).toLocaleDateString('en-IN') : 'TBD'] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(MapPin, { className: "w-3.5 h-3.5" }), " ", selected.venue || 'TBD'] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Shield, { className: "w-3.5 h-3.5" }), " ", selected.format] }), _jsx(StatusBadge, { status: selected.status || 'upcoming' })] })] }) }), _jsx("div", { className: "flex gap-1 mt-4 -mb-5 border-b border-slate-800 pt-2", children: tabs.map(tab => (_jsx("button", { onClick: () => setActiveTab(tab), className: `px-4 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${activeTab === tab
                                            ? 'border-blue-500 text-blue-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-300'}`, children: tab === 'leaderboard' ? 'Points Table' : tab }, tab))) })] }), _jsxs("div", { className: "p-6", children: [activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
                                                { label: 'Teams', value: selected.teams?.length || 0, icon: Users, color: 'text-blue-400' },
                                                { label: 'Matches', value: matches.length, icon: Activity, color: 'text-green-400' },
                                                { label: 'Live Now', value: matches.filter((m) => m.status === 'live').length, icon: Zap, color: 'text-red-400' },
                                                { label: 'Completed', value: matches.filter((m) => m.status === 'completed').length, icon: CheckCircle, color: 'text-purple-400' },
                                            ].map(stat => (_jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-slate-500 text-xs font-semibold", children: stat.label }), _jsx(stat.icon, { className: `w-4 h-4 ${stat.color}` })] }), _jsx("p", { className: `text-3xl font-black ${stat.color}`, children: stat.value })] }, stat.label))) }), _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-5", children: [_jsx("h3", { className: "text-white font-bold mb-3", children: "Tournament Details" }), _jsxs("div", { className: "grid grid-cols-2 gap-y-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "Type" }), _jsx("div", { className: "text-white capitalize", children: selected.type?.replace('_', ' ') })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "Format" }), _jsx("div", { className: "text-white", children: selected.format })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "Start Date" }), _jsx("div", { className: "text-white", children: selected.startDate ? new Date(selected.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "Venue" }), _jsx("div", { className: "text-white", children: selected.venue || 'TBD' })] }), selected.prizePool > 0 && _jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "Prize Pool" }), _jsxs("div", { className: "text-white", children: ["\u20B9", selected.prizePool.toLocaleString()] })] })] }), selected.rules && (_jsxs("div", { className: "mt-4 pt-4 border-t border-slate-800", children: [_jsx("p", { className: "text-slate-500 text-xs font-semibold mb-1", children: "Rules" }), _jsx("p", { className: "text-slate-300 text-sm whitespace-pre-line", children: selected.rules })] }))] })] })), activeTab === 'matches' && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-white font-bold text-lg", children: ["Matches (", matches.length, ")"] }), _jsxs("button", { onClick: () => setShowCreateMatch(true), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all", children: [_jsx(Plus, { className: "w-4 h-4" }), " Schedule Match"] })] }), matches.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl", children: [_jsx(Activity, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500", children: "No matches scheduled yet" }), _jsx("button", { onClick: () => setShowCreateMatch(true), className: "mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold", children: "+ Schedule First Match" })] })) : (_jsx("div", { className: "space-y-3", children: matches.map(match => (_jsx("div", { className: "bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all group", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: () => setSelectedMatch(match), className: "flex-1 text-left", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(StatusBadge, { status: match.status }), _jsxs("span", { className: "text-slate-600 text-xs", children: [match.format, " \u00B7 ", match.venue] }), _jsx("span", { className: "text-slate-600 text-xs", children: match.date ? new Date(match.date).toLocaleDateString('en-IN') : '' })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-right flex-1", children: [_jsx("p", { className: "text-white font-bold", children: match.team1Name || match.team1?.name }), match.status !== 'upcoming' && _jsxs("p", { className: "text-slate-400 text-sm", children: [match.team1Score || 0, "/", match.team1Wickets || 0, " (", (match.team1Overs || 0).toFixed ? (match.team1Overs || 0).toFixed(1) : 0, ")"] })] }), _jsx("div", { className: "text-slate-600 font-bold text-sm", children: "vs" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-white font-bold", children: match.team2Name || match.team2?.name }), match.status !== 'upcoming' && _jsxs("p", { className: "text-slate-400 text-sm", children: [match.team2Score || 0, "/", match.team2Wickets || 0, " (", (match.team2Overs || 0).toFixed ? (match.team2Overs || 0).toFixed(1) : 0, ")"] })] })] })] }), _jsxs("div", { className: "flex items-center gap-2 ml-4", children: [_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setStatusMenu(statusMenu === match._id ? null : match._id), className: "flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-all border border-slate-700", children: [_jsx(Clock, { className: "w-3 h-3" }), " Status"] }), statusMenu === match._id && (_jsx("div", { className: "absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden w-36", children: ['upcoming', 'live', 'completed', 'abandoned'].map(s => (_jsx("button", { onClick: () => handleStatusChange(match._id, s), className: "w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 capitalize transition-colors", children: s }, s))) }))] }), _jsxs("button", { onClick: () => navigate(`/matches/${match._id}/score`), className: "flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 text-red-400 text-xs font-semibold transition-all", children: [_jsx(Zap, { className: "w-3 h-3" }), " Live Score"] }), _jsx("button", { onClick: () => handleDeleteMatch(match._id), className: "p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }) }, match._id))) }))] })), activeTab === 'teams' && (_jsx(TeamManagement, { tournamentId: selected._id, onTeamsChange: () => { } })), activeTab === 'overlays' && (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-white font-bold text-lg", children: "Overlays" }), _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center", children: [_jsx(Layers, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-400 font-semibold mb-1", children: "Streaming Overlays" }), _jsx("p", { className: "text-slate-600 text-sm", children: "Connect an overlay to display live score data on your stream" }), _jsx("p", { className: "text-slate-600 text-xs mt-2", children: "Upgrade to Premium for full overlay access" })] })] })), activeTab === 'leaderboard' && (_jsxs("div", { children: [_jsx("h2", { className: "text-white font-bold text-lg mb-4", children: "Points Table" }), _jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-800 flex items-center gap-2", children: [_jsx(Trophy, { className: "w-4 h-4 text-yellow-500" }), _jsxs("span", { className: "text-slate-400 text-sm font-semibold", children: [selected.name, " \u00B7 ", selected.format] })] }), _jsx(PointsTable, { tournamentId: selected._id })] })] }))] })] })) }), statusMenu && _jsx("div", { className: "fixed inset-0 z-10", onClick: () => setStatusMenu(null) })] }));
}
