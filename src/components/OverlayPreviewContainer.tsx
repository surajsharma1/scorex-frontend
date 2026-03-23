import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { usePreviewScale } from '../hooks/usePreviewScale';

interface OverlayPreviewContainerProps {
  src: string;
  title: string;
  className?: string;
  heightClass?: string;
  onProgressChange?: (progress: number) => void;
  progress?: number;
  previewContainerRef: React.RefObject<HTMLDivElement>;
  previewIframeRef: React.RefObject<HTMLIFrameElement>;
  retryLoad: () => void;
  setIframeLoading: (loading: boolean) => void;
  setIframeError: (error: boolean) => void;
  baseUrl: string;
}

const OverlayPreviewContainer: React.FC<OverlayPreviewContainerProps> = ({
  src,
  title,
  className = '',
  heightClass = 'h-[500px] lg:h-[600px]',
  onProgressChange,
  progress = 50,
  previewContainerRef,
  previewIframeRef,
  retryLoad,
  setIframeLoading,
  setIframeError,
  baseUrl
}) => {
  const changeProgress = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onProgressChange?.(Number(e.target.value));
  }, [onProgressChange]);

  const isBackendReady = src.startsWith('http');

  return (
    <div ref={previewContainerRef} className={`preview-container rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/50 hover:border-blue-500/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 ${heightClass} relative ${className}`}>
      <div className="preview-scale-fallback preview-scale w-full h-full">
        <iframe
          ref={previewIframeRef}
          src={src}
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
      {setIframeLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-20">
          <div className="text-center p-8">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-400" />
            <p className="text-slate-300 text-lg font-medium">Loading overlay preview...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {setIframeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/95 backdrop-blur-sm z-20">
          <div className="text-center p-8 rounded-2xl border-2 border-red-500/50 max-w-md bg-slate-900/50">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-200 mb-4">Preview Failed</h3>
            <p className="text-slate-400 mb-6 text-sm">
              Server unreachable? Start backend to view live preview.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={retryLoad}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backend not HTTP fallback */}
      {!isBackendReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-slate-900/80 to-black/80 z-10">
          <p className="text-slate-300 text-sm font-medium text-center px-4">
            Backend not running? <br />
            <span className="text-emerald-400 font-semibold underline cursor-pointer hover:text-emerald-300" onClick={() => window.open(baseUrl, '_blank')}>Start server</span> to see preview
          </p>
        </div>
      )}

      {/* Right-side Vertical Zoom Slider */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 p-3 flex flex-col items-center gap-2 z-30 shadow-2xl min-h-[200px]">
        <label className="text-xs font-semibold text-slate-200 writing-vertical">Zoom</label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          className="w-12 h-36 bg-slate-700 rounded-xl cursor-pointer accent-blue-500 hover:accent-blue-400 appearance-none [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-36 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-blue-500 shadow-lg hover:shadow-xl transition-all [writing-mode:vertical-lr]"
          style={{ writingMode: 'vertical-lr' }}
          onChange={(e) => {
            const newZoom = 0.25 + (parseFloat(e.target.value) / 100) * 1.75;
            if (previewContainerRef.current) {
              previewContainerRef.current.style.setProperty('--user-zoom', newZoom.toString());
            }
          }}
        />
        <span className="text-xs font-bold text-blue-400">100%</span>
      </div>
    </div>
  );
};

export default OverlayPreviewContainer;

