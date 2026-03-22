import React from 'react';
import { X, Eye, Maximize2 } from 'lucide-react';
import MembershipPreview from './MembershipPreview';
import { getBackendBaseUrl } from '../services/env';

interface OverlayTemplate {
  id: string;
  name: string;
  url: string;
  level: number;
}

interface OverlayPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  overlays: OverlayTemplate[];
}

const OverlayPreviewModal: React.FC<OverlayPreviewModalProps> = ({ isOpen, onClose, level, overlays }) => {
  const baseUrl = getBackendBaseUrl();

  if (!isOpen) return null;

  const levelOverlays = overlays.filter(o => o.level === level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              Level {level} Overlay Designs
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
              {levelOverlays.length} premium overlays included
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-xl transition-all group"
          >
            <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {levelOverlays.map((overlay) => (
            <div key={overlay.id} className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-gray-200/50 hover:border-green-400/60 overflow-hidden">
              {/* Name */}
              <h3 className="font-bold text-lg mb-4 line-clamp-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors pr-8">
                {overlay.name}
              </h3>
              
              {/* Preview */}
              <div className="relative w-full aspect-video max-h-48 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200/50 group-hover:border-green-400/70 transition-all mb-4">
                <MembershipPreview 
                  overlayFile={`${overlay.url}?demo=true`}
                  planName={`Level ${level}`}
                  baseUrl={baseUrl}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute bottom-4 right-4">
                <button className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-semibold">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </button>
              </div>
            </div>
          ))}
        </div>

        {levelOverlays.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <Eye className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">No overlays yet</h3>
            <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
              Upgrade to see all Level {level} overlay designs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlayPreviewModal;

