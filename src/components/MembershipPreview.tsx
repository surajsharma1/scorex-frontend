import React, { useState, useRef, useEffect } from 'react';
import { Eye, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Circle, Award, Target } from 'lucide-react';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl: string;
}

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName, baseUrl }) => {
  const [progress, setProgress] = useState(50);
  const [demoRuns, setDemoRuns] = useState(0);
  const [demoWickets, setDemoWickets] = useState(0);
  const [demoSixes, setDemoSixes] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const outerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);

  const previewUrl = `${baseUrl}/overlays/${overlayFile}?demo=true&progress=${progress}%&runs=${demoRuns}&wickets=${demoWickets}&sixes=${demoSixes}`;

  // Measure container
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setContainerW(e.contentRect.width);
        setContainerH(e.contentRect.height);
      }
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setContainerW(r.width);
    setContainerH(r.height);
    return () => ro.disconnect();
  }, []);

  const idealScale = containerW > 0
    ? Math.min(containerW / 1920, containerH > 0 ? containerH / 1080 : containerW / 1920)
    : 0;
  const effectiveScale = idealScale * zoom;

  const clamp = (v: number) => Math.max(0.1, Math.min(3, v));

  const retryLoad = () => {
    setIframeLoading(true);
    setIframeError(false);
    if (iframeRef.current) iframeRef.current.src = previewUrl;
  };

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
            type="range" min="0" max="100" step="4" value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            className="w-24 h-2 rounded cursor-pointer"
            style={{ accentColor: 'var(--accent)' }}
          />
          <span className="text-xs font-bold tabular-nums w-8" style={{ color: 'var(--accent)' }}>
            {progress}%
          </span>
        </div>

        {/* Demo Score Buttons */}
        <div className="flex items-center gap-1 rounded-lg p-1 bg-blue-500/10 border border-blue-500/30">
          <button 
            onClick={() => setDemoRuns(r => r + 4)}
            className="p-1.5 rounded font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all"
            title="4 Runs"
          >
            4
          </button>
          <button 
            onClick={() => setDemoSixes(s => s + 1)}
            className="p-1.5 rounded font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-95 transition-all"
            title="Six!"
          >
            6
          </button>
          <button 
            onClick={() => setDemoWickets(w => w + 1)}
            className="p-1.5 rounded font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 transition-all"
            title="OUT"
          >
            OUT
          </button>
        </div>

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

      {/* Preview frame */}
      <div
        ref={outerRef}
        className="relative overflow-hidden"
        style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}
      >
        {/* iframe scaled to fit */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '1920px', height: '1080px',
          transform: `scale(${effectiveScale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}>
          <iframe
            ref={iframeRef}
            src={previewUrl}
            title={`${planName} Overlay Preview`}
            style={{ width: '1920px', height: '1080px', border: 'none', display: 'block', background: 'transparent' }}
            sandbox="allow-scripts allow-same-origin"
            loading="eager"
            onLoad={() => { setIframeLoading(false); setIframeError(false); }}
            onError={() => { setIframeLoading(false); setIframeError(true); }}
          />
        </div>

        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
            <div className="text-center">
              <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-emerald-400" />
              <p className="text-slate-300 text-sm">Loading overlay…</p>
            </div>
          </div>
        )}

        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-20">
            <div className="text-center p-8 max-w-sm">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-300 text-sm mb-4">Backend unreachable</p>
              <div className="flex gap-2 justify-center">
                <button onClick={retryLoad}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all">
                  Retry
                </button>
                <button onClick={() => window.open(previewUrl, '_blank')}
                  className="px-4 py-2 text-sm rounded-xl font-semibold transition-all"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  Open Direct
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipPreview;
