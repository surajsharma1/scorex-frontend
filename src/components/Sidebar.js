import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, Zap, Users, CreditCard, Building2, UserPlus, User, Sun, Moon, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Trophy, label: 'Tournament', path: '/tournaments' },
    { icon: Zap, label: 'Live Match', path: '/live' },
    { icon: Users, label: 'Team Manager', path: '/tournaments' }, // managed inside tournament
    { icon: CreditCard, label: 'Membership', path: '/membership' },
    { icon: Building2, label: 'Club', path: '/clubs' },
    { icon: UserPlus, label: 'Friends', path: '/friends' },
    { icon: User, label: 'Profile', path: '/profile' },
];
export default function Sidebar({ user, logout, isOpen = false, onToggle }) {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [dark, setDark] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }, [dark]);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (_jsxs("aside", { className: `flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0`, children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-slate-800 min-h-[64px]", children: [!collapsed && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0", children: _jsx(Zap, { className: "w-4 h-4 text-white" }) }), _jsx("span", { className: "font-black text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", children: "ScoreX" })] })), collapsed && (_jsx("div", { className: "w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto", children: _jsx(Zap, { className: "w-4 h-4 text-white" }) })), !collapsed && (_jsx("button", { onClick: () => setCollapsed(true), className: "text-slate-500 hover:text-slate-300 transition-colors p-1", children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }))] }), collapsed && (_jsx("button", { onClick: () => setCollapsed(false), className: "flex justify-center py-2 text-slate-500 hover:text-slate-300 transition-colors border-b border-slate-800", children: _jsx(ChevronRight, { className: "w-4 h-4" }) })), !collapsed && user && (_jsx("div", { className: "px-4 py-3 border-b border-slate-800", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0", children: user.username?.[0]?.toUpperCase() || 'U' }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-white text-sm font-semibold truncate", children: user.username }), _jsx("p", { className: "text-slate-500 text-xs truncate", children: user.email })] })] }) })), _jsx("nav", { className: "flex-1 py-3 px-2 space-y-0.5 overflow-y-auto", children: navItems.map(item => (_jsxs(NavLink, { to: item.path, title: collapsed ? item.label : undefined, className: ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
              ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'}`, children: [_jsx(item.icon, { className: "w-5 h-5 flex-shrink-0" }), !collapsed && _jsx("span", { className: "text-sm font-medium", children: item.label })] }, item.label))) }), _jsxs("div", { className: "p-2 border-t border-slate-800 space-y-1", children: [_jsxs("button", { onClick: () => setDark(!dark), title: dark ? 'Switch to Light' : 'Switch to Dark', className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all", children: [dark
                                ? _jsx(Sun, { className: "w-5 h-5 flex-shrink-0" })
                                : _jsx(Moon, { className: "w-5 h-5 flex-shrink-0" }), !collapsed && _jsx("span", { className: "text-sm font-medium", children: dark ? 'Light Mode' : 'Dark Mode' })] }), _jsxs("button", { onClick: handleLogout, title: "Logout", className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all", children: [_jsx(LogOut, { className: "w-5 h-5 flex-shrink-0" }), !collapsed && _jsx("span", { className: "text-sm font-medium", children: "Logout" })] })] })] }));
}
