import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Monitor, Smartphone, Tablet, Eye, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { useValueDebounce } from '../hooks/useValueDebounce';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import { getBackendBaseUrl } from '../services/env';

interface TemplateItem {
  id: string;
  name: string;
  url?: string;
  file?: string;
  category?: string;
  color?: string;
  level: number;
}

interface FloatingOverlayPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  templates: TemplateItem[];
  selectedOverlay: string;
  onOverlaySelect: (filename: string) => void;
}

const SCREEN_PRESETS = [
  { label: 'Desktop',  icon: Monitor,    w: '100%',  aspect: '16/9' },
  { label: 'Tablet',   icon: Tablet,     w: '768px', aspect: '4/3'  },
  { label: 'Mobile',   icon: Smartphone, w: '390px', aspect: '16/9' },
] as const;

function templateFilename(t: TemplateItem): string {
  if (t.url) return t.url.split('/').pop()!;
  if (t.file) return t.file;
  return t.id + '.html';
}

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
  const [localTemplates, setLocalTemplates] = useState<TemplateItem[]>([]);
  const [progress, setProgress] = useState(50);
  const debouncedProgress = useValueDebounce(progress, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLoad = useCallback(() => {
    setLoading(false);
    // Attempt to hide any built-in dev controls inside the HTML iframe
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.contentDocument) {
          const style = iframe.contentDocument.createElement('style');
          style.innerHTML = '.dev-controls, #dev-controls, .controls-container, button { display: none !important; }';
          iframe.contentDocument.head.appendChild(style);
        }
      });
    } catch (err) {
      // Ignore cross-origin errors
    }
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
    setLoading(false);
  }, []);

  // Fetch bypassing cache to ensure new names and designs are ALWAYS loaded
  useEffect(() => {
    if (!isOpen) return;
    fetch(`/templates.json?t=${Date.now()}`)
      .then(r => r.json())
      .then((data: Array<{ id: string; name: string; file: string; category: string; color: string }>) => {
        setLocalTemplates(data.map(t => ({
          ...t,
          url: `/overlays/${t.file}`,
          level: t.id.startsWith('lvl2') ? 2 : 1,
        })));
      })
      .catch(console.error);
  }, [isOpen]);

  if (!isOpen) return null;

  const baseUrl = getBackendBaseUrl();

  // Prioritize freshly fetched local templates to bypass any caching from parent props
  const allLevelTemplates = localTemplates.length > 0
    ? localTemplates.filter(t => t.level === level)
    : templates.filter(t => t.level === level);

  const count = allLevelTemplates.length;
  const planName = level === 1 ? 'Premium' : 'Enterprise';
  const accentColor = level === 1 ? '#22c55e' : '#a855f7';

  const clampZoom = (v: number) => Math.max(0.25, Math.min(3, v));
  const zoomIn    = () => setZoom(z => clampZoom(parseFloat((z * 1.25).toFixed(2))));
  const zoomOut   = () => setZoom(z => clampZoom(parseFloat((z * 0.8).toFixed(2))));
  const resetZoom = () => setZoom(1);

  const preset = SCREEN_PRESETS[screenPreset];

  // Auto-select first if nothing selected yet
  const resolvedSelected = selectedOverlay || (allLevelTemplates[0] ? templateFilename(allLevelTemplates[0]) : '');

  // Master Scoreboard-style trigger method (Purely triggers animations)
  const triggerAnimation = (eventType: string) => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({
        type: 'OVERLAY_ACTION',
        payload: { event: eventType }
      }, '*');
    });
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className=" flex flex-col rounded-2xl shadow-2xl overflow-hidden w-full"
        style={{
          background: 'var(--bg-secondary)',
          border: `1px solid ${accentColor}30`,
          boxShadow: `0 0 60px ${accentColor}20`,
          maxWidth: '1100px',
          maxHeight: '95vh',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full"
              style={{ background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}88)` }} />
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                {planName} Overlay Preview
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {count} design{count !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Controls bar ── */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>

          <select
            value={resolvedSelected}
            onChange={e => onOverlaySelect(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${accentColor}60`,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            {allLevelTemplates.length === 0
              ? <option value="">Loading overlays…</option>
              : <>
                  <option value="">Choose overlay design…</option>
                  {allLevelTemplates.map(t => (
                    <option key={t.id} value={templateFilename(t)}>{t.name}</option>
                  ))}
                </>
            }
          </select>

          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--bg-elevated)' }}>
            {SCREEN_PRESETS.map((p, i) => {
              const Icon = p.icon;
              return (
                <button key={p.label} onClick={() => setScreenPreset(i)} title={p.label}
                  className="p-2 rounded-lg transition-all"
                  style={screenPreset === i ? { background: accentColor, color: '#000' } : { color: 'var(--text-muted)' }}>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--bg-elevated)' }}>
            <button onClick={zoomOut} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold tabular-nums min-w-[44px] text-center" style={{ color: accentColor }}>
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={zoomIn} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={resetZoom} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} title="Reset Zoom">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress:</label>
            <input
              type="range"
              min="0"
              max="100"
              step="4"
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              disabled={loading}
              className="w-24 h-2 rounded cursor-pointer accent-green-500"
            />
            <span className="text-xs font-bold tabular-nums w-8" style={{ color: 'var(--accent)' }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* ── Preview area ── */}
        <div className="flex-1 flex items-center justify-center overflow-hidden p-4"
          style={{ background: '#000', minHeight: 0 }}>
          {resolvedSelected ? (
            <div ref={containerRef} style={{
              width:       preset.w,
              maxWidth:    '100%',
              aspectRatio: preset.aspect,
              maxHeight:   '100%',
              border:      `2px solid ${accentColor}40`,
              borderRadius:'12px',
              overflow:    'hidden',
              boxShadow:   `0 0 40px ${accentColor}15`,
              background:  '#0a0a0f',
              position:    'relative',
            }}>
              <OverlayPreviewRenderer 
                key={resolvedSelected}
                template={resolvedSelected}
                progress={debouncedProgress}
                baseUrl={baseUrl}
                zoom={zoom}
                onLoad={handleLoad}
                onError={handleError}
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                  <div className="text-center">
                    <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-emerald-400" />
                    <p className="text-slate-300 text-sm">Loading overlay…</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-20">
                  <div className="text-center p-8 max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-slate-300 text-sm mb-4">{error}</p>
                    <button onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all">
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="text-center p-12">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)' }}>
                <Monitor className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>
                Select an overlay above
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {count > 0 ? `${count} designs available` : 'Loading designs…'}
              </p>
            </div>
          )}
        </div>

        {/* Animation Trigger Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-inner m-4">
           <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mr-2 sm:mr-4 flex items-center gap-2">
             <Activity className="w-4 h-4 text-blue-500"/> Triggers:
           </span>
           <button onClick={() => triggerAnimation('FOUR')} className="flex-1 sm:flex-none px-6 py-3 bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm">FOUR (4)</button>
           <button onClick={() => triggerAnimation('SIX')} className="flex-1 sm:flex-none px-6 py-3 bg-green-500/10 text-green-400 font-bold border border-green-500/30 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm">SIX (6)</button>
           <button onClick={() => triggerAnimation('WICKET')} className="flex-1 sm:flex-none px-6 py-3 bg-red-500/10 text-red-400 font-bold border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">OUT (W)</button>
           <button onClick={() => triggerAnimation('DECISION_PENDING')} className="w-full sm:w-auto px-6 py-3 bg-amber-500/10 text-amber-500 font-bold border border-amber-500/30 rounded-xl hover:bg-amber-500 hover:text-black transition-all tracking-wide shadow-sm">DECISION PENDING (DP)</button>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2 flex-shrink-0 text-xs flex justify-between"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
          <span>Renders at 1920×1080 — scaled to preview frame</span>
          <span>Progress slider + triggers match tournament overlay previews</span>
        </div>
      </div>
    </div>
  );
};

export default FloatingOverlayPreview;
