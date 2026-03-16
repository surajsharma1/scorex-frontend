import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import { RotateCcw, LogOut, AlertTriangle, X, RefreshCw, Users } from 'lucide-react';
// ─── Sub-panel: Run buttons ───────────────────────────────────────────────────
function RunButtons({ onSelect, disabled = false, extraLabel = '' }) {
    return (_jsx("div", { className: "grid grid-cols-4 gap-2", children: [0, 1, 2, 3, 4, 5, 6].map(r => (_jsx("button", { disabled: disabled, onClick: () => onSelect(r), className: "py-3 rounded-xl font-bold text-lg bg-slate-700 hover:bg-slate-600 text-white transition-all active:scale-95 disabled:opacity-40", children: extraLabel ? `${extraLabel}+${r}` : (r === 0 ? '•' : r) }, r))) }));
}
// ─── Wicket types ─────────────────────────────────────────────────────────────
const WICKET_TYPES = [
    { id: 'bowled', label: 'Bowled' },
    { id: 'caught', label: 'Caught' },
    { id: 'lbw', label: 'LBW' },
    { id: 'run_out', label: 'Run Out' },
    { id: 'stumped', label: 'Stumped' },
    { id: 'hit_wicket', label: 'Hit Wicket' },
    { id: 'handled_ball', label: 'Handled Ball' },
    { id: 'obstructing', label: 'Obstructing' },
    { id: 'timed_out', label: 'Timed Out' },
    { id: 'retired_hurt', label: 'Retired Hurt' },
];
// ─── Toss Modal ───────────────────────────────────────────────────────────────
function TossModal({ match, onDone }) {
    const [tossWinner, setTossWinner] = useState('');
    const [decision, setDecision] = useState('bat');
    const submit = () => {
        if (!tossWinner)
            return;
        const team = match.team1._id === tossWinner || match.team1?._id === tossWinner
            ? match.team1 : match.team2;
        const other = team._id === (match.team1._id || match.team1) ? match.team2 : match.team1;
        const battingTeam = decision === 'bat' ? team : other;
        const bowlingTeam = decision === 'bat' ? other : team;
        onDone({
            tossWinnerId: tossWinner,
            tossWinnerName: team.name || team.team1Name,
            tossDecision: decision,
            battingTeamId: battingTeam._id,
            battingTeamName: battingTeam.name,
            bowlingTeamId: bowlingTeam._id,
            bowlingTeamName: bowlingTeam.name,
        });
    };
    const t1 = match.team1;
    const t2 = match.team2;
    return (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md", children: [_jsxs("h2", { className: "text-2xl font-black text-white mb-6 text-center flex items-center justify-center gap-2", children: [_jsx("span", { className: "text-3xl", children: "\uD83E\uDE99" }), " Toss"] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-2 block", children: "Who won the toss?" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: [t1, t2].map(team => (_jsx("button", { onClick: () => setTossWinner(team._id), className: `py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${tossWinner === team._id ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`, children: team.name }, team._id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-2 block", children: "Decision" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: ['bat', 'bowl'].map(d => (_jsx("button", { onClick: () => setDecision(d), className: `py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 capitalize ${decision === d ? 'border-green-500 bg-green-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`, children: d === 'bat' ? '🏏 Bat' : '🎳 Bowl' }, d))) })] }), _jsx("button", { onClick: submit, disabled: !tossWinner, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all", children: "Continue to Player Selection" })] })] }) }));
}
// ─── Player Selection Modal ───────────────────────────────────────────────────
function PlayerSelectModal({ match, battingTeamId, bowlingTeamId, inningsNum, title, onDone, requireAll = true }) {
    const [striker, setStriker] = useState('');
    const [nonStriker, setNonStriker] = useState('');
    const [bowler, setBowler] = useState('');
    // Get batting/bowling teams
    const battingTeam = match.team1?._id === battingTeamId || match.team1?.toString() === battingTeamId
        ? match.team1 : match.team2;
    const bowlingTeam = battingTeam === match.team1 ? match.team2 : match.team1;
    const battingPlayers = battingTeam?.players || [];
    const bowlingPlayers = bowlingTeam?.players || [];
    const valid = requireAll ? (striker && nonStriker && bowler && striker !== nonStriker) : (striker || nonStriker || bowler);
    return (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg my-4", children: [_jsxs("h2", { className: "text-xl font-black text-white mb-5 flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5 text-blue-400" }), " ", title] }), _jsxs("p", { className: "text-slate-500 text-xs mb-4", children: ["Innings ", inningsNum, " | ", battingTeam?.name, " batting vs ", bowlingTeam?.name] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1.5 block", children: "\uD83C\uDFCF Striker (On Strike)" }), battingPlayers.length > 0 ? (_jsxs("select", { value: striker, onChange: e => setStriker(e.target.value), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "-- Select Striker --" }), battingPlayers.filter((p) => p.name !== nonStriker).map((p) => (_jsx("option", { value: p.name, children: p.name }, p._id || p.name)))] })) : (_jsx("input", { value: striker, onChange: e => setStriker(e.target.value), placeholder: "Enter striker name", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" }))] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1.5 block", children: "\uD83C\uDFCF Non-Striker" }), battingPlayers.length > 0 ? (_jsxs("select", { value: nonStriker, onChange: e => setNonStriker(e.target.value), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "-- Select Non-Striker --" }), battingPlayers.filter((p) => p.name !== striker).map((p) => (_jsx("option", { value: p.name, children: p.name }, p._id || p.name)))] })) : (_jsx("input", { value: nonStriker, onChange: e => setNonStriker(e.target.value), placeholder: "Enter non-striker name", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" }))] }), _jsxs("div", { children: [_jsx("label", { className: "text-slate-400 text-sm font-semibold mb-1.5 block", children: "\uD83C\uDFB3 Bowler" }), bowlingPlayers.length > 0 ? (_jsxs("select", { value: bowler, onChange: e => setBowler(e.target.value), className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "-- Select Bowler --" }), bowlingPlayers.map((p) => (_jsx("option", { value: p.name, children: p.name }, p._id || p.name)))] })) : (_jsx("input", { value: bowler, onChange: e => setBowler(e.target.value), placeholder: "Enter bowler name", className: "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" }))] }), _jsx("button", { onClick: () => valid && onDone({ striker, nonStriker, bowler }), disabled: !valid, className: "w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all mt-2", children: "Start Scoring \u2192" })] })] }) }));
}
// ─── Innings Break ────────────────────────────────────────────────────────────
function InningsBreak({ match, onContinue }) {
    const innings1 = match.innings?.[0];
    const target = (innings1?.score || 0) + 1;
    return (_jsx("div", { className: "fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-slate-900 border border-blue-500/30 rounded-2xl p-8 w-full max-w-sm text-center", children: [_jsx("div", { className: "text-5xl mb-4", children: "\uD83C\uDFCF" }), _jsx("h2", { className: "text-2xl font-black text-white mb-2", children: "Innings Break" }), _jsx("p", { className: "text-slate-400 mb-6", children: "1st Innings Complete" }), _jsxs("div", { className: "bg-slate-800 rounded-xl p-4 mb-6", children: [_jsxs("p", { className: "text-slate-400 text-sm mb-1", children: [innings1?.teamName || 'Team 1', " scored"] }), _jsxs("p", { className: "text-4xl font-black text-white", children: [innings1?.score, "/", innings1?.wickets] }), _jsxs("p", { className: "text-slate-400 text-sm mt-1", children: [innings1?.overs?.toFixed ? innings1.overs.toFixed(1) : 0, " overs"] })] }), _jsxs("div", { className: "bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 mb-6", children: [_jsxs("p", { className: "text-blue-400 font-bold text-lg", children: ["Target: ", target] }), _jsxs("p", { className: "text-slate-400 text-sm", children: ["2nd innings team needs ", target, " to win"] })] }), _jsx("button", { onClick: onContinue, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all", children: "Select Players for 2nd Innings \u2192" })] }) }));
}
// ─── MAIN LiveScoring ─────────────────────────────────────────────────────────
export default function LiveScoring() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('toss');
    const [panel, setPanel] = useState('main');
    const [submitting, setSubmitting] = useState(false);
    const [lastBall, setLastBall] = useState('');
    const [error, setError] = useState('');
    const [wicketModal, setWicketModal] = useState({ open: false, baseData: {} });
    const [tossData, setTossData] = useState(null);
    // Fetch match
    const fetchMatch = useCallback(async () => {
        if (!id)
            return;
        try {
            const res = await matchAPI.getMatch(id);
            const m = res.data.data;
            setMatch(m);
            // Determine step from match state
            if (m.status === 'completed')
                setStep('done');
            else if (m.status === 'live') {
                const innings = m.innings?.[m.currentInnings - 1];
                if (!innings || (!m.strikerName && !m.nonStrikerName))
                    setStep('players');
                else
                    setStep('scoring');
            }
            else
                setStep('toss');
        }
        catch (e) {
            setError('Failed to load match');
        }
        finally {
            setLoading(false);
        }
    }, [id]);
    useEffect(() => {
        fetchMatch();
    }, [fetchMatch]);
    useEffect(() => {
        if (!id)
            return;
        socket.emit('joinMatch', id);
        socket.on('scoreUpdate', (data) => {
            if (data.match)
                setMatch(data.match);
        });
        socket.on('inningsEnded', () => fetchMatch());
        socket.on('matchEnded', (data) => {
            setMatch(data);
            setStep('done');
        });
        return () => {
            socket.emit('leaveMatch', id);
            socket.off('scoreUpdate');
            socket.off('inningsEnded');
            socket.off('matchEnded');
        };
    }, [id, fetchMatch]);
    // ── Toss done ──────────────────────────────────────────────────────────────
    const handleTossDone = (data) => {
        setTossData(data);
        setStep('players');
    };
    // ── Players selected (start match or select mid-innings) ───────────────────
    const handlePlayersDone = async (players) => {
        if (!id || !match)
            return;
        setSubmitting(true);
        try {
            if (match.status !== 'live') {
                // Start match with toss + players
                await matchAPI.startMatch(id, { ...tossData, ...players });
            }
            else {
                // Mid-innings player selection (after over or wicket)
                await matchAPI.selectPlayers(id, players);
            }
            await fetchMatch();
            setStep('scoring');
            setPanel('main');
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed to start/select players');
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── Submit ball ────────────────────────────────────────────────────────────
    const submitBall = async (data) => {
        if (!id || submitting)
            return;
        setSubmitting(true);
        setError('');
        try {
            const res = await matchAPI.addBall(id, data);
            const result = res.data.data;
            const updatedMatch = res.data.match;
            setMatch(updatedMatch);
            setLastBall(result?.ballDescription || '');
            setPanel('main');
            if (result?.matchEnded) {
                setStep('done');
            }
            else if (result?.inningsEnded) {
                setStep('inningsBreak');
            }
            else if (result?.needPlayerSelection) {
                setStep('playerSelect');
            }
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed to record ball');
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── Undo ───────────────────────────────────────────────────────────────────
    const handleUndo = async () => {
        if (!id || submitting)
            return;
        if (!confirm('Undo last ball?'))
            return;
        setSubmitting(true);
        try {
            const res = await matchAPI.undoBall(id);
            setMatch(res.data.data);
            setLastBall('↩ Undone');
            setPanel('main');
        }
        catch (e) {
            setError(e.response?.data?.message || 'Cannot undo');
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── End innings manually ───────────────────────────────────────────────────
    const handleEndInnings = async () => {
        if (!confirm('End current innings?'))
            return;
        setSubmitting(true);
        try {
            await matchAPI.endInnings(id);
            await fetchMatch();
            setStep('inningsBreak');
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── End match ──────────────────────────────────────────────────────────────
    const handleEndMatch = async () => {
        if (!confirm('End the match?'))
            return;
        setSubmitting(true);
        try {
            await matchAPI.endMatch(id, {});
            await fetchMatch();
            setStep('done');
        }
        catch (e) {
            setError(e.response?.data?.message || 'Failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    // ── Innings break continue ─────────────────────────────────────────────────
    const handleInningsBreakContinue = () => {
        setStep('playerSelect');
    };
    // ── Computed values ────────────────────────────────────────────────────────
    const innings = match?.innings?.[match?.currentInnings - 1] || {};
    const striker = innings?.batsmen?.find((b) => b.isStriker && !b.isOut);
    const nonStriker = innings?.batsmen?.find((b) => !b.isStriker && !b.isOut);
    const bowler = innings?.bowlers?.find((b) => b.name === match?.currentBowlerName);
    const score = innings?.score || 0;
    const wickets = innings?.wickets || 0;
    const oversDisplay = `${innings?.overs || 0}.${innings?.balls ? innings.balls % 6 : 0}`;
    const runRate = innings?.runRate?.toFixed(2) || '0.00';
    const target = innings?.targetScore;
    const requiredRuns = innings?.requiredRuns;
    const rrr = innings?.requiredRunRate?.toFixed(2);
    // Current over balls from history
    const ballsInOver = innings?.balls ? innings.balls % 6 : 0;
    const history = innings?.ballHistory || [];
    const thisOverBalls = history.slice(-ballsInOver);
    // ── Get batting/bowling team IDs for player selection ─────────────────────
    const currentBattingTeamId = innings?.teamId || tossData?.battingTeamId || match?.team1?._id;
    const currentBowlingTeamId = currentBattingTeamId === match?.team1?._id ? match?.team2?._id : match?.team1?._id;
    // ── Wicket modal handler ───────────────────────────────────────────────────
    const openWicketModal = (baseData = {}) => {
        setWicketModal({ open: true, baseData });
    };
    if (loading)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400", children: "Loading scoreboard..." })] }) }));
    if (!match)
        return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-red-400 text-xl mb-4", children: "Match not found" }), _jsx("button", { onClick: () => navigate(-1), className: "text-blue-400 hover:underline", children: "Go back" })] }) }));
    // ── DONE state ─────────────────────────────────────────────────────────────
    if (step === 'done')
        return (_jsx("div", { className: "min-h-screen bg-slate-950 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center max-w-md w-full", children: [_jsx("div", { className: "text-5xl mb-4", children: "\uD83C\uDFC6" }), _jsx("h2", { className: "text-2xl font-black text-white mb-2", children: "Match Completed" }), match.winnerName && _jsxs("p", { className: "text-green-400 text-lg font-semibold mb-4", children: [match.winnerName, " won!"] }), match.resultSummary && _jsx("p", { className: "text-slate-400 mb-6", children: match.resultSummary }), _jsx("button", { onClick: () => navigate(-1), className: "w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all", children: "Back to Match" })] }) }));
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 text-white flex flex-col", children: [step === 'toss' && _jsx(TossModal, { match: match, onDone: handleTossDone }), (step === 'players' || step === 'playerSelect') && (_jsx(PlayerSelectModal, { match: match, battingTeamId: currentBattingTeamId, bowlingTeamId: currentBowlingTeamId, inningsNum: match.currentInnings || 1, title: step === 'players' ? 'Select Opening Players' : 'Select Players for Next Over', onDone: handlePlayersDone })), step === 'inningsBreak' && _jsx(InningsBreak, { match: match, onContinue: handleInningsBreakContinue }), wicketModal.open && (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: "Wicket Type" }), _jsx("button", { onClick: () => setWicketModal({ open: false, baseData: {} }), className: "text-slate-500 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: WICKET_TYPES.map(wt => (_jsx("button", { onClick: () => {
                                    setWicketModal({ open: false, baseData: {} });
                                    submitBall({ ...wicketModal.baseData, wicket: true, outType: wt.id, outBatsmanName: match?.strikerName });
                                }, className: "py-2.5 px-3 rounded-xl text-sm font-semibold bg-red-900/40 hover:bg-red-700/60 border border-red-700/40 text-red-200 transition-all", children: wt.label }, wt.id))) }), _jsxs("div", { className: "mt-3 pt-3 border-t border-slate-700", children: [_jsx("p", { className: "text-slate-500 text-xs mb-2", children: "Runs before wicket" }), _jsx("div", { className: "grid grid-cols-4 gap-1.5", children: [0, 1, 2, 3].map(r => (_jsx("button", { onClick: () => {
                                            setWicketModal({ open: false, baseData: {} });
                                            submitBall({ ...wicketModal.baseData, runs: r, wicket: true, outType: wicketModal.baseData.outType || 'bowled', outBatsmanName: match?.strikerName });
                                        }, className: "py-2 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all", children: r }, r))) })] })] }) })), _jsx("div", { className: "bg-slate-900 border-b border-slate-800 px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-bold text-white text-sm", children: match.name }), _jsxs("p", { className: "text-slate-500 text-xs", children: [match.venue, " \u00B7 ", match.format] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: handleUndo, disabled: submitting, className: "flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-400 text-xs font-semibold transition-all disabled:opacity-40", children: [_jsx(RotateCcw, { className: "w-3.5 h-3.5" }), " Undo"] }), _jsxs("button", { onClick: () => navigate(-1), className: "flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-all", children: [_jsx(LogOut, { className: "w-3.5 h-3.5" }), " Leave"] })] })] }) }), _jsxs("div", { className: "bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-slate-500 text-xs font-semibold uppercase tracking-wider", children: [innings?.teamName || match.team1Name, " \u00B7 Inn ", match.currentInnings] }), _jsxs("div", { className: "flex items-end gap-2 mt-0.5", children: [_jsxs("span", { className: "text-5xl font-black text-white leading-none", children: [score, "/", wickets] }), _jsxs("span", { className: "text-slate-400 text-lg mb-1", children: ["(", oversDisplay, " ov)"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-slate-500 text-xs mb-1", children: "Run Rate" }), _jsx("div", { className: "text-2xl font-black text-green-400", children: runRate }), target && (_jsxs("div", { className: "mt-1", children: [_jsxs("div", { className: "text-xs text-blue-400 font-semibold", children: ["Target ", target] }), _jsxs("div", { className: "text-xs text-slate-400", children: ["Need ", requiredRuns, " @ ", rrr] })] }))] })] }), _jsxs("div", { className: "flex items-center gap-1.5 mb-3", children: [_jsx("span", { className: "text-slate-600 text-xs mr-1", children: "Over:" }), thisOverBalls.map((b, i) => (_jsx("span", { className: `w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold
              ${b.wicket ? 'bg-red-600 text-white' : b.extras ? 'bg-amber-600/80 text-white' : b.runs === 4 ? 'bg-blue-600 text-white' : b.runs === 6 ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`, children: b.wicket ? 'W' : b.extras === 'wide' ? 'Wd' : b.extras === 'nb' ? 'Nb' : (b.runs || '•') }, i))), Array(6 - thisOverBalls.length).fill(0).map((_, i) => (_jsx("span", { className: "w-7 h-7 flex items-center justify-center rounded-full text-xs bg-slate-800/50 text-slate-700", children: "\u00B7" }, `empty-${i}`)))] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { className: "bg-slate-800/60 rounded-xl p-2.5", children: [_jsx("div", { className: "text-slate-500 mb-0.5 flex items-center gap-1", children: "\uD83C\uDFCF Striker" }), _jsx("div", { className: "text-white font-semibold truncate", children: striker?.name || match.strikerName || '–' }), striker && _jsxs("div", { className: "text-slate-400 mt-0.5", children: [striker.runs, "(", striker.balls, ") SR:", striker.strikeRate?.toFixed(0)] })] }), _jsxs("div", { className: "bg-slate-800/60 rounded-xl p-2.5", children: [_jsx("div", { className: "text-slate-500 mb-0.5", children: "\u2B24 Non-Striker" }), _jsx("div", { className: "text-white font-semibold truncate", children: nonStriker?.name || match.nonStrikerName || '–' }), nonStriker && _jsxs("div", { className: "text-slate-400 mt-0.5", children: [nonStriker.runs, "(", nonStriker.balls, ")"] })] }), _jsxs("div", { className: "bg-slate-800/60 rounded-xl p-2.5", children: [_jsx("div", { className: "text-slate-500 mb-0.5", children: "\uD83C\uDFB3 Bowler" }), _jsx("div", { className: "text-white font-semibold truncate", children: bowler?.name || match.currentBowlerName || '–' }), bowler && _jsxs("div", { className: "text-slate-400 mt-0.5", children: [bowler.overs, ".", bowler.balls % 6, "ov ", bowler.runs, "R ", bowler.wickets, "W"] })] })] }), lastBall && (_jsx("div", { className: "mt-2 text-center", children: _jsxs("span", { className: "text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-slate-300", children: ["Last: ", lastBall] }) })), error && (_jsxs("div", { className: "mt-2 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-red-400 flex-shrink-0" }), _jsx("span", { className: "text-red-300 text-xs", children: error }), _jsx("button", { onClick: () => setError(''), className: "ml-auto text-red-400", children: _jsx(X, { className: "w-3.5 h-3.5" }) })] }))] }), _jsxs("div", { className: "flex-1 bg-slate-950 px-4 py-4 overflow-y-auto", children: [panel === 'main' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2", children: "Runs" }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [0, 1, 2, 3, 4, 6].map(r => (_jsx("button", { disabled: submitting, onClick: () => submitBall({ runs: r }), className: `py-5 rounded-2xl font-black text-2xl transition-all active:scale-95 disabled:opacity-40 shadow-lg
                      ${r === 4 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30' :
                                                r === 6 ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30' :
                                                    r === 0 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' :
                                                        'bg-slate-700 hover:bg-slate-600 text-white'}`, children: r === 0 ? '•' : r }, r))) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2", children: "Extras & Wickets" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                                            { label: 'Wide', icon: '↔', panel: 'wide', color: 'bg-amber-600/20 border-amber-600/40 text-amber-300 hover:bg-amber-600/40' },
                                            { label: 'No Ball', icon: '⊘', panel: 'noBall', color: 'bg-orange-600/20 border-orange-600/40 text-orange-300 hover:bg-orange-600/40' },
                                            { label: 'Bye', icon: 'B', panel: 'bye', color: 'bg-teal-600/20 border-teal-600/40 text-teal-300 hover:bg-teal-600/40' },
                                            { label: 'Leg Bye', icon: 'LB', panel: 'legBye', color: 'bg-cyan-600/20 border-cyan-600/40 text-cyan-300 hover:bg-cyan-600/40' },
                                        ].map(btn => (_jsxs("button", { onClick: () => setPanel(btn.panel), className: `py-3 px-4 rounded-xl font-bold text-sm border transition-all flex items-center gap-2 ${btn.color}`, children: [_jsx("span", { className: "font-black", children: btn.icon }), " ", btn.label] }, btn.label))) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { onClick: () => openWicketModal({}), className: "py-4 rounded-2xl font-black text-lg bg-red-700 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-700/30 active:scale-95", children: "OUT! \uD83C\uDFAF" }), _jsx("button", { onClick: () => setPanel('others'), className: "py-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all", children: "Others\u2026" })] })] })), panel === 'wide' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("button", { onClick: () => setPanel('main'), className: "text-slate-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) }), _jsx("h3", { className: "text-white font-bold", children: "Wide Ball" })] }), _jsx("p", { className: "text-slate-500 text-sm", children: "Select extra runs (1 wide already counted)" }), _jsx(RunButtons, { onSelect: r => submitBall({ wide: true, runs: r }), disabled: submitting, extraLabel: "Wd" }), _jsxs("div", { className: "border-t border-slate-800 pt-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-3", children: "Wide + Wicket (run-out, stumped off wide)" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: ['run_out', 'stumped', 'obstructing', 'hit_wicket'].map(wt => (_jsx("button", { onClick: () => { setPanel('main'); submitBall({ wide: true, runs: 0, wicket: true, outType: wt, outBatsmanName: match?.strikerName }); }, className: "py-2.5 px-3 rounded-xl text-xs font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 transition-all capitalize", children: wt.replace('_', ' ') }, wt))) })] })] })), panel === 'noBall' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("button", { onClick: () => setPanel('main'), className: "text-slate-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) }), _jsx("h3", { className: "text-white font-bold", children: "No Ball" })] }), _jsx("p", { className: "text-slate-500 text-sm", children: "Runs scored off the bat (1 no-ball extra auto-added)" }), _jsx(RunButtons, { onSelect: r => submitBall({ noBall: true, runs: r }), disabled: submitting, extraLabel: "NB" }), _jsxs("div", { className: "border-t border-slate-800 pt-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-3", children: "No Ball + Wicket (run out only)" }), _jsx("button", { onClick: () => { setPanel('main'); submitBall({ noBall: true, runs: 0, wicket: true, outType: 'run_out', outBatsmanName: match?.strikerName }); }, className: "py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 transition-all w-full", children: "Run Out (off No Ball)" })] })] })), panel === 'bye' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("button", { onClick: () => setPanel('main'), className: "text-slate-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) }), _jsx("h3", { className: "text-white font-bold", children: "Byes" })] }), _jsx("p", { className: "text-slate-500 text-sm", children: "Runs scored as byes (ball missed bat and keeper)" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: [1, 2, 3, 4].map(r => (_jsxs("button", { disabled: submitting, onClick: () => { setPanel('main'); submitBall({ bye: r }); }, className: "py-4 rounded-xl font-bold text-lg bg-teal-900/40 hover:bg-teal-700/60 border border-teal-700/40 text-teal-200 transition-all", children: ["B", r] }, r))) }), _jsxs("div", { className: "border-t border-slate-800 pt-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-3", children: "Bye + Wicket (run out)" }), _jsx("button", { onClick: () => { setPanel('main'); submitBall({ bye: 0, wicket: true, outType: 'run_out', outBatsmanName: match?.strikerName }); }, className: "py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 transition-all w-full", children: "Run Out (off Bye)" })] })] })), panel === 'legBye' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("button", { onClick: () => setPanel('main'), className: "text-slate-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) }), _jsx("h3", { className: "text-white font-bold", children: "Leg Byes" })] }), _jsx("p", { className: "text-slate-500 text-sm", children: "Runs scored off the body (leg byes)" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: [1, 2, 3, 4].map(r => (_jsxs("button", { disabled: submitting, onClick: () => { setPanel('main'); submitBall({ legBye: r }); }, className: "py-4 rounded-xl font-bold text-lg bg-cyan-900/40 hover:bg-cyan-700/60 border border-cyan-700/40 text-cyan-200 transition-all", children: ["LB", r] }, r))) }), _jsxs("div", { className: "border-t border-slate-800 pt-4", children: [_jsx("p", { className: "text-slate-500 text-xs mb-3", children: "Leg Bye + Wicket (run out)" }), _jsx("button", { onClick: () => { setPanel('main'); submitBall({ legBye: 0, wicket: true, outType: 'run_out', outBatsmanName: match?.strikerName }); }, className: "py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/50 border border-red-700/30 text-red-200 transition-all w-full", children: "Run Out (off Leg Bye)" })] })] })), panel === 'others' && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("button", { onClick: () => setPanel('main'), className: "text-slate-400 hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) }), _jsx("h3", { className: "text-white font-bold", children: "Other Actions" })] }), _jsx("button", { onClick: () => { setPanel('main'); submitBall({ retired: true }); }, className: "w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all text-left", children: "\uD83D\uDEB6 Retired Hurt (batsman retires)" }), _jsx("button", { onClick: () => { setPanel('main'); setStep('playerSelect'); }, className: "w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all text-left", children: "\uD83D\uDD04 Player Substitution (change player)" }), [1, 2, 3, 4, 5].map(p => (_jsxs("button", { onClick: () => { setPanel('main'); submitBall({ penalty: p }); }, className: "w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all text-left", children: ["\u26A1 +", p, " Penalty Run", p > 1 ? 's' : ''] }, p))), _jsxs("div", { className: "border-t border-slate-800 pt-3", children: [_jsx("button", { onClick: handleEndInnings, disabled: submitting, className: "w-full py-3 px-4 rounded-xl text-sm font-semibold bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 transition-all disabled:opacity-40", children: "\uD83D\uDD1A End Innings Manually" }), _jsx("button", { onClick: handleEndMatch, disabled: submitting, className: "w-full py-3 px-4 rounded-xl text-sm font-semibold bg-red-900/30 hover:bg-red-700/40 border border-red-700/40 text-red-300 transition-all mt-2 disabled:opacity-40", children: "\uD83C\uDFC1 End Match" })] })] }))] }), _jsxs("div", { className: "bg-slate-900 border-t border-slate-800 px-4 py-3 grid grid-cols-2 gap-3", children: [_jsxs("button", { onClick: handleEndInnings, disabled: submitting, className: "py-3 rounded-xl font-semibold text-sm bg-orange-900/30 hover:bg-orange-700/40 border border-orange-700/40 text-orange-300 transition-all disabled:opacity-40 flex items-center justify-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), " Change Inning"] }), _jsxs("button", { onClick: () => navigate(-1), className: "py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all flex items-center justify-center gap-2", children: [_jsx(LogOut, { className: "w-4 h-4" }), " Leave & Save"] })] }), submitting && (_jsxs("div", { className: "fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-300 flex items-center gap-2 shadow-xl z-40", children: [_jsx("div", { className: "w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }), "Recording..."] }))] }));
}
