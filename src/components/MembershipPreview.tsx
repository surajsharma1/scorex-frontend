import React, { useState } from 'react';
import { Eye, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl: string;
}

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName, baseUrl }) => {
  const [progress, setProgress] = useState(50);
  const [zoom, setZoom] = useState(1);
  
  const clamp = (v: number) => Math.max(0.1, Math.min(3, v));

  // The standardized messaging function that triggers CSS/JS animations inside the rendered overlay
  const triggerAnimation = (eventType: string) => {
    window.postMessage({
      type: 'OVERLAY_ACTION',
      payload: { event: eventType }
    }, '*');
  };

  // Ensure we always have a string to render, even if the prop drops temporarily
  const safeOverlayFile = overlayFile || 'lvl1-modern-bar.html';

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* ── Top Control Bar ── */}
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

        {/* Progress Slider to feed demo data */}
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress:</label>
          <input
            type="range" min="0" max="100" step="4" value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            className="w-24 h-2 rounded cursor-pointer"
            style={{ accentColor: 'var(--accent)' }}
          />
          <span className="text-xs font-bold tabular-nums w-8" style={{ color: 'var(--accent)' }}>
            {progress}%
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--bg-card)' }}>
          <button onClick={() => setZoom(z => clamp(z * 0.8))} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => clamp(z * 1.25))} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Reset">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main Preview Frame ── */}
      <div className="relative w-full aspect-video bg-black flex-1">
          <OverlayPreviewRenderer 
            template={safeOverlayFile} 
            progress={progress} 
            baseUrl={baseUrl} 
            zoom={zoom}
            className="rounded-none border-none"
          />
      </div>

      {/* ── Bottom Animation Triggers ── */}
      <div className="p-3 border-t flex flex-wrap gap-2 justify-center items-center" style={{ background: 'var(--bg-elevated)', borderTopColor: 'var(--border)' }}>
          <span className="text-xs font-bold mr-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Test Triggers:</span>
          <button 
            onClick={() => triggerAnimation('FOUR')} 
            className="px-4 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500/30 transition-colors"
          >
            FOUR
          </button>
          <button 
            onClick={() => triggerAnimation('SIX')} 
            className="px-4 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-colors"
          >
            SIX
          </button>
          <button 
            onClick={() => triggerAnimation('WICKET')} 
            className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors"
          >
            WICKET
          </button>
          <button 
            onClick={() => triggerAnimation('DECISION_PENDING')} 
            className="px-4 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors"
          >
            DECISION PENDING
          </button>
      </div>
    </div>
  );
};

export default MembershipPreview;