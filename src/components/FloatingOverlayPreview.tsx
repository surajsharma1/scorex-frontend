import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Monitor, Smartphone, Tablet } from 'lucide-react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import { getBackendBaseUrl } from '../services/env';

interface FloatingOverlayPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  templates: any[]; // Using any to robustly handle different backend responses
  selectedOverlay: string;
  onOverlaySelect: (filename: string) => void;
}

const SCREEN_PRESETS = [
  { label: 'Desktop',  icon: Monitor,     w: '100%',  h: '100%',   aspect: '16/9' },
  { label: 'Tablet',   icon: Tablet,      w: '768px', h: '576px',  aspect: '4/3'  },
  { label: 'Mobile',   icon: Smartphone,  w: '390px', h: '220px',  aspect: '16/9' },
] as const;

const FloatingOverlayPreview: React.FC<FloatingOverlayPreviewProps> = ({
  isOpen,
  onClose,
  level,
  templates = [],
  selectedOverlay,
  onOverlaySelect,
}) => {
  const [zoom, setZoom] = useState(1);
  const [screenPreset, setScreenPreset] = useState<number>(0);
  const baseUrl = getBackendBaseUrl();

  // Safely filter templates by the required membership level
  const levelTemplates = templates.filter((t: any) => t.level === level || t.level === undefined);

  // 🔥 AUTO-SELECT FIX: If the modal opens and nothing is selected, select the first available overlay
  useEffect(() => {
    if (isOpen && !selectedOverlay && levelTemplates.length > 0) {
      const first = levelTemplates[0];
      const fileId = first.file || first.url || first.template || first.name || '';
      onOverlaySelect(fileId);
    }
  }, [isOpen, selectedOverlay, levelTemplates, onOverlaySelect]);

  if (!isOpen) return null;

  const clamp = (v: number) => Math.max(0.1, Math.min(3, v));
  const activePreset = SCREEN_PRESETS[screenPreset];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl max-h-[95vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <div>
            <h3 className="font-black text-xl flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Monitor className="w-5 h-5 text-emerald-400" />
              Level {level} Overlays
            </h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {levelTemplates.length} premium broadcast designs available
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ── Template Selector ── */}
        <div className="p-5" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x scrollbar-hide">
            {levelTemplates.map((t: any, idx: number) => {
              // 🔥 ROBUST PROPERTY FALLBACK: Handles different backend response formats
              const file = t.file || t.url || t.template || '';
              const id = t._id || t.id || `template-${idx}`;
              const name = t.name || t.title || file || `Template ${idx + 1}`;
              
              const isSelected = selectedOverlay === file;

              return (
                <button
                  key={id}
                  onClick={() => onOverlaySelect(file)}
                  className={`flex-shrink-0 w-[240px] rounded-xl p-3 border-2 transition-all snap-start text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-[var(--border)] hover:border-emerald-500/50 bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="aspect-video bg-black rounded-lg mb-3 overflow-hidden relative pointer-events-none">
                     {/* Mini Preview Thumbnail */}
                     <div className="w-[1920px] h-[1080px] absolute top-0 left-0" style={{ transform: 'scale(0.125)', transformOrigin: 'top left' }}>
                        <OverlayPreviewRenderer template={file} progress={90} baseUrl={baseUrl} />
                     </div>
                  </div>
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.category || 'Broadcast'}</p>
                </button>
              );
            })}
            
            {levelTemplates.length === 0 && (
              <p className="text-sm text-center w-full" style={{ color: 'var(--text-muted)' }}>
                No templates found for this level.
              </p>
            )}
          </div>
        </div>

        {/* ── Main Preview Area ── */}
        <div className="flex-1 overflow-hidden relative bg-[#0a0a0a] flex items-center justify-center p-8">
          
          {/* Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl z-20 shadow-xl backdrop-blur-md bg-white/5 border border-white/10">
            {SCREEN_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setScreenPreset(i)}
                className={`p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${
                  screenPreset === i ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <preset.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{preset.label}</span>
              </button>
            ))}
            <div className="w-px h-6 bg-white/20 mx-2" />
            <div className="flex items-center gap-1 text-gray-300">
              <button onClick={() => setZoom(z => clamp(z * 0.8))} className="p-1.5 hover:bg-white/10 rounded-lg"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => clamp(z * 1.25))} className="p-1.5 hover:bg-white/10 rounded-lg"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-white/10 rounded-lg"><RotateCcw className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Render Active Overlay */}
          {selectedOverlay ? (
            <div 
              className="bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden"
              style={{
                width: activePreset.w,
                height: activePreset.h,
                aspectRatio: activePreset.aspect,
                position: 'relative',
              }}
            >
              <OverlayPreviewRenderer
                template={selectedOverlay}
                progress={85}
                baseUrl={baseUrl}
                zoom={zoom}
                className="rounded-none border-none"
              />
            </div>
          ) : (
            <div className="text-center p-12">
              <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="font-bold text-lg text-gray-400">Select an overlay above</p>
            </div>
          )}
        </div>
        
        {/* ── Footer Hint ── */}
        <div
          className="px-5 py-2 flex-shrink-0 text-xs flex justify-between"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}
        >
          <span>Overlay renders at 1920×1080 — scaled to fit preview frame</span>
          <span>Use zoom controls to inspect details</span>
        </div>
      </div>
    </div>
  );
};

export default FloatingOverlayPreview;