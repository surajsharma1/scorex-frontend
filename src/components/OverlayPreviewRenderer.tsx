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
  const outerRef   = useRef<HTMLDivElement>(null);
  const innerRef   = useRef<HTMLDivElement>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);
  const [internalZoom, setInternalZoom] = useState(1);

  const controllerBaseUrl = baseUrl || getBackendBaseUrl();

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

  // Listen for zoom events dispatched by ManagerPreviewZoom
  useEffect(() => {
    const el = outerRef.current?.closest('[data-preview-host]') || outerRef.current?.parentElement;
    if (!el) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ zoom: number }>;
      setInternalZoom(ce.detail.zoom);
    };
    // listen on document so bubbled events from sibling refs work
    document.addEventListener('scorex:zoom', handler);
    return () => document.removeEventListener('scorex:zoom', handler);
  }, []);

  // idealScale: fit 1920×1080 inside container
  const idealScale = containerW > 0
    ? Math.min(containerW / OVERLAY_W, containerH > 0 ? containerH / OVERLAY_H : containerW / OVERLAY_W)
    : 0;

  const activeZoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const effectiveScale = idealScale * activeZoom;

  // Apply scale via transform (transform-origin top-left)
  useEffect(() => {
    if (!innerRef.current || effectiveScale === 0) return;
    innerRef.current.style.transform = `scale(${effectiveScale})`;
  }, [effectiveScale]);

  const loadPreview = useCallback(async () => {
    if (!template) return;
    try {
      setLoading(true);
      setError(null);
      const htmlContent = await fetchOverlayHTML(controllerBaseUrl, template);
      if (innerRef.current) {
        innerRef.current.innerHTML = htmlContent;

        const script = document.createElement('script');
        script.src = `${controllerBaseUrl}/overlays/engine.js`;
        script.async = true;
        innerRef.current.appendChild(script);

        const utilsScript = document.createElement('script');
        utilsScript.src = `${controllerBaseUrl}/overlays/overlay-utils.js`;
        utilsScript.async = true;
        innerRef.current.appendChild(utilsScript);

        const demoData = getDemoData(progress / 100);
        setPreviewData(demoData);
        updatePreviewData(innerRef.current, demoData);
        onLoad?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Preview load failed';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [template, progress, controllerBaseUrl, onLoad, onError]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  useEffect(() => {
    const container = innerRef.current;
    if (!container) return;
    const handler = (e: CustomEvent<PreviewData>) => updatePreviewData(container, e.detail);
    container.addEventListener('scorex:update', handler as EventListener);
    return () => container.removeEventListener('scorex:update', handler as EventListener);
  }, []);

  return (
    /* overflow:hidden is the critical gate — nothing leaks outside */
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
            width: `${OVERLAY_W}px`,
            height: `${OVERLAY_H}px`,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        />
      </div>

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
