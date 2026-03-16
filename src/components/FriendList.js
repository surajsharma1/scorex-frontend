import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { friendAPI, userAPI } from '../services/api';
import { UserPlus, Users, Search, Check, X, UserMinus } from 'lucide-react';
export default function FriendList() {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('friends');
    const load = async () => {
        try {
            const [fRes, rRes] = await Promise.all([friendAPI.getFriends(), friendAPI.getPendingRequests()]);
            setFriends(fRes.data.data || fRes.data || []);
            setRequests(rRes.data.data || rRes.data || []);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const doSearch = async () => {
        if (!search.trim())
            return;
        try {
            const res = await userAPI.searchUsers(search);
            setSearchResults(res.data.data || res.data || []);
        }
        catch (e) {
            setSearchResults([]);
        }
    };
    const sendRequest = async (userId) => {
        try {
            await friendAPI.sendRequest(userId);
            doSearch();
        }
        catch (e) {
            alert(e.response?.data?.message || 'Failed');
        }
    };
    const accept = async (id) => {
        try {
            await friendAPI.acceptRequest(id);
            await load();
        }
        catch (e) {
            console.error(e);
        }
    };
    const reject = async (id) => {
        try {
            await friendAPI.rejectRequest(id);
            await load();
        }
        catch (e) {
            console.error(e);
        }
    };
    const remove = async (id) => {
        if (!confirm('Remove this friend?'))
            return;
        try {
            await friendAPI.removeFriend(id);
            await load();
        }
        catch (e) {
            console.error(e);
        }
    };
    return (_jsxs("div", { className: "p-6 max-w-3xl", children: [_jsxs("h1", { className: "text-2xl font-black text-white mb-6 flex items-center gap-2", children: [_jsx(Users, { className: "w-6 h-6 text-blue-400" }), " Friends"] }), _jsx("div", { className: "flex gap-1 border-b border-slate-800 mb-6", children: ['friends', 'requests', 'search'].map(t => (_jsxs("button", { onClick: () => setTab(t), className: `px-4 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`, children: [t, t === 'requests' && requests.length > 0 && _jsx("span", { className: "ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs", children: requests.length })] }, t))) }), tab === 'search' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" }), _jsx("input", { value: search, onChange: e => setSearch(e.target.value), onKeyDown: e => e.key === 'Enter' && doSearch(), placeholder: "Search by username or email...", className: "w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-blue-500" })] }), _jsx("button", { onClick: doSearch, className: "px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all", children: "Search" })] }), _jsx("div", { className: "space-y-2", children: searchResults.map(u => (_jsxs("div", { className: "flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm", children: u.username?.[0]?.toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: u.username }), _jsx("p", { className: "text-slate-500 text-xs", children: u.email })] })] }), _jsxs("button", { onClick: () => sendRequest(u._id), className: "flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-400 text-xs font-semibold rounded-lg transition-all", children: [_jsx(UserPlus, { className: "w-3.5 h-3.5" }), " Add"] })] }, u._id))) })] })), tab === 'requests' && (_jsx("div", { className: "space-y-3", children: requests.length === 0 ? (_jsx("div", { className: "text-center py-12 text-slate-600", children: "No pending friend requests" })) : requests.map((r) => (_jsxs("div", { className: "flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm", children: (r.from?.username || r.user1?.username || '?')[0]?.toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: r.from?.username || r.user1?.username }), _jsx("p", { className: "text-slate-500 text-xs", children: "Sent you a friend request" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => accept(r._id), className: "p-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/40 text-green-400 rounded-lg transition-all", children: _jsx(Check, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => reject(r._id), className: "p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-400 rounded-lg transition-all", children: _jsx(X, { className: "w-4 h-4" }) })] })] }, r._id))) })), tab === 'friends' && (_jsx("div", { className: "space-y-3", children: loading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx("div", { className: "w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : friends.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl", children: [_jsx(Users, { className: "w-12 h-12 text-slate-700 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500", children: "No friends yet" }), _jsx("button", { onClick: () => setTab('search'), className: "mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold", children: "Find friends \u2192" })] })) : friends.map((f) => {
                    const friend = f.user1 || f.from || f;
                    return (_jsxs("div", { className: "flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-all group", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm", children: (friend.username || '?')[0]?.toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: friend.username }), _jsx("p", { className: "text-slate-500 text-xs", children: friend.email })] })] }), _jsx("button", { onClick: () => remove(f._id), className: "opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all", children: _jsx(UserMinus, { className: "w-4 h-4" }) })] }, f._id));
                }) }))] }));
}
