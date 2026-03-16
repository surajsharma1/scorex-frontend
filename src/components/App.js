import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Frontpage from './Frontpage';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import TournamentList from './TournamentList';
import TournamentForm from './TournamentForm';
import TournamentDetail from './TournamentDetail';
import LiveMatches from './LiveMatches';
import LiveMatchPage from './LiveMatchPage';
import LiveScoring from './LiveScoring';
import OverlayEditor from './OverlayEditor';
import OverlayForm from './OverlayForm';
import Payment from './Payment';
import Leaderboard from './Leaderboard';
import TeamManagement from './TeamManagement';
import FriendList from './FriendList';
import ClubManagement from './ClubManagement';
import Membership from './Membership';
import Profile from './Profile';
import AdminPanel from './AdminPanel';
import { Menu } from 'lucide-react';
function App() {
    const token = localStorage.getItem('token');
    let user = null;
    let isAdmin = false;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
            user = JSON.parse(userStr);
            isAdmin = user?.role === 'admin';
        }
    }
    catch (e) {
        console.error("Error parsing user data from localStorage:", e);
        localStorage.removeItem('user');
    }
    const DashboardLayout = () => {
        const [isSidebarOpen, setSidebarOpen] = useState(false);
        const logout = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        };
        return (_jsxs("div", { className: "flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden", children: [_jsx("button", { className: "fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md md:hidden", onClick: () => setSidebarOpen(!isSidebarOpen), children: _jsx(Menu, { className: "w-6 h-6" }) }), _jsx(Sidebar, { user: user, logout: logout, isOpen: isSidebarOpen, onToggle: () => setSidebarOpen(false) }), _jsx("main", { className: "flex-1 md:ml-64 h-full overflow-y-auto transition-all duration-300 p-4 md:p-8 pt-16 md:pt-8", children: _jsx(Outlet, {}) })] }));
    };
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Frontpage, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/matches/live", element: _jsx(LiveMatches, {}) }), _jsx(Route, { path: "/live/:id", element: _jsx(LiveMatchPage, {}) }), _jsx(Route, { path: "/live-scoring/:id", element: _jsx(LiveScoring, {}) }), _jsxs(Route, { element: token ? _jsx(DashboardLayout, {}) : _jsx(Navigate, { to: "/login", replace: true }), children: [_jsx(Route, { path: "/dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/tournaments", element: _jsx(TournamentList, {}) }), _jsx(Route, { path: "/leaderboard", element: _jsx(Leaderboard, {}) }), _jsx(Route, { path: "/tournaments/create", element: _jsx(TournamentForm, {}) }), _jsx(Route, { path: "/tournaments/:id", element: _jsx(TournamentDetail, {}) }), _jsx(Route, { path: "/overlays", element: _jsx(OverlayEditor, {}) }), _jsx(Route, { path: "/overlays/create", element: _jsx(OverlayForm, {}) }), _jsx(Route, { path: "/teams", element: _jsx(TeamManagement, {}) }), _jsx(Route, { path: "/friends", element: _jsx(FriendList, {}) }), _jsx(Route, { path: "/clubs", element: _jsx(ClubManagement, {}) }), _jsx(Route, { path: "/membership", element: _jsx(Membership, {}) }), _jsx(Route, { path: "/profile", element: _jsx(Profile, {}) }), _jsx(Route, { path: "/live-matches", element: _jsx(LiveMatches, {}) }), isAdmin && _jsx(Route, { path: "/admin", element: _jsx(AdminPanel, {}) }), _jsx(Route, { path: "/upgrade", element: _jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Payment, { onClose: () => window.history.back(), onSuccess: () => alert('Upgraded!') }) }) })] })] }));
}
export default App;
