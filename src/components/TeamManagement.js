import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { teamAPI } from '../services/api';
import { Plus, Trash2, Users, X, ChevronDown, ChevronUp, User } from 'lucide-react';
export default function TeamManagement({ tournamentId = '', onTeamsChange }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [teamForm, setTeamForm] = useState({ name: '', shortName: '' });
    const [playerForm, setPlayerForm] = useState({ name: '', role: 'batsman' });
    const [addingPlayerTo, setAddingPlayerTo] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const loadTeams = useCallback(async () => {
        try {
            const res = await teamAPI.getTeams(tournamentId || undefined);
            setTeams(res.data.data || []);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    }, [tournamentId]);
    useEffect(() => { loadTeams(); }, [loadTeams]);
    const createTeam = async (e) => {
        e.preventDefault();
        if (!teamForm.name)
            return;
        setSaving(true);
        setError('');
        try {
            await teamAPI.createTeam({ ...teamForm, ...(tournamentId && { tournamentId }) });
            setTeamForm({ name: '', shortName: '' });
            setShowCreateTeam(false);
            await loadTeams();
            onTeamsChange?.();
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed to create team');
        }
        finally {
            setSaving(false);
        }
    };
    const deleteTeam = async (id) => {
        if (!confirm('Delete this team?'))
            return;
        try {
            await teamAPI.deleteTeam(id);
            setTeams(prev => prev.filter(t => t._id !== id));
            onTeamsChange?.();
        }
        catch (e) {
            console.error(e);
        }
    };
    const addPlayer = async (teamId, e) => {
        e.preventDefault();
        if (!playerForm.name)
            return;
        setSaving(true);
        setError('');
        try {
            // Create player and add to team
            const res = await teamAPI.addPlayer(teamId, playerForm);
            await loadTeams();
            setPlayerForm({ name: '', role: 'batsman' });
            setAddingPlayerTo(null);
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed to add player');
        }
        finally {
            setSaving(false);
        }
    };
    const removePlayer = async (teamId, playerId) => {
        if (!confirm('Remove this player?'))
            return;
        try {
            await teamAPI.removePlayer(teamId, playerId);
            await loadTeams();
        }
        catch (e) {
            console.error(e);
        }
    };
    const roleColors = {
        batsman: 'bg-blue-500/20 text-blue-400',
        bowler: 'bg-red-500/20 text-red-400',
        'all-rounder': 'bg-purple-500/20 text-purple-400',
        'wicket-keeper': 'bg-amber-500/20 text-amber-400',
        'batsman-wicket-keeper': 'bg-teal-500/20 text-teal-400',
    };
    if (loading)
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx("div", { className: "w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }) }));
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-white font-bold text-lg", children: ["Teams (", teams.length, ")"] }), _jsxs("button", { onClick: () => setShowCreateTeam(!showCreateTeam), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all", children: [_jsx(Plus, { className: "w-4 h-4" }), " Add Team"] })] }), error && _jsx("div", { className: "p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm", children: error }), showCreateTeam && (_jsxs("form", { onSubmit: createTeam, className: "bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3", children: [_jsx("h3", { className: "text-white font-semibold", children: "New Team" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Team Name *" }), _jsx("input", { value: teamForm.name, onChange: e => setTeamForm({ ...teamForm, name: e.target.value }), placeholder: "e.g. Mumbai Indians", required: true, className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-xs font-semibold mb-1 block", children: "Short Name (up to 4)" }), _jsx("input", { value: teamForm.shortName, onChange: e => setTeamForm({ ...teamForm, shortName: e.target.value.toUpperCase().slice(0, 4) }), placeholder: "MI", maxLength: 4, className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "submit", disabled: saving, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all", children: saving ? 'Creating...' : 'Create Team' }), _jsx("button", { type: "button", onClick: () => setShowCreateTeam(false), className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-xl transition-all", children: "Cancel" })] })] })), teams.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl", children: [_jsx(Users, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500", children: "No teams yet" }), _jsx("button", { onClick: () => setShowCreateTeam(true), className: "mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold", children: "+ Add First Team" })] })) : (_jsx("div", { className: "space-y-3", children: teams.map(team => (_jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [_jsxs("button", { className: "flex items-center gap-3 flex-1 text-left", onClick: () => setExpandedTeam(expandedTeam === team._id ? null : team._id), children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0", children: team.shortName || team.name[0] }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-bold", children: team.name }), _jsxs("p", { className: "text-slate-500 text-xs", children: [team.players?.length || 0, " players"] })] }), expandedTeam === team._id ? _jsx(ChevronUp, { className: "w-4 h-4 text-slate-500 ml-auto" }) : _jsx(ChevronDown, { className: "w-4 h-4 text-slate-500 ml-auto" })] }), _jsxs("div", { className: "flex items-center gap-2 ml-3", children: [_jsxs("button", { onClick: () => setAddingPlayerTo(addingPlayerTo === team._id ? null : team._id), className: "flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 text-xs font-semibold transition-all", children: [_jsx(Plus, { className: "w-3 h-3" }), " Player"] }), _jsx("button", { onClick: () => deleteTeam(team._id), className: "p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), addingPlayerTo === team._id && (_jsxs("form", { onSubmit: e => addPlayer(team._id, e), className: "px-4 pb-3 border-t border-slate-800 pt-3 flex gap-2 flex-wrap", children: [_jsx("input", { value: playerForm.name, onChange: e => setPlayerForm({ ...playerForm, name: e.target.value }), placeholder: "Player name", required: true, className: "flex-1 min-w-[140px] bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" }), _jsxs("select", { value: playerForm.role, onChange: e => setPlayerForm({ ...playerForm, role: e.target.value }), className: "bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "batsman", children: "Batsman" }), _jsx("option", { value: "bowler", children: "Bowler" }), _jsx("option", { value: "all-rounder", children: "All-Rounder" }), _jsx("option", { value: "wicket-keeper", children: "Wicket Keeper" }), _jsx("option", { value: "batsman-wicket-keeper", children: "Batsman WK" })] }), _jsx("button", { type: "submit", disabled: saving, className: "px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all", children: "Add" }), _jsx("button", { type: "button", onClick: () => setAddingPlayerTo(null), className: "px-3 py-2 bg-slate-700 text-slate-400 text-sm rounded-xl transition-all hover:bg-slate-600", children: _jsx(X, { className: "w-4 h-4" }) })] })), expandedTeam === team._id && (_jsx("div", { className: "border-t border-slate-800", children: !team.players?.length ? (_jsx("p", { className: "text-slate-600 text-sm px-4 py-3", children: "No players added yet" })) : (_jsx("div", { className: "divide-y divide-slate-800/50", children: team.players.map((player, i) => (_jsxs("div", { className: "flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 group", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold flex-shrink-0", children: i + 1 }), _jsx(User, { className: "w-4 h-4 text-slate-600 flex-shrink-0" }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("p", { className: "text-white text-sm font-medium truncate", children: player.name }) }), _jsx("span", { className: `text-xs px-2 py-0.5 rounded-full capitalize ${roleColors[player.role] || 'bg-slate-700 text-slate-400'}`, children: player.role?.replace('-', ' ') }), _jsx("button", { onClick: () => removePlayer(team._id, player._id), className: "opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all", children: _jsx(X, { className: "w-3.5 h-3.5" }) })] }, player._id || i))) })) }))] }, team._id))) }))] }));
}
