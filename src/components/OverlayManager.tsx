import { useState, useEffect } from 'react';
import OverlayPreviewContainer from './OverlayPreviewContainer';
import { Eye, Plus, Save, Trash2, Edit, Copy, RefreshCw, ExternalLink, X, AlertCircle, PlaySquare, Target, Activity, ShieldAlert } from 'lucide-react';
import { overlayAPI } from '../services/api';
import { getBackendBaseUrl } from '../services/env';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';

// Safe filename extractor
const getTemplateFilename = (t: any): string => {
  if (t.file) return t.file;
  if (t.url) return t.url.split('/').pop() || '';
  return `${t.id}.html`;
};

export default function OverlayManager({ tournamentId, matches }: { tournamentId?: string, matches?: any[] }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const baseUrl = getBackendBaseUrl();
  
  const [createdOverlays, setCreatedOverlays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activePreview, setActivePreview] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', template: '' });
  
  const userLevel = (user as any)?.membership?.level || (user as any)?.membershipLevel || 0;
  const isEligible = userLevel > 0;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, oRes] = await Promise.all([
        overlayAPI.getOverlayTemplates(),
        overlayAPI.getOverlays()
      ]);
      
      // Safely extract templates whether backend returns {data: []}, {templates: []}, or just []
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
      addToast({ type: 'success', message: 'Overlay deployed successfully' });
      setShowCreate(false);
      setCreateForm({ name: '', template: '' });
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
    } catch (e) { 
      addToast({ type: 'error', message: 'Deletion failed' }); 
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!isEligible) return addToast({ type: 'error', message: 'Active membership required to regenerate URLs.' });
    try {
      await overlayAPI.regenerateOverlay(id);
      addToast({ type: 'success', message: 'URL Regenerated' });
      loadData();
    } catch (e) { 
      addToast({ type: 'error', message: 'Regeneration failed' }); 
    }
  };

  const triggerAnim = (event: string) => {
    window.postMessage({ type: 'OVERLAY_ACTION', payload: { event } }, '*');
  };

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

        {/* Create Overlay Form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="mb-6 p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-4 duration-200 shadow-inner">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Overlay Name</label>
              <input type="text" required value={createForm.name} onChange={e=>setCreateForm({...createForm, name: e.target.value})} placeholder="e.g. Grand Final Scorebug" className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-white outline-none focus:border-green-500 transition-colors" />
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
            <button type="submit" className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl hover:scale-105 transition-transform shadow-lg">Create</button>
          </form>
        )}

        {/* Overlays Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {createdOverlays.map(overlay => {
            const isExpired = new Date(overlay.urlExpiresAt) < new Date();
            const isActive = activePreview?._id === overlay._id;
            return (
              <div key={overlay._id} onClick={() => !isExpired && setActivePreview(overlay)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${isActive ? 'bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-blue-500/50'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-white text-lg">{overlay.name}</h4>
                    <p className="text-xs text-blue-400 font-mono mt-1 truncate max-w-[200px] bg-blue-500/10 inline-block px-2 py-0.5 rounded">{overlay.template}</p>
                  </div>
                  {isExpired 
                    ? <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-[10px] rounded-md font-bold uppercase border border-red-500/30 tracking-wider">Expired</span> 
                    : <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-[10px] rounded-md font-bold uppercase border border-green-500/30 tracking-wider">Active</span>
                  }
                </div>

                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[var(--border)]">
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${baseUrl}/overlays/public/${overlay.publicId}`); addToast({type: 'success', message: 'URL Copied'}); }} 
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

      {/* ─── LIVE PREVIEW ENGINE SECTION ─── */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Target className="text-blue-500 w-5 h-5"/> Live Preview Engine
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">Select an overlay above or from the dropdown to test animations.</p>
          </div>
          
          <select value={activePreview?.template || ''} onChange={e => {
            const tmpl = e.target.value;
            if(!tmpl) return setActivePreview(null);
            setActivePreview({ template: tmpl, name: 'Preview Mode' });
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
            <div className="w-full aspect-video bg-[#000] rounded-2xl overflow-hidden border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
              <OverlayPreviewContainer
                src={`/overlays/${activePreview.template}`}
                title="Preview"
                baseUrl={baseUrl}
                heightClass="h-full"
                previewContainerRef={{ current: null } as any}
                previewIframeRef={{ current: null } as any}
                retryLoad={() => {}}
                setIframeLoading={() => {}}
                setIframeError={() => {}}
              />
            </div>
            
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
            <p className="text-[var(--text-muted)] font-semibold">No overlay selected for preview</p>
          </div>
        )}
      </div>
    </div>
  );
}