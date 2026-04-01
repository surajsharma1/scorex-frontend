import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { X, PlayCircle, Layers, Activity, User, MonitorPlay } from 'lucide-react';
import { getBackendBaseUrl } from '../services/env';

interface InteractivePreviewStudioProps {
  isOpen?: boolean;
  onClose?: () => void;
  overlayUrl?: string;
  overlayName?: string;
}

const InteractivePreviewStudio: React.FC<InteractivePreviewStudioProps> = ({ 
  isOpen = false, 
  onClose, 
  overlayUrl, 
  overlayName 
}) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get('template');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [effectiveUrl, setEffectiveUrl] = useState('');
  const [effectiveName, setEffectiveName] = useState('Interactive Studio');

  // Determine URL and name - props first, then route params
  useEffect(() => {
    let url = overlayUrl;
    let name = overlayName;

    if (!url && id && id !== 'preview') {
      url = `${getBackendBaseUrl()}/api/v1/overlays/public/${id}?preview=true`;
      name = `Overlay ID: ${id.substring(0, 6)}...`;
    } else if (!url && templateParam) {
      url = `${decodeURIComponent(templateParam)}?preview=true`;
      name = 'Template Preview';
    }

    if (url) {
      setEffectiveUrl(url);
      setEffectiveName(name || 'Interactive Studio');
    }
  }, [id, templateParam, overlayUrl, overlayName]);

  // Generic Mock Data
  const genericBattingData = { batTeam: "INDIA", batsmen: [ { name: "R. Sharma", status: "c Smith b Starc", runs: 45, balls: 28, fours: 4, sixes: 2, sr: 160.7 }, { name: "V. Kohli", status: "not out", runs: 82, balls: 45, fours: 8, sixes: 3, sr: 182.2 }, { name: "H. Pandya", status: "not out", runs: 24, balls: 12, fours: 1, sixes: 2, sr: 200.0 } ] };
  const genericBowlingData = { bowlTeam: "AUSTRALIA", bowlers: [ { name: "M. Starc", overs: 4, maidens: 0, runs: 32, wickets: 1, econ: 8.0 }, { name: "P. Cummins", overs: 3.2, maidens: 0, runs: 34, wickets: 1, econ: 10.2 } ] };
  const mockLiveScore = { tournamentName: "WORLD CHAMPIONSHIP", team1Name: "IND", team2Name: "AUS", team1Score: 184, team1Wickets: 4, team1Overs: "18.2", strikerName: "V. Kohli", strikerRuns: 82, strikerBalls: 45, nonStrikerName: "H. Pandya", nonStrikerRuns: 24, nonStrikerBalls: 12, bowlerName: "P. Cummins", bowlerRuns: 34, bowlerWickets: 1, bowlerOvers: "3.2", runRate: "10.10", requiredRunRate: "12.00", target: 200, requiredRuns: 16, remainingBalls: 10, thisOver: ['1', 'W', '4', '6'] };

  useEffect(() => {
    if (effectiveUrl) {
      setTimeout(() => pushScore(), 1000);
    }
  }, [effectiveUrl]);

  const fireTrigger = useCallback((type: string) => {
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
  }, []);

  const pushScore = useCallback(() => { 
    iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_SCORE', data: mockLiveScore, raw: mockLiveScore }, '*'); 
  }, []);

  // Modal mode (isOpen=true)
  if (isOpen) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        />
        <div className="fixed inset-x-4 top-8 bottom-8 z-[10000] flex flex-col max-w-7xl mx-auto animate-in fade-in zoom-in duration-200">
          {/* Modal content - same as before */}
          <div className="bg-slate-900 border border-slate-700 flex flex-col shadow-2xl rounded-3xl overflow-hidden flex-1 max-h-[90vh] min-h-[500px]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
              <h2 className="text-white font-bold flex items-center gap-2 text-xl">
                <MonitorPlay className="w-5 h-5 text-blue-500" /> 
                {effectiveName}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-red-900/40 rounded-xl text-red-400 hover:text-red-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Rest of modal controls and iframe */}
            <div className="flex overflow-x-auto hide-scrollbar p-4 gap-6 bg-slate-900/50 border-b border-slate-800 shrink-0">
              {/* Controls buttons */}
            </div>
            <div className="flex-1 relative overflow-hidden bg-[#0a0a0f]">
              {effectiveUrl && (
                <iframe ref={iframeRef} src={effectiveUrl} className="w-full h-full border-none" />
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Full page route mode (isOpen=false or undefined)
  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden m-0 p-0">
      <div className="bg-slate-900 border-b border-slate-700 flex flex-col w-full shadow-2xl shrink-0">
        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 bg-slate-950">
          <h2 className="text-white font-bold flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-blue-500" /> {effectiveName}
          </h2>
          <button onClick={() => window.close()} className="px-3 py-1 bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-white rounded text-xs font-bold transition-colors">
            Close Tab
          </button>
        </div>
        {/* Controls bar */}
        <div className="flex overflow-x-auto hide-scrollbar p-3 gap-6 items-center">
          {/* All trigger buttons */}
        </div>
      </div>
      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-[#0a0a0f]" style={{ backgroundImage: 'radial-gradient(#222 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <div style={{ width: '1920px', height: '1080px', transform: 'scale(min(calc(100vw / 1920), calc((100vh - 120px) / 1080)))', transformOrigin: 'center center' }}>
            {effectiveUrl && (
              <iframe ref={iframeRef} src={effectiveUrl} className="w-full h-full border-none bg-transparent" title="Studio" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePreviewStudio;

