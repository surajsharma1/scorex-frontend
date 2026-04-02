import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MonitorPlay, X, Layout, Zap, Users, BarChart3 } from 'lucide-react';
import { getBackendBaseUrl } from '../services/env';

// Pre-defined lists of our HTML templates
const LVL1_TEMPLATES = [
  { name: 'Lvl 1 Modern Bar', url: '/overlays/lvl1-modern-bar.html' },
  { name: 'Lvl 1 Solid Edge', url: '/overlays/lvl1-solid-edge.html' },
  { name: 'Lvl 1 Clean Cloud', url: '/overlays/lvl1-clean-cloud.html' },
  { name: 'Lvl 1 Minimal Dark', url: '/overlays/lvl1-minimal-dark.html' },
  { name: 'Lvl 1 Franchise Gold', url: '/overlays/lvl1-franchise-gold.html' },
  { name: 'Lvl 1 Cyber Chevron', url: '/overlays/lvl1-cyber-chevron.html' },
  { name: 'Lvl 1 Retro Teal', url: '/overlays/lvl1-paper-style.html' },
  { name: 'Lvl 1 Yellow Impact', url: '/overlays/lvl1-yellow-impact.html' },
  { name: 'Lvl 1 Classic', url: '/overlays/lvl1-classic-test.html' }
];

const LVL2_TEMPLATES = [
  { name: 'Lvl 2 Broadcast Pro', url: '/overlays/lvl2-broadcast-pro.html' },
  { name: 'Lvl 2 Cyber Glitch', url: '/overlays/lvl2-cyber-glitch.html' },
  { name: 'Lvl 2 Tech Capsule', url: '/overlays/lvl2-flame-thrower.html' },
  { name: 'Lvl 2 Airlock Split', url: '/overlays/lvl2-Fluid-Ribbon.html' },
  { name: 'Lvl 2 Glass Morphism', url: '/overlays/lvl2-glass-morphism.html' },
  { name: 'Lvl 2 Sports Ticker', url: '/overlays/lvl2-Global-Sports-Ticker.html' },
  { name: 'Lvl 2 Hologram HUD', url: '/overlays/lvl2-hologram.html' },
  { name: 'Lvl 2 Terminal Glitch', url: '/overlays/lvl2-matrix-rain.html' },
  { name: 'Lvl 2 Neon Pipeline', url: '/overlays/lvl2-neon-pulse.html' },
  { name: 'Lvl 2 Liquid Elastic', url: '/overlays/lvl2-water-flow.html' },
  { name: 'Lvl 2 Particle Storm', url: '/overlays/lvl2-particle-storm.html' },
  { name: 'Lvl 2 RGB Split', url: '/overlays/lvl2-rgb-split.html' }
];

const PreviewStudio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [options, setOptions] = useState<{name: string, url: string}[]>([]);
  const [selectedUrl, setSelectedUrl] = useState('');

  // 1. Determine Dropdown Content based on URL
  useEffect(() => {
    const level = searchParams.get('level');
    const overlayId = searchParams.get('overlayId');
    const template = searchParams.get('template');

    if (level === '1') {
      setOptions(LVL1_TEMPLATES);
      setSelectedUrl(LVL1_TEMPLATES[0].url);
    } else if (level === '2') {
      setOptions(LVL2_TEMPLATES);
      setSelectedUrl(LVL2_TEMPLATES[0].url);
    } else if (overlayId) {
      // Viewing a specific created overlay
      const url = `${getBackendBaseUrl()}/api/v1/overlays/public/${overlayId}`;
      setOptions([{ name: `Created Overlay ID: ${overlayId.substring(0,6)}`, url }]);
      setSelectedUrl(url);
    } else if (template) {
      // Previewing a single template from the creation page
      setOptions([{ name: 'Template Preview', url: template }]);
      setSelectedUrl(template);
    } else {
      // Fallback
      setOptions([{ name: 'Broadcast Pro (Demo)', url: '/overlays/lvl2-broadcast-pro.html' }]);
      setSelectedUrl('/overlays/lvl2-broadcast-pro.html');
    }
  }, [searchParams]);

  // 2. Generic Mock Data
  const genericBattingData = { batTeam: "INDIA", batsmen: [ { name: "R. Sharma", status: "c Smith b Starc", runs: 45, balls: 28, fours: 4, sixes: 2, sr: 160.7 }, { name: "V. Kohli", status: "not out", runs: 82, balls: 45, fours: 8, sixes: 3, sr: 182.2 } ] };
  const genericBowlingData = { bowlTeam: "AUSTRALIA", bowlers: [ { name: "M. Starc", overs: 4, maidens: 0, runs: 32, wickets: 1, econ: 8.0 }, { name: "P. Cummins", overs: 3.2, maidens: 0, runs: 34, wickets: 1, econ: 10.2 } ] };
  const mockLiveScore = { tournamentName: "SCOREX CHAMPIONSHIP", team1Name: "IND", team2Name: "AUS", team1Score: 184, team1Wickets: 4, team1Overs: "18.2", strikerName: "V. Kohli", strikerRuns: 82, strikerBalls: 45, nonStrikerName: "H. Pandya", nonStrikerRuns: 24, nonStrikerBalls: 12, bowlerName: "P. Cummins", bowlerRuns: 34, bowlerWickets: 1, bowlerOvers: "3.2", runRate: "10.10", requiredRunRate: "12.00", target: 200, requiredRuns: 16, remainingBalls: 10, thisOver: ['1', 'W', '4', '6'] };

  // 3. Auto-push data when URL changes
  useEffect(() => {
    if (selectedUrl) setTimeout(() => pushScore(), 800);
  }, [selectedUrl]);

  const fireTrigger = (type: string) => {
    let payload: any = { type: type, data: {} };
    if (type === 'VS_SCREEN') payload.data = { text: "INDIA VS AUSTRALIA" };
    if (type === 'SHOW_TOSS') payload.data = { text: "INDIA WON TOSS & CHOSE BAT" };
    if (type === 'BATSMAN_PROFILE') { payload.type = 'PLAYER_PROFILE'; payload.data = { title: "BATSMAN: V. KOHLI", stats: [{ label: "RUNS", value: "82" }, { label: "SR", value: "182.2" }] }; }
    if (type === 'BOWLER_PROFILE') { payload.type = 'PLAYER_PROFILE'; payload.data = { title: "BOWLER: P. CUMMINS", stats: [{ label: "OVERS", value: "3.2" }, { label: "WICKETS", value: "1" }] }; }
    if (type === 'CAREER_STATS') { payload.data = { title: "V. KOHLI CAREER", stats: [{ label: "MATCHES", value: "115" }, { label: "RUNS", value: "4008" }, { label: "AVG", value: "52.73" }] }; }
    if (type === 'MILESTONE') { payload.data = { title: "HALF CENTURY!", stats: [{ label: "PLAYER", value: "V. KOHLI" }, { label: "RUNS", value: "50" }] }; }
    if (type === 'BATTING_CARD') payload.data = genericBattingData;
    if (type === 'BOWLING_CARD') payload.data = genericBowlingData;
    if (type === 'BOTH_CARDS') payload.data = { ...genericBattingData, ...genericBowlingData };

    iframeRef.current?.contentWindow?.postMessage({ type: 'OVERLAY_TRIGGER', payload }, '*');
  };

  const pushScore = () => { iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_SCORE', data: mockLiveScore, raw: mockLiveScore }, '*'); };

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] flex flex-col overflow-hidden m-0 p-0 font-sans">
      
      {/* FIXED TOP CONTROL PANEL */}
      <div className="bg-slate-900 border-b border-slate-700 w-full shadow-xl shrink-0 z-50">
        
        {/* Top Header Row */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <MonitorPlay className="w-5 h-5 text-blue-500" />
            <span className="text-white font-bold tracking-wide">Broadcast Studio</span>
            <select 
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              className="ml-4 bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1 outline-none focus:border-blue-500 hidden sm:block"
            >
              {options.map((opt, i) => <option key={i} value={opt.url}>{opt.name}</option>)}
            </select>
          </div>
          <button onClick={() => window.close()} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded text-xs font-bold transition-colors">
            <X className="w-4 h-4"/> Close Studio
          </button>
        </div>

        {/* Mobile-only Dropdown */}
        <div className="sm:hidden px-4 py-2 bg-slate-800 border-b border-slate-700">
           <select 
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded px-3 py-2 outline-none"
            >
              {options.map((opt, i) => <option key={i} value={opt.url}>{opt.name}</option>)}
            </select>
        </div>

        {/* HORIZONTAL SCROLLING BUTTON BAR */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-6 items-center">
          
          <div className="flex flex-col gap-1.5 shrink-0 border-r border-slate-700 pr-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><Layout className="w-3 h-3"/> Match Startup</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('VS_SCREEN')} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded-lg font-bold hover:bg-purple-600 hover:text-white transition-all shadow-sm">VS Screen</button>
              <button onClick={() => fireTrigger('SHOW_TOSS')} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded-lg font-bold hover:bg-purple-600 hover:text-white transition-all shadow-sm">Toss Result</button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0 border-r border-slate-700 pr-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><Zap className="w-3 h-3"/> Triggers</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('FOUR')} className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg font-bold hover:bg-green-600 hover:text-white transition-all shadow-sm">Score 4</button>
              <button onClick={() => fireTrigger('SIX')} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">Score 6</button>
              <button onClick={() => fireTrigger('WICKET')} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">Wicket</button>
              <button onClick={() => fireTrigger('DECISION_PENDING')} className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-lg font-bold hover:bg-yellow-600 hover:text-white transition-all shadow-sm">3rd Umpire</button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0 border-r border-slate-700 pr-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><Users className="w-3 h-3"/> Summaries</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('BOTH_CARDS')} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Both Cards (Summary)</button>
              <button onClick={() => fireTrigger('BATTING_CARD')} className="px-4 py-2 bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg font-bold hover:bg-slate-700 hover:text-white transition-all shadow-sm">Batting Only</button>
              <button onClick={() => fireTrigger('BATSMAN_PROFILE')} className="px-4 py-2 bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg font-bold hover:bg-slate-700 hover:text-white transition-all shadow-sm">Side Profiles</button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><BarChart3 className="w-3 h-3"/> Controls</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('RESTORE')} className="px-4 py-2 bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg font-bold hover:bg-slate-700 hover:text-white transition-all shadow-sm">Clear Graphics</button>
              <button onClick={pushScore} className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs rounded-lg font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Push Data</button>
            </div>
          </div>

        </div>
      </div>

      {/* AUTO-SCALING CANVAS */}
      {/* Uses CSS grid to perfectly center, and transform scale to fit any device height/width */}
      <div className="flex-1 w-full h-full relative" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
         <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
           {/* Mobile safe area: subtract 180px to account for the massive top bar */}
           <div style={{ width: '1920px', height: '1080px', transform: 'scale(min(calc(100vw / 1920), calc((100vh - 180px) / 1080)))', transformOrigin: 'center center' }}>
              {selectedUrl && (
                <iframe src={`${selectedUrl}?preview=true`} className="w-full h-full border-none bg-transparent" title="Broadcast Studio" />
              )}
           </div>
         </div>
      </div>

    </div>
  );
};

export default PreviewStudio;