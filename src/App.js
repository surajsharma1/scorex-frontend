import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import api from './services/api';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import OAuthCallback from './components/OAuthCallback';
import TournamentView from './components/TournamentView';
import LiveScoring from './components/LiveScoring';
import LiveMatches from './components/LiveMatches';
import Profile from './components/Profile';
import Membership from './components/Membership';
import ClubManagement from './components/ClubManagement';
import FriendList from './components/FriendList';
import Leaderboard from './components/Leaderboard';
import ForgotPassword from './components/ForgotPassword';
import Frontpage from './components/Frontpage';
export const AuthContext = createContext({
    user: null,
    login: () => { },
    logout: () => { },
    loading: true
});
export const useAuth = () => useContext(AuthContext);
// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading)
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-950", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Loading ScoreX..." })] }) }));
    return user ? _jsx(_Fragment, { children: children }) : _jsx(Navigate, { to: "/login", replace: true });
}
// ─── Dashboard Layout ─────────────────────────────────────────────────────────
function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 flex", children: [_jsx(Sidebar, { user: user, logout: logout }), _jsx("main", { className: "flex-1 overflow-auto", children: children })] }));
}
// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    const userData = res.data.data;
                    setUser({
                        id: userData._id,
                        username: userData.username,
                        email: userData.email,
                        role: userData.role,
                        membershipLevel: userData.membershipLevel,
                        fullName: userData.fullName
                    });
                }
                catch {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);
    const login = (userData) => {
        const u = userData.user || userData;
        localStorage.setItem('token', userData.token || userData.data?.token);
        setUser({
            id: u._id || u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            membershipLevel: u.membershipLevel,
            fullName: u.fullName
        });
    };
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };
    return (_jsx(AuthContext.Provider, { value: { user, login, logout, loading }, children: _jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: user ? _jsx(Navigate, { to: "/dashboard" }) : _jsx(Frontpage, {}) }), _jsx(Route, { path: "/login", element: user ? _jsx(Navigate, { to: "/dashboard" }) : _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: user ? _jsx(Navigate, { to: "/dashboard" }) : _jsx(Register, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: "/oauth/callback", element: _jsx(OAuthCallback, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(Dashboard, {}) }) }) }), _jsx(Route, { path: "/tournaments", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(TournamentView, {}) }) }) }), _jsx(Route, { path: "/tournaments/:id", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(TournamentView, {}) }) }) }), _jsx(Route, { path: "/live", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(LiveMatches, {}) }) }) }), _jsx(Route, { path: "/matches/:id/score", element: _jsx(ProtectedRoute, { children: _jsx(LiveScoring, {}) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(Profile, {}) }) }) }), _jsx(Route, { path: "/membership", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(Membership, {}) }) }) }), _jsx(Route, { path: "/clubs", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(ClubManagement, {}) }) }) }), _jsx(Route, { path: "/friends", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(FriendList, {}) }) }) }), _jsx(Route, { path: "/leaderboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: _jsx(Leaderboard, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/" }) })] }) }) }));
}
