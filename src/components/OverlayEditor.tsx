import { useState, useEffect, useRef } from 'react';
import { Eye, Download, Settings, Crown, ExternalLink, Zap } from 'lucide-react';
import { overlayAPI, matchAPI, tournamentAPI } from '../services/api';
import { Overlay, Match, Tournament } from './types';

// Pre-defined overlays list (matching your file uploads)
const OVERLAY_TEMPLATES = [
  { id: 'titan', name: 'Titan Premier', file: 'titan-overlay.html', type: 'premium', color: 'from-orange-500 to-yellow-500' },
  { id: 'neon', name: 'Neon Vector', file: 'neon-vector-replay.html', type: 'free', color: 'from-green-400 to-blue-500' },
  { id: 'glitch', name: 'Cyber Glitch', file: 'glitch-overlay.html', type: 'premium', color: 'from-pink-500 to-purple-600' },
  { id: 'zenith', name: 'Zenith Flux', file: 'zenith-overlay.html', type: 'premium', color: 'from-cyan-400 to-blue-600' },
  { id: 'vintage', name: 'Vintage Paper', file: 'vintage.html', type: 'free', color: 'from-amber-700 to-amber-900' },
  { id: 'prism', name: 'Prism Glass', file: 'prism-overlay.html', type: 'premium', color: 'from-indigo-400 to-purple-400' },
  { id: 'minimal', name: 'Clean Minimal', file: 'gate-minimal-dark.html', type: 'free', color: 'from-gray-700 to-gray-900' },
];

export default function OverlayEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState(OVERLAY_TEMPLATES[0]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [openedWindow, setOpenedWindow] = useState<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

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
     if (!selectedMatchId) return;
     
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
  }, [selectedMatchId]);

  const loadLiveMatches = async () => {
    try {
        const res = await matchAPI.getAllMatches();
        const live = (res.data.matches || []).filter((m: Match) => m.status === 'ongoing');
        setMatches(live);
    } catch (e) {
        console.error("Failed to load matches");
    }
  };

  const launchOverlay = () => {
    const url = `/overlays/${selectedTemplate.file}`;
    const win = window.open(url, 'ScoreX_Overlay', 'width=1920,height=1080,menubar=no,toolbar=no');
    setOpenedWindow(win);
  };

  const pushDataToOverlay = (match: Match) => {
    if (!channelRef.current) return;

    // Transform API match data to Overlay format
    const isTeam1 = match.battingTeam === 'team1';
    const battingTeam = isTeam1 ? match.team1 : match.team2;
    const bowlingTeam = isTeam1 ? match.team2 : match.team1;
    
    const payload = {
        tournament: { name: typeof match.tournament === 'string' ? match.tournament : match.tournament?.name || 'Live Tournament' },
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
        striker: match.liveScores && match.battingTeam ? match.liveScores[match.battingTeam]?.batsmen?.find((b: any) => b.isStriker) || { name: 'Striker', runs: 0, balls: 0 } : { name: 'Striker', runs: 0, balls: 0 },
        nonStriker: match.liveScores && match.battingTeam ? match.liveScores[match.battingTeam]?.batsmen?.find((b: any) => !b.isStriker) || { name: 'Non-Striker', runs: 0, balls: 0 } : { name: 'Non-Striker', runs: 0, balls: 0 },
        bowler: match.liveScores && match.battingTeam ? match.liveScores[match.battingTeam]?.bowler || { name: 'Bowler', overs: 0, runs: 0, wickets: 0 } : { name: 'Bowler', overs: 0, runs: 0, wickets: 0 },
        stats: {
            currentRunRate: match.currentRunRate || 0,
            requiredRunRate: match.requiredRunRate || 0,
            target: match.target || 0
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

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
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
                onClick={launchOverlay}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg"
            >
                <ExternalLink className="w-5 h-5" /> Launch Overlay
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Selection */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold dark:text-white">Select Theme</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {OVERLAY_TEMPLATES.map(template => (
                    <div 
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`cursor-pointer border-2 rounded-xl overflow-hidden relative transition-all transform hover:scale-105 ${
                            selectedTemplate.id === template.id 
                                ? 'border-green-500 ring-2 ring-green-300' 
                                : 'border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        <div className={`h-24 bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                            <span className="text-white font-black text-2xl tracking-widest">{template.name.substring(0,3)}</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800">
                            <h3 className="font-bold text-gray-900 dark:text-white">{template.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded ${template.type === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                {template.type.toUpperCase()}
                            </span>
                        </div>
                        {selectedTemplate.id === template.id && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                                <Zap className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Data Source Control */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm h-fit">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Data Source</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sync with Live Match</label>
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
                        {openedWindow ? ' Overlay Active' : ' Ready to Launch'}
                    </p>
                    <p className="mt-2 text-xs opacity-80">
                        Select a match above to automatically sync scores to the overlay window.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}