import React, { useState, useRef } from 'react';
import { useValueDebounce } from '../hooks/useValueDebounce';
import InteractivePreviewStudio from './PreviewStudio';
import { MonitorPlay } from 'lucide-react';

import { Eye, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Activity } from 'lucide-react';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl: string;
}

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName, baseUrl }) => {
  const [progress, setProgress] = useState(50);
  const debouncedProgress = useValueDebounce(progress, 300);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const clamp = (v: number) => Math.max(0.1, Math.min(3, v));

  // Master Scoreboard-style trigger method (Purely triggers animations)
  const triggerAnimation = (eventType: string) => {
    const iframes = document.querySelectorAll('iframe');
    
    let payload = { type: eventType, duration: 8, data: {} };

    // Inject mock data for the advanced panels so you can see them work
    if (eventType === 'SHOW_SQUADS') {
      payload.data = {
        team1Name: "INDIA", team2Name: "AUSTRALIA",
        team1Players: [{name: 'R. Sharma', role: 'BAT'}, {name: 'V. Kohli', role: 'BAT'}, {name: 'J. Bumrah', role: 'BOWL'}],
        team2Players: [{name: 'T. Head', role: 'BAT'}, {name: 'P. Cummins', role: 'BOWL'}, {name: 'M. Starc', role: 'BOWL'}]
      };
    } else if (eventType === 'SHOW_TOSS') {
      payload.data = { text: "INDIA WON THE TOSS AND CHOSE TO BAT" };
    } else if (eventType === 'WICKET') {
      payload.data = { playerName: "V. Kohli", matches: 280, runs: 12500, sr: 138.5 };
    } else if (eventType === 'BATSMAN_CARD') {
      payload.data = { playerName: "R. Sharma", stat1: "45", stat2: "28", stat3: "4/2" };
    } else if (eventType === 'BOWLER_CARD') {
      payload.data = { playerName: "M. Starc", stat1: "3.0", stat2: "2", stat3: "6.5" };
    } else if (eventType === 'MANHATTAN') {
      payload.data = { runsPerOver: [5, 12, 4, 8, 16, 2, 7, 14] };
    }

    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({
        type: 'OVERLAY_TRIGGER',
        payload: payload
      }, '*');
    });
  };

  const handleLoad = React.useCallback(() => {
    setLoading(false);
    // Attempt to hide any built-in dev controls inside the HTML iframe
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.contentDocument) {
          const style = iframe.contentDocument.createElement('style');
          style.innerHTML = '.dev-controls, #dev-controls, .controls-container, button { display: none !important; }';
          iframe.contentDocument.head.appendChild(style);
        }
      });
    } catch (err) {
      // Ignore cross-origin errors
    }
  }, []);

  const handleError = React.useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    console.error('Iframe load error:', e);
    setError('Failed to load preview. Try refreshing.');
    setLoading(false);
  }, []);



  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Controls */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
<button 
  onClick={() => {
    // Determine level from the planName or overlayFile string
    const level = planName.toLowerCase().includes('pro') || overlayFile.includes('lvl2') ? '2' : '1';
    window.open(`/studio?level=${level}`, '_blank');
  }} 
  className="flex-1 sm:flex-none px-6 py-3 bg-blue-500 text-white font-bold rounded-xl transition-colors" 
  title="Launch Interactive Preview"
>
  <MonitorPlay className="w-4 h-4" /> Launch Interactive Preview
</button>
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {planName} Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress:</label>
            <input
              type="range"
              min="0"
              max="100"
              step="4"
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              disabled={loading}
              className="w-24 h-2 rounded cursor-pointer accent-green-500"
            />

          <span className="text-xs font-bold tabular-nums w-8" style={{ color: 'var(--accent)' }}>
            {progress}%
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--bg-card)' }}>
          <button onClick={() => setZoom(z => clamp(z * 0.8))} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Zoom Out" disabled={loading}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => clamp(z * 1.25))} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Zoom In" disabled={loading}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button onClick={() => setZoom(1)} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Reset">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview frame */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}
      >
        <iframe
          src={`${baseUrl}/overlays/${overlayFile}`}
          className="w-full h-full border-none"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          onLoad={handleLoad}
          onError={handleError}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
            <div className="text-center">
              <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-emerald-400" />
              <p className="text-slate-300 text-sm">Loading overlay…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-20">
            <div className="text-center p-8 max-w-sm">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-300 text-sm mb-4">{error}</p>
              <button onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all">
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

         <div className="mt-6 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-inner">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500"/> Advanced Triggers:</span>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Full Screen Triggers */}
              <button onClick={() => triggerAnimation('SHOW_SQUADS')} className="p-3 bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30 rounded-xl hover:bg-purple-500 hover:text-white transition-all text-xs">Full Squads</button>
              <button onClick={() => triggerAnimation('SHOW_TOSS')} className="p-3 bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30 rounded-xl hover:bg-purple-500 hover:text-white transition-all text-xs">Toss Result</button>
              
              {/* Micro Triggers */}
              <button onClick={() => triggerAnimation('FOUR')} className="p-3 bg-green-500/10 text-green-400 font-bold border border-green-500/30 rounded-xl hover:bg-green-500 hover:text-white transition-all text-xs">FOUR (4)</button>
              <button onClick={() => triggerAnimation('SIX')} className="p-3 bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30 rounded-xl hover:bg-blue-500 hover:text-white transition-all text-xs">SIX (6)</button>
              
              {/* Advanced Panel Triggers */}
              <button onClick={() => triggerAnimation('WICKET')} className="p-3 bg-red-500/10 text-red-400 font-bold border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs">Wicket & Career</button>
              <button onClick={() => triggerAnimation('BATSMAN_CARD')} className="p-3 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30 rounded-xl hover:bg-amber-500 hover:text-white transition-all text-xs">Batsman Summary</button>
              <button onClick={() => triggerAnimation('BOWLER_CARD')} className="p-3 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30 rounded-xl hover:bg-amber-500 hover:text-white transition-all text-xs">Bowler Summary</button>
              <button onClick={() => triggerAnimation('MANHATTAN')} className="p-3 bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/30 rounded-xl hover:bg-indigo-500 hover:text-white transition-all text-xs">Manhattan Graph</button>
              
              <button onClick={() => triggerAnimation('DECISION_PENDING')} className="col-span-2 p-3 bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/30 rounded-xl hover:bg-yellow-500 hover:text-white transition-all text-xs">Decision Pending</button>
              <button onClick={() => triggerAnimation('SHOW_SCOREBOARD')} className="col-span-2 p-3 bg-slate-500/10 text-slate-400 font-bold border border-slate-500/30 rounded-xl hover:bg-slate-500 hover:text-white transition-all text-xs">Restore Scoreboard</button>
            </div>
         </div>
    </div>
  );
};

export default MembershipPreview;