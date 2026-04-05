import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye, Trash2, Copy, X, Settings, ImageOff,
  Timer, Maximize2, Plus, Sparkles, Tag,
  ChevronRight, Star, Building2, Check,
  Monitor, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { overlayAPI, matchAPI } from '../services/api';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { usePreviewScale } from '../hooks/usePreviewScale';

const getTemplateFilename = (t: any): string => {
  if (t.file) return t.file;
  if (t.url) return t.url.split('/').pop() || '';
  if (t.template) return t.template.split('/').pop() || '';
  return `${t.id || 'default'}.html`;
};

interface GlobalConfig {
  tossDuration: number;
  squadDuration: number;
}

interface SponsorConfig {
  sponsors: Array<{ name: string; tagline: string }>;
  showDuration: number;
  position: 'bottom' | 'top';
}

const CountdownBadge = ({ expiresAt, overlayId, onExpire }: { expiresAt: string; overlayId: string; onExpire: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) return;
    const iv = setInterval(() => {
      const rem = new Date(expiresAt).getTime() - Date.now();
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(iv); onExpire(overlayId); }
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresAt, overlayId, onExpire, timeLeft]);

  if (timeLeft <= 0) return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-mono">Expired</span>;
  
  const h = String(Math.floor((timeLeft / 1000 / 60 / 60) % 24)).padStart(2, '0');
  const m = String(Math.floor((timeLeft / 1000 / 60) % 60)).padStart(2, '0');
  const s = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, '0');

  return <span className="px-2 py-1 bg-green-600/80 text-white text-xs rounded-full font-mono">{h}:{m}:{s}</span>;
};

function SettingsModal({
  globalConfig, setGlobalConfig,
  sponsorConfig, setSponsorConfig,
  onSave, onClose
}: {
  globalConfig: GlobalConfig; setGlobalConfig: (c: GlobalConfig) => void;
  sponsorConfig: SponsorConfig; setSponsorConfig: (c: SponsorConfig) => void;
  onSave: () => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<'automation' | 'sponsors'>('automation');

  const addSponsor = () => setSponsorConfig({ ...sponsorConfig, sponsors: [...sponsorConfig.sponsors, { name: '', tagline: '' }] });
  const removeSponsor = (i: number) => setSponsorConfig({ ...sponsorConfig, sponsors: sponsorConfig.sponsors.filter((_, idx) => idx !== i) });
  const updateSponsor = (i: number, field: 'name' | 'tagline', val: string) => {
    const updated = [...sponsorConfig.sponsors];
    updated[i] = { ...updated[i], [field]: val };
    setSponsorConfig({ ...sponsorConfig, sponsors: updated });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-800 bg-[#0d0d14] flex items-center justify-center">
          <h2 className="text-xl font-black text-white">Overlay Settings</h2>
        </div>
        <div className="flex border-b border-gray-800 shrink-0">
          <button onClick={() => setTab('automation')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 ${tab === 'automation' ? 'border-blue-500 text-blue-400' : 'text-gray-500'}`}>Automation</button>
          <button onClick={() => setTab('sponsors')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 ${tab === 'sponsors' ? 'border-blue-500 text-blue-400' : 'text-gray-500'}`}>Sponsors</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'automation' && (
            <div key="automation" className="space-y-4">
              <p className="text-xs text-gray-500">Configure automatic trigger conditions. Stats cards trigger automatically at the end of overs.</p>
              <div className="p-4 border border-dashed border-gray-800 rounded-xl bg-gray-900/50 text-sm space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Auto-trigger toss screen (10s)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Auto-trigger squad screen (30s)</span>
                </label>
              </div>
            </div>
          )}
          {tab === 'sponsors' && (
            <div key="sponsors" className="space-y-4">
              <div className="flex gap-3">
                <button onClick={addSponsor} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">Add Sponsor</button>
              </div>
              {sponsorConfig.sponsors.map((sponsor, i) => (
                <div key={i} className="p-4 border border-gray-800 rounded-xl bg-gray-900/50">
                  <input 
                    value={sponsor.name} 
                    onChange={(e) => updateSponsor(i, 'name', e.target.value)}
                    placeholder="Sponsor name"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-bold"
                  />
                  <input 
                    value={sponsor.tagline} 
                    onChange={(e) => updateSponsor(i, 'tagline', e.target.value)}
                    placeholder="Tagline"
                    className="w-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300"
                  />
                  <button onClick={() => removeSponsor(i)} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-800 flex gap-3 bg-[#0d0d14]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-800 text-gray-400 font-bold text-sm hover:bg-gray-800">Cancel</button>
          <button onClick={onSave} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700">Save Settings</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function OverlayManager({ tournamentId }: { tournamentId?: string }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [createdOverlays, setCreatedOverlays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePreview, setActivePreview] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', template: '', match: '' });
  const [previewZoom, setPreviewZoom] = useState(1);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { idealScale } = usePreviewScale({ containerRef: previewContainerRef });

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(() => {
    const saved = localStorage.getItem('scorex_global_overlay_config');
    return saved ? JSON.parse(saved) : { tossDuration: 10, squadDuration: 30 };
  });

  const [sponsorConfig, setSponsorConfig] = useState<SponsorConfig>(() => {
    const saved = localStorage.getItem('scorex_sponsor_config');
    return saved ? JSON.parse(saved) : { sponsors: [], showDuration: 6, position: 'bottom' };
  });

  const userLevel = (user as any)?.membership?.level || (user as any)?.membershipLevel || 0;
  const isAdmin = user?.role === 'admin';
  const isEligible = userLevel >= 1 || isAdmin;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, oRes, mRes] = await Promise.all([
        overlayAPI.getOverlayTemplates(), 
        overlayAPI.getOverlays(tournamentId || ''),
        tournamentId ? matchAPI.getMatchesByTournament(tournamentId) : matchAPI.getMatches()
      ]);
      setTemplates(Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data || []));
      setCreatedOverlays(Array.isArray(oRes.data) ? oRes.data : (oRes.data?.data || []));
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load overlays' });
    } finally {
      setLoading(false);
    }
  }, [tournamentId, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return addToast({ type: 'error', message: 'Membership required to deploy overlays.' });
    if (!createForm.name || !createForm.template) return addToast({ type: 'error', message: 'Name and template required' });
    try {
      const res = await overlayAPI.createOverlay({ ...createForm, tournamentId: tournamentId || undefined });
      addToast({ type: 'success', message: 'Overlay created' });
      setShowCreate(false);
      setCreateForm({ name: '', template: '', match: '' });
      loadData();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to create overlay' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this overlay permanently?')) return;
    try {
      await overlayAPI.deleteOverlay(id);
      addToast({ type: 'success', message: 'Overlay deleted' });
      if (activePreview?._id === id) setActivePreview(null);
      loadData();
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to delete overlay' });
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('scorex_global_overlay_config', JSON.stringify(globalConfig));
    localStorage.setItem('scorex_sponsor_config', JSON.stringify(sponsorConfig));
    addToast({ type: 'success', message: 'Settings saved' });
    setShowSettings(false);
  };

  const generateOverlayUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    const cfg = encodeURIComponent(JSON.stringify({ ...globalConfig, sponsors: sponsorConfig.sponsors }));
    return `/overlays/${filename}?tournament=${tournamentId || overlay.tournamentId}&config=${cfg}`;
  };

  if (!isEligible) return (
    <div className="py-16 text-center">
      <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-black text-white mb-2">Overlay Engine Locked</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Upgrade to Premium or Enterprise to deploy broadcast overlays for your tournaments.</p>
      <a href="/membership" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-xl hover:shadow-lg">
        <ChevronRight className="w-4 h-4" />
        Upgrade Membership
      </a>
    </div>
  );

  const renderPreviewDirector = () => {
    if (!activePreview) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-[#0a0a0f]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Preview Director</span>
            </div>
            <span className="text-xs text-gray-600 font-mono">— {activePreview.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5">
              <button onClick={() => setPreviewZoom(p => Math.max(0.3, p * 0.9))} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input 
                type="range" 
                min="30" 
                max="200" 
                step="5" 
                value={Math.round(previewZoom * 100)} 
                onChange={(e) => setPreviewZoom(parseFloat(e.target.value) / 100)}
                className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-bold text-gray-400 w-10 text-right">{Math.round(previewZoom * 100)}%</span>
              <button onClick={() => setPreviewZoom(p => Math.min(3, p * 1.1))} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors">
              <Copy className="w-4 h-4" />
              Copy URL
            </button>
            <button onClick={() => { setActivePreview(null); setPreviewZoom(1); }} className="p-2 rounded-xl bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 to-black">
          <div className="w-full max-w-4xl aspect-video relative border-4 border-gray-800 rounded-2xl overflow-hidden shadow-2xl" ref={previewContainerRef}>
            <iframe
              id="main-preview"
              src={generateOverlayUrl(activePreview)}
              style={{ transform: `scale(${previewZoom})`, width: `${1/previewZoom * 100}%`, height: `${1/previewZoom * 100}%` }}
              className="w-full h-full border-0 bg-black rounded-xl"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {showSettings && (
        <SettingsModal 
          globalConfig={globalConfig}
          setGlobalConfig={setGlobalConfig}
          sponsorConfig={sponsorConfig}
          setSponsorConfig={setSponsorConfig}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {renderPreviewDirector()}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Overlay Engine</h1>
            <p className="text-sm text-gray-500">Broadcast quality overlays for your tournaments</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 font-bold transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg transition-all hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            New Overlay
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Overlay
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input 
              value={createForm.name}
              onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
              placeholder="Overlay name"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white font-bold text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
              required
            />
            <select 
              value={createForm.template}
              onChange={(e) => setCreateForm({...createForm, template: e.target.value})}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white font-semibold text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
              required
            >
              <option value="">Select template</option>
              {templates.map(t => (
                <option key={t.id} value={t.template || t.file || t.url}>{t.name || getTemplateFilename(t)}</option>
              ))}
            </select>
            <select 
              value={createForm.match}
              onChange={(e) => setCreateForm({...createForm, match: e.target.value})}
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Select match (optional)</option>
              {/* matches list */}
            </select>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 px-6 border border-gray-700 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-xl hover:shadow-lg shadow-md transition-all">Create Overlay</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} className="aspect-video bg-gray-900 animate-pulse rounded-xl border border-gray-800" />
          ))}
        </div>
      ) : createdOverlays.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-3xl">
          <ImageOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-500 font-bold mb-2">No overlays yet</p>
          <p className="text-gray-600 mb-6">Create your first broadcast overlay above</p>
          <button 
            onClick={() => setShowCreate(true)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg"
          >
            Create First Overlay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {createdOverlays.map((overlay) => (
            <div key={overlay._id} className="group bg-gradient-to-br from-gray-900/50 to-black border border-gray-800 rounded-3xl p-6 hover:border-blue-500/50 hover:shadow-2xl transition-all overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xl text-white line-clamp-1 pr-12">{overlay.name}</h3>
                  {overlay.expiresAt && <CountdownBadge expiresAt={overlay.expiresAt} overlayId={overlay._id!} onExpire={setActivePreview} />}
                </div>
                <p className="text-gray-400 text-sm line-clamp-2">{getTemplateFilename(overlay)}</p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-1 bg-black/80 backdrop-blur-sm p-1.5 rounded-xl">
                <button 
                  onClick={() => setActivePreview(overlay)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4 text-gray-300 hover:text-blue-400" />
                </button>
                <button 
                  onClick={() => handleDelete(overlay._id!)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
