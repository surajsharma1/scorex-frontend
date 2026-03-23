import React from 'react';
import { Eye } from 'lucide-react';
import { usePreviewScale } from '../hooks/usePreviewScale';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl: string;
}

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName, baseUrl }) => {
  const [progress, setProgress] = React.useState(50);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  const previewUrl = `${baseUrl}/overlays/${overlayFile}?demo=true&progress=${progress}%`;
  const title = `${planName} Overlay Preview`;

  const {
    userZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    idealScale
  } = usePreviewScale({ 
    containerRef: previewContainerRef,
    initialZoom: 1 
  });

  const changeProgress = (e: React.ChangeEvent<HTMLInputElement>) => setProgress(Number(e.target.value));

  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex justify-between items-center mb-3">
        <div className="flex justify-between items-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />Live Preview ({Math.round(idealScale * 100)}% fit • {Math.round(userZoom * 100)}% zoom)
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Progress:</label>
              <input
                type="range"
                min="0"
                max="100"
                step="4"
                value={progress}
                onChange={changeProgress}
                className="flex-1 h-3 bg-gray-200 rounded-lg cursor-pointer dark:bg-gray-700 appearance-none accent-blue-500 hover:accent-blue-600 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full shadow-lg hover:shadow-md transition-all"
              />
              <span className="font-mono text-sm font-bold text-green-600 w-12 text-right">{progress}%</span>
            </div>
            <div className="flex gap-1">
              <button onClick={zoomOut} className="p-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors" title="Zoom Out">-</button>
              <button onClick={zoomIn} className="p-1 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors" title="Zoom In">+</button>
              <button onClick={resetZoom} className="p-1 text-xs rounded bg-green-500 hover:bg-green-600 text-white transition-colors ml-1" title="Fit to container">Fit</button>
            </div>
          </div>
        </div>
      </div>
      <div 
        ref={previewContainerRef}
        className="preview-container rounded-xl overflow-hidden shadow-lg border-2 border-gray-200/50 dark:border-gray-700 hover:shadow-2xl hover:border-blue-400/60 group transition-all duration-300"
      >
        <div className="preview-scale-fallback preview-scale overflow-visible">
          <iframe
            src={previewUrl}
            className="iframe-container bg-transparent" 
            style={{ width: '1920px', height: '1080px' }}
            title={title}
            sandbox="allow-scripts allow-same-origin"
            loading="eager"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {(!previewUrl.startsWith('http') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gray-900/80 to-black/80 z-10">
            <p className="text-white text-sm font-medium text-center px-4">
              Backend not running? <br />
              <span className="text-blue-400 underline">Start server to see live preview</span>
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400 font-medium">
        Sample {planName} overlay design • Adaptive 1920×1080 preview
      </p>
    </div>
  );
};

export default MembershipPreview;

