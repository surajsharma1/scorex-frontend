import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye, Trash2, Copy, X, Settings,
  Timer, Maximize2, Plus, Sparkles, Tag,
  ChevronRight, Star, ImageOff, Building2, Check,
  Monitor, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { overlayAPI, matchAPI } from '../services/api';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { usePreviewScale } from '../hooks/usePreviewScale';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTemplateFilename = (t: any): string => {
  if (t.file) return t.file;
  if (t.url) return t.url.split('/').pop() || '';
  if (t.template) return t.template.split('/').pop() || '';
  return `${t.id || 'default'}.html`;
};

// ─── Countdown Badge ──────────────────────────────────────────────────────────
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

  if (timeLeft <= 0) return <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">EXPIRED</span>;
  const h = String(Math.floor((timeLeft / 1000 / 60 / 60) % 24)).padStart(2, '0');
  const m = String(Math.floor((timeLeft / 1000 / 60) % 60)).padStart(2, '0');
  const s = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, '0');
  return <span className="px-2 py-0.5 bg-green-500/15 text-green-400 text-[10px] font-mono font-bold rounded-full border border-green-500/20 flex items-center gap-1"><Timer className="w-3 h-3" />{h}:{m}:{s}</span>;
};

// ─── Settings Modal ────────────────────────────────────────────────────────────
interface GlobalConfig {
  tossDuration: number;
  squadDuration: number;
  introDuration: number;
  autoBattingOvers: number;
  autoBowlingOvers: number;
  autoStatsStyle: 'TOGETHER' | 'SEQUENTIAL';
  autoStatsDuration: number;
}

interface SponsorConfig {
  sponsors: Array<{ name: string; tagline: string }>;
  showDuration: number;
  position: 'bottom' | 'top';
}

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
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0d0d14] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Overlay Settings</h3>
              <p className="text-[11px] text-gray-500">Configure automations & sponsors</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-all"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 shrink-0">
          <button onClick={() => setTab('automation')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 ${tab === 'automation' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            Automations
          </button>
          <button onClick={() => setTab('sponsors')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 ${tab === 'sponsors' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            Sponsors
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'automation' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-4">These settings control how long animated overlay panels appear on screen during broadcasts.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Standard Timers */}
                {[
                  { label: 'Toss Screen Duration', key: 'tossDuration', unit: 'sec', max: 30 },
                  { label: 'Playing XI Duration', key: 'squadDuration', unit: 'sec', max: 30 },
                  { label: 'Batsman Intro Duration', key: 'introDuration', unit: 'sec', max: 30 },
                  { label: 'Stats Animation Duration', key: 'autoStatsDuration', unit: 'sec (Max 12)', max: 12 },
                ].map(({ label, key, unit, max }) => (
                  <div key={key} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={max}
                        value={(globalConfig as any)[key]}
                        onChange={e => setGlobalConfig({ ...globalConfig, [key]: Math.min(max, Number(e.target.value)) })}
                        className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                      />
                      <span className="text-xs text-gray-600 font-bold">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Independent Over Controls */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Batting Card Trigger</label>
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-gray-500">Every</span>
                     <input type="number" min="0" value={globalConfig.autoBattingOvers} onChange={e => setGlobalConfig({ ...globalConfig, autoBattingOvers: Number(e.target.value) })} className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                     <span className="text-xs text-gray-600 font-bold">Overs <span className="font-normal text-gray-500">(0 = Off)</span></span>
                  </div>
                </div>

                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Bowling Card Trigger</label>
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-gray-500">Every</span>
                     <input type="number" min="0" value={globalConfig.autoBowlingOvers} onChange={e => setGlobalConfig({ ...globalConfig, autoBowlingOvers: Number(e.target.value) })} className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                     <span className="text-xs text-gray-600 font-bold">Overs <span className="font-normal text-gray-500">(0 = Off)</span></span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">When Both Trigger on Same Over</label>
                <select
                  value={globalConfig.autoStatsStyle}
                  onChange={e => setGlobalConfig({ ...globalConfig, autoStatsStyle: e.target.value as any })}
                  className="w-full p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                >
                  <option value="TOGETHER">Show Both Cards Together</option>
                  <option value="SEQUENTIAL">Show Sequentially (Batting, then Bowling)</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'sponsors' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Sponsor Branding</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sponsor names shown inside overlay templates that support it.</p>
                </div>
                <button onClick={addSponsor} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-all">
                  <Plus className="w-3.5 h-3.5" /> Add Sponsor
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Display Duration</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={sponsorConfig.showDuration} onChange={e => setSponsorConfig({ ...sponsorConfig, showDuration: Number(e.target.value) })} className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                    <span className="text-xs text-gray-600 font-bold">sec</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Position</label>
                  <select value={sponsorConfig.position} onChange={e => setSponsorConfig({ ...sponsorConfig, position: e.target.value as 'top' | 'bottom' })} className="w-full p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500">
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                  </select>
                </div>
              </div>

              {sponsorConfig.sponsors.length === 0 && (
                <div className="py-10 text-center border border-dashed border-gray-800 rounded-2xl">
                  <Building2 className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No sponsors added yet.</p>
                </div>
              )}

              <div className="space-y-3">
                {sponsorConfig.sponsors.map((sp, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-900/60 border border-gray-800 rounded-xl group hover:border-gray-700 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <input type="text" placeholder="Sponsor Name" value={sp.name} onChange={e => updateSponsor(i, 'name', e.target.value)} className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none border-b border-gray-800 focus:border-blue-500 pb-0.5 transition-all" />
                    <input type="text" placeholder="Tagline (optional)" value={sp.tagline} onChange={e => updateSponsor(i, 'tagline', e.target.value)} className="flex-1 bg-transparent text-sm text-gray-400 placeholder-gray-700 outline-none border-b border-gray-800 focus:border-blue-500 pb-0.5 transition-all" />
                    <button onClick={() => removeSponsor(i)} className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 shrink-0 flex gap-3 bg-[#0d0d14]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:bg-gray-800 font-bold text-sm transition-all">Cancel</button>
          <button onClick={onSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
            <Check className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ─── Main OverlayManager ───────────────────────────────────────────────────────
export default function OverlayManager({ tournamentId }: { tournamentId?: string }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [createdOverlays, setCreatedOverlays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePreview, setActivePreview] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', template: '', match: '' });
  const [previewZoom, setPreviewZoom] = useState(1);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { idealScale } = usePreviewScale({ containerRef: previewContainerRef });

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(() => {
    const saved = localStorage.getItem('scorex_global_overlay_config');
    return saved ? JSON.parse(saved) : { 
      tossDuration: 8, squadDuration: 12, introDuration: 12, 
      autoBattingOvers: 2, autoBowlingOvers: 3, 
      autoStatsStyle: 'TOGETHER', autoStatsDuration: 10 
    };
  });

  const [sponsorConfig, setSponsorConfig] = useState<SponsorConfig>(() => {
    const saved = localStorage.getItem('scorex_sponsor_config');
    return saved ? JSON.parse(saved) : { sponsors: [], showDuration: 6, position: 'bottom' };
  });

  const userLevel = (user as any)?.membership?.level || (user as any)?.membershipLevel || 0;
  const isAdmin = user?.role === 'admin';
  const isEligible = userLevel > 0 || isAdmin;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, oRes, mRes] = await Promise.all([
        overlayAPI.getOverlayTemplates(), 
        overlayAPI.getOverlays(tournamentId!),
        tournamentId ? matchAPI.getMatchesByTournament(tournamentId) : matchAPI.getMatches()
      ]);
      setTemplates(Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data || []));
      setCreatedOverlays(oRes.data?.data || oRes.data || []);
      setMatches(mRes.data?.data || mRes.data || []);
    } catch (e) {} finally { setLoading(false); }
  }, [tournamentId, userLevel]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return addToast({ type: 'error', message: 'Membership required to deploy overlays.' });
    if (!createForm.name || !createForm.template) return addToast({ type: 'error', message: 'Name and template required.' });
    try {
      await overlayAPI.createOverlay({ ...createForm, tournamentId, config: globalConfig });
      addToast({ type: 'success', message: 'Overlay deployed!' });
      setShowCreate(false);
      setCreateForm({ name: '', template: '', match: '' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Creation failed' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this overlay permanently?')) return;
    try {
      await overlayAPI.deleteOverlay(id);
      addToast({ type: 'success', message: 'Overlay deleted' });
      if (activePreview?._id === id) setActivePreview(null);
      loadData();
    } catch (e) {}
  };

  const handleSaveSettings = () => {
    localStorage.setItem('scorex_global_overlay_config', JSON.stringify(globalConfig));
    localStorage.setItem('scorex_sponsor_config', JSON.stringify(sponsorConfig));
    addToast({ type: 'success', message: 'Settings saved!' });
    setShowSettings(false);
  };

  const generateOverlayUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    const expTime = overlay.urlExpiresAt ? new Date(overlay.urlExpiresAt).getTime() : Date.now() + 86400000;
    const cfg = encodeURIComponent(JSON.stringify({ ...globalConfig, sponsors: sponsorConfig.sponsors }));
    
    // Explicitly append matchId if the overlay has one
    let url = `/overlays/${filename}?tournament=${tournamentId || overlay.tournamentId}&exp=${expTime}&preview=true&cfg=${cfg}`;
    if (overlay.match) {
        const matchId = typeof overlay.match === 'string' ? overlay.match : overlay.match._id;
        url += `&matchId=${matchId}`;
    }
    
    return url;
  };

  if (!isEligible) return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
        <Sparkles className="w-7 h-7 text-amber-400" />
      </div>
      <h3 className="text-lg font-black text-white mb-2">Overlay Engine Locked</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Upgrade to Premium or Enterprise to deploy broadcast overlays for your tournaments.</p>
      <a href="/membership" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl shadow-lg text-sm">
        <ChevronRight className="w-4 h-4" /> Upgrade Membership
      </a>
    </div>
  );

  // ─── Preview Director Modal mapped via Portal to stay above Sidebar ───
  const renderPreviewDirector = () => {
    if (!activePreview) return null;
    const effectiveScale = idealScale * previewZoom;

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-[#0a0a0f] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Preview Director</span>
            </div>
            <span className="text-xs text-gray-600 font-mono">— {activePreview.name}</span>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Zoom slider directly in the preview director */}
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1">
              <ZoomOut className="w-3.5 h-3.5 text-gray-400" />
              <input 
                type="range" min="30" max="250" 
                value={Math.round(previewZoom * 100)} 
                onChange={e => setPreviewZoom(Number(e.target.value) / 100)} 
                className="w-24 h-1 accent-blue-500 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-400 w-10 text-right">{Math.round(previewZoom * 100)}%</span>
              <button onClick={() => setPreviewZoom(1)} className="ml-1 p-1 hover:text-white text-gray-500"><RotateCcw className="w-3.5 h-3.5" /></button>
            </div>

            <button
              onClick={() => { navigator.clipboard.writeText(window.location.origin + generateOverlayUrl(activePreview)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all"
            >
              <Copy className="w-3.5 h-3.5" /> Copy OBS URL
            </button>
            <button onClick={() => { setActivePreview(null); setPreviewZoom(1); }} className="p-2 rounded-xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#030305] flex items-center justify-center p-4 overflow-hidden relative">
          <div ref={previewContainerRef} className="relative w-full h-full max-w-6xl flex items-center justify-center overflow-hidden border border-gray-800 bg-black rounded-2xl shadow-2xl">
            <iframe
              id="main-preview"
              src={generateOverlayUrl(activePreview)}
              style={{ width: '1920px', height: '1080px', transform: `scale(${effectiveScale})`, transformOrigin: 'center center', border: 'none', position: 'absolute' }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-5">
      {showSettings && (
        <SettingsModal globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} sponsorConfig={sponsorConfig} setSponsorConfig={setSponsorConfig} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />
      )}

      {renderPreviewDirector()}

      {/* ─── Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20">
            <Monitor className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-black text-[var(--text-primary)] text-sm">Broadcast Overlays</h3>
            <p className="text-[11px] text-[var(--text-muted)]">{createdOverlays.length} deployed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-blue-500/40 hover:text-white transition-all text-[var(--text-secondary)] text-sm font-bold">
            <Settings className="w-4 h-4" /> Settings
            {sponsorConfig.sponsors.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center border border-amber-500/30">
                {sponsorConfig.sponsors.length}
              </span>
            )}
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] shadow-lg hover:shadow-green-500/20 transition-all text-black font-black text-sm">
            <Plus className="w-4 h-4" /> Deploy Overlay
          </button>
        </div>
      </div>

      {/* ─── Active Sponsors Preview ─── */}
      {sponsorConfig.sponsors.filter(s => s.name).length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
          <Tag className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-amber-400 shrink-0">Sponsors:</span>
            {sponsorConfig.sponsors.filter(s => s.name).map((sp, i) => (
              <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[11px] font-bold rounded-full border border-amber-500/20 shrink-0">{sp.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Create Form ─── */}
      {showCreate && (
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
          <h4 className="font-black text-[var(--text-primary)] text-sm mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-400" /> Deploy New Overlay
          </h4>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Overlay name (e.g. Main Scoreboard)" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="flex-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all placeholder:text-[var(--text-muted)]" />
            <select value={createForm.template} onChange={e => setCreateForm({ ...createForm, template: e.target.value })} className="flex-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all">
              <option value="">Select template...</option>
              {templates.map(t => <option key={t.id || t.file} value={t.file || t.id}>{t.name}</option>)}
            </select>
            <select value={createForm.match} onChange={e => setCreateForm({ ...createForm, match: e.target.value })} className="flex-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all">
              <option value="">Select Match (Optional)</option>
              {matches.map(m => <option key={m._id} value={m._id}>{m.team1Name} vs {m.team2Name}</option>)}
            </select>
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-all shadow-lg whitespace-nowrap">Deploy →</button>
          </form>
        </div>
      )}

      {/* ─── Overlay Cards ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-2xl bg-[var(--bg-card)] animate-pulse border border-[var(--border)]" />)}
        </div>
      ) : createdOverlays.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-[var(--border)] rounded-2xl">
          <ImageOff className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-[var(--text-muted)] mb-1">No overlays deployed yet</p>
          <p className="text-xs text-[var(--text-muted)] opacity-60">Click "Deploy Overlay" to create your first broadcast overlay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {createdOverlays.map(overlay => (
            <div key={overlay._id} className="group p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl hover:border-green-500/30 transition-all hover:shadow-lg hover:shadow-green-500/5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-[var(--text-primary)] text-sm truncate">{overlay.name}</h4>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono truncate mt-0.5">
                    {overlay.match?.team1Name ? `${overlay.match.team1Name} vs ${overlay.match.team2Name}` : 'Global Overlay'}
                  </p>
                </div>
                <CountdownBadge expiresAt={overlay.urlExpiresAt} overlayId={overlay._id} onExpire={() => loadData()} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setActivePreview(overlay)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 text-xs transition-all hover:scale-[1.02] shadow-md shadow-blue-500/20"><Eye className="w-3.5 h-3.5" /> Preview</button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + generateOverlayUrl(overlay)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }} className="p-2 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white rounded-xl transition-all hover:border-gray-600" title="Copy OBS URL"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(overlay._id)} className="p-2 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 rounded-xl transition-all" title="Delete overlay"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}