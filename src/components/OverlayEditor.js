import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Eye, Zap, X, Maximize2, Minimize2, Plus, Trash2, Edit, Copy, RefreshCw, ExternalLink, Link } from 'lucide-react';
import { overlayAPI, matchAPI, tournamentAPI } from '../services/api';
// Level 1 (Scoreboard) overlays
const LEVEL1_OVERLAYS = [
    { id: 'lvl1-broadcast-bar', name: 'Broadcast Bar', file: 'lvl1-broadcast-bar.html', category: 'Scoreboard', color: 'from-blue-600 to-indigo-800' },
    { id: 'lvl1-curved-compact', name: 'Curved Compact', file: 'lvl1-curved-compact.html', category: 'Scoreboard', color: 'from-gray-600 to-gray-800' },
    { id: 'lvl1-dark-angular', name: 'Dark Angular', file: 'lvl1-dark-angular.html', category: 'Scoreboard', color: 'from-gray-800 to-black' },
    { id: 'lvl1-grass-theme', name: 'Grass Theme', file: 'lvl1-grass-theme.html', category: 'Scoreboard', color: 'from-green-600 to-green-800' },
    { id: 'lvl1-high-vis', name: 'High Visibility', file: 'lvl1-high-vis.html', category: 'Scoreboard', color: 'from-yellow-500 to-orange-600' },
    { id: 'lvl1-minimal-dark', name: 'Minimal Dark', file: 'lvl1-minimal-dark.html', category: 'Scoreboard', color: 'from-gray-700 to-gray-900' },
    { id: 'lvl1-modern-bar', name: 'Modern Bar', file: 'lvl1-modern-bar.html', category: 'Scoreboard', color: 'from-blue-500 to-blue-700' },
    { id: 'lvl1-modern-blue', name: 'Modern Blue', file: 'lvl1-modern-blue.html', category: 'Scoreboard', color: 'from-cyan-500 to-blue-600' },
    { id: 'lvl1-paper-style', name: 'Paper Style', file: 'lvl1-paper-style.html', category: 'Scoreboard', color: 'from-amber-100 to-amber-300' },
    { id: 'lvl1-red-card', name: 'Red Card', file: 'lvl1-red-card.html', category: 'Scoreboard', color: 'from-red-600 to-red-800' },
    { id: 'lvl1-retro-board', name: 'Retro Board', file: 'lvl1-retro-board.html', category: 'Scoreboard', color: 'from-amber-700 to-yellow-900' },
    { id: 'lvl1-side-panel', name: 'Side Panel', file: 'lvl1-side-panel.html', category: 'Scoreboard', color: 'from-purple-600 to-purple-800' },
    { id: 'lvl1-simple-text', name: 'Simple Text', file: 'lvl1-simple-text.html', category: 'Scoreboard', color: 'from-gray-500 to-gray-700' },
];
// Level 2 (Replay/Effects) overlays
const LEVEL2_OVERLAYS = [
    { id: 'lvl2-broadcast-pro', name: 'Broadcast Pro', file: 'lvl2-broadcast-pro.html', category: 'Replay/Effects', color: 'from-blue-500 to-indigo-700' },
    { id: 'lvl2-cosmic-orbit', name: 'Cosmic Orbit', file: 'lvl2-cosmic-orbit.html', category: 'Replay/Effects', color: 'from-purple-500 to-pink-700' },
    { id: 'lvl2-cyber-glitch', name: 'Cyber Glitch', file: 'lvl2-cyber-glitch.html', category: 'Replay/Effects', color: 'from-pink-500 to-purple-600' },
    { id: 'lvl2-flame-thrower', name: 'Flame Thrower', file: 'lvl2-flame-thrower.html', category: 'Replay/Effects', color: 'from-orange-500 to-red-700' },
    { id: 'lvl2-glass-morphism', name: 'Glass Morphism', file: 'lvl2-glass-morphism.html', category: 'Replay/Effects', color: 'from-cyan-400 to-blue-600' },
    { id: 'lvl2-gold-rush', name: 'Gold Rush', file: 'lvl2-gold-rush.html', category: 'Replay/Effects', color: 'from-yellow-500 to-amber-700' },
    { id: 'lvl2-hologram', name: 'Hologram', file: 'lvl2-hologram.html', category: 'Replay/Effects', color: 'from-cyan-500 to-blue-800' },
    { id: 'lvl2-matrix-rain', name: 'Matrix Rain', file: 'lvl2-matrix-rain.html', category: 'Replay/Effects', color: 'from-green-600 to-black' },
    { id: 'lvl2-neon-pulse', name: 'Neon Pulse', file: 'lvl2-neon-pulse.html', category: 'Replay/Effects', color: 'from-green-400 to-cyan-600' },
    { id: 'lvl2-particle-storm', name: 'Particle Storm', file: 'lvl2-particle-storm.html', category: 'Replay/Effects', color: 'from-purple-500 to-pink-600' },
    { id: 'lvl2-rgb-split', name: 'RGB Split', file: 'lvl2-rgb-split.html', category: 'Replay/Effects', color: 'from-red-500 via-blue-500 to-green-500' },
    { id: 'lvl2-speed-racer', name: 'Speed Racer', file: 'lvl2-speed-racer.html', category: 'Replay/Effects', color: 'from-yellow-500 to-orange-700' },
    { id: 'lvl2-tech-hud', name: 'Tech HUD', file: 'lvl2-tech-hud.html', category: 'Replay/Effects', color: 'from-cyan-600 to-blue-900' },
    { id: 'lvl2-thunder-strike', name: 'Thunder Strike', file: 'lvl2-thunder-strike.html', category: 'Replay/Effects', color: 'from-yellow-400 to-purple-700' },
    { id: 'lvl2-vinyl-spin', name: 'Vinyl Spin', file: 'lvl2-vinyl-spin.html', category: 'Replay/Effects', color: 'from-pink-500 to-purple-700' },
    { id: 'lvl2-water-flow', name: 'Water Flow', file: 'lvl2-water-flow.html', category: 'Replay/Effects', color: 'from-blue-400 to-cyan-600' },
];
// Combine all overlays
const OVERLAY_TEMPLATES = [
    ...LEVEL1_OVERLAYS,
    ...LEVEL2_OVERLAYS,
];
// Category options for dropdown
const CATEGORIES = [
    { value: 'all', label: 'All Overlays' },
    { value: 'Scoreboard', label: 'Level 1 - Scoreboard' },
    { value: 'Replay/Effects', label: 'Level 2 - Replay/Effects' },
    { value: 'Special', label: 'Special' },
];
// Helper function to get API base URL
const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
};
export default function OverlayEditor() {
    const [selectedTemplate, setSelectedTemplate] = useState(OVERLAY_TEMPLATES[0]);
    const [matches, setMatches] = useState([]);
    const [allMatches, setAllMatches] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTournamentId, setSelectedTournamentId] = useState('');
    const [showOverlay, setShowOverlay] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    // Create overlay modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        template: selectedTemplate?.file || '',
        match: ''
    });
    const [createLoading, setCreateLoading] = useState(false);
    // Tournament matches only
    const [tournamentMatches, setTournamentMatches] = useState([]);
    // State for created overlays
    const [createdOverlays, setCreatedOverlays] = useState([]);
    const [overlaysLoading, setOverlaysLoading] = useState(false);
    // Preview modal state
    const [previewOverlay, setPreviewOverlay] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    // Edit modal state
    const [editOverlay, setEditOverlay] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '' });
    const [editLoading, setEditLoading] = useState(false);
    // Regenerate loading state
    const [regeneratingId, setRegeneratingId] = useState(null);
    // Copy to clipboard feedback
    const [copiedId, setCopiedId] = useState(null);
    const channelRef = useRef(null);
    const iframeRef = useRef(null);
    const previewIframeRef = useRef(null);
    useEffect(() => {
        loadLiveMatches(selectedTournamentId);
        loadTournaments();
        loadCreatedOverlays();
        // Initialize Broadcast Channel
        channelRef.current = new BroadcastChannel('cricket_score_updates');
        return () => {
            if (channelRef.current)
                channelRef.current.close();
        };
    }, [selectedTournamentId]);
    // Listen for match updates from the server to auto-update overlay
    useEffect(() => {
        if (!selectedMatchId || !showOverlay)
            return;
        const interval = setInterval(async () => {
            try {
                const res = await matchAPI.getMatch(selectedMatchId);
                const matchData = res.data;
                pushDataToOverlay(matchData);
            }
            catch (e) {
                console.error("Auto-sync failed", e);
            }
        }, 2000); // Sync every 2 seconds
        return () => clearInterval(interval);
    }, [selectedMatchId, showOverlay]);
    const loadLiveMatches = async (tournamentId) => {
        try {
            // API now returns response.data directly
            let data;
            if (tournamentId) {
                // Tournament-specific matches only
                data = await tournamentAPI.getTournamentMatches(tournamentId);
            }
            else {
                // All matches fallback
                data = await matchAPI.getMatches();
            }
            // Handle different response formats
            let allMatchesData = [];
            if (Array.isArray(data)) {
                allMatchesData = data;
            }
            else if (data?.data && Array.isArray(data.data)) {
                allMatchesData = data.data;
            }
            else if ((data.data || data)?.matches && Array.isArray((data.data || data)?.matches)) {
                allMatchesData = (data.data || data)?.matches;
            }
            // Store all matches for overlay creation
            setAllMatches(allMatchesData);
            // Filter for tournament matches only (per user request)
            const tournamentMatches = Array.isArray((data.data || data)) ? (data.data || data) : (data.data || data)?.matches || data || [];
            setMatches(tournamentMatches.filter((m) => ['live', 'ongoing', 'in_progress', 'upcoming'].includes((m.status || '').toLowerCase())));
            console.log(`✅ Tournament matches loaded: ${tournamentMatches.length} total, ${matches.length} ready`);
            if (matches.length === 0) {
                console.log('No live matches found for overlays');
            }
        }
        catch (e) {
            console.error("Failed to load matches");
        }
    };
    const loadTournaments = async () => {
        try {
            const response = await tournamentAPI.getTournaments();
            const tournamentsData = response.data.tournaments || response.data || [];
            setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
        }
        catch (error) {
            console.error('Failed to fetch tournaments');
            setTournaments([]);
        }
    };
    const loadCreatedOverlays = async () => {
        try {
            setOverlaysLoading(true);
            const res = await overlayAPI.getOverlays();
            const overlaysData = res.data.overlays || res.data || [];
            // Add computed fields for each overlay
            const overlaysWithComputed = (Array.isArray(overlaysData) ? overlaysData : []).map((overlay) => {
                const baseUrl = getApiBaseUrl();
                const publicUrl = `${baseUrl}/api/v1/overlays/public/${overlay.publicId}`;
                // Check if URL is expired
                let isUrlExpired = false;
                if (overlay.urlExpiresAt) {
                    isUrlExpired = new Date(overlay.urlExpiresAt) < new Date();
                }
                return {
                    ...overlay,
                    publicUrl,
                    isUrlExpired
                };
            });
            setCreatedOverlays(overlaysWithComputed);
        }
        catch (error) {
            console.error('Failed to fetch created overlays');
            setCreatedOverlays([]);
        }
        finally {
            setOverlaysLoading(false);
        }
    };
    const handleCreateOverlay = async (e) => {
        e.preventDefault();
        if (!createFormData.name.trim()) {
            alert('Please enter an overlay name');
            return;
        }
        if (!createFormData.template) {
            alert('Please select a template');
            return;
        }
        if (!createFormData.match) {
            alert('Please select a match');
            return;
        }
        // Get the selected match to extract tournament
        const selectedMatch = allMatches.find((m) => m._id === createFormData.match);
        if (!selectedMatch) {
            alert('Selected match not found');
            return;
        }
        // Extract tournament ID from match (handle both string and object formats)
        const tournamentId = typeof selectedMatch.tournament === 'string'
            ? selectedMatch.tournament
            : selectedMatch.tournament?._id;
        if (!tournamentId) {
            alert('Could not detect tournament from selected match');
            return;
        }
        setCreateLoading(true);
        try {
            const overlayData = {
                name: createFormData.name.trim(),
                template: createFormData.template,
                tournament: tournamentId,
                match: createFormData.match,
                config: {
                    backgroundColor: '#16a34a',
                    opacity: 90,
                    fontFamily: 'Inter',
                    position: 'top',
                    showAnimations: true,
                    autoUpdate: true,
                },
                elements: [],
            };
            await overlayAPI.createOverlay(overlayData);
            setShowCreateModal(false);
            setCreateFormData({ name: '', template: '', match: '' });
            loadCreatedOverlays(); // Refresh the list
        }
        catch (error) {
            console.error('Failed to create overlay:', error);
            alert('Failed to create overlay. Please try again.');
        }
        finally {
            setCreateLoading(false);
        }
    };
    const handleDeleteOverlay = async (overlayId) => {
        if (!confirm('Are you sure you want to delete this overlay?'))
            return;
        try {
            await overlayAPI.deleteOverlay(overlayId);
            loadCreatedOverlays(); // Refresh the list
        }
        catch (error) {
            console.error('Failed to delete overlay:', error);
            alert('Failed to delete overlay. Please try again.');
        }
    };
    const handleRegenerateUrl = async (overlayId) => {
        if (!confirm('Are you sure you want to regenerate the URL? The old URL will stop working immediately.'))
            return;
        setRegeneratingId(overlayId);
        try {
            const res = await overlayAPI.regenerateOverlay(overlayId);
            alert('URL regenerated successfully! The new URL is valid for 24 hours.');
            loadCreatedOverlays(); // Refresh the list
        }
        catch (error) {
            console.error('Failed to regenerate URL:', error);
            alert('Failed to regenerate URL. Please try again.');
        }
        finally {
            setRegeneratingId(null);
        }
    };
    const handleCopyUrl = async (overlay) => {
        try {
            await navigator.clipboard.writeText(overlay.publicUrl || '');
            setCopiedId(overlay._id);
            setTimeout(() => setCopiedId(null), 2000);
        }
        catch (error) {
            console.error('Failed to copy URL:', error);
        }
    };
    const handlePreviewOverlay = (overlay) => {
        setPreviewOverlay(overlay);
        setShowPreviewModal(true);
    };
    const handleEditOverlay = (overlay) => {
        setEditOverlay(overlay);
        setEditFormData({ name: overlay.name });
        setShowEditModal(true);
    };
    const handleSaveEdit = async () => {
        if (!editOverlay || !editFormData.name.trim()) {
            alert('Please enter an overlay name');
            return;
        }
        setEditLoading(true);
        try {
            await overlayAPI.updateOverlay(editOverlay._id, { name: editFormData.name.trim() });
            setShowEditModal(false);
            setEditOverlay(null);
            setEditFormData({ name: '' });
            loadCreatedOverlays(); // Refresh the list
        }
        catch (error) {
            console.error('Failed to update overlay:', error);
            alert('Failed to update overlay. Please try again.');
        }
        finally {
            setEditLoading(false);
        }
    };
    const toggleOverlay = () => {
        setShowOverlay(!showOverlay);
    };
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };
    const pushDataToOverlay = (match) => {
        if (!channelRef.current)
            return;
        // Robust fallbacks for optional data
        const isTeam1Batting = match.battingTeam === 'team1';
        // Safely access nested liveScores properties
        const currentInnings = match.liveScores ? match.liveScores[match.battingTeam || 'team1'] : null;
        // Find Striker and Non-Striker safely
        const striker = currentInnings?.batsmen?.find((b) => b.isStriker) || { name: '', runs: 0, balls: 0 };
        const nonStriker = currentInnings?.batsmen?.find((b) => !b.isStriker) || { name: '', runs: 0, balls: 0 };
        const currentBowler = currentInnings?.bowler || { name: '', overs: 0, runs: 0, wickets: 0 };
        const payload = {
            tournament: {
                name: typeof match.tournament === 'string' ? 'Tournament' : (match.tournament?.name || 'Tournament')
            },
            team1: {
                name: match.team1?.name || 'Team 1',
                shortName: (match.team1?.name || 'T1').substring(0, 3).toUpperCase(),
                score: match.score1 || 0,
                wickets: match.wickets1 || 0,
                overs: match.overs1 || 0
            },
            team2: {
                name: match.team2?.name || 'Team 2',
                shortName: (match.team2?.name || 'T2').substring(0, 3).toUpperCase(),
                score: match.score2 || 0,
                wickets: match.wickets2 || 0,
                overs: match.overs2 || 0
            },
            // Active play data
            striker: striker,
            nonStriker: nonStriker,
            bowler: currentBowler,
            stats: {
                currentRunRate: match.currentRunRate || 0,
                requiredRunRate: match.requiredRunRate || 0,
                target: match.target || 0,
                need: match.target ? (match.target - (isTeam1Batting ? match.score1 : match.score2)) : 0
            }
        };
        channelRef.current.postMessage(payload);
    };
    const sendTestEvent = (type) => {
        if (!channelRef.current)
            return;
        channelRef.current.postMessage({
            type: 'PUSH_EVENT',
            message: type === 'WICKET' ? 'OUT!' : type,
            eventType: type
        });
    };
    // Filter overlays by selected category
    const filteredOverlays = selectedCategory === 'all'
        ? OVERLAY_TEMPLATES
        : OVERLAY_TEMPLATES.filter(o => o.category === selectedCategory);
    // Format time remaining
    const formatTimeRemaining = (expiresAt) => {
        if (!expiresAt)
            return null;
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();
        if (diff <= 0)
            return 'Expired';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };
    return (_jsxs("div", { className: "p-6 bg-gray-50 dark:bg-gray-900 min-h-screen", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Broadcast Controller" }), _jsx("p", { className: "text-gray-500", children: "Manage your live stream graphics in real-time" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("button", { onClick: () => setShowCreateModal(true), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: [_jsx(Plus, { className: "w-4 h-4" }), " Create Overlay"] }), _jsx("button", { onClick: () => sendTestEvent('SIX'), className: "px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700", children: "Test 6" }), _jsx("button", { onClick: () => sendTestEvent('WICKET'), className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700", children: "Test Wicket" }), _jsx("button", { onClick: toggleOverlay, className: `flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-lg ${showOverlay
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'}`, children: showOverlay ? _jsxs(_Fragment, { children: [_jsx(X, { className: "w-5 h-5" }), " Hide Overlay"] }) : _jsxs(_Fragment, { children: [_jsx(Eye, { className: "w-5 h-5" }), " Show Overlay"] }) })] })] }), _jsxs("div", { className: `grid gap-6 ${showOverlay ? (isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3') : 'grid-cols-1'}`, children: [_jsxs("div", { className: `${showOverlay && !isFullscreen ? 'lg:col-span-1' : 'col-span-1'}`, children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6", children: [_jsx("h2", { className: "text-xl font-bold mb-4 dark:text-white", children: "Select Overlay" }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Overlay Category" }), _jsx("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white", children: CATEGORIES.map(cat => (_jsx("option", { value: cat.value, children: cat.label }, cat.value))) })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-bold dark:text-white", children: "Data Source" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Tournament (Optional Filter)" }), _jsxs("select", { value: selectedTournamentId, onChange: (e) => setSelectedTournamentId(e.target.value), className: "w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white", children: [_jsxs("option", { value: "", children: ["All Tournaments (", matches.length, " matches)"] }), tournaments.map(t => (_jsxs("option", { value: t._id, children: [t.name, " (", t.matches?.length || 0, " matches)"] }, t._id)))] })] }), _jsxs("h3", { className: "text-lg font-semibold dark:text-white", children: ["Matches (", matches.length, ")"] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Sync with Live Match" }), _jsxs("select", { value: selectedMatchId, onChange: (e) => setSelectedMatchId(e.target.value), className: "w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white", children: [_jsx("option", { value: "", children: "-- Manual Control --" }), matches.length > 0 ? (matches.map(m => (_jsxs("option", { value: m._id, children: [m.team1?.name || 'Team 1', " vs ", m.team2?.name || 'Team 2', _jsxs("span", { style: { color: 'green' }, children: [" (", m.status || 'live', ")"] })] }, m._id)))) : (_jsx("option", { disabled: true, children: "No active matches - start a live match first" }))] })] }), _jsxs("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300", children: [_jsxs("p", { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4" }), _jsx("strong", { children: "Status:" }), selectedMatchId ? ' Auto-syncing' : ' Manual Mode'] }), selectedMatchId && (_jsx("p", { className: "mt-2 text-xs opacity-80", children: "Scores will automatically sync every 2 seconds." }))] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm", children: [_jsxs("h2", { className: "text-xl font-bold mb-4 dark:text-white", children: ["Available Overlays (", filteredOverlays.length, ")"] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto", children: filteredOverlays.map(template => (_jsxs("div", { onClick: () => setSelectedTemplate(template), className: `cursor-pointer border-2 rounded-xl overflow-hidden relative transition-all transform hover:scale-105 ${selectedTemplate.id === template.id
                                                        ? 'border-green-500 ring-2 ring-green-300'
                                                        : 'border-gray-200 dark:border-gray-700'}`, children: [_jsx("div", { className: `h-16 bg-gradient-to-br ${template.color} flex items-center justify-center`, children: _jsx("span", { className: "text-white font-black text-xl tracking-widest", children: template.name.substring(0, 3) }) }), _jsx("div", { className: "p-2 bg-white dark:bg-gray-800", children: _jsx("h3", { className: "font-bold text-gray-900 dark:text-white text-xs", children: template.name }) }), selectedTemplate.id === template.id && (_jsx("div", { className: "absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded-full", children: _jsx(Zap, { className: "w-3 h-3" }) }))] }, template.id))) })] })] }), showOverlay && (_jsxs("div", { className: `${isFullscreen ? 'fixed inset-0 z-50 bg-black p-4' : 'lg:col-span-2'} bg-gray-900 rounded-xl overflow-hidden`, children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("h3", { className: "text-white font-bold", children: [selectedTemplate.name, " Preview"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: toggleFullscreen, className: "p-2 bg-gray-700 text-white rounded hover:bg-gray-600", children: isFullscreen ? _jsx(Minimize2, { className: "w-4 h-4" }) : _jsx(Maximize2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setShowOverlay(false), className: "p-2 bg-red-600 text-white rounded hover:bg-red-700", children: _jsx(X, { className: "w-4 h-4" }) })] })] }), _jsx("iframe", { ref: iframeRef, src: `/overlays/${selectedTemplate.file}`, className: "w-full bg-black rounded-lg", style: { height: isFullscreen ? 'calc(100vh - 80px)' : '500px' }, title: "Overlay Preview" })] }))] }), _jsxs("div", { className: "mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm", children: [_jsxs("h2", { className: "text-xl font-bold mb-4 dark:text-white", children: ["My Overlays (", createdOverlays.length, ")"] }), overlaysLoading ? (_jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Loading overlays..." })) : createdOverlays.length === 0 ? (_jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "No overlays created yet. Click \"Create Overlay\" to get started." })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: createdOverlays.map((overlay) => (_jsxs("div", { className: "border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-bold text-gray-900 dark:text-white", children: overlay.name }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => handlePreviewOverlay(overlay), className: "p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded", title: "Preview overlay", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleEditOverlay(overlay), className: "p-1.5 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded", title: "Edit overlay", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDeleteOverlay(overlay._id), className: "p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded", title: "Delete overlay", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), _jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-2", children: ["Template: ", overlay.template] }), _jsxs("div", { className: "mb-2", children: [_jsxs("label", { className: "block text-xs text-gray-500 dark:text-gray-400 mb-1", children: [_jsx(Link, { className: "w-3 h-3 inline mr-1" }), "Overlay URL"] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("input", { type: "text", readOnly: true, value: overlay.publicUrl || '', className: "flex-1 text-xs px-2 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 truncate" }), _jsx("button", { onClick: () => handleCopyUrl(overlay), className: "p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded", title: "Copy URL", children: copiedId === overlay._id ? (_jsx("span", { className: "text-green-600 text-xs font-bold", children: "\u2713" })) : (_jsx(Copy, { className: "w-3.5 h-3.5" })) }), _jsx("a", { href: overlay.publicUrl, target: "_blank", rel: "noopener noreferrer", className: "p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded", title: "Open in new tab", children: _jsx(ExternalLink, { className: "w-3.5 h-3.5" }) }), _jsx("button", { onClick: () => handleRegenerateUrl(overlay._id), disabled: regeneratingId === overlay._id, className: "p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50", title: "Regenerate URL (24h expiry)", children: regeneratingId === overlay._id ? (_jsx(RefreshCw, { className: "w-3.5 h-3.5 animate-spin" })) : (_jsx(RefreshCw, { className: "w-3.5 h-3.5" })) })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: `px-2 py-0.5 rounded ${overlay.isUrlExpired
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`, children: overlay.isUrlExpired ? '⚠️ Expired' : '✓ Active' }), overlay.urlExpiresAt && (_jsxs("span", { className: "text-gray-500 dark:text-gray-400", children: [formatTimeRemaining(overlay.urlExpiresAt), " remaining"] }))] }), _jsxs("p", { className: "text-xs text-gray-400 dark:text-gray-500 mt-2", children: ["Created: ", overlay.createdAt ? new Date(overlay.createdAt).toLocaleDateString() : 'N/A'] })] }, overlay._id))) }))] }), showCreateModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white", children: "Create New Overlay" }), _jsx("button", { onClick: () => setShowCreateModal(false), className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) })] }), _jsxs("form", { onSubmit: handleCreateOverlay, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Overlay Name" }), _jsx("input", { type: "text", placeholder: "My Custom Overlay", value: createFormData.name, onChange: (e) => setCreateFormData({ ...createFormData, name: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400", required: true })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: ["Template ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: createFormData.template, onChange: (e) => setCreateFormData({ ...createFormData, template: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white", required: true, children: [_jsx("option", { value: "", children: "Select Template" }), _jsxs("optgroup", { label: "Level 1 - Scoreboard", children: [_jsx("option", { value: "lvl1-broadcast-bar.html", children: "Broadcast Bar" }), _jsx("option", { value: "lvl1-curved-compact.html", children: "Curved Compact" }), _jsx("option", { value: "lvl1-dark-angular.html", children: "Dark Angular" }), _jsx("option", { value: "lvl1-grass-theme.html", children: "Grass Theme" }), _jsx("option", { value: "lvl1-high-vis.html", children: "High Visibility" }), _jsx("option", { value: "lvl1-minimal-dark.html", children: "Minimal Dark" }), _jsx("option", { value: "lvl1-modern-bar.html", children: "Modern Bar" }), _jsx("option", { value: "lvl1-modern-blue.html", children: "Modern Blue" }), _jsx("option", { value: "lvl1-paper-style.html", children: "Paper Style" }), _jsx("option", { value: "lvl1-red-card.html", children: "Red Card" }), _jsx("option", { value: "lvl1-retro-board.html", children: "Retro Board" }), _jsx("option", { value: "lvl1-side-panel.html", children: "Side Panel" }), _jsx("option", { value: "lvl1-simple-text.html", children: "Simple Text" })] }), _jsxs("optgroup", { label: "Level 2 - Replay/Effects", children: [_jsx("option", { value: "lvl2-broadcast-pro.html", children: "Broadcast Pro" }), _jsx("option", { value: "lvl2-cosmic-orbit.html", children: "Cosmic Orbit" }), _jsx("option", { value: "lvl2-cyber-glitch.html", children: "Cyber Glitch" }), _jsx("option", { value: "lvl2-flame-thrower.html", children: "Flame Thrower" }), _jsx("option", { value: "lvl2-glass-morphism.html", children: "Glass Morphism" }), _jsx("option", { value: "lvl2-gold-rush.html", children: "Gold Rush" }), _jsx("option", { value: "lvl2-hologram.html", children: "Hologram" }), _jsx("option", { value: "lvl2-matrix-rain.html", children: "Matrix Rain" }), _jsx("option", { value: "lvl2-neon-pulse.html", children: "Neon Pulse" }), _jsx("option", { value: "lvl2-particle-storm.html", children: "Particle Storm" }), _jsx("option", { value: "lvl2-rgb-split.html", children: "RGB Split" }), _jsx("option", { value: "lvl2-speed-racer.html", children: "Speed Racer" }), _jsx("option", { value: "lvl2-tech-hud.html", children: "Tech HUD" }), _jsx("option", { value: "lvl2-thunder-strike.html", children: "Thunder Strike" }), _jsx("option", { value: "lvl2-vinyl-spin.html", children: "Vinyl Spin" }), _jsx("option", { value: "lvl2-water-flow.html", children: "Water Flow" })] })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: ["Match ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: createFormData.match, onChange: (e) => setCreateFormData({ ...createFormData, match: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white", required: true, children: [_jsx("option", { value: "", children: "Select Match" }), allMatches.map((matchItem) => (_jsxs("option", { value: matchItem._id, children: [matchItem.team1?.name || 'Team 1', " vs ", matchItem.team2?.name || 'Team 2', "(", matchItem.status || 'scheduled', ")"] }, matchItem._id)))] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: "Tournament will be automatically detected from the selected match" })] }), _jsx("button", { type: "submit", disabled: createLoading, className: "w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: createLoading ? 'Creating...' : 'Create Overlay' })] })] }) })), showPreviewModal && previewOverlay && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl mx-4 h-[80vh] flex flex-col", children: [_jsxs("div", { className: "flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 dark:text-white", children: ["Preview: ", previewOverlay.name] }), _jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: ["Template: ", previewOverlay.template] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("a", { href: previewOverlay.publicUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm", children: [_jsx(ExternalLink, { className: "w-4 h-4" }), " Open Full"] }), _jsx("button", { onClick: () => setShowPreviewModal(false), className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) })] })] }), _jsx("div", { className: "flex-1 bg-gray-900 p-4", children: _jsx("iframe", { ref: previewIframeRef, src: previewOverlay.publicUrl, className: "w-full h-full rounded-lg", title: "Overlay Preview" }) })] }) })), showEditModal && editOverlay && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white", children: "Edit Overlay" }), _jsx("button", { onClick: () => setShowEditModal(false), className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Overlay Name" }), _jsx("input", { type: "text", value: editFormData.name, onChange: (e) => setEditFormData({ ...editFormData, name: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white", required: true })] }), _jsxs("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: [_jsxs("p", { children: ["Template: ", editOverlay.template] }), _jsxs("p", { children: ["Created: ", editOverlay.createdAt ? new Date(editOverlay.createdAt).toLocaleDateString() : 'N/A'] })] }), _jsx("button", { onClick: handleSaveEdit, disabled: editLoading, className: "w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: editLoading ? 'Saving...' : 'Save Changes' })] })] }) }))] }), ");"] }));
}
