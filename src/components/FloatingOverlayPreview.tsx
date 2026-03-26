import React, { useState, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Monitor, Smartphone, Tablet } from 'lucide-react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
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

// Screen size presets (width x height aspect)
const SCREEN_PRESETS = [
  { label: 'Desktop',  icon: Monitor,     w: '100%',  h: '100%',   aspect: '16/9' },
  { label: 'Tablet',   icon: Tablet,      w: '768px', h: '576px',  aspect: '4/3'  },
  { label: 'Mobile',   icon: Smartphone,  w: '390px', h: '220px',  aspect: '16/9' },
] as const;

const FloatingOverlayPreview: React.FC<FloatingOverlayPreviewProps> = ({
  isOpen,
  onClose,
  level,
  templates,
  selectedOverlay,
  onOverlaySelect,
}) => {
  const [zoom, setZoom] = useState(1);
  const [screenPreset, setScreenPreset] = useState<number>(0);

  if (!isOpen) return null;

  const baseUrl = getBackendBaseUrl();
  const levelTemplates = templates.filter(t => t.level === level);
  const count = levelTemplates.length;
  const planName = level === 1 ? 'Premium' : 'Enterprise';
  const accentColor = level === 1 ? '#22c55e' : '#a855f7';

  const clampZoom = (v: number) => Math.max(0.25, Math.min(3, v));
  const zoomIn    = () => setZoom(z => clampZoom(parseFloat((z * 1.25).toFixed(2))));
  const zoomOut   = () => setZoom(z => clampZoom(parseFloat((z * 0.8).toFixed(2))));
  const resetZoom = () => setZoom(1);

  const preset = SCREEN_PRESETS[screenPreset];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col rounded-2xl shadow-2xl overflow-hidden w-full"
        style={{
          background: 'var(--bg-secondary)',
          border: `1px solid ${accentColor}30`,
          boxShadow: `0 0 60px ${accentColor}20`,
          maxWidth: '1100px',
          maxHeight: '95vh',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-1.5 h-8 rounded-full"
              style={{ background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}88)` }}
            />
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                {planName} Overlay Preview
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {count} design{count !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Controls bar ── */}
        <div
          className="flex flex-wrap items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          {/* Overlay selector */}
          <select
            value={selectedOverlay}
            onChange={e => onOverlaySelect(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="">Choose overlay design…</option>
            {levelTemplates.map(t => (
              <option key={t.id} value={t.url.split('/').pop()!}>{t.name}</option>
            ))}
          </select>

          {/* Screen presets */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--bg-elevated)' }}>
            {SCREEN_PRESETS.map((p, i) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  onClick={() => setScreenPreset(i)}
                  title={p.label}
                  className="p-2 rounded-lg transition-all"
                  style={screenPreset === i
                    ? { background: accentColor, color: '#000' }
                    : { color: 'var(--text-muted)' }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--bg-elevated)' }}>
            <button
              onClick={zoomOut}
              className="p-2 rounded-lg transition-all hover:text-white"
              style={{ color: 'var(--text-muted)' }}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span
              className="px-2 text-xs font-bold tabular-nums min-w-[44px] text-center"
              style={{ color: accentColor }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 rounded-lg transition-all hover:text-white"
              style={{ color: 'var(--text-muted)' }}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 rounded-lg transition-all text-xs font-bold"
              style={{ color: 'var(--text-muted)' }}
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom slider */}
          <input
            type="range"
            min={25}
            max={200}
            step={5}
            value={Math.round(zoom * 100)}
            onChange={e => setZoom(parseInt(e.target.value) / 100)}
            className="w-28 hidden sm:block"
            style={{ accentColor }}
          />
        </div>

        {/* ── Preview area ── */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden p-4"
          style={{ background: '#000', minHeight: 0 }}
        >
          {selectedOverlay ? (
            /* The outer box simulates the chosen screen size.
               It fills the available space but is constrained to the preset's
               aspect ratio — just like a real screen. The OverlayPreviewRenderer
               then scales the 1920×1080 overlay to fit inside THIS box,
               then zoom multiplies on top. Nothing ever bleeds outside. */
            <div
              style={{
                width:  preset.w,
                maxWidth: '100%',
                aspectRatio: preset.aspect,
                maxHeight: '100%',
                border: `2px solid ${accentColor}40`,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: `0 0 40px ${accentColor}15`,
                background: '#0a0a0f',
                position: 'relative',
              }}
            >
              <OverlayPreviewRenderer
                template={selectedOverlay}
                progress={69}
                baseUrl={baseUrl}
                zoom={zoom}
                className=""
                heightClass=""
              />
            </div>
          ) : (
            <div className="text-center p-12">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <Monitor className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>
                Select an overlay above
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {count} designs to preview
              </p>
            </div>
          )}
        </div>

        {/* ── Footer hint ── */}
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
