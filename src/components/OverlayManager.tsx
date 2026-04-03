import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, MonitorPlay, Save, Trash2, Copy, RefreshCw, X, PlaySquare, Settings, 
  Target, ShieldAlert, Timer, Maximize2, Smartphone, ZoomIn, Activity, Layout, Sliders

} from 'lucide-react';
import { overlayAPI, matchAPI } from '../services/api';
import { getBackendBaseUrl, getApiBaseUrl } from '../services/env';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { usePreviewScale } from '../hooks/usePreviewScale';

// ─── SAFE EXTRACTOR ────────────────────────────────────────────────────────
const getTemplateFilename = (t: any): string => {
  if (t.file) return t.file;
  if (t.url) return t.url.split('/').pop() || '';
  if (t.template) return t.template.split('/').pop() || '';
  return `${t.id || 'default'}.html`;
};

// ─── ISOLATED COUNTDOWN BADGE ──────────────────────────────────────────────
const CountdownBadge = ({ expiresAt, overlayId, onExpire }: { expiresAt: string, overlayId: string, onExpire: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire(overlayId);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, overlayId, onExpire, timeLeft]);

  if (timeLeft <= 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-red-500/20 border-red-500/40 text-red-400">
        <Timer className="w-3.5 h-3.5" />
        <span className="text-[11px] font-black font-mono tracking-widest">DEAD URL</span>
      </div>
    );
  }

  const h = String(Math.floor((timeLeft / (1000 * 60 * 60)) % 24)).padStart(2, '0');
  const m = String(Math.floor((timeLeft / 1000 / 60) % 60)).padStart(2, '0');
  const s = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-green-500/20 border-green-500/40 text-green-400">
      <Timer className="w-3.5 h-3.5" />
      <span className="text-[11px] font-black font-mono tracking-widest">{`${h}:${m}:${s}`}</span>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function OverlayManager({ tournamentId }: { tournamentId?: string, matches?: any[] }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const baseUrl = getBackendBaseUrl();
  const apiBaseUrl = getApiBaseUrl(); 
  
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [createdOverlays, setCreatedOverlays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activePreview, setActivePreview] = useState<any | null>(null);
  const [configuringOverlay, setConfiguringOverlay] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', template: '', match: '' });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { idealScale } = usePreviewScale({ containerRef });

  const userLevel = (user as any)?.membership?.level || (user as any)?.membershipLevel || 0;
  const isEligible = userLevel > 0;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tournamentId) fetchLiveMatches();
  }, [tournamentId]);

  const fetchLiveMatches = async () => {
    if (!tournamentId) return;
    try {
      const res = await matchAPI.getMatches({ tournament: tournamentId });
      const all = res.data.data || res.data || [];
      setLiveMatches(all);
      const firstLive = all.find((m: any) => m.status === 'live');
      if (firstLive && !createForm.match) {
        setCreateForm(prev => ({ ...prev, match: firstLive._id }));
      }
    } catch (e) { console.error('Failed to load matches', e); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, oRes] = await Promise.all([
        overlayAPI.getOverlayTemplates(),
        tournamentId ? overlayAPI.getOverlays(tournamentId) : Promise.resolve({ data: { data: [] } })
      ]);
      const rawTemplates = tRes.data?.data || tRes.data?.templates || tRes.data || [];
      const availableTemplates = rawTemplates.filter((t: any) => userLevel >= (t.level || 1));
      
      setTemplates(availableTemplates);
      setCreatedOverlays(oRes.data?.data || oRes.data || []);
    } catch (e) { console.error('Failed to load overlays', e); } 
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return addToast({ type: 'error', message: 'Membership required to create overlays.' });
    if (!createForm.name || !createForm.template) return addToast({ type: 'error', message: 'Name and template required' });
    
    try {
      await overlayAPI.createOverlay({ ...createForm, tournamentId });
      addToast({ type: 'success', message: 'Overlay deployed successfully. Link valid for 24 hours.' });
      setShowCreate(false);
      setCreateForm({ name: '', template: '', match: '' });
      loadData();
    } catch (err: any) { addToast({ type: 'error', message: err.response?.data?.message || 'Creation failed' }); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Destroy this overlay link permanently?')) return;
    try {
      await overlayAPI.deleteOverlay(id);
      addToast({ type: 'success', message: 'Overlay deleted' });
      if (activePreview?._id === id) setActivePreview(null);
      loadData();
    } catch (e) { addToast({ type: 'error', message: 'Deletion failed' }); }
  };

  const handleRegenerate = async (id: string) => {
    try {
      await overlayAPI.regenerateOverlay(id);
      addToast({ type: 'success', message: 'URL Regenerated for another 24 hours.' });
      loadData();
    } catch (e) { addToast({ type: 'error', message: 'Regeneration failed' }); }
  };

  const handleOverlayExpire = useCallback((expiredId: string) => {
    if (activePreview?._id === expiredId) {
      setActivePreview(null);
      addToast({ type: 'error', message: 'The active preview link has expired.' });
    }
  }, [activePreview, addToast]);

  // Deep animation trigger that targets the active iframe
  const triggerAnim = (eventType: string, targetId: string = 'main-preview') => {
    const iframe = document.getElementById(targetId) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      // Matches the OVERLAY_TRIGGER payload expected by engine.js and the Level 2 HTML files
      const payload = { 
        type: 'OVERLAY_TRIGGER', 
        payload: { type: eventType, duration: 8 } 
      };
      
      iframe.contentWindow.postMessage(payload, '*');
      
      // Also send direct fallback format just in case engine.js is bypassed
      iframe.contentWindow.postMessage({ type: eventType, duration: 8 }, '*');
    }
  };


  const generateSecureUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    const expTime = overlay.urlExpiresAt ? new Date(overlay.urlExpiresAt).getTime() : Date.now() + 86400000;
    return `${baseUrl}/overlays/${filename}?tournament=${tournamentId || overlay.tournamentId}&exp=${expTime}&preview=true`;
  };

  if (!isEligible) {
    return (
      <div className="p-8 text-center rounded-3xl bg-[var(--bg-card)] border border-red-500/30 shadow-2xl mt-4 mx-2">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-black text-white mb-2">Overlay Engine Locked</h2>
        <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">Upgrade to Premium or Enterprise membership to unlock live broadcast overlays.</p>
        <button onClick={() => window.location.href = '/membership'} className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow-lg">View Plans</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4 mx-2">
      
{/* ─── CONFIGURATION MODAL (BROADCAST DIRECTOR) ─── */}
      {configuringOverlay && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl w-full max-w-6xl flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0d0d14]">
              <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-wide">
                <Settings className="w-5 h-5 text-blue-500" /> BROADCAST DIRECTOR: <span className="text-blue-400">{configuringOverlay.name}</span>
              </h3>
              <button onClick={() => setConfiguringOverlay(null)} className="p-2 text-gray-400 hover:text-red-400 bg-gray-800 hover:bg-red-500/10 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex flex-col lg:flex-row h-full max-h-[85vh]">
              {/* Left Side: Preview Engine for Config */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center bg-black relative" style={{ backgroundImage: 'radial-gradient(#1a1a24 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <div className="w-full aspect-video relative overflow-hidden bg-transparent border border-gray-800 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                  <iframe
                    id="config-preview"
                    src={generateSecureUrl(configuringOverlay)}
                    style={{
                      width: '1920px', height: '1080px',
                      position: 'absolute', top: '50%', left: '50%',
                      transform: `translate(-50%, -50%) scale(${idealScale})`,
                      transformOrigin: 'center center', border: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Right Side: Level 2 Overlay Triggers & Settings */}
              <div className="w-full lg:w-96 bg-[#0d0d14] border-l border-gray-800 flex flex-col">
                
                {/* TRIGGERS SECTION */}
                <div className="p-5 border-b border-gray-800 overflow-y-auto custom-scrollbar">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> Live Action Triggers
                  </h4>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <button onClick={() => triggerAnim('FOUR', 'config-preview')} className="py-2.5 bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30 rounded-lg hover:bg-blue-500 hover:text-white transition-all text-xs">FOUR (4)</button>
                    <button onClick={() => triggerAnim('SIX', 'config-preview')} className="py-2.5 bg-green-500/10 text-green-400 font-bold border border-green-500/30 rounded-lg hover:bg-green-500 hover:text-white transition-all text-xs">SIX (6)</button>
                    <button onClick={() => triggerAnim('WICKET', 'config-preview')} className="py-2.5 bg-red-500/10 text-red-400 font-bold border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs">OUT (W)</button>
                  </div>

                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-purple-500" /> Full-Screen Graphics (Level 2)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <button onClick={() => triggerAnim('BATTING_CARD', 'config-preview')} className="py-3 bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30 rounded-lg hover:bg-purple-500 hover:text-white transition-all text-xs">Batting Summary</button>
                    <button onClick={() => triggerAnim('BOWLING_CARD', 'config-preview')} className="py-3 bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/30 rounded-lg hover:bg-indigo-500 hover:text-white transition-all text-xs">Bowling Summary</button>
                    <button onClick={() => triggerAnim('BOTH_CARDS', 'config-preview')} className="col-span-2 py-3 bg-fuchsia-500/10 text-fuchsia-400 font-bold border border-fuchsia-500/30 rounded-lg hover:bg-fuchsia-500 hover:text-white transition-all text-xs">Full Match Stats (Both)</button>
                    <button onClick={() => triggerAnim('MATCH_END', 'config-preview')} className="col-span-2 py-3 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30 rounded-lg hover:bg-amber-500 hover:text-white transition-all text-xs">End Match Rotation</button>
                  </div>

                  {/* RESTORE COMMAND */}
                  <button onClick={() => triggerAnim('RESTORE', 'config-preview')} className="w-full py-3 bg-slate-800 text-slate-300 font-black tracking-widest border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    RESTORE LIVE SCOREBOARD
                  </button>
                </div>

                {/* SETTINGS SECTION */}
                <div className="p-5 flex-1 bg-[#0a0a0f]">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400" /> Engine Settings
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Display Name</label>
                      <input type="text" defaultValue={configuringOverlay.name} className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white focus:border-blue-500 outline-none text-sm font-semibold" />
                    </div>
                    
                    {/* Maps to engine.js startupSequence settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">VS Screen (sec)</label>
                        <input type="number" defaultValue={8} className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white focus:border-blue-500 outline-none text-sm text-center font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Toss Screen (sec)</label>
                        <input type="number" defaultValue={6} className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white focus:border-blue-500 outline-none text-sm text-center font-mono" />
                      </div>
                    </div>

                    <button className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                      <Save className="w-4 h-4" /> Save Configuration
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}


      {/* ─── CREATED OVERLAYS SECTION ─── */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <PlaySquare className="text-green-500 w-5 h-5"/> Deployed Overlays
          </h3>
          <button onClick={() => setShowCreate(!showCreate)} className="px-5 py-2.5 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm border border-green-500/30">
            {showCreate ? 'Close Deploy Panel' : 'Deploy New Overlay'}
          </button>
        </div>

        {showCreate && (
           <form onSubmit={handleCreate} className="mb-6 p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col md:flex-row gap-4 shadow-inner">
             <div className="flex-1"><label className="block text-xs font-bold text-gray-400 mb-2">Name</label><input required value={createForm.name} onChange={e=>setCreateForm({...createForm, name: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-gray-800 text-white outline-none" /></div>
             <div className="flex-1"><label className="block text-xs font-bold text-gray-400 mb-2">Match</label>
               <select value={createForm.match} onChange={e => setCreateForm({...createForm, match: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-gray-800 text-white outline-none">
                 <option value="">-- Select Match --</option>
                 {liveMatches.map(m => <option key={m._id} value={m._id}>{m.team1?.name} vs {m.team2?.name}</option>)}
               </select>
             </div>
             <div className="flex-1"><label className="block text-xs font-bold text-gray-400 mb-2">Template</label>
               <select required value={createForm.template} onChange={e=>setCreateForm({...createForm, template: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-gray-800 text-white outline-none">
                 <option value="">-- Choose --</option>
                 {templates.map(t => <option key={t.id} value={getTemplateFilename(t)}>{t.name}</option>)}
               </select>
             </div>
             <button type="submit" className="px-8 py-3.5 bg-green-600 text-white font-black rounded-xl mt-6">Create</button>
           </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {createdOverlays.map(overlay => {
            const isExpired = new Date(overlay.urlExpiresAt).getTime() - Date.now() <= 0;
            return (
              <div key={overlay._id} onClick={() => !isExpired && setActivePreview(overlay)} className={`p-5 rounded-2xl border transition-all cursor-pointer ${isExpired ? 'opacity-75 bg-gray-900 border-red-500/20' : 'bg-gray-900 border-gray-800 hover:border-blue-500/50'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className={`font-bold text-lg ${isExpired ? 'text-red-300' : 'text-white'}`}>{overlay.name}</h4>
                    <p className="text-xs font-mono mt-1 text-blue-400">{getTemplateFilename(overlay)}</p>
                  </div>
                  <CountdownBadge expiresAt={overlay.urlExpiresAt} overlayId={overlay._id} onExpire={handleOverlayExpire} />
                </div>
                
                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-800">
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${apiBaseUrl}/overlays/public/${overlay.publicId}`); addToast({type:'success', message:'URL Copied'}); }} disabled={isExpired} className="flex-1 py-2 bg-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:text-white">Copy Link</button>
                  
                  {/* NEW CONFIG BUTTON */}
                  <button onClick={(e) => { e.stopPropagation(); setConfiguringOverlay(overlay); }} disabled={isExpired} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-blue-400" title="Configure Settings & Triggers"><Settings className="w-4 h-4"/></button>
                  
                  <button onClick={(e) => { e.stopPropagation(); handleRegenerate(overlay._id); }} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-green-400"><RefreshCw className="w-4 h-4"/></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(overlay._id); }} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── LIVE PREVIEW ENGINE RESTORED ─── */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Target className="text-blue-500 w-5 h-5"/>
          <h3 className="text-xl font-bold text-white">Live Preview Engine</h3>
        </div>

        {activePreview ? (
          <div ref={containerRef} className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-blue-500/30 relative" style={{ backgroundImage: 'radial-gradient(#1a1a24 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
             <iframe
                id="main-preview"
                src={generateSecureUrl(activePreview)}
                style={{
                  width: '1920px', height: '1080px',
                  position: 'absolute', top: '50%', left: '50%',
                  transform: `translate(-50%, -50%) scale(${idealScale})`,
                  transformOrigin: 'center center', border: 'none', pointerEvents: 'none'
                }}
             />
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/50">
            <Eye className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-500 font-semibold">Click an overlay above to load the Broadcast Engine</p>
          </div>
        )}
      </div>
    </div>
  );
}