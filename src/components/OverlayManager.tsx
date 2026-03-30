import { useState, useEffect, useRef, useCallback } from 'react';
import OverlayPreviewContainer from './OverlayPreviewContainer';
import { 
  Eye, Save, Trash2, Copy, RefreshCw, X, PlaySquare, 
  Target, ShieldAlert, Timer, Maximize2, Smartphone, ZoomIn, Activity 
} from 'lucide-react';
import { overlayAPI, matchAPI } from '../services/api';
import { getBackendBaseUrl, getApiBaseUrl } from '../services/env';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';

// ─── SAFE EXTRACTOR ────────────────────────────────────────────────────────
const getTemplateFilename = (t: any): string => {
  if (t.file) return t.file;
  if (t.url) return t.url.split('/').pop() || '';
  if (t.template) return t.template.split('/').pop() || '';
  return `${t.id || 'default'}.html`;
};

// ─── ISOLATED COUNTDOWN BADGE (Prevents 1-second root re-renders) ──────────
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
        <span className="text-[11px] font-black font-mono tracking-widest">EXPIRED</span>
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
  
  const [liveMatches, setLiveMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [createdOverlays, setCreatedOverlays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activePreview, setActivePreview] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', template: '', match: '' });
  
  // Mobile Fullscreen Modal State & Stable Refs
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const userLevel = (user as any)?.membership?.level || (user as any)?.membershipLevel || 0;
  const isEligible = userLevel > 0;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tournamentId) {
      fetchLiveMatches();
    }
  }, [tournamentId]);

  const fetchLiveMatches = async () => {
  if (!tournamentId) return;
  setMatchLoading(true);
  try {
    // Fetch ALL matches for this tournament (not just live), so scorer can pick any
    const res = await matchAPI.getMatches({ tournamentId });
    const all = res.data.data || res.data || [];
    setLiveMatches(all);
    const firstLive = all.find((m: any) => m.status === 'live');
    if (firstLive && !createForm.match) {
      setCreateForm(prev => ({ ...prev, match: firstLive._id }));
    }
  } catch (e) {
    console.error('Failed to load matches', e);
  } finally {
    setMatchLoading(false);
  }
};

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, oRes] = await Promise.all([
        overlayAPI.getOverlayTemplates(),
        overlayAPI.getOverlays()
      ]);
      
      const rawTemplates = tRes.data?.data || tRes.data?.templates || tRes.data || [];
      const availableTemplates = rawTemplates.filter((t: any) => userLevel >= (t.level || 1));
      
      setTemplates(availableTemplates);
      setCreatedOverlays(oRes.data?.data || oRes.data || []);
    } catch (e) {
      console.error('Failed to load overlays/templates', e);
    } finally { 
      setLoading(false); 
    }
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
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Creation failed' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Destroy this overlay link permanently?')) return;
    try {
      await overlayAPI.deleteOverlay(id);
      addToast({ type: 'success', message: 'Overlay deleted' });
      if (activePreview?._id === id) {
        setActivePreview(null);
        setIsMobileFullscreen(false);
      }
      loadData();
    } catch (e) { 
      addToast({ type: 'error', message: 'Deletion failed' }); 
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!isEligible) return addToast({ type: 'error', message: 'Active membership required to regenerate URLs.' });
    try {
      await overlayAPI.regenerateOverlay(id);
      addToast({ type: 'success', message: 'URL Regenerated for another 24 hours.' });
      loadData();
    } catch (e) { 
      addToast({ type: 'error', message: 'Regeneration failed' }); 
    }
  };

  // Ejects the preview if the active one expires
  const handleOverlayExpire = useCallback((expiredId: string) => {
    if (activePreview?._id === expiredId) {
      setActivePreview(null);
      setIsMobileFullscreen(false);
      addToast({ type: 'error', message: 'The active preview link has expired.' });
    }
  }, [activePreview, addToast]);

  // Deep animation trigger that bypasses iframe security boundaries
  const triggerAnim = (event: string) => {
    const payload = { type: 'OVERLAY_ACTION', payload: { event } };
    
    // Send to global window
    window.postMessage(payload, '*');
    window.dispatchEvent(new CustomEvent('OVERLAY_ACTION', { detail: { event } }));

    // Send to deep iframe
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage(payload, '*');
      } catch (e) { console.warn("Iframe blocked postMessage"); }
    });
  };

  const handleMobileZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMobileZoom(val);
    const evt = new CustomEvent('scorex:zoom', { detail: { zoom: val }, bubbles: true });
    window.dispatchEvent(evt);
    if (previewContainerRef.current) previewContainerRef.current.dispatchEvent(evt);
  };

  // Memoized dummy callbacks to prevent infinite re-renders
  const dummyRetry = useCallback(() => {}, []);
  const dummySetLoading = useCallback(() => {}, []);
  const dummySetError = useCallback(() => {}, []);

  if (!isEligible) {
    return (
      <div className="p-8 text-center rounded-3xl bg-[var(--bg-card)] border border-red-500/30 shadow-2xl mt-4 mx-2">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-black text-white mb-2">Overlay Engine Locked</h2>
        <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">Upgrade to Premium or Enterprise membership to unlock and deploy live broadcast overlays for your matches.</p>
        <button onClick={() => window.location.href = '/membership'} className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all">View Membership Plans</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4 mx-2">
      {/* ─── CREATED OVERLAYS SECTION ─── */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <PlaySquare className="text-green-500 w-5 h-5"/> Deployed Overlays
          </h3>
          <button onClick={() => setShowCreate(!showCreate)} className="w-full sm:w-auto px-5 py-2.5 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm hover:bg-green-500 hover:text-black transition-all border border-green-500/30">
            {showCreate ? 'Close Deploy Panel' : 'Deploy New Overlay'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="mb-6 p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-4 duration-200 shadow-inner">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Overlay Name</label>
              <input type="text" required value={createForm.name} onChange={e=>setCreateForm({...createForm, name: e.target.value})} placeholder="e.g. Grand Final Scorebug" className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-white outline-none focus:border-green-500 transition-colors" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Live Match (for real scoreboard data)</label>
<select value={createForm.match} onChange={e => setCreateForm({...createForm, match: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-white outline-none focus:border-green-500 transition-colors appearance-none font-semibold">
  <option value="">-- Select a match --</option>
  {liveMatches.map((m: any) => (
    <option key={m._id} value={m._id}>
      {m.name || `${m.team1?.name} vs ${m.team2?.name}`} {m.status === 'live' ? '🔴 LIVE' : `(${m.status})`}
    </option>
  ))}
</select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Select Base Template</label>
              <select required value={createForm.template} onChange={e=>setCreateForm({...createForm, template: e.target.value})} className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-white outline-none focus:border-green-500 transition-colors appearance-none font-semibold">
                <option value="">-- Choose Template --</option>
                {templates.map(t => (
                  <option key={t.id || t.name} value={getTemplateFilename(t)}>
                    {t.name} (Lvl {t.level || 1})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl hover:scale-105 transition-transform shadow-lg">Create Live Overlay</button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {createdOverlays.map(overlay => {
            const isExpired = new Date(overlay.urlExpiresAt).getTime() - Date.now() <= 0;
            const isActive = activePreview?._id === overlay._id;
            
            return (
              <div key={overlay._id} onClick={() => !isExpired && setActivePreview(overlay)}
                className={`p-5 rounded-2xl border transition-all ${isExpired ? 'opacity-75 cursor-not-allowed bg-[var(--bg-elevated)] border-red-500/20' : 'cursor-pointer shadow-sm'} ${isActive ? 'bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-blue-500/50'}`}>
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className={`font-bold text-lg ${isExpired ? 'text-red-300' : 'text-white'}`}>{overlay.name}</h4>
                    <p className={`text-xs font-mono mt-1 truncate max-w-[200px] inline-block px-2 py-0.5 rounded ${isExpired ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {getTemplateFilename(overlay)} {overlay.match && '(Live Match)'}
                    </p>
                  </div>
                  
                  <CountdownBadge 
                    expiresAt={overlay.urlExpiresAt} 
                    overlayId={overlay._id} 
                    onExpire={handleOverlayExpire} 
                  />
                </div>

                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[var(--border)]">
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${apiBaseUrl}/overlays/public/${overlay.publicId}`); addToast({type: 'success', message: 'URL Copied for OBS'}); }} 
                    disabled={isExpired} className="flex-1 py-2.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    <Copy className="w-3.5 h-3.5"/> Copy Link
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleRegenerate(overlay._id); }} 
                    className="flex-1 py-2.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-blue-400 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5"/> Regenerate
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(overlay._id); }} 
                    className="p-2.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            );
          })}
          {createdOverlays.length === 0 && !loading && (
            <div className="col-span-full py-10 text-center border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-elevated)]/50">
              <p className="text-[var(--text-muted)] font-semibold mb-1">No overlays deployed yet.</p>
              <p className="text-xs text-[var(--text-secondary)]">Deploy a template above to generate your live OBS URLs.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── DESKTOP/STANDARD PREVIEW ENGINE ─── */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Target className="text-blue-500 w-5 h-5"/> Live Preview Engine
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">Select an active overlay to view its layout.</p>
          </div>
          
          <select value={getTemplateFilename(activePreview || {})} onChange={e => {
            const tmpl = e.target.value;
            if(!tmpl) return setActivePreview(null);
            
            const existing = createdOverlays.find(o => getTemplateFilename(o) === tmpl);
            if (existing) {
               const isExp = new Date(existing.urlExpiresAt).getTime() - Date.now() <= 0;
               if (!isExp) setActivePreview(existing);
               else addToast({ type: 'error', message: 'That overlay has expired.' });
            } else {
               setActivePreview({ template: tmpl, name: 'Preview Mode', urlExpiresAt: new Date(Date.now() + 86400000).toISOString() });
            }
          }} className="w-full md:w-auto p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white outline-none focus:border-blue-500 min-w-[250px] appearance-none font-semibold shadow-inner">
            <option value="">-- Preview Template --</option>
            {templates.map(t => (
              <option key={`prev-${t.id || t.name}`} value={getTemplateFilename(t)}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {activePreview ? (
          <>
            <div className="w-full aspect-video bg-[#000] rounded-2xl overflow-hidden border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative group">
              <OverlayPreviewContainer
                src={`/overlays/${getTemplateFilename(activePreview)}`}
                title="Preview"
                isPreview={true}

                heightClass="h-full"
                previewContainerRef={previewContainerRef}
                previewIframeRef={previewIframeRef}
                retryLoad={dummyRetry}
                setIframeLoading={dummySetLoading}
                setIframeError={dummySetError} 
                baseUrl={''} />
              {/* Expand Button for Small Screens */}
              <button 
                onClick={() => setIsMobileFullscreen(true)}
                className="md:hidden absolute top-4 right-4 p-3 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/20 shadow-2xl flex items-center gap-2 active:scale-95 transition-all z-10"
              >
                <Maximize2 className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">Full Screen</span>
              </button>
            </div>

            {/* Triggers Bar Restored OUTSIDE the preview iframe */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 p-4 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-inner">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mr-2 sm:mr-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500"/> Triggers:</span>
               <button onClick={() => triggerAnim('FOUR')} className="flex-1 sm:flex-none px-6 py-3 bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm">FOUR (4)</button>
               <button onClick={() => triggerAnim('SIX')} className="flex-1 sm:flex-none px-6 py-3 bg-green-500/10 text-green-400 font-bold border border-green-500/30 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm">SIX (6)</button>
               <button onClick={() => triggerAnim('WICKET')} className="flex-1 sm:flex-none px-6 py-3 bg-red-500/10 text-red-400 font-bold border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">OUT (W)</button>
               <button onClick={() => triggerAnim('DECISION PENDING')} className="w-full sm:w-auto px-6 py-3 bg-amber-500/10 text-amber-500 font-bold border border-amber-500/30 rounded-xl hover:bg-amber-500 hover:text-black transition-all tracking-wide shadow-sm">DECISION PENDING (DP)</button>
            </div>
          </>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-elevated)]/30">
            <Eye className="w-12 h-12 text-[var(--border)] mb-3" />
            <p className="text-[var(--text-muted)] font-semibold">No active overlay selected for preview</p>
          </div>
        )}
      </div>

      {/* ─── MOBILE FULLSCREEN MODAL WITH ZOOM ─── */}
      {isMobileFullscreen && activePreview && (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 bg-[#0a0a0f] border-b border-gray-800 shrink-0 gap-4">
            <div className="text-white font-bold flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-blue-500 animate-pulse" />
              <span className="text-sm">Rotate phone for best view</span>
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 shadow-inner">
                <ZoomIn className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.1"
                  value={mobileZoom}
                  onChange={handleMobileZoomChange}
                  className="w-24 accent-blue-500 cursor-pointer"
                />
                <span className="text-xs text-gray-400 font-mono w-9 text-right">
                  {Math.round(mobileZoom * 100)}%
                </span>
              </div>
              <button onClick={() => { setIsMobileFullscreen(false); setMobileZoom(1); }} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full relative bg-[#000] overflow-hidden flex justify-center items-center">
            <OverlayPreviewContainer
              src={`/overlays/${getTemplateFilename(activePreview)}`}
              title="Preview"
              baseUrl={baseUrl}
              zoom={mobileZoom}
              heightClass="absolute inset-0 w-full h-full"
              previewContainerRef={previewContainerRef}
              previewIframeRef={previewIframeRef}
              retryLoad={dummyRetry}
              setIframeLoading={dummySetLoading}
              setIframeError={dummySetError}
            />
          </div>

          {/* Triggers Bar Restored OUTSIDE the mobile preview iframe */}
          <div className="p-4 bg-[#0a0a0f] border-t border-gray-800 flex overflow-x-auto hide-scrollbar gap-3 shrink-0">
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2 flex items-center gap-2 shrink-0">
               <Activity className="w-4 h-4 text-blue-500"/> Triggers:
             </span>
             <button onClick={() => triggerAnim('FOUR')} className="px-6 py-3.5 bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30 rounded-xl whitespace-nowrap shrink-0 active:scale-95 transition-transform">FOUR (4)</button>
             <button onClick={() => triggerAnim('SIX')} className="px-6 py-3.5 bg-green-500/10 text-green-400 font-bold border border-green-500/30 rounded-xl whitespace-nowrap shrink-0 active:scale-95 transition-transform">SIX (6)</button>
             <button onClick={() => triggerAnim('WICKET')} className="px-6 py-3.5 bg-red-500/10 text-red-400 font-bold border border-red-500/30 rounded-xl whitespace-nowrap shrink-0 active:scale-95 transition-transform">OUT (W)</button>
             <button onClick={() => triggerAnim('DECISION PENDING')} className="px-6 py-3.5 bg-amber-500/10 text-amber-500 font-bold border border-amber-500/30 rounded-xl whitespace-nowrap shrink-0 active:scale-95 transition-transform">DECISION PENDING (DP)</button>
          </div>
        </div>
      )}
    </div>
  );
}

