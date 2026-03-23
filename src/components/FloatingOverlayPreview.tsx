import React, { useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import type { OverlayTemplate } from '../types/overlay';
import { getBackendBaseUrl } from '../services/env';
import { usePreviewScale } from '../hooks/usePreviewScale';

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

  const previewContainerRef = React.useRef<HTMLDivElement>(null);
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
                <div className="flex gap-1">
                  <span className="text-xs text-blue-600 font-semibold">
                    {Math.round(idealScale * 100)}% fit • {Math.round(userZoom * 100)}% zoom
                  </span>
                  <button onClick={zoomOut} className="p-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all" title="Zoom Out">-</button>
                  <button onClick={zoomIn} className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-all" title="Zoom In">+</button>
                  <button onClick={resetZoom} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white transition-all" title="Reset">1x</button>
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
              <div 
                ref={previewContainerRef}
                className="preview-container rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/50 hover:border-blue-500/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 h-full relative"
              >
                <div className="preview-scale-fallback preview-scale">
                  <OverlayPreviewRenderer 
                    template={selectedOverlay} 
                    progress={69}
                    baseUrl={baseUrl}
                  />
                </div>
                {/* Right-side Vertical Zoom Slider */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 p-2 flex flex-col items-center gap-1 z-30 shadow-2xl min-h-[180px]">
                  <label className="text-xs font-semibold text-slate-300">Zoom</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round((userZoom - 0.25) / 1.75 * 100)}
                    onChange={(e) => {
                      const newZoom = 0.25 + (parseFloat(e.target.value) / 100) * 1.75;
                      if (previewContainerRef.current) {
                        previewContainerRef.current.style.setProperty('--user-zoom', newZoom.toString());
                      }
                    }}
                    className="w-10 h-32 bg-slate-700 rounded-lg cursor-pointer accent-blue-500 hover:accent-blue-400 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-500 shadow-md hover:shadow-lg transition-all appearance-none"
                    style={{ writingMode: 'vertical-lr' }}
                  />
                  <span className="text-xs font-bold text-blue-400">{Math.round(userZoom * 100)}%</span>
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

