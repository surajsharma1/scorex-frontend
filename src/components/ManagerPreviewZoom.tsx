import React, { useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ManagerPreviewZoomProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Standalone zoom controls for OverlayManager preview modal.
 * Reads/writes a --user-zoom CSS variable on the container.
 * The OverlayPreviewRenderer inside reacts to its own ResizeObserver,
 * so we just need to expose a multiplier and let the renderer do the math.
 * We store zoom state locally and push it via a custom event.
 */
const ManagerPreviewZoom: React.FC<ManagerPreviewZoomProps> = ({ containerRef }) => {
  const [zoom, setZoom] = useState(1);

  const applyZoom = useCallback((nextZoom: number) => {
    const clamped = Math.max(0.1, Math.min(3, nextZoom));
    setZoom(clamped);
    // Fire a custom event so OverlayPreviewRenderer inside can pick it up
    containerRef.current?.dispatchEvent(
      new CustomEvent('scorex:zoom', { detail: { zoom: clamped }, bubbles: true })
    );
    // Also update the display span
    const el = document.getElementById('manager-zoom-display');
    if (el) el.textContent = `${Math.round(clamped * 100)}%`;
  }, [containerRef]);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => applyZoom(zoom * 0.8)}
        className="p-1.5 rounded-lg transition-all"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <span
        className="px-2 text-xs font-bold tabular-nums min-w-[40px] text-center"
        style={{ color: 'var(--accent)' }}
      >
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => applyZoom(zoom * 1.25)}
        className="p-1.5 rounded-lg transition-all"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => applyZoom(1)}
        className="p-1.5 rounded-lg transition-all"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        title="Reset Zoom"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ManagerPreviewZoom;
