import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Monitor, Smartphone, Tablet } from 'lucide-react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import { getBackendBaseUrl } from '../services/env';
import { getDemoData } from '../utils/overlayPreview';

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
  const demoScoreRef = useRef({ score: 124, wickets: 4 });

  // Always load from public static file — no auth filter, always shows all designs
  useEffect(() => {
    if (!isOpen) return;
    fetch('/templates.json')
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

  // Use prop templates if populated, else fall back to locally-loaded static list
  const propLevelTemplates = templates.filter(t => t.level === level);
  const allLevelTemplates = propLevelTemplates.length > 0
    ? propLevelTemplates
    : localTemplates.filter(t => t.level === level);

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

  // Push score update with delta so overlays detect 4/6/wicket via their built-in logic
  const pushAnimationEvent = (type: 'FOUR' | 'SIX' | 'WICKET') => {
    const cur = demoScoreRef.current;
    let newScore   = cur.score;
    let newWickets = cur.wickets;
    if (type === 'FOUR')   newScore   += 4;
    if (type === 'SIX')    newScore   += 6;
    if (type === 'WICKET') newWickets += 1;
    demoScoreRef.current = { score: newScore, wickets: newWickets };

    const base = getDemoData(0.69);
    const payload = {
      ...base,
      team1Score:    newScore,
      team1Wickets:  newWickets,
      lastBall:      type,
      lastBallRuns:  type === 'FOUR' ? 4 : type === 'SIX' ? 6 : 0,
      wicket:        type === 'WICKET',
    };

    // UPDATE_SCORE is what all overlay HTML files listen for
    window.postMessage({ type: 'UPDATE_SCORE', data: payload }, '*');
    // scorex:update for the renderer's own DOM updater
    window.dispatchEvent(new CustomEvent('scorex:update', { detail: payload }));
  };

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

          {/* Overlay selector */}
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

          {/* Screen presets */}
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

          {/* Zoom controls */}
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

          {/* Zoom slider */}
          <input type="range" min={25} max={200} step={5}
            value={Math.round(zoom * 100)}
            onChange={e => setZoom(parseInt(e.target.value) / 100)}
            className="w-28 hidden sm:block"
            style={{ accentColor }} />

          {/* ── Animation push buttons ── */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-semibold hidden sm:block" style={{ color: 'var(--text-muted)' }}>Push:</span>
            <button onClick={() => pushAnimationEvent('FOUR')}
              className="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
              title="Simulate a FOUR — triggers animation on overlays that support it">
              4️⃣ FOUR
            </button>
            <button onClick={() => pushAnimationEvent('SIX')}
              className="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}
              title="Simulate a SIX — triggers animation on overlays that support it">
              6️⃣ SIX
            </button>
            <button onClick={() => pushAnimationEvent('WICKET')}
              className="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
              title="Simulate a WICKET — triggers animation on overlays that support it">
              🎯 OUT
            </button>
          </div>
        </div>

        {/* ── Preview area ── */}
        <div className="flex-1 flex items-center justify-center overflow-hidden p-4"
          style={{ background: '#000', minHeight: 0 }}>
          {resolvedSelected ? (
            <div style={{
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
                progress={69}
                matchData={{ runs: 142, wickets: 4 }}
                isPreview={true}
                baseUrl={baseUrl}
                zoom={zoom}
                className=""
                heightClass=""
              />
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

        {/* ── Footer ── */}
        <div className="px-5 py-2 flex-shrink-0 text-xs flex justify-between"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
          <span>Renders at 1920×1080 — scaled to preview frame</span>
          <span>Push 4️⃣ 6️⃣ 🎯 to test animations</span>
        </div>
      </div>
    </div>
  );
};

export default FloatingOverlayPreview;
