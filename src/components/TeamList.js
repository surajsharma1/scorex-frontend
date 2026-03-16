import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../services/api';
export default function TeamList() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const fetchTeams = async (page = 1, append = false) => {
        try {
            console.log('Fetching teams...');
            if (append) {
                setLoadingMore(true);
            }
            else {
                setLoading(true);
                setError(null);
            }
            const response = await teamAPI.getTeams();
            console.log('Teams API response:', response);
            // Handle different response formats
            let newTeams = [];
            let paginationData = null;
            if (response.data && response.data.teams) {
                newTeams = response.data.teams || [];
                paginationData = response.data.pagination;
            }
            else if (Array.isArray(response.data)) {
                newTeams = response.data;
            }
            else if (response.data && Array.isArray(response.data.data)) {
                newTeams = response.data.data;
            }
            else {
                console.warn('Unexpected teams response format:', response.data);
                newTeams = [];
            }
            if (append) {
                setTeams(prev => [...prev, ...newTeams]);
            }
            else {
                setTeams(newTeams);
            }
            setPagination(paginationData);
            setCurrentPage(page);
        }
        catch (err) {
            console.error('Failed to fetch teams:', err);
            console.error('Error details:', err.response?.data || err.message);
            setError(err.response?.data?.message || err.message || 'Failed to load teams. Please try again.');
            setTeams([]);
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };
    useEffect(() => {
        fetchTeams();
    }, []);
    const loadMore = () => {
        if (pagination?.hasNext) {
            fetchTeams(currentPage + 1, true);
        }
    };
    // Loading Skeleton Component
    const LoadingSkeleton = () => (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-300 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-4 bg-gray-300 rounded w-1/2" })] }));
    // Team List Skeleton
    const TeamListSkeleton = () => (_jsx("div", { className: "space-y-2", children: [...Array(5)].map((_, i) => (_jsxs("div", { className: "animate-pulse bg-gray-200 p-4 rounded-lg", children: [_jsx("div", { className: "h-4 bg-gray-300 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-3 bg-gray-300 rounded w-1/2" })] }, i))) }));
    // Error State
    if (error && loading) {
        return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl mb-4", id: "teams-heading", children: "Teams" }), _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-4", children: [_jsx("p", { className: "text-red-600 font-medium", children: "Error loading teams" }), _jsx("p", { className: "text-red-500 text-sm mt-1", children: error }), _jsx("button", { onClick: () => fetchTeams(), className: "mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium", children: "Retry" })] })] }));
    }
    if (loading)
        return (_jsxs("div", { className: "p-6", role: "status", "aria-live": "polite", "aria-label": "Loading teams", children: [_jsx(LoadingSkeleton, {}), _jsx("div", { className: "mt-4", children: _jsx(TeamListSkeleton, {}) })] }));
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl mb-4", id: "teams-heading", children: "Teams" }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-4", children: [_jsx("p", { className: "text-red-600 font-medium", children: "Error" }), _jsx("p", { className: "text-red-500 text-sm mt-1", children: error }), _jsx("button", { onClick: () => fetchTeams(), className: "mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium", children: "Retry" })] })), _jsx("button", { onClick: () => navigate('/teams/new'), className: "btn-primary mb-4", "aria-label": "Create a new team", children: "Create New" }), teams.length === 0 ? (_jsxs("div", { className: "text-center py-10 text-gray-500", children: [_jsx("p", { className: "text-lg", children: "No teams found" }), _jsx("p", { className: "text-sm mt-2", children: "Create your first team to get started!" })] })) : (_jsx("ul", { className: "space-y-2", role: "list", "aria-labelledby": "teams-heading", "aria-label": `List of ${teams.length} teams`, children: teams.map((team) => (_jsxs("li", { className: "bg-white p-4 rounded shadow", role: "listitem", "aria-label": `Team: ${team.name}`, children: [_jsx("h3", { className: "text-lg font-semibold", id: `team-${team._id}-name`, children: team.name }), _jsx("button", { onClick: () => navigate(`/teams/${team._id}/edit`), className: "text-blue-500 hover:text-blue-700 mt-2", "aria-label": `Edit team ${team.name}`, "aria-describedby": `team-${team._id}-name`, children: "Edit" })] }, team._id))) })), pagination?.hasNext && (_jsx("div", { className: "mt-4 text-center", children: _jsx("button", { onClick: loadMore, disabled: loadingMore, className: "btn-secondary", "aria-label": loadingMore ? "Loading more teams" : "Load more teams", "aria-disabled": loadingMore, children: loadingMore ? 'Loading...' : 'Load More' }) }))] }));
}
