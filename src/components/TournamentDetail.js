import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI, teamAPI, matchAPI } from '../services/api';
export default function TournamentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [showMatchForm, setShowMatchForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [localMatchStatuses, setLocalMatchStatuses] = useState({});
    const socketRef = useRef(null);
    const [matchForm, setMatchForm] = useState({
        tournament: '',
        team1: '',
        team2: '',
        date: '',
        venue: '',
        tossWinner: '',
        tossChoice: '',
        matchType: 'T20',
        videoLink: '',
    });
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [innings, setInnings] = useState({
        battingTeam: 'team1',
        totalRuns: 0,
        wickets: 0,
        totalBalls: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        strikerIndex: 0,
        nonStrikerIndex: 1,
        lineup: Array.from({ length: 11 }, (_, i) => ({
            id: String(i + 1),
            name: `Player ${i + 1}`,
            runsScored: 0,
            ballsFaced: 0,
            isOut: false,
        })),
    });
    const [showTossModal, setShowTossModal] = useState(false);
    const [showPlayerModal, setShowPlayerModal] = useState(false);
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [matchSetupStage, setMatchSetupStage] = useState('toss');
    const [pendingMatchForToss, setPendingMatchForToss] = useState(null);
    const [selectedTossWinner, setSelectedTossWinner] = useState('');
    const [selectedTossDecision, setSelectedTossDecision] = useState('');
    const [selectedStriker, setSelectedStriker] = useState('');
    const [selectedNonStriker, setSelectedNonStriker] = useState('');
    const [selectedBowler, setSelectedBowler] = useState('');
    useEffect(() => {
        if (id) {
            loadData();
        }
        return () => {
            socketRef.current?.close();
        };
    }, [id]);
    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchTournament(),
                fetchMatches(),
                fetchTeams(),
            ]);
        }
        catch (err) {
            setError('Failed to load tournament data');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchTournament = async () => {
        try {
            const response = await tournamentAPI.getTournament(id);
            setTournament(response.data);
        }
        catch (error) {
            console.error('Tournament fetch failed:', error);
        }
    };
    const fetchMatches = async () => {
        try {
            const response = await matchAPI.getMatches();
            const matchesArray = Array.isArray(response.data) ? response.data : response.data?.matches || [];
            setMatches(matchesArray.filter((m) => m.tournamentId === id));
        }
        catch (error) {
            console.error('Matches fetch failed:', error);
            setMatches([]);
        }
    };
    const fetchTeams = async () => {
        try {
            const response = await teamAPI.getTeams();
            const teamsArray = Array.isArray(response.data) ? response.data : response.data?.teams || [];
            setTeams(teamsArray.filter((t) => t.tournamentId === id));
        }
        catch (error) {
            console.error('Teams fetch failed:', error);
            setTeams([]);
        }
    };
    const handleStatusChange = async (match, newStatus) => {
        const matchId = match._id;
        setLocalMatchStatuses(prev => ({ ...prev, [matchId]: newStatus }));
        try {
            await matchAPI.updateStatus(matchId, newStatus); // FIXED: was updateMatchStatus
            await fetchMatches();
        }
        catch (error) {
            setLocalMatchStatuses(prev => {
                const copy = { ...prev };
                delete copy[matchId];
                return copy;
            });
            alert(`Status update failed: ${error.response?.data?.message || error.message}`);
        }
    };
    const handleTossClick = (match) => {
        if (match.status !== 'upcoming') {
            alert('Toss only for upcoming matches');
            return;
        }
        setPendingMatchForToss(match);
        setSelectedTossWinner('');
        setSelectedTossDecision('');
        setShowTossModal(true);
    };
    const handleTossSave = async () => {
        if (!pendingMatchForToss || !selectedTossWinner || !selectedTossDecision) {
            return alert('Complete all fields');
        }
        try {
            await matchAPI.updateMatch(pendingMatchForToss._id, {
                tossWinner: selectedTossWinner,
                tossDecision: selectedTossDecision
            });
            setShowTossModal(false);
            await fetchMatches();
        }
        catch (error) {
            alert(`Toss failed: ${error.response?.data?.message || error.message}`);
        }
    };
    if (loading)
        return _jsx("div", { className: "p-12 text-center", children: "Loading..." });
    if (!tournament)
        return _jsx("div", { className: "p-12 text-center text-gray-400", children: "Tournament not found" });
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8", children: [_jsx("div", { className: "max-w-6xl mx-auto mb-12", children: _jsxs("div", { className: "bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl", children: [_jsx("h1", { className: "text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent", children: tournament.name }), _jsxs("div", { className: "flex items-center gap-4 text-xl text-gray-300 mb-6", children: [_jsx("span", { className: `px-4 py-2 rounded-full font-bold text-sm ${tournament.status === 'live' ? 'bg-green-500 text-white' :
                                        tournament.status === 'upcoming' ? 'bg-blue-500 text-white' :
                                            'bg-gray-500 text-white'}`, children: tournament.status?.toUpperCase() }), _jsx("span", { children: tournament.format }), _jsx("span", { children: tournament.venue }), _jsx("span", { children: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD' })] }), _jsx("p", { className: "text-gray-400 text-lg", children: tournament.description })] }) }), _jsxs("div", { className: "max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-12", children: [_jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-blue-400", children: matches.length }), _jsx("div", { className: "text-gray-400", children: "Matches" })] }), _jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-emerald-400", children: teams.length }), _jsx("div", { className: "text-gray-400", children: "Teams" })] }), _jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-orange-400", children: matches.filter(m => m.status === 'live').length }), _jsx("div", { className: "text-gray-400", children: "Live" })] }), _jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center", children: [_jsx("div", { className: "text-3xl font-bold text-purple-400", children: tournament.bracket?.length || 0 }), _jsx("div", { className: "text-gray-400", children: "Rounds" })] })] }), _jsxs("div", { className: "max-w-6xl mx-auto mb-12 flex flex-wrap gap-4 justify-center", children: [_jsx("button", { className: "px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all", children: "+ New Match" }), tournament.status === 'upcoming' && (_jsx("button", { className: "px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-orange-500/25 transition-all", children: "Generate Bracket" }))] }), _jsx("div", { className: "max-w-6xl mx-auto", children: _jsx("div", { className: "grid gap-6", children: matches.map(match => (_jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all", children: [_jsxs("div", { className: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: `px-4 py-2 rounded-full font-bold text-sm ${match.status === 'live' ? 'bg-green-500 text-white' :
                                                    match.status === 'upcoming' ? 'bg-blue-500 text-white' :
                                                        'bg-gray-500 text-white'}`, children: match.status?.toUpperCase() }), _jsxs("h3", { className: "text-2xl font-bold", children: [match.team1?.name, " vs ", match.team2?.name] })] }), _jsxs("div", { className: "text-xl font-mono bg-gray-800 px-4 py-2 rounded-xl", children: [match.team1Score, "/", match.team1Wickets, " (", match.team1Overs, ") RRR ", match.team1RRR?.toFixed(2)] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("select", { value: localMatchStatuses[match._id] || match.status || '', onChange: (e) => handleStatusChange(match, e.target.value), className: "px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-600 focus:border-blue-500", children: [_jsx("option", { value: "upcoming", children: "Upcoming" }), _jsx("option", { value: "live", children: "Live" }), _jsx("option", { value: "completed", children: "Completed" })] }), _jsx("button", { className: "px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl", children: "View Scorecard" }), match.status === 'upcoming' && (_jsx("button", { onClick: () => handleTossClick(match), className: "px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2", children: "Toss \uD83E\uDE99" }))] })] }, match._id))) }) }), showTossModal && (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-white text-center", children: "Toss Decision" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("select", { value: selectedTossWinner, onChange: (e) => setSelectedTossWinner(e.target.value), className: "w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white", children: [_jsx("option", { value: "", children: "Select Toss Winner" }), _jsx("option", { value: pendingMatchForToss?.team1?._id, children: pendingMatchForToss?.team1?.name }), _jsx("option", { value: pendingMatchForToss?.team2?._id, children: pendingMatchForToss?.team2?.name })] }), _jsxs("select", { value: selectedTossDecision, onChange: (e) => setSelectedTossDecision(e.target.value), className: "w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white", children: [_jsx("option", { value: "", children: "Toss Decision" }), _jsx("option", { value: "bat", children: "Bat First" }), _jsx("option", { value: "bowl", children: "Bowl First" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: handleTossSave, disabled: !selectedTossWinner || !selectedTossDecision, className: "flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all", children: "Save Toss" }), _jsx("button", { onClick: () => setShowTossModal(false), className: "flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all", children: "Cancel" })] })] })] }) }))] }));
}
