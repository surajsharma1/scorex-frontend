import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Eye, Save, Trash2, Copy, RefreshCw, X, PlaySquare, Settings, 
  Target, ShieldAlert, Timer, Activity, Layout, Globe, Maximize2
} from 'lucide-react';
import { overlayAPI, matchAPI } from '../services/api';
import { getBackendBaseUrl, getApiBaseUrl } from '../services/env';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { usePreviewScale } from '../hooks/usePreviewScale';

const getTemplateFilename = (t: any): string => {
  if (t.file) return t.file;
  if (t.url) return t.url.split('/').pop() || '';
  if (t.template) return t.template.split('/').pop() || '';
  return `${t.id || 'default'}.html`;
};

const CountdownBadge = ({ expiresAt, overlayId, onExpire }: { expiresAt: string, overlayId: string, onExpire: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setTimeLeft(remaining);
      if (remaining <= 0) { clearInterval(interval); onExpire(overlayId); }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, overlayId, onExpire, timeLeft]);

  if (timeLeft <= 0) return <div className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">DEAD</div>;
  
  const m = String(Math.floor((timeLeft / 1000 / 60) % 60)).padStart(2, '0');
  const s = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, '0');
  return <div className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-mono font-bold rounded"><Timer className="w-3 h-3 inline mr-1"/>{m}:{s}</div>;
};

export default function OverlayManager({ tournamentId }: { tournamentId?: string }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const baseUrl = getBackendBaseUrl();
  const apiBaseUrl = getApiBaseUrl(); 
  
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [createdOverlays, setCreatedOverlays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activePreview, setActivePreview] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', template: '', match: '' });
  
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { idealScale } = usePreviewScale({ containerRef: previewContainerRef });

  // --- GLOBAL OVERLAY CONFIGURATION ---
  const [globalConfig, setGlobalConfig] = useState(() => {
    const saved = localStorage.getItem('scorex_global_overlay_config');
    return saved ? JSON.parse(saved) : {
      tossDuration: 8,
      squadDuration: 12,
      introDuration: 12,
      autoStatsOvers: 5,
      autoStatsType: 'BOTH_CARDS',
      autoStatsDuration: 10
    };
  });

  const userLevel = (user as any)?.membership?.level || (user as any)?.membershipLevel || 0;
  const isEligible = userLevel > 0;

  useEffect(() => { loadData(); if (tournamentId) fetchLiveMatches(); }, [tournamentId]);

  const fetchLiveMatches = async () => {
    try {
      const res = await matchAPI.getMatches({ tournament: tournamentId });
      setLiveMatches(res.data.data || []);
    } catch (e) {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, oRes] = await Promise.all([overlayAPI.getOverlayTemplates(), overlayAPI.getOverlays(tournamentId!)]); 
      const availableTemplates = (tRes.data?.data || []).filter((t: any) => userLevel >= (t.level || 1));
      setTemplates(availableTemplates);
      setCreatedOverlays(oRes.data?.data || []);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return addToast({ type: 'error', message: 'Membership required to deploy broadcast overlays.' });
    if (!createForm.name) return addToast({ type: 'error', message: 'Please provide an overlay name.' });
    if (!createForm.template) return addToast({ type: 'error', message: 'Please select a base template.' });
    
    try {
      await overlayAPI.createOverlay({ ...createForm, tournamentId });
      addToast({ type: 'success', message: 'Overlay deployed successfully!' });
      setShowCreate(false);
      setCreateForm({ name: '', template: '', match: '' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Creation failed' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Destroy this overlay link permanently?')) return;
    try {
      await overlayAPI.deleteOverlay(id);
      addToast({ type: 'success', message: 'Overlay deleted' });
      if (activePreview?._id === id) setActivePreview(null);
      loadData();
    } catch (e) {}
  };

  const handleSaveGlobalConfig = () => {
    localStorage.setItem('scorex_global_overlay_config', JSON.stringify(globalConfig));
    addToast({ type: 'success', message: 'Global automations saved and applied to all overlays.' });
    setShowConfigModal(false);
    // Force reload active preview to apply new config
    if (activePreview) {
      const current = activePreview;
      setActivePreview(null);
      setTimeout(() => setActivePreview(current), 100);
    }
  };

  const generateSecureUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    const expTime = overlay.urlExpiresAt ? new Date(overlay.urlExpiresAt).getTime() : Date.now() + 86400000;
    // Pass the global config directly to the engine via URL parameters
    const cfgString = encodeURIComponent(JSON.stringify(globalConfig));
    return `${baseUrl}/overlays/${filename}?tournament=${tournamentId || overlay.tournamentId}&exp=${expTime}&preview=true&cfg=${cfgString}`;
  };

  // Deep animation trigger that targets the active iframe with rich mock data
  const triggerAnim = (eventType: string, targetId: string = 'main-preview') => {
    const iframe = document.getElementById(targetId) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      
      let mockData: any = {};

      // Inject data based on the Level 2 requirement
      if (['BATTING_CARD', 'BOWLING_CARD', 'BOTH_CARDS', 'MATCH_END'].includes(eventType)) {
        mockData = {
          team1: {
            name: "RCB",
            batsmen: [
              { name: 'V. Kohli', runs: 82, balls: 53, fours: 6, sixes: 4, sr: 154.7 },
              { name: 'F. du Plessis', runs: 45, balls: 31, fours: 4, sixes: 2, sr: 145.1 }
            ],
            bowlers: [
              { name: 'M. Siraj', overs: '4.0', maidens: 0, runs: 28, wickets: 2, econ: 7.0 }
            ]
          }
        };
      } else if (eventType === 'BATSMAN_PROFILE') {
        mockData = {
          title: "PLAYER PROFILE",
          stats: [
            { label: 'RUNS', value: '114' },
            { label: 'MATCHES', value: '12' },
            { label: 'STRIKE RATE', value: '165.4' }
          ]
        };
      } else if (eventType === 'SHOW_SQUADS') {
        mockData = {
          team1Name: 'RCB', team2Name: 'CSK',
          team1Players: [{ name: 'V. Kohli', role: 'BAT' }, { name: 'G. Maxwell', role: 'ALL' }],
          team2Players: [{ name: 'M. Dhoni', role: 'WK' }, { name: 'R. Jadeja', role: 'ALL' }]
        };
      } else if (eventType === 'WICKET_SWITCH' || eventType === 'BATSMAN_CHANGE') {
        mockData = {
          outName: 'V. Kohli', outScore: '82 (53)', inName: 'G. Maxwell'
        };
      } else if (eventType === 'INNINGS_BREAK') {
        mockData = { chasingTeam: 'CSK', target: 214 };
      }

      // Matches the OVERLAY_TRIGGER payload expected by engine.js and your HTML files
      const payload = { 
        type: 'OVERLAY_TRIGGER', 
        payload: { type: eventType, duration: 8, data: mockData } 
      };
      
      iframe.contentWindow.postMessage(payload, '*');
    }
  };

  if (!isEligible) return <div className="p-8 text-center text-red-500">Overlay Engine Locked. Upgrade Membership.</div>;

  return (
    <div className="space-y-6 mt-4">
      
      {/* ─── GLOBAL SETTINGS MODAL (NO IFRAME = NO LAG) ─── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0d0d14]">
              <h3 className="text-xl font-black text-white flex items-center gap-2"><Globe className="text-blue-500 w-5 h-5"/> Global Automations Config</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-white"><X /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <label className="block text-xs font-bold text-gray-400 mb-2">Toss Screen Duration (Secs)</label>
                  <input type="number" value={globalConfig.tossDuration} onChange={e => setGlobalConfig({...globalConfig, tossDuration: Number(e.target.value)})} className="w-full p-2 bg-black border border-gray-700 text-white rounded outline-none" />
                </div>
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <label className="block text-xs font-bold text-gray-400 mb-2">Playing XI Duration (Secs)</label>
                  <input type="number" value={globalConfig.squadDuration} onChange={e => setGlobalConfig({...globalConfig, squadDuration: Number(e.target.value)})} className="w-full p-2 bg-black border border-gray-700 text-white rounded outline-none" />
                </div>
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <label className="block text-xs font-bold text-gray-400 mb-2">Batsman Intro Duration (Secs)</label>
                  <input type="number" value={globalConfig.introDuration} onChange={e => setGlobalConfig({...globalConfig, introDuration: Number(e.target.value)})} className="w-full p-2 bg-black border border-gray-700 text-white rounded outline-none" />
                </div>
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <label className="block text-xs font-bold text-gray-400 mb-2">Auto-Stats Interval (Overs)</label>
                  <input type="number" value={globalConfig.autoStatsOvers} onChange={e => setGlobalConfig({...globalConfig, autoStatsOvers: Number(e.target.value)})} placeholder="e.g. 5 (0 to disable)" className="w-full p-2 bg-black border border-gray-700 text-white rounded outline-none" />
                </div>
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <label className="block text-xs font-bold text-gray-400 mb-2">Auto-Stats Layout</label>
                  <select value={globalConfig.autoStatsType} onChange={e => setGlobalConfig({...globalConfig, autoStatsType: e.target.value})} className="w-full p-2 bg-black border border-gray-700 text-white rounded outline-none">
                    <option value="BATTING_CARD">Batting Card Only</option>
                    <option value="BOWLING_CARD">Bowling Card Only</option>
                    <option value="BOTH_CARDS">Both Cards</option>
                  </select>
                </div>
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <label className="block text-xs font-bold text-gray-400 mb-2">Auto-Stats Duration (Secs)</label>
                  <input type="number" value={globalConfig.autoStatsDuration} onChange={e => setGlobalConfig({...globalConfig, autoStatsDuration: Number(e.target.value)})} className="w-full p-2 bg-black border border-gray-700 text-white rounded outline-none" />
                </div>
              </div>
              <button onClick={handleSaveGlobalConfig} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">Save Global Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE PREVIEW DIRECTOR MODAL ─── */}
      {activePreview && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between p-4 bg-[#0d0d14] border border-gray-800 rounded-t-2xl">
            <h3 className="text-xl font-black text-white"><span className="text-red-500 animate-pulse">●</span> PREVIEW DIRECTOR</h3>
            <button onClick={() => setActivePreview(null)} className="p-2 bg-gray-800 rounded hover:bg-red-500 text-white"><X /></button>
          </div>
          
          {/* Iframe Scaling Bug Fix -> Exact bounds, no double iframes */}
            <div className="w-full aspect-video bg-[#000] rounded-2xl overflow-hidden border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative group flex items-center justify-center">
              
              {/* RESTORED: Auto-Scaling 3D Broadcast Engine */}
              <div ref={previewContainerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <iframe
                  id="main-preview"
                  src={generateSecureUrl(activePreview)}
                  style={{
                    width: '1920px',
                    height: '1080px',
                    transform: `scale(${idealScale})`,
                    transformOrigin: 'center center',
                    border: 'none',
                    position: 'absolute'
                  }}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* Expand Button for Small Screens */}
              <button 
                onClick={() => setIsMobileFullscreen(true)}
                className="md:hidden absolute top-4 right-4 p-3 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/20 shadow-2xl flex items-center gap-2 active:scale-95 transition-all z-10"
              >
                <Maximize2 className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">Full Screen</span>
              </button>
            </div>

          <div className="bg-[#0d0d14] border border-gray-800 rounded-b-2xl p-4 flex gap-2 overflow-x-auto shrink-0">
             <button onClick={() => triggerAnim('SHOW_VS_SCREEN')} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded">VS</button>
             <button onClick={() => triggerAnim('SHOW_TOSS')} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded">Toss</button>
             <button onClick={() => triggerAnim('SHOW_SQUADS')} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded">Squads</button>
             <button onClick={() => triggerAnim('START_INNINGS_INTRO')} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded">Players</button>
             
             <div className="w-px h-8 bg-gray-700 mx-2"></div>
             
             <button onClick={() => triggerAnim('FOUR')} className="px-4 py-2 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">FOUR</button>
             <button onClick={() => triggerAnim('SIX')} className="px-4 py-2 bg-green-500/20 text-green-400 text-xs font-bold rounded">SIX</button>
             <button onClick={() => triggerAnim('WICKET')} className="px-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold rounded">OUT</button>
             
             <div className="w-px h-8 bg-gray-700 mx-2"></div>

             <button onClick={() => triggerAnim('BATTING_CARD')} className="px-4 py-2 bg-fuchsia-500/20 text-fuchsia-400 text-xs font-bold rounded">Batting Sum</button>
             <button onClick={() => triggerAnim('BOWLING_CARD')} className="px-4 py-2 bg-fuchsia-500/20 text-fuchsia-400 text-xs font-bold rounded">Bowling Sum</button>
             <button onClick={() => triggerAnim('RESTORE')} className="ml-auto px-6 py-2 bg-white text-black text-xs font-black rounded">RESTORE</button>
          </div>
        </div>
      )}

      {/* ─── MAIN UI ─── */}
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)]">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><PlaySquare className="text-green-500"/> Deployed Overlays</h3>
        <div className="flex gap-2">
          <button onClick={() => setShowConfigModal(true)} className="px-4 py-2 bg-blue-500/20 text-blue-400 font-bold rounded-lg text-sm flex items-center gap-2"><Globe className="w-4 h-4"/> Global Settings</button>
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-green-500/20 text-green-400 font-bold rounded-lg text-sm">Deploy New</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {createdOverlays.map(overlay => (
          <div key={overlay._id} className="p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-white">{overlay.name}</h4>
                <p className="text-xs text-blue-400 mt-1">{getTemplateFilename(overlay)}</p>
              </div>
              <CountdownBadge expiresAt={overlay.urlExpiresAt} overlayId={overlay._id} onExpire={()=>{}} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActivePreview(overlay)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex justify-center items-center gap-2"><Eye className="w-4 h-4"/> Preview</button>
              <button onClick={() => { navigator.clipboard.writeText(generateSecureUrl(overlay)); addToast({type:'success', message:'URL Copied'}); }} className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg"><Copy className="w-4 h-4"/></button>
              <button onClick={() => handleDelete(overlay._id)} className="p-2 bg-gray-800 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}