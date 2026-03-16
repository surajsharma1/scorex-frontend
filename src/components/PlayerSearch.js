import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { userAPI } from '../services/api';
import { Search, Loader2, UserPlus, X } from 'lucide-react';
export default function PlayerSearch({ onSelect, excludeIds = [], placeholder = "Search users..." }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const handleSearch = async (val) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        setLoading(true);
        setIsOpen(true);
        try {
            const res = await userAPI.searchUsers(val);
            const users = res.data.users || [];
            // Filter out already selected IDs
            setResults(users.filter((u) => !excludeIds.includes(u._id)));
        }
        catch (e) {
            console.error("Search error");
        }
        finally {
            setLoading(false);
        }
    };
    const handleSelect = (user) => {
        onSelect(user);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };
    return (_jsxs("div", { className: "relative w-full", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", value: query, onChange: (e) => handleSearch(e.target.value), placeholder: placeholder, className: "w-full pl-9 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" }), query && (_jsx("button", { onClick: () => { setQuery(''); setIsOpen(false); }, className: "absolute right-2 top-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full", children: _jsx(X, { className: "w-4 h-4 text-gray-500" }) }))] }), isOpen && (query.length >= 2) && (_jsx("div", { className: "absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto", children: loading ? (_jsx("div", { className: "p-4 text-center", children: _jsx(Loader2, { className: "w-5 h-5 animate-spin mx-auto text-blue-500" }) })) : results.length === 0 ? (_jsx("div", { className: "p-4 text-center text-sm text-gray-500", children: "No users found." })) : (_jsx("ul", { children: results.map(user => (_jsxs("li", { onClick: () => handleSelect(user), className: "flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-0 border-gray-100 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300", children: user.username.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium dark:text-white", children: user.username }), user.fullName && _jsx("p", { className: "text-xs text-gray-500", children: user.fullName })] })] }), _jsx(UserPlus, { className: "w-4 h-4 text-gray-400" })] }, user._id))) })) }))] }));
}
