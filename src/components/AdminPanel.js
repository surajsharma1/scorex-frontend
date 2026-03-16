import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Users, Zap, BarChart3, Download } from 'lucide-react';
import api from '../services/api';
export default function AdminPanel() {
    const [stats, setStats] = useState({
        users: 0,
        tournaments: 0,
        matches: 0,
        revenue: 0
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Admin stats API call
        api.get('/stats/admin').then(res => {
            setStats(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);
    const exportData = (type) => {
        // Download CSV/JSON
        window.open(`/api/stats/export/${type}`, '_blank');
    };
    if (loading)
        return _jsx("div", { children: "Loading admin stats..." });
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h1", { className: "text-5xl font-black bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-4", children: "Admin Panel" }), _jsx("p", { className: "text-xl text-slate-400", children: "Platform overview & management" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12", children: [_jsx(AdminStatCard, { icon: _jsx(Users, {}), title: "Total Users", value: stats.users.toLocaleString() }), _jsx(AdminStatCard, { icon: _jsx(Zap, {}), title: "Tournaments", value: stats.tournaments.toLocaleString() }), _jsx(AdminStatCard, { icon: _jsx(BarChart3, {}), title: "Matches", value: stats.matches.toLocaleString() }), _jsx(AdminStatCard, { icon: _jsx(Download, {}), title: "Revenue", value: `$${stats.revenue}` })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: [_jsx(ManagementCard, { title: "User Management", onClick: () => { } }), _jsx(ManagementCard, { title: "Tournament Audit", onClick: () => { } }), _jsx(ManagementCard, { title: "Payment Reports", onClick: () => { } }), _jsx(ManagementCard, { title: "Overlay Stats", onClick: () => { } }), _jsx(ManagementCard, { title: "System Logs", onClick: () => { } }), _jsx(ManagementCard, { title: "Export Data", onClick: () => exportData('all') })] })] }) }));
}
function AdminStatCard({ icon, title, value }) {
    return (_jsx("div", { className: "group bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 shadow-xl hover:shadow-2xl", children: _jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg", children: icon }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 font-medium text-sm uppercase tracking-wide", children: title }), _jsx("p", { className: "text-4xl font-black text-white", children: value })] })] }) }));
}
function ManagementCard({ title, onClick }) {
    return (_jsxs("div", { className: "bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 shadow-xl group", onClick: onClick, children: [_jsx("h3", { className: "text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors", children: title }), _jsxs("p", { className: "text-slate-400", children: ["Quick access to ", title.toLowerCase()] })] }));
}
