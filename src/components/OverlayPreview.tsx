import React, { useState, useRef } from 'react';
import { Maximize2, Eye, X } from 'lucide-react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import type { OverlayTemplate } from '../types/overlay';
import { getBackendBaseUrl } from '../services/env';
import { getDemoData } from '../utils/overlayPreview';

interface OverlayPreviewProps {
  level: number;
  templates: OverlayTemplate[];
  onClose?: () => void;
}

const OverlayPreview: React.FC<OverlayPreviewProps> = ({ level, templates, onClose }) => {
  const [selectedOverlay, setSelectedOverlay] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const baseUrl = getBackendBaseUrl();
  const demoScoreRef = useRef({ score: 124, wickets: 4 });

  const levelTemplates = templates.filter(t => t.level === level);
  const count = levelTemplates.length;

  if (levelTemplates.length === 0) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  const pushAnimationEvent = (type: 'FOUR' | 'SIX' | 'WICKET') => {
    const cur = demoScoreRef.current;
    let newScore   = cur.score;
    let newWickets = cur.wickets;
    if (type === 'FOUR')   newScore   += 4;
    if (type === 'SIX')    newScore   += 6;
    if (type === 'WICKET') newWickets += 1;
    demoScoreRef.current = { score: newScore, wickets: newWickets };

    const base = getDemoData(0.69);
    const payload = { ...base, team1Score: newScore, team1Wickets: newWickets,
      lastBall: type, lastBallRuns: type === 'FOUR' ? 4 : type === 'SIX' ? 6 : 0,
      wicket: type === 'WICKET' };
    window.postMessage({ type: 'UPDATE_SCORE', data: payload }, '*');
    window.dispatchEvent(new CustomEvent('scorex:update', { detail: payload }));
  };

  const activeOverlay = selectedOverlay || (levelTemplates[0]?.url?.split('/').pop() ?? '');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 transition-all max-w-4xl w-full ${isFullscreen ? 'h-screen w-screen m-0 rounded-none border-0' : 'max-h-[90vh] overflow-y-auto p-6'}`}>
        {!isFullscreen && (
          <>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Overlay Preview ({count} designs)
              </h3>
              <div className="flex gap-2">
                {/* Animation push buttons */}
                <button onClick={() => pushAnimationEvent('FOUR')}
                  className="px-3 py-1.5 bg-blue-500/80 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-all"
                  title="Push FOUR animation">4️⃣</button>
                <button onClick={() => pushAnimationEvent('SIX')}
                  className="px-3 py-1.5 bg-purple-500/80 text-white rounded-lg text-xs font-bold hover:bg-purple-500 transition-all"
                  title="Push SIX animation">6️⃣</button>
                <button onClick={() => pushAnimationEvent('WICKET')}
                  className="px-3 py-1.5 bg-red-500/80 text-white rounded-lg text-xs font-bold hover:bg-red-500 transition-all"
                  title="Push WICKET animation">🎯</button>
                <button onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all" title="Fullscreen">
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Template grid thumbnails */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {levelTemplates.slice(0, 9).map(t => {
                const filename = t.url?.split('/').pop() ?? '';
                return (
                  <button key={t.id}
                    onClick={() => setSelectedOverlay(filename)}
                    className={`group p-4 rounded-xl transition-all border bg-gradient-to-b from-white/70 to-gray-50/70 hover:shadow-xl hover:scale-105 ${activeOverlay === filename ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-blue-400'}`}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-slate-900">
                      <OverlayPreviewRenderer
                        key={filename}
                        template={filename}
                        progress={69}
                        baseUrl={baseUrl}
                        heightClass="h-full"
                      />
                    </div>
                    <p className="font-semibold text-sm line-clamp-1 text-left">{t.name}</p>
                  </button>
                );
              })}
            </div>

            {/* Selector dropdown */}
            <select
              value={activeOverlay}
              onChange={e => setSelectedOverlay(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            >
              <option value="">Select design to preview…</option>
              {levelTemplates.map(t => (
                <option key={t.id} value={t.url?.split('/').pop() ?? ''}>{t.name}</option>
              ))}
            </select>
          </>
        )}

        {/* Full preview */}
        {activeOverlay && (
          <div className={`rounded-xl overflow-hidden shadow-2xl border-4 border-blue-200/50 ${isFullscreen ? 'h-full' : 'h-[400px]'}`}>
            {isFullscreen && (
              <button onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-all">
                <X className="w-5 h-5" />
              </button>
            )}
            <OverlayPreviewRenderer
              key={activeOverlay}
              template={activeOverlay}
              progress={69}
              baseUrl={baseUrl}
              heightClass="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlayPreview;
