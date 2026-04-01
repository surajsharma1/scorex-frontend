import React, { useRef, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { X, PlayCircle, Layers, Activity, User, MonitorPlay } from 'lucide-react';
import { getBackendBaseUrl } from '../services/env';

const InteractivePreviewStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get('template'); // For membership previews

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [overlayUrl, setOverlayUrl] = useState('');
  const [overlayName, setOverlayName] = useState('Interactive Studio');

  // Determine what we are previewing (Saved Overlay vs Membership Template)
  useEffect(() => {
    if (id && id !== 'preview') {
      setOverlayUrl(`${getBackendBaseUrl()}/api/v1/overlays/public/${id}?preview=true`);
      setOverlayName(`Overlay ID: ${id.substring(0, 6)}...`);
    } else if (templateParam) {
      setOverlayUrl(`${decodeURIComponent(templateParam)}?preview=true`);
      setOverlayName('Template Preview');
    }
  }, [id, templateParam]);

  // Generic Mock Data
  const genericBattingData = { batTeam: "INDIA", batsmen: [ { name: "R. Sharma", status: "c Smith b Starc", runs: 45, balls: 28, fours: 4, sixes: 2, sr: 160.7 }, { name: "V. Kohli", status: "not out", runs: 82, balls: 45, fours: 8, sixes: 3, sr: 182.2 }, { name: "H. Pandya", status: "not out", runs: 24, balls: 12, fours: 1, sixes: 2, sr: 200.0 } ] };
  const genericBowlingData = { bowlTeam: "AUSTRALIA", bowlers: [ { name: "M. Starc", overs: 4, maidens: 0, runs: 32, wickets: 1, econ: 8.0 }, { name: "P. Cummins", overs: 3.2, maidens: 0, runs: 34, wickets: 1, econ: 10.2 } ] };
  const mockLiveScore = { tournamentName: "WORLD CHAMPIONSHIP", team1Name: "IND", team2Name: "AUS", team1Score: 184, team1Wickets: 4, team1Overs: "18.2", strikerName: "V. Kohli", strikerRuns: 82, strikerBalls: 45, nonStrikerName: "H. Pandya", nonStrikerRuns: 24, nonStrikerBalls: 12, bowlerName: "P. Cummins", bowlerRuns: 34, bowlerWickets: 1, bowlerOvers: "3.2", runRate: "10.10", requiredRunRate: "12.00", target: 200, requiredRuns: 16, remainingBalls: 10, thisOver: ['1', 'W', '4', '6'] };

  useEffect(() => {
    if (overlayUrl) {
      setTimeout(() => pushScore(), 1000);
    }
  }, [overlayUrl]);

  const fireTrigger = (type: string) => {
    let payload: any = { type: type, data: {} };
    if (type === 'VS_SCREEN') payload.data = { text: "INDIA VS AUSTRALIA" };
    if (type === 'SHOW_TOSS') payload.data = { text: "INDIA WON THE TOSS AND CHOSE TO BAT" };
    if (type === 'BATSMAN_PROFILE') { payload.type = 'PLAYER_PROFILE'; payload.data = { title: "CURRENT BATSMAN: V. KOHLI", stats: [{ label: "RUNS", value: "82" }, { label: "BALLS", value: "45" }, { label: "STRIKE RATE", value: "182.2" }] }; }
    if (type === 'BOWLER_PROFILE') { payload.type = 'PLAYER_PROFILE'; payload.data = { title: "CURRENT BOWLER: P. CUMMINS", stats: [{ label: "OVERS", value: "3.2" }, { label: "WICKETS", value: "1" }, { label: "ECONOMY", value: "10.2" }] }; }
    if (type === 'CAREER_STATS') { payload.data = { title: "V. KOHLI - CAREER", stats: [{ label: "MATCHES", value: "115" }, { label: "TOTAL RUNS", value: "4008" }, { label: "AVERAGE", value: "52.73" }] }; }
    if (type === 'MILESTONE') { payload.data = { title: "HALF CENTURY!", stats: [{ label: "BATSMAN", value: "V. KOHLI" }, { label: "RUNS", value: "50" }, { label: "BALLS FACED", value: "32" }] }; }
    if (type === 'BATTING_CARD') payload.data = genericBattingData;
    if (type === 'BOWLING_CARD') payload.data = genericBowlingData;
    if (type === 'BOTH_CARDS') payload.data = { ...genericBattingData, ...genericBowlingData };

    iframeRef.current?.contentWindow?.postMessage({ type: 'OVERLAY_TRIGGER', payload: payload }, '*');
  };

  const pushScore = () => { iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_SCORE', data: mockLiveScore, raw: mockLiveScore }, '*'); };

  return (
    // FULL SCREEN ANCHOR: h-screen w-screen overflow-hidden guarantees it locks to corners
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden m-0 p-0">
      
      {/* HEADER / FIXED CONTROL PANEL */}
      <div className="bg-slate-900 border-b border-slate-700 flex flex-col w-full shadow-2xl shrink-0">
        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 bg-slate-950">
          <h2 className="text-white font-bold flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-blue-500" /> {overlayName}
          </h2>
          <button onClick={() => window.close()} className="px-3 py-1 bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-white rounded text-xs font-bold transition-colors">
            Close Tab
          </button>
        </div>

        {/* SCROLLABLE BUTTON BAR */}
        <div className="flex overflow-x-auto hide-scrollbar p-3 gap-6 items-center">
          <div className="flex flex-col gap-1 shrink-0 border-r border-slate-700 pr-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Pre-Match

</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('VS_SCREEN')} className="px-3 py-1.5 bg-purple-900/40 border border-purple-700/50 text-purple-300 text-xs rounded font-bold hover:bg-purple-600 hover:text-white">VS Screen</button>
              <button onClick={() => fireTrigger('SHOW_TOSS')} className="px-3 py-1.5 bg-purple-900/40 border border-purple-700/50 text-purple-300 text-xs rounded font-bold hover:bg-purple-600 hover:text-white">Toss Result</button>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0 border-r border-slate-700 pr-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Live Events</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('FOUR')} className="px-3 py-1.5 bg-green-900/40 border border-green-700/50 text-green-300 text-xs rounded font-bold hover:bg-green-600 hover:text-white">Score 4</button>
              <button onClick={() => fireTrigger('SIX')} className="px-3 py-1.5 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs rounded font-bold hover:bg-blue-600 hover:text-white">Score 6</button>
              <button onClick={() => fireTrigger('WICKET')} className="px-3 py-1.5 bg-red-900/40 border border-red-700/50 text-red-300 text-xs rounded font-bold hover:bg-red-600 hover:text-white">Wicket</button>
              <button onClick={() => fireTrigger('DECISION_PENDING')} className="px-3 py-1.5 bg-yellow-900/40 border border-yellow-700/50 text-yellow-300 text-xs rounded font-bold hover:bg-yellow-600 hover:text-white">3rd Umpire</button>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0 border-r border-slate-700 pr-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Data Panels</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('BATSMAN_PROFILE')} className="px-3 py-1.5 bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded font-bold hover:bg-slate-600 hover:text-white">Bat Profile</button>
              <button onClick={() => fireTrigger('BOWLER_PROFILE')} className="px-3 py-1.5 bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded font-bold hover:bg-slate-600 hover:text-white">Bowl Profile</button>
              <button onClick={() => fireTrigger('MILESTONE')} className="px-3 py-1.5 bg-yellow-900/40 border border-yellow-700/50 text-yellow-300 text-xs rounded font-bold hover:bg-yellow-600 hover:text-white">Milestone</button>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0 border-r border-slate-700 pr-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Match Summaries</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('BOTH_CARDS')} className="px-3 py-1.5 bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs rounded font-bold hover:bg-indigo-600 hover:text-white">Both Cards</button>
              <button onClick={() => fireTrigger('BATTING_CARD')} className="px-3 py-1.5 bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded font-bold hover:bg-slate-600 hover:text-white">Batting Only</button>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase">System</span>
            <div className="flex gap-2">
              <button onClick={() => fireTrigger('RESTORE')} className="px-3 py-1.5 bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded font-bold hover:bg-slate-600 hover:text-white">Clear Graphics</button>
            </div>
          </div>
        </div>
      </div>

      {/* IFRAME CONTAINER */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-[#0a0a0f]" style={{ backgroundImage: 'radial-gradient(#222 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Responsive Scaling Wrapper */}
          <div style={{ width: '1920px', height: '1080px', transform: 'scale(min(calc(100vw / 1920), calc((100vh - 120px) / 1080)))', transformOrigin: 'center center' }}>
             {overlayUrl && (
               <iframe ref={iframeRef} src={overlayUrl} className="w-full h-full border-none bg-transparent" title="Studio" />
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePreviewStudio;
