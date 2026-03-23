import React, { useState, useRef, useEffect } from 'react';
import { Eye, RefreshCw, AlertCircle } from 'lucide-react';
import ManagerPreviewZoom from './ManagerPreviewZoom';
import { usePreviewScale } from '../hooks/usePreviewScale';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl: string;
}

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName, baseUrl }) => {
  const [progress, setProgress] = useState(50);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const previewUrl = `${baseUrl}/overlays/${overlayFile}?demo=true&progress=${progress}%`;
  const title = `${planName} Overlay Preview`;

  const {
    userZoom,
    idealScale,
    zoomIn,
    zoomOut,
    resetZoom
  } = usePreviewScale({ 
    containerRef: previewContainerRef
  });

  const changeProgress = (e: React.ChangeEvent<HTMLInputElement>) => setProgress(Number(e.target.value));

  // Update zoom display like OverlayManager
  useEffect(() => {
    const element = document.getElementById('manager-zoom-display');
    if (element) {
      element.textContent = `${Math.round(idealScale * userZoom * 100)}%`;
    }
  }, [idealScale, userZoom]);

  // Refresh iframe on src change
  useEffect(() => {
    setIframeLoading(true);
    setIframeError(false);
    if (previewIframeRef.current && previewUrl) {
      const timer = setTimeout(() => {
        try {
          previewIframeRef.current.contentWindow?.postMessage({ type: 'scorex:refresh' }, '*');
        } catch (e) {
          console.log('[MembershipPreview] Refresh safe fail:', e);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [previewUrl]);

  const retryLoad = () => {
    setIframeLoading(true);
    setIframeError(false);
    setTimeout(() => {
      previewIframeRef.current?.contentWindow?.postMessage({ type: 'scorex:refresh' }, '*');
    }, 500);
  };

  return (
    <div className="p-6 rounded-xl shadow-lg border border-slate-700/70 backdrop-blur-xl">
      <div className="mb-4 p-4 bg-gradient-to-br from-slate-900/80 to-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Eye className="w-4 h-4" />Live Preview
            </p>
            <span id="manager-zoom-display" className="text-xs font-bold text-blue-400">--%</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-300">Progress:</label>
            <input
              type="range"
              min="0"
              max="100"
              step="4"
              value={progress}
              onChange={changeProgress}
              className="flex-1 h-3 bg-slate-700 rounded-lg cursor-pointer appearance-none accent-emerald-500 hover:accent-emerald-600 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full shadow-lg hover:shadow-md transition-all"
            />
<span className="font-mono text-sm font-bold text-emerald-400 w-12 text-right">{progress}%</span>
          </div>
          <div className="flex gap-1">
            <ManagerPreviewZoom containerRef={previewContainerRef} />
          </div>
        </div>
      </div>
      
      <div ref={previewContainerRef} className="preview-container rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/50 hover:border-blue-500/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 flex-1 relative h-[500px] lg:h-[600px]">
        <div className="preview-scale-fallback preview-scale w-full h-full">
          <iframe
            ref={previewIframeRef}
            src={previewUrl}
            className="iframe-container bg-transparent w-full h-full" 
            style={{ width: '1920px', height: '1080px' }}
            title={title}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            allow="fullscreen; autoplay; clipboard-write; encrypted-media"
            loading="eager"
            onLoad={() => {
              setIframeLoading(false);
              setIframeError(false);
            }}
            onError={() => {
              setIframeLoading(false);
              setIframeError(true);
            }}
          />
        </div>

        {/* Loading Overlay */}
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-20">
            <div className="text-center p-8">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-slate-300 text-lg font-medium">Loading overlay preview...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/95 backdrop-blur-sm z-20">
            <div className="text-center p-8 rounded-2xl border-2 border-red-500/50 max-w-md bg-slate-900/50">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-200 mb-4">Preview Failed</h3>
              <p className="text-slate-400 mb-6">
                Backend unreachable: <code className="bg-slate-800 px-3 py-1 rounded-lg text-sm font-mono inline-block break-all max-w-full">{previewUrl}</code>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
                >
                  Open Direct
                </button>
                <button 
                  onClick={retryLoad}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backend not HTTP fallback */}
        {!previewUrl.startsWith('http') && !iframeLoading && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-slate-900/80 to-black/80 z-10">
            <p className="text-slate-300 text-sm font-medium text-center px-4">
              Backend not running? <br />
              <span className="text-emerald-400 font-semibold underline cursor-pointer hover:text-emerald-300">Start server</span> to see preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipPreview;

