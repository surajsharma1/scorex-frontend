import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../services/api';
import { Search, Filter, Calendar, Users, Trophy, Radio } from 'lucide-react';
export default function TournamentList() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    useEffect(() => {
        loadTournaments();
    }, []);
    const loadTournaments = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await tournamentAPI.getTournaments();
            // Handle both array response and object with tournaments/data property
            let data = [];
            if (Array.isArray(res.data)) {
                data = res.data;
            }
            else if (res.data?.data && Array.isArray(res.data.data)) {
                data = res.data.data;
            }
            else if (res.data?.tournaments && Array.isArray(res.data.tournaments)) {
                data = res.data.tournaments;
            }
            setTournaments(data);
        }
        catch (err) {
            console.error("Failed to load tournaments", err);
            setError(err.response?.data?.message || err.message || 'Failed to load tournaments');
            setTournaments([]);
        }
        finally {
            setLoading(false);
        }
    };
    const filteredTournaments = (Array.isArray(tournaments) ? tournaments : []).filter((t) => {
        const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesFilter = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesFilter;
    });
    return (_jsxs("div", { className: "p-6 bg-gray-50 dark:bg-gray-900 min-h-screen", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Tournaments" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Browse and join cricket leagues" })] }), _jsx(Link, { to: "/tournaments/create", className: "bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg transition-all", children: "Create Tournament" })] }), error && (_jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6", children: [_jsx("p", { className: "text-red-600 dark:text-red-400 font-medium", children: "Error loading tournaments" }), _jsx("p", { className: "text-red-500 dark:text-red-500 text-sm mt-1", children: error }), _jsx("button", { onClick: loadTournaments, className: "mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium", children: "Retry" })] })), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-3 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search tournaments...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500" })] }), _jsxs("div", { className: "relative", children: [_jsx(Filter, { className: "absolute left-3 top-3 w-5 h-5 text-gray-400" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "pl-10 p-3 pr-8 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none cursor-pointer", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "ongoing", children: "Live / Ongoing" }), _jsx("option", { value: "upcoming", children: "Upcoming" }), _jsx("option", { value: "completed", children: "Completed" })] })] })] }), loading ? (_jsx("div", { className: "flex justify-center py-20", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" }) })) : filteredTournaments.length === 0 ? (_jsxs("div", { className: "text-center py-20 text-gray-500 dark:text-gray-400", children: [_jsx(Trophy, { className: "w-16 h-16 mx-auto mb-4 opacity-20" }), _jsx("p", { className: "text-lg", children: "No tournaments found" }), _jsx("p", { className: "text-sm mt-2", children: "Create your first tournament to get started!" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredTournaments.map((tournament) => (_jsxs(Link, { to: `/tournaments/${tournament._id}`, className: "block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 dark:border-gray-700 group", children: [_jsx("div", { className: "h-32 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center", children: _jsx(Trophy, { className: "w-16 h-16 text-white opacity-20 group-hover:scale-110 transition-transform" }) }), _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-bold text-xl text-gray-900 dark:text-white truncate pr-2", children: tournament.name }), tournament.status === 'ongoing' && (_jsxs("span", { className: "flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full animate-pulse", children: [_jsx(Radio, { className: "w-3 h-3" }), " LIVE"] }))] }), _jsxs("div", { className: "space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { children: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4 text-gray-400" }), _jsxs("span", { children: [tournament.teams?.length || 0, " Teams"] })] })] }), _jsxs("div", { className: "pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center", children: [_jsx("span", { className: `text-xs px-2 py-1 rounded-md capitalize font-medium
                    ${tournament.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                                tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                  `, children: tournament.status || 'upcoming' }), _jsx("span", { className: "text-green-600 dark:text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform", children: "View Details \u2192" })] })] })] }, tournament._id))) }))] }));
}
