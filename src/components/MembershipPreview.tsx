import React, { useState, useRef } from 'react';
import { useValueDebounce } from '../hooks/useValueDebounce';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import { getDemoData } from '../utils/overlayPreview';
import { getBackendBaseUrl } from '../services/env';

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

  const containerRef = useRef<HTMLDivElement>(null);
  const demoScoreRef = useRef({ score: 124, wickets: 4 });

  const clamp = (v: number) => Math.max(0.1, Math.min(3, v));

  // Master Scoreboard-style Push Animation Method
  const pushAnimationEvent = (type: 'FOUR' | 'SIX' | 'WICKET' | 'DECISION PENDING') => {
    const cur = demoScoreRef.current;
    let newScore   = cur.score;
    let newWickets = cur.wickets;
    if (type === 'FOUR')   newScore   += 4;
    if (type === 'SIX')    newScore   += 6;
    if (type === 'WICKET') newWickets += 1;
    demoScoreRef.current = { score: newScore, wickets: newWickets };

    const base = getDemoData(0.69);
    const payload = {
      ...base,
      team1Score:    newScore,
      team1Wickets:  newWickets,
      lastBall:      type,
      lastBallRuns:  type === 'FOUR' ? 4 : type === 'SIX' ? 6 : 0,
      wicket:        type === 'WICKET',
      decisionPending: type === 'DECISION PENDING',
    };

    window.postMessage({ type: 'UPDATE_SCORE', data: payload }, '*');
    window.dispatchEvent(new CustomEvent('scorex:update', { detail: payload }));
  };

  const handleLoad = React.useCallback(() => setLoading(false), []);
  const handleError = React.useCallback((err: string) => {
    setError(err);
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
          <Eye className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
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
        <OverlayPreviewRenderer 
          template={overlayFile}
          progress={debouncedProgress}
          baseUrl={baseUrl}
          zoom={zoom}
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

      {/* Animation Trigger Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-inner">
         <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mr-2 sm:mr-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500"/> Triggers:</span>
         <button onClick={() => pushAnimationEvent('FOUR')} className="flex-1 sm:flex-none px-6 py-3 bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm">FOUR (4)</button>
         <button onClick={() => pushAnimationEvent('SIX')} className="flex-1 sm:flex-none px-6 py-3 bg-green-500/10 text-green-400 font-bold border border-green-500/30 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm">SIX (6)</button>
         <button onClick={() => pushAnimationEvent('WICKET')} className="flex-1 sm:flex-none px-6 py-3 bg-red-500/10 text-red-400 font-bold border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">OUT (W)</button>
         <button onClick={() => pushAnimationEvent('DECISION PENDING')} className="w-full sm:w-auto px-6 py-3 bg-amber-500/10 text-amber-500 font-bold border border-amber-500/30 rounded-xl hover:bg-amber-500 hover:text-black transition-all tracking-wide shadow-sm">DECISION PENDING (DP)</button>
      </div>
    </div>
  );
};

export default MembershipPreview;
