import React from 'react';
import { Eye } from 'lucide-react';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl: string;
}

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName, baseUrl }) => {
  const previewUrl = `${baseUrl}/overlays/${overlayFile}?demo=true`;
  const title = `${planName} Overlay Preview`;


  const [zoom, setZoom] = React.useState(0.25);


  const changeZoom = (delta: number) => setZoom(Math.max(0.15, Math.min(0.5, zoom + delta * 0.01)));


  React.useEffect(() => {
    document.documentElement.style.setProperty('--zoom', zoom.toString());
  }, [zoom]);


  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex justify-between items-center mb-3">

        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />Live Preview ({Math.round(zoom*100)}%)
          </p>
          <div className="flex gap-1">
            <button onClick={() => changeZoom(-0.1)} className="p-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors" title="Zoom Out">-</button>
            <button onClick={() => changeZoom(0.1)} className="p-1 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors" title="Zoom In">+</button>
            <button onClick={() => setZoom(1)} className="p-1 text-xs rounded bg-green-500 hover:bg-green-600 text-white transition-colors ml-1" title="Reset Zoom">1x</button>
          </div>
        </div>

      </div>
      <div className="preview-container rounded-xl overflow-hidden shadow-lg border-2 border-gray-200/50 dark:border-gray-700 hover:shadow-2xl hover:border-blue-400/60 group transition-all duration-300">
        <div className="preview-scale-fallback preview-scale">
          <iframe
            src={previewUrl}
            className="iframe-container bg-transparent group-hover:scale-[1.02] transition-transform duration-300"
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
        Sample {planName} overlay design
      </p>
    </div>
  );
};

export default MembershipPreview;

