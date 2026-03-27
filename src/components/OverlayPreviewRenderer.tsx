import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import { getBackendBaseUrl } from '../services/env';
import { getDemoData, updatePreviewData, PreviewData, fetchOverlayHTML } from '../utils/overlayPreview';

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
  const innerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [containerW, setContainerW]   = useState(0);
  const [containerH, setContainerH]   = useState(0);
  const [internalZoom, setInternalZoom] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  // Track demo score for delta-based animation push
  const demoScoreRef = useRef({ score: 124, wickets: 4 });

  const controllerBaseUrl = baseUrl || getBackendBaseUrl();

  // ── Measure container (debounced to prevent ResizeObserver loop) ────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    let rafId: number;
    const updateSize = (width: number, height: number) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Only update if size significantly changed (2px tolerance prevents jitter loops)
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
        const w = e.contentRect.width;
        const h = e.contentRect.height;
        if (w > 0 && h > 0) updateSize(w, h);
      }
    });

    ro.observe(el);
    
    // Initial measurements
    measure();
    requestAnimationFrame(measure);

    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ── Listen for zoom events from ManagerPreviewZoom ──────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ zoom: number }>;
      setInternalZoom(ce.detail.zoom);
    };
    document.addEventListener('scorex:zoom', handler);
    return () => document.removeEventListener('scorex:zoom', handler);
  }, []);

  // Memoized scale calculation
  const idealScale = React.useMemo(() => 
    containerW > 0
      ? Math.min(
          containerW / OVERLAY_W,
          containerH > 0 ? containerH / OVERLAY_H : Infinity
        )
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

  // Apply scale via useLayoutEffect (synchronous before paint)
  React.useLayoutEffect(() => {
    if (!innerRef.current || effectiveScale === 0) return;
    innerRef.current.style.transform = `scale(${effectiveScale})`;
  }, [effectiveScale]);

  // ── Load overlay HTML ──────────────────────────────────────────────────────
  const loadPreview = useCallback(async () => {
    if (!template || isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const htmlContent = await fetchOverlayHTML(controllerBaseUrl, template);
      if (!innerRef.current) return;

      innerRef.current.innerHTML = htmlContent;
      
      // Preview logic fully ported to overlayPreview.ts - no external scripts needed
      // CSP-safe: relies on inline HTML scripts + updatePreviewData DOM updates

      const demoData = getDemoData(progress / 100);
      // Reset delta tracker to match demo base score
      demoScoreRef.current = { score: demoData.team1Score, wickets: demoData.team1Wickets };
      setPreviewData(demoData);
      setIsLoaded(true);

      // Single-frame delay for paint + scale stabilization
      requestAnimationFrame(() => {
        if (innerRef.current) {
          updatePreviewData(innerRef.current, demoData);
          window.postMessage({ type: 'UPDATE_SCORE', data: demoData }, '*');
        }
        onLoad?.();
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Preview load failed';
      setError(msg + ` (${template})`);
      onError?.(msg);
      setIsLoaded(true); // Prevent retry loops
    } finally {
      setLoading(false);
    }
  }, [template, progress, controllerBaseUrl, onLoad, onError, isLoaded]);

  // Load once on mount/template change, skip if already loaded
  useEffect(() => { 
    loadPreview(); 
  }, [loadPreview]);

  // ── Data refresh on previewData change
  useEffect(() => {
    if (previewData && innerRef.current) {
      updatePreviewData(innerRef.current, previewData);
      window.postMessage({ type: 'UPDATE_SCORE', data: previewData }, '*');
    }
  }, [previewData]);

  // ── Listen for scorex:update events ───────────────────────────────────────
  useEffect(() => {
    const container = innerRef.current;
    if (!container) return;

      const handleContainerUpdate = (e: CustomEvent<PreviewData>) => {
        if (e.defaultPrevented) return; // Prevent recursion
        e.preventDefault();
        updatePreviewData(container, e.detail);
      };
    container.addEventListener('scorex:update', handleContainerUpdate as EventListener);

    const handleWindowUpdate = (e: Event) => {
      const ce = e as CustomEvent<PreviewData>;
      if (ce.detail) updatePreviewData(container, ce.detail);
    };
    window.addEventListener('scorex:update', handleWindowUpdate);

    return () => {
      container.removeEventListener('scorex:update', handleContainerUpdate as EventListener);
      window.removeEventListener('scorex:update', handleWindowUpdate);
    };
  }, []);

  // ── Push animation event using score DELTA (overlays detect 4/6/wicket this way) ──
  const pushAnimationEvent = (type: 'FOUR' | 'SIX' | 'WICKET') => {
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

    // UPDATE_SCORE is what all overlay HTML message listeners expect
    window.postMessage({ type: 'UPDATE_SCORE', data: payload }, '*');
    // scorex:update for the React-side DOM updater
    window.dispatchEvent(new CustomEvent('scorex:update', { detail: payload }));
    if (innerRef.current) updatePreviewData(innerRef.current, payload);
  };

  return (
    <div
      ref={outerRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ${heightClass} ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Overlay content at native 1920×1080, scaled to fit */}
      <div style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', width: '100%', height: '100%' }}>
        <div
          ref={innerRef}
          style={{
            width:           `${OVERLAY_W}px`,
            height:          `${OVERLAY_H}px`,
            transform:       `scale(${effectiveScale || 0.001})`,
            transformOrigin: 'top left',
            pointerEvents:   'none',
          }}
        />
      </div>

      {/* Animation push buttons — only shown when overlay is loaded */}
      {!loading && !error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          <button
            onClick={() => pushAnimationEvent('FOUR')}
            className="px-4 py-2 bg-blue-600/80 text-white shadow-lg rounded-xl text-xs font-bold hover:bg-blue-500 transition-all backdrop-blur-md"
            title="Push FOUR — triggers overlay animation via score delta"
          >4</button>
          <button
            onClick={() => pushAnimationEvent('SIX')}
            className="px-4 py-2 bg-green-600/80 text-white shadow-lg rounded-xl text-xs font-bold hover:bg-green-500 transition-all backdrop-blur-md"
            title="Push SIX — triggers overlay animation via score delta"
          >6</button>
          <button
            onClick={() => pushAnimationEvent('WICKET')}
            className="px-4 py-2 bg-red-600/80 text-white shadow-lg rounded-xl text-xs font-bold hover:bg-red-500 transition-all backdrop-blur-md"
            title="Push WICKET — triggers overlay animation via wicket delta"
          >OUT</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-20">
          <div className="text-center p-8">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-400" />
            <p className="text-slate-300 text-lg font-medium">Rendering preview…</p>
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
              onClick={loadPreview}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Live badge */}
      {!loading && !error && previewData && (
        <div className="absolute top-3 right-3 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg flex items-center gap-1">
          <Eye className="w-3 h-3" /> LIVE
        </div>
      )}
    </div>
  );
};

export default OverlayPreviewRenderer;
