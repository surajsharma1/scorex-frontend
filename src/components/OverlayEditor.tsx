import { useState, useEffect, useRef } from 'react';
import { Eye, Zap, X, Maximize2, Minimize2 } from 'lucide-react';
import { overlayAPI, matchAPI, tournamentAPI } from '../services/api';
import { Overlay, Match, Tournament } from './types';

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

export default function OverlayEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState(OVERLAY_TEMPLATES[0]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOverlay, setShowOverlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadLiveMatches();
    // Initialize Broadcast Channel
    channelRef.current = new BroadcastChannel('cricket_score_updates');
    
    return () => {
        if (channelRef.current) channelRef.current.close();
    };
  }, []);

  // Listen for match updates from the server to auto-update overlay
  useEffect(() => {
     if (!selectedMatchId || !showOverlay) return;
     
     const interval = setInterval(async () => {
         try {
             const res = await matchAPI.getMatches(selectedMatchId);
             const matchData = res.data;
             pushDataToOverlay(matchData);
         } catch (e) {
             console.error("Auto-sync failed", e);
         }
     }, 2000); // Sync every 2 seconds

     return () => clearInterval(interval);
  }, [selectedMatchId, showOverlay]);

  const loadLiveMatches = async () => {
    try {
        const res = await matchAPI.getAllMatches();
        const live = (res.data.matches || []).filter((m: Match) => m.status === 'ongoing');
        setMatches(live);
    } catch (e) {
        console.error("Failed to load matches");
    }
  };

  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const pushDataToOverlay = (match: Match) => {
    if (!channelRef.current) return;

    // Robust fallbacks for optional data
    const isTeam1Batting = match.battingTeam === 'team1';
    
    // Safely access nested liveScores properties
    const currentInnings = match.liveScores ? match.liveScores[match.battingTeam || 'team1'] : null;
    
    // Find Striker and Non-Striker safely
    const striker = currentInnings?.batsmen?.find((b: any) => b.isStriker) || { name: '', runs: 0, balls: 0 };
    const nonStriker = currentInnings?.batsmen?.find((b: any) => !b.isStriker) || { name: '', runs: 0, balls: 0 };
    const currentBowler = currentInnings?.bowler || { name: '', overs: 0, runs: 0, wickets: 0 };

    const payload = {
        tournament: { 
            name: typeof match.tournament === 'string' ? 'Tournament' : (match.tournament?.name || 'Tournament') 
        },
        team1: {
            name: match.team1?.name || 'Team 1',
            shortName: (match.team1?.name || 'T1').substring(0,3).toUpperCase(),  
            score: match.score1 || 0,
            wickets: match.wickets1 || 0,
            overs: match.overs1 || 0
        },
        team2: {
            name: match.team2?.name || 'Team 2',
            shortName: (match.team2?.name || 'T2').substring(0,3).toUpperCase(),
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
            need: match.target ? (match.target - (isTeam1Batting ? match.score1! : match.score2!)) : 0
        }
    };

    channelRef.current.postMessage(payload);
  };

  const sendTestEvent = (type: 'SIX' | 'FOUR' | 'WICKET') => {
      if (!channelRef.current) return;
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

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Broadcast Controller</h1>
          <p className="text-gray-500">Manage your live stream graphics in real-time</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => sendTestEvent('SIX')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
                Test 6
            </button>
            <button 
                onClick={() => sendTestEvent('WICKET')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
                Test Wicket
            </button>
            <button 
                onClick={toggleOverlay}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-lg ${
                    showOverlay 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
                {showOverlay ? <><X className="w-5 h-5" /> Hide Overlay</> : <><Eye className="w-5 h-5" /> Show Overlay</>}
            </button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className={`grid gap-6 ${showOverlay ? (isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3') : 'grid-cols-1'}`}>
        
        {/* Controls Panel */}
        <div className={`${showOverlay && !isFullscreen ? 'lg:col-span-1' : 'col-span-1'}`}>
            {/* Category Dropdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Select Overlay</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Overlay Category
                    </label>
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Match Selection Dropdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Data Source</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sync with Live Match
                    </label>
                    <select 
                        value={selectedMatchId}
                        onChange={(e) => setSelectedMatchId(e.target.value)}
                        className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">-- Manual Control --</option>
                        {matches.map(m => (
                            <option key={m._id} value={m._id}>
                                {m.team1?.name} vs {m.team2?.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                    <p className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <strong>Status:</strong> 
                        {selectedMatchId ? ' Auto-syncing' : ' Manual Mode'}
                    </p>
                    {selectedMatchId && (
                        <p className="mt-2 text-xs opacity-80">
                            Scores will automatically sync every 2 seconds.
                        </p>
                    )}
                </div>
            </div>

            {/* Overlay Grid */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Available Overlays ({filteredOverlays.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {filteredOverlays.map(template => (
                        <div 
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`cursor-pointer border-2 rounded-xl overflow-hidden relative transition-all transform hover:scale-105 ${
                                selectedTemplate.id === template.id 
                                    ? 'border-green-500 ring-2 ring-green-300' 
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <div className={`h-16 bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                                <span className="text-white font-black text-xl tracking-widest">{template.name.substring(0,3)}</span>
                            </div>
                            <div className="p-2 bg-white dark:bg-gray-800">
                                <h3 className="font-bold text-gray-900 dark:text-white text-xs">{template.name}</h3>
                            </div>
                            {selectedTemplate.id === template.id && (
                                <div className="absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded-full">
                                    <Zap className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Overlay Preview Panel */}
        {showOverlay && (
            <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black p-4' : 'lg:col-span-2'} bg-gray-900 rounded-xl overflow-hidden`}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-bold">
                        {selectedTemplate.name} Preview
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={toggleFullscreen}
                            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={() => setShowOverlay(false)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <iframe
                    ref={iframeRef}
                    src={`/overlays/${selectedTemplate.file}`}
                    className="w-full bg-black rounded-lg"
                    style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '500px' }}
                    title="Overlay Preview"
                />
            </div>
        )}
      </div>
    </div>
  );
}
