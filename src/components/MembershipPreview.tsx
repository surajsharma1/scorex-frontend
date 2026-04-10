import React, { useState, useRef } from 'react';
import { Eye, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw, MonitorPlay } from 'lucide-react';
import { getApiBaseUrl } from '../services/env';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl?: string;
}

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName }) => {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const level = overlayFile.includes('lvl2') ? '2' : '1';
  const clamp = (v: number) => Math.max(0.1, Math.min(3, v));

  // Use the dedicated /preview endpoint — no auth, no DB lookup, injects mock data
  const templateName = overlayFile.replace(/\.html$/, '');
  const previewUrl = `${getApiBaseUrl()}/overlays/preview?template=${templateName}`;

  const handleLoad = React.useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleError = React.useCallback(() => {
    setError('Failed to load preview. Please check your connection and try again.');
    setLoading(false);
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setIframeKey(k => k + 1);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>

        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
          <Eye className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {planName} Preview
          </span>
        </div>

        <button
          onClick={() => window.open(`/studio?level=${level}&template=/overlays/${overlayFile}`, '_blank')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors text-xs"
          title="Launch Interactive Preview Studio"
        >
          <MonitorPlay className="w-3.5 h-3.5" /> Full Studio
        </button>

        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--bg-card)' }}>
          <button onClick={() => setZoom(z => clamp(z * 0.8))} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Zoom Out" disabled={loading}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => clamp(z * 1.25))} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Zoom In" disabled={loading}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Reset Zoom">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview frame */}
      <div ref={containerRef} className="relative overflow-hidden" style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}>
        <iframe
          key={iframeKey}
          src={previewUrl}
          className="border-none"
          style={{
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
          onLoad={handleLoad}
          onError={handleError}
          title={`${planName} overlay preview`}
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
              <button onClick={handleRetry}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all">
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipPreview;
