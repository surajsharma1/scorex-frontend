import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import { getBackendBaseUrl } from '../services/env';
import { getDemoData, normalizeScoreData, updatePreviewData, PreviewData, fetchOverlayHTML } from '../utils/overlayPreview';

interface OverlayPreviewRendererProps {
  template: string;
  progress?: number;
  className?: string;
  heightClass?: string;
  baseUrl?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const OverlayPreviewRenderer: React.FC<OverlayPreviewRendererProps> = ({
  template,
  progress = 69,
  className = '',
  heightClass = 'h-[500px] lg:h-[600px]',
  baseUrl,
  onLoad,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const controllerBaseUrl = baseUrl || getBackendBaseUrl();

  // Load overlay HTML + demo data
  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch overlay HTML structure
      const htmlContent = await fetchOverlayHTML(controllerBaseUrl, template);

      // 2. Inject into container
      if (containerRef.current) {
        containerRef.current.innerHTML = htmlContent;

        // 3. Load overlay scripts (engine.js etc.)
        const script = document.createElement('script');
        script.src = `${controllerBaseUrl}/overlays/engine.js`;
        script.async = true;
        containerRef.current.appendChild(script);

        const utilsScript = document.createElement('script');
        utilsScript.src = `${controllerBaseUrl}/overlays/overlay-utils.js`;
        utilsScript.async = true;
        containerRef.current.appendChild(utilsScript);

        // 4. Generate/update demo data
        const demoData = getDemoData(progress / 100);
        setPreviewData(demoData);
        updatePreviewData(containerRef.current, demoData);

        onLoad?.();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Preview load failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [template, progress, controllerBaseUrl, onLoad, onError]);

  // Reload on template/progress change
  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // Handle scorex:update events from loaded scripts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleUpdate = (e: CustomEvent<PreviewData>) => {
      updatePreviewData(container, e.detail);
    };

    container.addEventListener('scorex:update', handleUpdate as EventListener);
    return () => container.removeEventListener('scorex:update', handleUpdate as EventListener);
  }, []);

  return (
    <div 
      className={`preview-container rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 relative ${heightClass} ${className}`}
      style={{overflow: 'hidden'}}
    >
      <div 
        ref={containerRef}
        className="preview-scale-fallback preview-scale bg-transparent"
        style={{ 
          position: 'fixed',
          width: '1920px', 
          height: '1080px',
          top: 0,
          left: 0
        }}
      />








      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-20">
          <div className="text-center p-8">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-400" />
            <p className="text-slate-300 text-lg font-medium">Rendering preview...</p>
            <p className="text-sm text-slate-400 mt-2">Template: {template}</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/95 backdrop-blur-sm z-20">
          <div className="text-center p-8 rounded-2xl border-2 border-red-500/50 max-w-md bg-slate-900/50">
            <Eye className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-200 mb-4">Preview Error</h3>
            <p className="text-slate-400 mb-6">{error}</p>
            <button 
              onClick={loadPreview}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
            >
              Retry Preview
            </button>
          </div>
        </div>
      )}

      {/* Success indicator */}
      {!loading && !error && previewData && (
        <div className="absolute top-3 right-3 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg">
          <Eye className="w-3 h-3 inline mr-1" /> LIVE
        </div>
      )}
    </div>
  );
};

export default OverlayPreviewRenderer;

