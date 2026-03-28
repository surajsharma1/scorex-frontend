import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import { getBackendBaseUrl } from '../services/env';
import { getDemoData, PreviewData } from '../utils/overlayPreview';

interface OverlayPreviewRendererProps {
  template: string;
  progress?: number;
  className?: string;
  heightClass?: string;
  baseUrl?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  /** External zoom multiplier. 1 = fit-to-container (default). */
  zoom?: number;
}

const OVERLAY_W = 1920;
const OVERLAY_H = 1080;

const OverlayPreviewRenderer: React.FC<OverlayPreviewRendererProps> = ({
  template,
  progress = 69,
  className = '',
  heightClass = '',
  baseUrl,
  onLoad,
  onError,
  zoom: externalZoom,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [containerW, setContainerW]   = useState(0);
  const [containerH, setContainerH]   = useState(0);
  const [internalZoom, setInternalZoom] = useState(1);
  
  // Track demo score for delta-based animation push
  const demoScoreRef = useRef({ score: 124, wickets: 4 });

  const controllerBaseUrl = baseUrl || getBackendBaseUrl();
  const templatePath = template.startsWith('/') ? template : `/overlays/${template}`;

  // ── Measure container (debounced to prevent ResizeObserver loop) ────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    let rafId: number;
    const updateSize = (width: number, height: number) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (Math.abs(containerW - width) > 2) setContainerW(width);
        if (Math.abs(containerH - height) > 2) setContainerH(height);
      });
    };

    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) updateSize(r.width, r.height);
    };

    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        if (e.contentRect.width > 0 && e.contentRect.height > 0) {
          updateSize(e.contentRect.width, e.contentRect.height);
        }
      }
    });

    ro.observe(el);
    measure();
    requestAnimationFrame(measure);

    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [containerW, containerH]);

  // ── Listen for zoom events from ManagerPreviewZoom ──────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ zoom: number }>;
      setInternalZoom(ce.detail.zoom);
    };
    window.addEventListener('scorex:zoom', handler);
    return () => window.removeEventListener('scorex:zoom', handler);
  }, []);

  // Memoized scale calculation
  const idealScale = React.useMemo(() => 
    containerW > 0
      ? Math.min(containerW / OVERLAY_W, containerH > 0 ? containerH / OVERLAY_H : Infinity)
      : 0,
    [containerW, containerH]
  );

  const activeZoom = React.useMemo(() => 
    externalZoom !== undefined ? externalZoom : internalZoom,
    [externalZoom, internalZoom]
  );

  const effectiveScale = React.useMemo(() => 
    idealScale * activeZoom,
    [idealScale, activeZoom]
  );

  // ── Push animation event using score DELTA (overlays detect 4/6/wicket this way) ──
  const pushAnimationEvent = useCallback((type: string) => {
    const cur = demoScoreRef.current;
    let newScore   = cur.score;
    let newWickets = cur.wickets;
    
    if (type === 'FOUR')   newScore   += 4;
    if (type === 'SIX')    newScore   += 6;
    if (type === 'WICKET') newWickets += 1;
    
    demoScoreRef.current = { score: newScore, wickets: newWickets };

    const base = getDemoData(progress / 100);
    const payload = {
      ...base,
      team1Score:   newScore,
      team1Wickets: newWickets,
      lastBall:     type,
      lastBallRuns: type === 'FOUR' ? 4 : type === 'SIX' ? 6 : 0,
      wicket:       type === 'WICKET',
    };

    // Forward the precise data state down into the iframe environment
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_SCORE', data: payload }, '*');
      iframeRef.current.contentWindow.postMessage({ type: 'OVERLAY_ACTION', payload: { event: type } }, '*');
    }
  }, [progress]);

  // ── Listen for Global Animation Triggers from OverlayManager ─────────────
  useEffect(() => {
    const handleOverlayAction = (e: any) => {
      let eventType = '';
      if (e.type === 'message' && e.data?.type === 'OVERLAY_ACTION') {
        eventType = e.data.payload?.event;
      } else if (e.type === 'OVERLAY_ACTION') {
        eventType = e.detail?.event;
      }
      
      if (eventType) {
        pushAnimationEvent(eventType);
      }
    };

    window.addEventListener('message', handleOverlayAction);
    window.addEventListener('OVERLAY_ACTION', handleOverlayAction as any);
    
    return () => {
      window.removeEventListener('message', handleOverlayAction);
      window.removeEventListener('OVERLAY_ACTION', handleOverlayAction as any);
    };
  }, [pushAnimationEvent]);

  // ── Iframe Initialization ────────────────────────────────────────────────
  const handleIframeLoad = () => {
    setLoading(false);
    onLoad?.();
    
    // Seed the iframe with initial Demo Data
    const demoData = getDemoData(progress / 100);
    demoScoreRef.current = { score: demoData.team1Score, wickets: demoData.team1Wickets };
    
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_SCORE', data: demoData }, '*');
    }
  };

  return (
    <div
      ref={outerRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ${heightClass} ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Overlay iframe at native 1920×1080, scaled flawlessly to fit */}
      <div style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', width: '100%', height: '100%' }}>
        <iframe
          ref={iframeRef}
          src={`${controllerBaseUrl}${templatePath}?preview=true`}
          onLoad={handleIframeLoad}
          onError={() => {
            setError(`Failed to load ${template}`);
            onError?.(`Failed to load ${template}`);
          }}
          style={{
            width:           `${OVERLAY_W}px`,
            height:          `${OVERLAY_H}px`,
            transform:       `scale(${effectiveScale || 0.001})`,
            transformOrigin: 'top left',
            border:          'none',
            pointerEvents:   'none', // Prevents iframe from stealing scroll/clicks
          }}
          title="Overlay Preview"
        />
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-20">
          <div className="text-center p-8">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-400" />
            <p className="text-slate-300 text-lg font-medium">Initializing preview environment…</p>
            <p className="text-sm text-slate-400 mt-2">{template}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/95 z-20">
          <div className="text-center p-8 rounded-2xl border-2 border-red-500/50 max-w-md bg-slate-900/50">
            <Eye className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-200 mb-4">Preview Error</h3>
            <p className="text-slate-400 mb-6 text-sm">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src;
                }
              }}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Live badge */}
      {!loading && !error && (
        <div className="absolute top-3 right-3 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg flex items-center gap-1">
          <Eye className="w-3 h-3" /> PREVIEW
        </div>
      )}
    </div>
  );
};

export default OverlayPreviewRenderer;