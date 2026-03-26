import React, { useState, useEffect } from 'react';
import { Eye, X, Maximize2, Minimize2 } from 'lucide-react';
import MembershipPreview from './MembershipPreview';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import { getBackendBaseUrl } from '../services/env';

interface OverlayPreviewProps {
  level: number;
  templates: any[]; 
}

const OverlayPreview: React.FC<OverlayPreviewProps> = ({ level, templates = [] }) => {
  const [selectedOverlay, setSelectedOverlay] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const baseUrl = getBackendBaseUrl();
  
  const levelTemplates = templates.filter((t: any) => t.level === level || !t.level);

  // 🔥 FIX: Stabilized dependencies to prevent infinite loop crashes
  useEffect(() => {
    if (!selectedOverlay && templates.length > 0) {
      const first = templates.find((t: any) => t.level === level || !t.level);
      if (first) {
         setSelectedOverlay(first.file || first.url || first.template || first.name || 'default');
      }
    }
  }, [templates, level, selectedOverlay]);

  if (levelTemplates.length === 0) return null;

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm transition-all ${isFullscreen ? 'p-0' : ''}`}>
      <div 
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 transition-all w-full flex flex-col ${
          isFullscreen ? 'h-screen max-w-none m-0 rounded-none border-0' : 'max-w-5xl max-h-[90vh] p-6'
        }`}
      >
        {!isFullscreen && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" /> Live Overlay Preview
              </h3>
            </div>

            <div className="hidden md:flex gap-4 overflow-x-auto pb-4 snap-x mb-4 scrollbar-hide">
              {levelTemplates.map((t: any, idx: number) => {
                const file = t.file || t.url || t.template || '';
                const name = t.name || t.title || file || `Template ${idx + 1}`;
                const id = t._id || t.id || `tpl-${idx}`;

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedOverlay(file)}
                    className={`flex-shrink-0 w-64 rounded-xl p-3 border-2 transition-all snap-start text-left ${
                      selectedOverlay === file 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg mb-3 overflow-hidden relative pointer-events-none">
                      <div className="w-[1920px] h-[1080px] absolute top-0 left-0" style={{ transform: 'scale(0.125)', transformOrigin: 'top left' }}>
                        <OverlayPreviewRenderer template={file} progress={69} baseUrl={baseUrl} />
                      </div>
                    </div>
                    <p className="font-semibold text-sm line-clamp-1 dark:text-white">{name}</p>
                  </button>
                )
              })}
            </div>

            <select 
              value={selectedOverlay}
              onChange={(e) => setSelectedOverlay(e.target.value)}
              className="md:hidden w-full p-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            >
              <option value="" disabled>Select design to preview...</option>
              {levelTemplates.map((t: any, idx: number) => {
                const file = t.file || t.url || t.template || '';
                const name = t.name || t.title || file || `Template ${idx + 1}`;
                return <option key={idx} value={file}>{name}</option>
              })}
            </select>
          </>
        )}

        {selectedOverlay && (
          <div className="relative preview-container rounded-xl overflow-hidden shadow-2xl border-4 border-blue-200/50 dark:border-blue-900/50 flex-1 min-h-[400px] flex flex-col bg-black">
            <button 
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

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