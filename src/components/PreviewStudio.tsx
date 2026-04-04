import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MonitorPlay, X, Layout, Smartphone, Monitor, Activity } from 'lucide-react';
import { usePreviewScale } from '../hooks/usePreviewScale';

interface Template { name: string; url: string; level: 1 | 2; }

const ALL_TEMPLATES: Template[] = [
  // Level 1 — Premium
  { name: 'Modern Bar',      url: '/overlays/lvl1-modern-bar.html',      level: 1 },
  { name: 'Solid Edge',      url: '/overlays/lvl1-solid-edge.html',      level: 1 },
  { name: 'Clean Cloud',     url: '/overlays/lvl1-clean-cloud.html',     level: 1 },
  { name: 'Minimal Dark',    url: '/overlays/lvl1-minimal-dark.html',    level: 1 },
  { name: 'Franchise Gold',  url: '/overlays/lvl1-franchise-gold.html',  level: 1 },
  { name: 'Cyber Chevron',   url: '/overlays/lvl1-cyber-chevron.html',   level: 1 },
  { name: 'Retro Teal',      url: '/overlays/lvl1-paper-style.html',     level: 1 },
  { name: 'Yellow Impact',   url: '/overlays/lvl1-yellow-impact.html',   level: 1 },
  { name: 'Classic',         url: '/overlays/lvl1-classic-test.html',    level: 1 },
  // Level 2 — Enterprise
  { name: 'Broadcast Pro',   url: '/overlays/lvl2-broadcast-pro.html',   level: 2 },
  { name: 'Cyber Glitch',    url: '/overlays/lvl2-cyber-glitch.html',    level: 2 },
  { name: 'Flame Thrower',   url: '/overlays/lvl2-flame-thrower.html',   level: 2 },
  { name: 'Fluid Ribbon',    url: '/overlays/lvl2-Fluid-Ribbon.html',    level: 2 },
  { name: 'Glass Morphism',  url: '/overlays/lvl2-glass-morphism.html',  level: 2 },
  { name: 'Sports Ticker',   url: '/overlays/lvl2-Global-Sports-Ticker.html', level: 2 },
  { name: 'Hologram',        url: '/overlays/lvl2-hologram.html',        level: 2 },
  { name: 'Matrix Rain',     url: '/overlays/lvl2-matrix-rain.html',     level: 2 },
  { name: 'Neon Pulse',      url: '/overlays/lvl2-neon-pulse.html',      level: 2 },
  { name: 'Particle Storm',  url: '/overlays/lvl2-particle-storm.html',  level: 2 },
  { name: 'RGB Split',       url: '/overlays/lvl2-rgb-split.html',       level: 2 },
  { name: 'Water Flow',      url: '/overlays/lvl2-water-flow.html',      level: 2 },
];

export default function PreviewStudio() {
  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level');
  const templateParam = searchParams.get('template');

  // Filter to just the level requested, or all if none specified
  const filteredTemplates = levelParam
    ? ALL_TEMPLATES.filter(t => t.level === Number(levelParam))
    : ALL_TEMPLATES;

  const initialTemplate =
    ALL_TEMPLATES.find(t => t.url === templateParam) ||
    filteredTemplates[0] ||
    ALL_TEMPLATES[0];

  const [selectedTemplate, setSelectedTemplate] = useState<Template>(initialTemplate);
  const [filterLevel, setFilterLevel] = useState<'all' | 1 | 2>(
    levelParam ? (Number(levelParam) as 1 | 2) : 'all'
  );

  const visibleTemplates = filterLevel === 'all'
    ? ALL_TEMPLATES
    : ALL_TEMPLATES.filter(t => t.level === filterLevel);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom hook to perfectly scale 1920x1080 inside any container size
  const { idealScale } = usePreviewScale({ containerRef });

  const fireTrigger = (type: string) => {
    const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type, duration: 8 }, '*');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#030305] text-white overflow-hidden">
      {/* TOP NAVBAR */}
      <div className="h-16 shrink-0 bg-[#0a0a0f] border-b border-gray-800 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <MonitorPlay className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide text-white">Preview<span className="text-blue-500">Studio</span></h1>
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Broadcast Design Editor</p>
          </div>
        </div>

        <div className="flex gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button 
            onClick={() => setDeviceMode('desktop')} 
            className={`p-2 rounded-md transition-all ${deviceMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDeviceMode('mobile')} 
            className={`p-2 rounded-md transition-all ${deviceMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-full lg:w-72 bg-[#0a0a0f] border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-500" /> Templates
            </h2>

            {/* Level filter tabs */}
            <div className="flex gap-1 mb-4 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {(['all', 1, 2] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => {
                    setFilterLevel(lvl);
                    const first = lvl === 'all' ? ALL_TEMPLATES[0] : ALL_TEMPLATES.find(t => t.level === lvl);
                    if (first) setSelectedTemplate(first);
                  }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                    filterLevel === lvl
                      ? lvl === 2
                        ? 'bg-purple-600 text-white'
                        : lvl === 1
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {lvl === 'all' ? 'All' : lvl === 1 ? 'Premium' : 'Enterprise'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {visibleTemplates.map(t => (
                <button
                  key={t.url}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                    selectedTemplate.url === t.url
                      ? t.level === 2
                        ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                        : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.level === 2 ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CANVAS AREA */}
        <div className="flex-1 flex flex-col relative" style={{ backgroundImage: 'radial-gradient(#1a1a24 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

          <div className="flex-1 p-4 lg:p-8 flex items-center justify-center overflow-hidden">
            <div
              ref={containerRef}
              className={`relative bg-black rounded-xl border border-gray-800 shadow-2xl overflow-hidden transition-all duration-300 ${
                deviceMode === 'mobile' ? 'w-full max-w-[400px] aspect-[9/16]' : 'w-full aspect-video max-w-6xl'
              }`}
            >
              <iframe
                id="preview-frame"
                key={selectedTemplate.url}
                src={`${selectedTemplate.url}?preview=true`}
                style={{
                  width: '1920px',
                  height: '1080px',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${idealScale})`,
                  transformOrigin: 'center center',
                  border: 'none',
                  pointerEvents: 'none',
                }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

          {/* TRIGGERS BAR */}
          <div className="h-20 shrink-0 bg-[#0a0a0f] border-t border-gray-800 px-6 flex items-center gap-3 overflow-x-auto">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest shrink-0 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Triggers
            </span>
            <button onClick={() => fireTrigger('FOUR')}   className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg font-bold text-sm shrink-0 hover:bg-blue-500 hover:text-white transition-all">FOUR (4)</button>
            <button onClick={() => fireTrigger('SIX')}    className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg font-bold text-sm shrink-0 hover:bg-green-500 hover:text-white transition-all">SIX (6)</button>
            <button onClick={() => fireTrigger('WICKET')} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-bold text-sm shrink-0 hover:bg-red-500 hover:text-white transition-all">OUT (W)</button>
            <button onClick={() => fireTrigger('SHOW_TOSS')} className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg font-bold text-sm shrink-0 hover:bg-yellow-500 hover:text-white transition-all">Toss</button>
            <button onClick={() => fireTrigger('SHOW_SQUADS')} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg font-bold text-sm shrink-0 hover:bg-purple-500 hover:text-white transition-all">Squads</button>
            <button onClick={() => fireTrigger('RESTORE')} className="ml-auto px-4 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm shrink-0 hover:bg-gray-700 transition-all flex items-center gap-2">
              <X className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}