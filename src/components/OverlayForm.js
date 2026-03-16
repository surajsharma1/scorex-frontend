import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overlayAPI, matchAPI } from '../services/api';
export default function OverlayForm() {
    const [formData, setFormData] = useState({ name: '', template: '', match: '' });
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const data = await matchAPI.getMatches();
                // Handle different response formats
                let matchesData = [];
                if (Array.isArray(data)) {
                    matchesData = data;
                }
                else if (data?.data && Array.isArray(data.data)) {
                    matchesData = data.data;
                }
                else if ((data.data || data)?.matches && Array.isArray((data.data || data)?.matches)) {
                    matchesData = (data.data || data)?.matches;
                }
                setMatches(Array.isArray(matchesData) ? matchesData : []);
            }
            catch (error) {
                console.error('Failed to fetch matches');
                setMatches([]);
            }
        };
        fetchMatches();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate required fields
        if (!formData.name.trim()) {
            alert('Please enter an overlay name');
            return;
        }
        if (!formData.template) {
            alert('Please select a template');
            return;
        }
        if (!formData.match) {
            alert('Please select a match');
            return;
        }
        // Get the selected match to extract tournament
        const selectedMatch = matches.find(m => m._id === formData.match);
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
        setLoading(true);
        try {
            const overlayData = {
                name: formData.name.trim(),
                template: formData.template,
                tournament: tournamentId,
                match: formData.match,
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
            navigate('/overlays');
        }
        catch (error) {
            console.error('Failed to create overlay:', error);
            alert('Failed to create overlay. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4", children: "Create Overlay" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Name" }), _jsx("input", { type: "text", placeholder: "Overlay Name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400", required: true })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: ["Template ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.template, onChange: (e) => setFormData({ ...formData, template: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white", required: true, children: [_jsx("option", { value: "", children: "Select Template" }), _jsx("option", { value: "lvl1-broadcast-bar.html", children: "Broadcast Bar" }), _jsx("option", { value: "lvl1-curved-compact.html", children: "Curved Compact" }), _jsx("option", { value: "lvl1-dark-angular.html", children: "Dark Angular" }), _jsx("option", { value: "lvl1-grass-theme.html", children: "Grass Theme" }), _jsx("option", { value: "lvl1-high-vis.html", children: "High Visibility" }), _jsx("option", { value: "lvl1-minimal-dark.html", children: "Minimal Dark" }), _jsx("option", { value: "lvl1-modern-bar.html", children: "Modern Bar" }), _jsx("option", { value: "lvl1-modern-blue.html", children: "Modern Blue" }), _jsx("option", { value: "lvl1-paper-style.html", children: "Paper Style" }), _jsx("option", { value: "lvl1-red-card.html", children: "Red Card" }), _jsx("option", { value: "lvl1-retro-board.html", children: "Retro Board" }), _jsx("option", { value: "lvl1-side-panel.html", children: "Side Panel" }), _jsx("option", { value: "lvl1-simple-text.html", children: "Simple Text" }), _jsx("option", { value: "lvl2-broadcast-pro.html", children: "Broadcast Pro" }), _jsx("option", { value: "lvl2-cosmic-orbit.html", children: "Cosmic Orbit" }), _jsx("option", { value: "lvl2-cyber-glitch.html", children: "Cyber Glitch" }), _jsx("option", { value: "lvl2-flame-thrower.html", children: "Flame Thrower" }), _jsx("option", { value: "lvl2-glass-morphism.html", children: "Glass Morphism" }), _jsx("option", { value: "lvl2-gold-rush.html", children: "Gold Rush" }), _jsx("option", { value: "lvl2-hologram.html", children: "Hologram" }), _jsx("option", { value: "lvl2-matrix-rain.html", children: "Matrix Rain" }), _jsx("option", { value: "lvl2-neon-pulse.html", children: "Neon Pulse" }), _jsx("option", { value: "lvl2-particle-storm.html", children: "Particle Storm" }), _jsx("option", { value: "lvl2-rgb-split.html", children: "RGB Split" }), _jsx("option", { value: "lvl2-speed-racer.html", children: "Speed Racer" }), _jsx("option", { value: "lvl2-tech-hud.html", children: "Tech HUD" }), _jsx("option", { value: "lvl2-thunder-strike.html", children: "Thunder Strike" }), _jsx("option", { value: "lvl2-vinyl-spin.html", children: "Vinyl Spin" }), _jsx("option", { value: "lvl2-water-flow.html", children: "Water Flow" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: ["Match ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.match, onChange: (e) => setFormData({ ...formData, match: e.target.value }), className: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white", required: true, children: [_jsx("option", { value: "", children: "Select Match" }), matches.map((matchItem) => (_jsxs("option", { value: matchItem._id, children: [matchItem.team1?.name || 'Team 1', " vs ", matchItem.team2?.name || 'Team 2', " (", matchItem.status || 'scheduled', ")"] }, matchItem._id)))] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: "Tournament will be automatically detected from the selected match" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? 'Creating...' : 'Create Overlay' })] })] }) }));
}
