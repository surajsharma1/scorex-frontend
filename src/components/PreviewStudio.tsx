import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MonitorPlay, X, Layout, Zap, Users, BarChart3, Smartphone, Monitor, Activity } from 'lucide-react';
import { getBackendBaseUrl } from '../services/env';
import { usePreviewScale } from '../hooks/usePreviewScale';

const LVL1_TEMPLATES = [
  { name: 'Lvl 1 Modern Bar', url: '/overlays/lvl1-modern-bar.html' },
  { name: 'Lvl 1 Solid Edge', url: '/overlays/lvl1-solid-edge.html' },
  { name: 'Lvl 1 Clean Cloud', url: '/overlays/lvl1-clean-cloud.html' },
  { name: 'Lvl 1 Minimal Dark', url: '/overlays/lvl1-minimal-dark.html' },
  { name: 'Lvl 1 Franchise Gold', url: '/overlays/lvl1-franchise-gold.html' },
  { name: 'Lvl 1 Cyber Chevron', url: '/overlays/lvl1-cyber-chevron.html' },
  { name: 'Lvl 1 Retro Teal', url: '/overlays/lvl1-paper-style.html' },
  { name: 'Lvl 1 Yellow Impact', url: '/overlays/lvl1-yellow-impact.html' },
  { name: 'Lvl 1 Classic', url: '/overlays/lvl1-classic-test.html' }
];

export default function PreviewStudio() {
  const [searchParams] = useSearchParams();
  const initialTemplateUrl = searchParams.get('template') || LVL1_TEMPLATES[0].url;
  
  const [selectedTemplate, setSelectedTemplate] = useState(
    LVL1_TEMPLATES.find(t => t.url === initialTemplateUrl) || LVL1_TEMPLATES[0]
  );
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
        {/* SIDEBAR - TEMPLATE SELECTION */}
        <div className="w-full lg:w-72 bg-[#0a0a0f] border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-500" /> Templates
            </h2>
            <div className="space-y-2">
              {LVL1_TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                    selectedTemplate.name === t.name
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CANVAS AREA */}
        <div className="flex-1 flex flex-col relative" style={{ backgroundImage: 'radial-gradient(#1a1a24 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          
          {/* Responsive Container Wrapper */}
          <div className="flex-1 p-4 lg:p-8 flex items-center justify-center overflow-hidden">
            <div 
              ref={containerRef}
              className={`relative bg-black rounded-xl border border-gray-800 shadow-2xl overflow-hidden transition-all duration-300 ${
                deviceMode === 'mobile' ? 'w-full max-w-[400px] aspect-[9/16]' : 'w-full aspect-video max-w-6xl'
              }`}
            >
              <iframe
                id="preview-frame"
                src={`${getBackendBaseUrl()}${selectedTemplate.url}?preview=true`}
                style={{
                  width: '1920px',
                  height: '1080px',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${idealScale})`,
                  transformOrigin: 'center center',
                  border: 'none',
                  pointerEvents: 'none'
                }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

          {/* TRIGGERS CONTROL BAR */}
          <div className="h-20 shrink-0 bg-[#0a0a0f] border-t border-gray-800 px-6 flex items-center gap-4 overflow-x-auto custom-scrollbar">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest shrink-0 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Triggers
            </span>
            <button onClick={() => fireTrigger('FOUR')} className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg font-bold text-sm shrink-0 hover:bg-blue-500 hover:text-white transition-all">FOUR (4)</button>
            <button onClick={() => fireTrigger('SIX')} className="px-5 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg font-bold text-sm shrink-0 hover:bg-green-500 hover:text-white transition-all">SIX (6)</button>
            <button onClick={() => fireTrigger('WICKET')} className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-bold text-sm shrink-0 hover:bg-red-500 hover:text-white transition-all">OUT (W)</button>
            <button onClick={() => fireTrigger('RESTORE')} className="ml-auto px-5 py-2.5 bg-gray-800 text-white rounded-lg font-bold text-sm shrink-0 hover:bg-gray-700 transition-all flex items-center gap-2">
              <X className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}