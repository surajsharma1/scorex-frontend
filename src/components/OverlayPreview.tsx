import React, { useState } from 'react';
import { Maximize2, Eye, X } from 'lucide-react';
import MembershipPreview from './MembershipPreview';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import type { OverlayTemplate } from '../types/overlay';
import { getBackendBaseUrl } from '../services/env';

interface OverlayPreviewProps {
  level: number;
  templates: OverlayTemplate[];
}

const OverlayPreview: React.FC<OverlayPreviewProps> = ({ level, templates }) => {
  const [selectedOverlay, setSelectedOverlay] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const baseUrl = getBackendBaseUrl();
  const levelTemplates = templates.filter(t => t.level === level);
  const count = levelTemplates.length;

  if (levelTemplates.length === 0) return null;

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm transition-all ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 transition-all max-w-4xl w-full ${isFullscreen ? 'h-screen w-screen m-0 rounded-none border-0' : 'max-h-[90vh] overflow-y-auto p-6'}`}>
        {!isFullscreen && (
          <>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Overlay Preview ({count} designs)
                </h3>
                <div className="flex gap-1 text-sm">
                  <button onClick={() => document.documentElement.style.setProperty('--zoom', '0.75')} className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors" title="-">-</button>
                  <button onClick={() => document.documentElement.style.setProperty('--zoom', '1.25')} className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors" title="+">+</button>
                  <button onClick={() => document.documentElement.style.setProperty('--zoom', '1')} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white transition-colors" title="1x">1x</button>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setSelectedOverlay('')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {levelTemplates.slice(0, 9).map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedOverlay(t.url.split('/').pop()!)}
                  className="group p-4 rounded-xl hover:shadow-xl hover:scale-105 transition-all border hover:border-blue-400 bg-gradient-to-b from-white/70 to-gray-50/70 hover:from-blue-50"
                >
<div className="preview-container aspect-square rounded-lg overflow-hidden mb-2 group-hover:scale-[1.05] transition-transform max-h-48">
                    <div className="preview-scale-fallback preview-scale w-[512px] h-[288px]">
                      <OverlayPreviewRenderer 
                        template={t.url.split('/').pop()!} 
                        progress={69}
                        heightClass="h-[288px]"
                        baseUrl={baseUrl}
                      />
                    </div>
                  </div>
                  <p className="font-semibold text-sm line-clamp-1">{t.name}</p>
                </button>
              ))}
            </div>

            <select 
              value={selectedOverlay}
              onChange={(e) => setSelectedOverlay(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select design to preview...</option>
              {levelTemplates.map(t => (
                <option key={t.id} value={t.url.split('/').pop()!}>{t.name}</option>
              ))}
            </select>
          </>
        )}

        {selectedOverlay && (
          <div className="preview-container rounded-xl overflow-hidden shadow-2xl border-4 border-blue-200/50 h-full">
            <MembershipPreview
              overlayFile={selectedOverlay}
              planName={level === 1 ? 'Premium' : 'Enterprise'}
              baseUrl={baseUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlayPreview;
