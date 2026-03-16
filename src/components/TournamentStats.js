import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { matchAPI } from '../services/api';
export default function TournamentStats({ tournamentId, matches }) {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeStatTab, setActiveStatTab] = useState('batting');
    useEffect(() => {
        fetchStats();
    }, [tournamentId]);
    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await matchAPI.getTournamentStats(tournamentId);
            // API returns directly in the response.data due to axios interceptor
            // Format: { success: true, data: { playerStats: [...] } }
            // The api.ts already returns response.data
            const playerStats = response?.data?.playerStats || response?.playerStats || [];
            if (playerStats) {
                setStats(playerStats);
            }
        }
        catch (error) {
            console.error('Failed to fetch tournament stats:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const sortedByRuns = [...stats].sort((a, b) => b.runs - a.runs);
    const sortedByWickets = [...stats].sort((a, b) => b.wickets - a.wickets);
    const sortedByStrikeRate = [...stats].filter(s => Number(s.strikeRate) > 0).sort((a, b) => Number(b.strikeRate) - Number(a.strikeRate));
    const sortedByEconomy = [...stats].filter(s => Number(s.economy) > 0 && s.overs > 0).sort((a, b) => Number(a.economy) - Number(b.economy));
    if (loading) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto" }), _jsx("p", { className: "text-gray-400 mt-4", children: "Loading statistics..." })] }));
    }
    if (stats.length === 0) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-gray-400 text-lg", children: "No statistics available yet." }), _jsx("p", { className: "text-gray-500 mt-2", children: "Play some matches to see player statistics!" })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex gap-2 mb-6", children: [_jsx("button", { onClick: () => setActiveStatTab('batting'), className: `px-4 py-2 rounded-lg font-medium ${activeStatTab === 'batting' ? 'bg-green-600' : 'bg-gray-700'}`, children: "Batting Stats" }), _jsx("button", { onClick: () => setActiveStatTab('bowling'), className: `px-4 py-2 rounded-lg font-medium ${activeStatTab === 'bowling' ? 'bg-red-600' : 'bg-gray-700'}`, children: "Bowling Stats" })] }), activeStatTab === 'batting' && (_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "Top Run Scorers" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-700", children: [_jsx("th", { className: "p-3", children: "Player" }), _jsx("th", { className: "p-3", children: "Matches" }), _jsx("th", { className: "p-3", children: "Runs" }), _jsx("th", { className: "p-3", children: "Balls" }), _jsx("th", { className: "p-3", children: "4s" }), _jsx("th", { className: "p-3", children: "6s" }), _jsx("th", { className: "p-3", children: "Avg" }), _jsx("th", { className: "p-3", children: "SR" })] }) }), _jsx("tbody", { children: sortedByRuns.slice(0, 10).map((player, index) => (_jsxs("tr", { className: "border-b border-gray-700 hover:bg-gray-700/50", children: [_jsxs("td", { className: "p-3 font-medium", children: [index + 1, ". ", player.playerName] }), _jsx("td", { className: "p-3", children: player.matches }), _jsx("td", { className: "p-3 text-green-400 font-bold", children: player.runs }), _jsx("td", { className: "p-3", children: player.balls }), _jsx("td", { className: "p-3", children: player.fours }), _jsx("td", { className: "p-3", children: player.sixes }), _jsx("td", { className: "p-3", children: player.average }), _jsx("td", { className: "p-3", children: player.strikeRate })] }, player.playerId))) })] }) }), _jsx("h3", { className: "text-xl font-bold mt-8 mb-4", children: "Best Strike Rates (Min 50 balls)" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-700", children: [_jsx("th", { className: "p-3", children: "Player" }), _jsx("th", { className: "p-3", children: "Runs" }), _jsx("th", { className: "p-3", children: "Balls" }), _jsx("th", { className: "p-3", children: "Strike Rate" })] }) }), _jsx("tbody", { children: sortedByStrikeRate.slice(0, 10).map((player, index) => (_jsxs("tr", { className: "border-b border-gray-700 hover:bg-gray-700/50", children: [_jsxs("td", { className: "p-3 font-medium", children: [index + 1, ". ", player.playerName] }), _jsx("td", { className: "p-3", children: player.runs }), _jsx("td", { className: "p-3", children: player.balls }), _jsx("td", { className: "p-3 text-green-400 font-bold", children: player.strikeRate })] }, player.playerId))) })] }) })] })), activeStatTab === 'bowling' && (_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "Top Wicket Takers" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-700", children: [_jsx("th", { className: "p-3", children: "Player" }), _jsx("th", { className: "p-3", children: "Matches" }), _jsx("th", { className: "p-3", children: "Wickets" }), _jsx("th", { className: "p-3", children: "Overs" }), _jsx("th", { className: "p-3", children: "Runs" }), _jsx("th", { className: "p-3", children: "Economy" })] }) }), _jsx("tbody", { children: sortedByWickets.slice(0, 10).map((player, index) => (_jsxs("tr", { className: "border-b border-gray-700 hover:bg-gray-700/50", children: [_jsxs("td", { className: "p-3 font-medium", children: [index + 1, ". ", player.playerName] }), _jsx("td", { className: "p-3", children: player.matches }), _jsx("td", { className: "p-3 text-red-400 font-bold", children: player.wickets }), _jsx("td", { className: "p-3", children: player.overs }), _jsx("td", { className: "p-3", children: player.runs }), _jsx("td", { className: "p-3", children: player.economy })] }, player.playerId))) })] }) }), _jsx("h3", { className: "text-xl font-bold mt-8 mb-4", children: "Best Economy Rates (Min 10 overs)" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-700", children: [_jsx("th", { className: "p-3", children: "Player" }), _jsx("th", { className: "p-3", children: "Overs" }), _jsx("th", { className: "p-3", children: "Wickets" }), _jsx("th", { className: "p-3", children: "Runs" }), _jsx("th", { className: "p-3", children: "Economy" })] }) }), _jsx("tbody", { children: sortedByEconomy.slice(0, 10).map((player, index) => (_jsxs("tr", { className: "border-b border-gray-700 hover:bg-gray-700/50", children: [_jsxs("td", { className: "p-3 font-medium", children: [index + 1, ". ", player.playerName] }), _jsx("td", { className: "p-3", children: player.overs }), _jsx("td", { className: "p-3", children: player.wickets }), _jsx("td", { className: "p-3", children: player.runs }), _jsx("td", { className: "p-3 text-green-400 font-bold", children: player.economy })] }, player.playerId))) })] }) })] }))] }));
}
