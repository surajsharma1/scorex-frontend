import React from 'react';
import { X, Eye } from 'lucide-react';
import MembershipPreview from './MembershipPreview';
import type { OverlayTemplate } from '../types/overlay';
import { getBackendBaseUrl } from '../services/env';

interface FloatingOverlayPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  templates: OverlayTemplate[];
  selectedOverlay: string;
  onOverlaySelect: (filename: string) => void;
}

const FloatingOverlayPreview: React.FC<FloatingOverlayPreviewProps> = ({
  isOpen, 
  onClose, 
  level, 
  templates, 
  selectedOverlay, 
  onOverlaySelect 
}) => {
  if (!isOpen) return null;

  const baseUrl = getBackendBaseUrl();
  const levelTemplates = templates.filter(t => t.level === level);
  const count = levelTemplates.length;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl p-4 sm:p-8 max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border-4 border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-10 rounded-full bg-gradient-to-b from-blue-400 to-blue-600" />
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                {level === 1 ? 'Premium' : 'Enterprise'} Overlay Preview
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {count} premium designs available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-2xl transition-all group hover:scale-110"
          >
            <X className="w-6 h-6 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:h-[500px] h-auto">
          {/* Left: Dropdown Selector */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/50">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Design Selector
                </p>
                <div className="flex gap-1 text-xs">
                  <button onClick={() => document.documentElement.style.setProperty('--zoom', '0.75')} className="p-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors" title="Zoom Out">-</button>
                  <button onClick={() => document.documentElement.style.setProperty('--zoom', '1.25')} className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors" title="Zoom In">+</button>
                  <button onClick={() => document.documentElement.style.setProperty('--zoom', '1')} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white transition-colors" title="Reset">1x</button>
                </div>
              </div>
              <select 
                value={selectedOverlay}
                onChange={(e) => onOverlaySelect(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-300/50 shadow-lg hover:shadow-xl hover:border-blue-400/70 focus:ring-4 focus:ring-blue-500/20 focus:border-transparent transition-all text-sm font-semibold"
              >
                <option value="">Choose overlay design...</option>
                {levelTemplates.map((t) => (
                  <option key={t.id} value={t.url.split('/').pop()!}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-center p-4 text-xs bg-gradient-to-br from-gray-50/50 to-gray-100/50 rounded-xl border border-gray-200/50 dark:from-gray-800/50 dark:to-gray-900/50">
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{count} designs</p>
              <p className="text-gray-500 dark:text-gray-400">Live preview below</p>
            </div>
          </div>

          {/* Right: Large Preview */}
          <div className="flex-1 min-h-0">
            {selectedOverlay ? (
            <div className="preview-container rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-200/50 hover:border-blue-400/70 bg-gradient-to-br from-blue-50/30 to-indigo-50/30">
                <div className="preview-scale-fallback preview-scale">
                  <iframe
                    src={`${baseUrl}/overlays/${selectedOverlay}?demo=true`}
                    className="iframe-container bg-transparent"
                    title="Overlay Preview"
                    sandbox="allow-scripts allow-same-origin"
                    loading="eager"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-[500px] rounded-2xl bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-900/50 border-4 border-gray-300/50 flex items-center justify-center">
                <div className="text-center p-12">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">Select an overlay</h3>
                  <p className="text-gray-500 dark:text-gray-500">Choose from {count} designs above</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingOverlayPreview;
