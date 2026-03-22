import React from 'react';
import { Eye } from 'lucide-react';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl: string;
}

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName, baseUrl }) => {
  const previewUrl = `${baseUrl}/api/v1/overlays/public/demo?template=${overlayFile}`;
  const title = `${planName} Overlay Preview`;

  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      <p className="text-xs font-semibold uppercase mb-3 tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <Eye className="w-3 h-3" />Live Preview
      </p>
      <div className="relative w-full aspect-video max-h-48 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200/50 dark:border-gray-700 hover:shadow-2xl hover:border-blue-400/60 transition-all duration-300 group">
        <iframe
          src={previewUrl}
          className="w-full h-full border-0 bg-transparent group-hover:scale-[1.02] transition-transform duration-300"
          title={title}
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {(!previewUrl.startsWith('http') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gray-900/80 to-black/80">
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

