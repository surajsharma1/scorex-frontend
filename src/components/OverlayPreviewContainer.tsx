import React from 'react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import { AlertCircle } from 'lucide-react';

interface OverlayPreviewContainerProps {
  src: string;
  title: string;
  matchData?: any;
  isPreview?: boolean;
  className?: string;
  heightClass?: string;
  onProgressChange?: (progress: number) => void;
  progress?: number;
  previewContainerRef: React.RefObject<HTMLDivElement>;
  previewIframeRef: React.RefObject<HTMLIFrameElement>;
  retryLoad: () => void;
  setIframeLoading: (loading: boolean) => void;
  setIframeError: (error: boolean) => void;
  iframeLoading?: boolean;
  iframeError?: boolean;
  baseUrl: string;
  zoom?: number;
}

const OverlayPreviewContainer: React.FC<OverlayPreviewContainerProps> = ({
  src,
  title,
  matchData,
  isPreview = true,
  className = '',
  heightClass = 'h-[500px] lg:h-[600px]',
  progress = 50,
  previewContainerRef,
  retryLoad,
  setIframeLoading,
  setIframeError,
  iframeLoading = false,
  iframeError = false,
  baseUrl,
  zoom = 1,
}) => {
  const template = src.includes('overlays/')
    ? src.split('overlays/')[1].split('?')[0]
    : 'lvl1-modern-bar.html';

  return (
    <div
      ref={previewContainerRef}
      className={`relative overflow-hidden rounded-2xl ${heightClass} ${className}`}
      style={{ border: '1px solid var(--border)', background: '#000' }}
    >
      <OverlayPreviewRenderer
        template={template}
        progress={progress}
        matchData={matchData}
        isPreview={isPreview}
        baseUrl={baseUrl}
        zoom={zoom}
        onLoad={() => setIframeLoading(false)}
        onError={() => setIframeError(true)}
      />

      {iframeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-20">
          <div className="text-center p-8 max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Backend unreachable
            </p>
            <button
              onClick={retryLoad}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayPreviewContainer;
