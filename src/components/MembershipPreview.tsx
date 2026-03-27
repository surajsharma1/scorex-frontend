import React, { useState, useRef, useEffect } from 'react';
import { useValueDebounce } from '../hooks/useValueDebounce';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';

import { Eye, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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

  const clamp = (v: number) => Math.max(0.1, Math.min(3, v));


  const triggerAnimation = (eventType: string) => {
    window.postMessage({
      type: 'OVERLAY_ACTION',
      payload: { event: eventType }
    }, '*');
  };

  // Add these above your return statement
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
          progress={progress}
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
      <div className="p-3 border-t flex flex-wrap gap-2 justify-center" style={{ background: 'var(--bg-elevated)', borderTopColor: 'var(--border)' }}>
          <span className="text-xs font-bold flex items-center mr-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Trigger Animations:</span>
          <button onClick={() => triggerAnimation('FOUR')} className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold hover:bg-blue-500/30 transition-colors">FOUR</button>
          <button onClick={() => triggerAnimation('SIX')} className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-bold hover:bg-green-500/30 transition-colors">SIX</button>
          <button onClick={() => triggerAnimation('WICKET')} className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold hover:bg-red-500/30 transition-colors">WICKET</button>
          <button onClick={() => triggerAnimation('DECISION_PENDING')} className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold hover:bg-amber-500/30 transition-colors">DECISION PENDING</button>
      </div>
    </div>
  );
};

export default MembershipPreview;