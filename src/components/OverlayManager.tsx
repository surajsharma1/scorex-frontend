import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye, Trash2, Copy, X, Settings, Timer, Plus, Sparkles, Tag,
  ChevronRight, Star, ImageOff, Building2, Check, Monitor,
  ZoomIn, ZoomOut, RotateCcw, MonitorPlay, Activity, Lock
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

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://scorex-backend.onrender.com/api/v1';

// ─── Countdown Badge ──────────────────────────────────────────────────────────
const CountdownBadge = ({ expiresAt, overlayId, onExpire }: {
  expiresAt: string; overlayId: string; onExpire: (id: string) => void;
}) => {
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
  tossDuration: number; squadDuration: number; introDuration: number;
  autoBattingOvers: number; autoBowlingOvers: number;
  autoStatsStyle: 'TOGETHER' | 'SEQUENTIAL'; autoStatsDuration: number;
}
interface SponsorConfig {
  sponsors: Array<{ name: string; tagline: string }>;
  showDuration: number; position: 'bottom' | 'top';
}

function SettingsModal({ globalConfig, setGlobalConfig, sponsorConfig, setSponsorConfig, onSave, onClose }: {
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      {/* ✅ Bottom sheet on mobile, centered modal on desktop */}
      <div className="bg-[#0a0a0f] border border-gray-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex justify-between items-center bg-[#0d0d14] shrink-0">
          {/* ✅ Mobile drag indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-700 rounded-full sm:hidden" />
          <div className="flex items-center gap-3 mt-1 sm:mt-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Overlay Settings</h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500">Automations & sponsors</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-all"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 shrink-0">
          <button onClick={() => setTab('automation')} className={`flex-1 py-3 sm:py-3.5 text-sm font-bold border-b-2 ${tab === 'automation' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Automations</button>
          <button onClick={() => setTab('sponsors')} className={`flex-1 py-3 sm:py-3.5 text-sm font-bold border-b-2 ${tab === 'sponsors' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Sponsors</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5">
          {tab === 'automation' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-3">Controls how long animated overlay panels appear during broadcasts.</p>
              {/* ✅ 1 col on mobile, 2 col on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Toss Screen', key: 'tossDuration', unit: 'sec', max: 30 },
                  { label: 'Playing XI', key: 'squadDuration', unit: 'sec', max: 30 },
                  { label: 'Batsman Intro', key: 'introDuration', unit: 'sec', max: 30 },
                  { label: 'Stats Animation', key: 'autoStatsDuration', unit: 'sec', max: 12 },
                ].map(({ label, key, unit, max }) => (
                  <div key={key} className="p-3 sm:p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                    <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" max={max} value={(globalConfig as any)[key]}
                        onChange={e => setGlobalConfig({ ...globalConfig, [key]: Math.min(max, Number(e.target.value)) })}
                        className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all" />
                      <span className="text-xs text-gray-600 font-bold shrink-0">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 sm:p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Batting Card (Every N Overs)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={globalConfig.autoBattingOvers} onChange={e => setGlobalConfig({ ...globalConfig, autoBattingOvers: Number(e.target.value) })} className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                    <span className="text-xs text-gray-600 font-bold shrink-0">ov (0=off)</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Bowling Card (Every N Overs)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={globalConfig.autoBowlingOvers} onChange={e => setGlobalConfig({ ...globalConfig, autoBowlingOvers: Number(e.target.value) })} className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                    <span className="text-xs text-gray-600 font-bold shrink-0">ov (0=off)</span>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">When Both Cards Trigger on Same Over</label>
                <select value={globalConfig.autoStatsStyle} onChange={e => setGlobalConfig({ ...globalConfig, autoStatsStyle: e.target.value as any })}
                  className="w-full p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all">
                  <option value="TOGETHER">Show Both Together</option>
                  <option value="SEQUENTIAL">Sequential (Batting → Bowling)</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'sponsors' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Sponsor Branding</p>
                  <p className="text-xs text-gray-500 mt-0.5">Names shown inside overlay templates.</p>
                </div>
                <button onClick={addSponsor} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-all shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {/* ✅ Duration only (removed position selector — not useful) */}
              <div className="p-3 sm:p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Display Duration</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={sponsorConfig.showDuration} onChange={e => setSponsorConfig({ ...sponsorConfig, showDuration: Number(e.target.value) })} className="w-20 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                  <span className="text-xs text-gray-600 font-bold">seconds each</span>
                </div>
              </div>
              {sponsorConfig.sponsors.length === 0 && (
                <div className="py-8 text-center border border-dashed border-gray-800 rounded-2xl">
                  <Building2 className="w-7 h-7 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No sponsors yet. Tap Add to get started.</p>
                </div>
              )}
              <div className="space-y-2">
                {sponsorConfig.sponsors.map((sp, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-3 h-3 text-amber-400" />
                    </div>
                    <input type="text" placeholder="Sponsor name" value={sp.name} onChange={e => updateSponsor(i, 'name', e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-gray-600 outline-none border-b border-gray-800 focus:border-blue-500 pb-0.5 transition-all" />
                    <input type="text" placeholder="Tagline" value={sp.tagline} onChange={e => updateSponsor(i, 'tagline', e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm text-gray-400 placeholder-gray-700 outline-none border-b border-gray-800 focus:border-blue-500 pb-0.5 transition-all hidden sm:block" />
                    <button onClick={() => removeSponsor(i)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-800 shrink-0 flex gap-3 bg-[#0d0d14]">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-800 text-gray-400 hover:bg-gray-800 font-bold text-sm transition-all">Cancel</button>
          <button onClick={onSave} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
            <Check className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
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
  const [previewProgress, setPreviewProgress] = useState(50);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { idealScale } = usePreviewScale({ containerRef: previewContainerRef });

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(() => {
    try {
      const saved = localStorage.getItem('scorex_global_overlay_config');
      return saved ? JSON.parse(saved) : { tossDuration: 8, squadDuration: 12, introDuration: 12, autoBattingOvers: 2, autoBowlingOvers: 3, autoStatsStyle: 'TOGETHER', autoStatsDuration: 10 };
    } catch { return { tossDuration: 8, squadDuration: 12, introDuration: 12, autoBattingOvers: 2, autoBowlingOvers: 3, autoStatsStyle: 'TOGETHER', autoStatsDuration: 10 }; }
  });

  const [sponsorConfig, setSponsorConfig] = useState<SponsorConfig>(() => {
    try {
      const saved = localStorage.getItem('scorex_sponsor_config');
      return saved ? JSON.parse(saved) : { sponsors: [], showDuration: 6, position: 'bottom' };
    } catch { return { sponsors: [], showDuration: 6, position: 'bottom' }; }
  });

  const userLevel = (user as any)?.membership?.level ?? (user as any)?.membershipLevel ?? 0;
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
    } catch (e) { console.error('loadData error:', e); }
    finally { setLoading(false); }
  }, [tournamentId, userLevel]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return addToast({ type: 'error', message: 'Membership required to deploy overlays.' });
    if (!createForm.name.trim()) return addToast({ type: 'error', message: 'Overlay name is required.' });
    if (!createForm.template) return addToast({ type: 'error', message: 'Please select a template.' });
    const selectedTemplate = templates.find(t => (t.file || t.id) === createForm.template);
    const templateLevel: number = selectedTemplate?.level ?? (createForm.template.startsWith('lvl2') ? 2 : 1);
    if (!isAdmin && templateLevel > userLevel) {
      return addToast({ type: 'error', message: `Enterprise membership (Level ${templateLevel}) required. You are on Level ${userLevel}.` });
    }
    try {
      await overlayAPI.createOverlay({ name: createForm.name.trim(), template: createForm.template, match: createForm.match || undefined, tournamentId, config: globalConfig, requiredMembershipLevel: templateLevel });
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

  const getBaseUrl = () => BACKEND_URL.endsWith('/api/v1') ? BACKEND_URL.replace('/api/v1', '') : BACKEND_URL;

  const generateOverlayUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    const cfg = encodeURIComponent(JSON.stringify({ ...globalConfig, sponsors: sponsorConfig.sponsors }));
    let url = `${getBaseUrl()}/api/v1/overlays/public/${overlay.publicId}?template=${filename}&cfg=${cfg}`;
    if (overlay.match) { const matchId = typeof overlay.match === 'string' ? overlay.match : overlay.match._id; url += `&matchId=${matchId}`; }
    if (tournamentId || overlay.tournamentId) url += `&tournamentId=${tournamentId || overlay.tournamentId}`;
    return url;
  };

  const generatePreviewUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    return `${getBaseUrl()}/api/v1/overlays/public/${overlay.publicId}?template=${filename}&preview=true&progress=${previewProgress}`;
  };

  const triggerAnimation = (eventType: string) => {
    const iframe = document.getElementById('main-preview') as HTMLIFrameElement | null;
    let payload: any = { type: eventType, duration: 8, data: {} };
    if (eventType === 'SHOW_SQUADS') payload.data = { team1Name: 'INDIA', team2Name: 'AUSTRALIA', team1Players: [{ name: 'R. Sharma', role: 'BAT' }, { name: 'V. Kohli', role: 'BAT' }, { name: 'J. Bumrah', role: 'BOWL' }], team2Players: [{ name: 'T. Head', role: 'BAT' }, { name: 'P. Cummins', role: 'BOWL' }, { name: 'M. Starc', role: 'BOWL' }] };
    else if (eventType === 'SHOW_TOSS') payload.data = { text: 'INDIA WON THE TOSS AND CHOSE TO BAT' };
    else if (eventType === 'WICKET') payload.data = { playerName: 'V. Kohli', matches: 280, runs: 12500, sr: 138.5 };
    else if (eventType === 'BATSMAN_CARD') payload.data = { playerName: 'R. Sharma', stat1: '45', stat2: '28', stat3: '4/2' };
    else if (eventType === 'BOWLER_CARD') payload.data = { playerName: 'M. Starc', stat1: '3.0', stat2: '2', stat3: '6.5' };
    iframe?.contentWindow?.postMessage({ type: 'OVERLAY_TRIGGER', payload }, '*');
  };

  if (!isEligible) return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/20"><Sparkles className="w-7 h-7 text-amber-400" /></div>
      <h3 className="text-lg font-black text-white mb-2">Overlay Engine Locked</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Upgrade to Premium or Enterprise to deploy broadcast overlays.</p>
      <a href="/membership" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl shadow-lg text-sm"><ChevronRight className="w-4 h-4" /> Upgrade Membership</a>
    </div>
  );

  // ─── Preview Director ──────────────────────────────────────────────────────
  const renderPreviewDirector = () => {
    if (!activePreview) return null;
    const effectiveScale = idealScale * previewZoom;
    const templateFilename = getTemplateFilename(activePreview);
    const level = templateFilename.startsWith('lvl2') ? '2' : '1';

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-800 bg-[#0a0a0f] shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">Live Overlay Preview</span>
            <span className="text-xs text-gray-600 font-mono truncate hidden sm:inline">— {activePreview.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Zoom */}
            <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg px-1.5 py-1">
              <button onClick={() => setPreviewZoom(z => Math.max(0.1, z * 0.8))} className="p-1 hover:text-white text-gray-500 rounded"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-xs font-bold text-gray-400 w-8 text-center tabular-nums">{Math.round(previewZoom * 100)}%</span>
              <button onClick={() => setPreviewZoom(z => Math.min(3, z * 1.25))} className="p-1 hover:text-white text-gray-500 rounded"><ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPreviewZoom(1)} className="p-1 hover:text-white text-gray-500 rounded"><RotateCcw className="w-3 h-3" /></button>
            </div>
            <button onClick={() => window.open(`/studio?level=${level}&template=/overlays/${templateFilename}`, '_blank')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs">
              <MonitorPlay className="w-3.5 h-3.5" /> Studio
            </button>
            <button onClick={() => { setActivePreview(null); setPreviewZoom(1); }} className="p-2 rounded-xl bg-gray-800 hover:bg-red-500 hover:text-white text-gray-400 transition-all"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#030305] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div ref={previewContainerRef} className="relative w-full border border-gray-800 bg-transparent rounded-xl sm:rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: 'calc(100vh - 200px)' }}>
            <iframe
              id="main-preview"
              key={`${activePreview._id}-${previewProgress}`}
              src={generatePreviewUrl(activePreview)}
              style={{ width: '1920px', height: '1080px', transform: `scale(${effectiveScale})`, transformOrigin: 'top left', border: 'none', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

        {/* ✅ Triggers — scrollable, animation triggers on top row, action triggers below */}
        <div className="shrink-0 border-t border-gray-800 bg-[#0a0a0f]">
          {/* Row 1: Animation / sequence triggers */}
          <div className="px-3 pt-2.5 pb-1 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest shrink-0 mr-1">Sequence:</span>
              {[
                { label: 'VS Screen', type: 'SHOW_VS_SCREEN', color: 'blue' },
                { label: 'Toss', type: 'SHOW_TOSS', color: 'blue' },
                { label: 'Squads XI', type: 'SHOW_SQUADS', color: 'purple' },
                { label: 'Innings Break', type: 'INNINGS_BREAK', color: 'purple' },
                { label: 'Match End', type: 'MATCH_END', color: 'purple' },
              ].map(t => (
                <button key={t.type} onClick={() => triggerAnimation(t.type)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all active:scale-95 whitespace-nowrap ${t.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* Row 2: Live action triggers + Restore */}
          <div className="px-3 pt-1 pb-2.5 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest shrink-0 mr-1">Live:</span>
              {[
                { label: 'FOUR', type: 'FOUR', color: 'green' },
                { label: 'SIX', type: 'SIX', color: 'blue' },
                { label: 'Wicket', type: 'WICKET', color: 'red' },
                { label: 'Batsman Card', type: 'BATSMAN_CARD', color: 'amber' },
                { label: 'Bowler Card', type: 'BOWLER_CARD', color: 'amber' },
                { label: '3rd Umpire', type: 'DECISION_PENDING', color: 'yellow' },
              ].map(t => {
                const cls: Record<string, string> = {
                  green: 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-white',
                  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white',
                  red: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white',
                  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-white',
                  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500 hover:text-white',
                };
                return (
                  <button key={t.type} onClick={() => triggerAnimation(t.type)}
                    className={`px-3 py-1.5 border rounded-lg font-bold text-[11px] transition-all active:scale-95 whitespace-nowrap ${cls[t.color]}`}>
                    {t.label}
                  </button>
                );
              })}
              <button onClick={() => triggerAnimation('SHOW_SCOREBOARD')} className="px-3 py-1.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg font-bold text-[11px] transition-all hover:bg-gray-700 hover:text-white whitespace-nowrap ml-2">
                ↩ Restore Score
              </button>
              <button onClick={() => { navigator.clipboard.writeText(generateOverlayUrl(activePreview)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }} className="px-3 py-1.5 bg-gray-900 text-gray-400 border border-gray-800 rounded-lg font-bold text-[11px] transition-all hover:text-white whitespace-nowrap flex items-center gap-1">
                <Copy className="w-3 h-3" /> OBS URL
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {showSettings && <SettingsModal globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} sponsorConfig={sponsorConfig} setSponsorConfig={setSponsorConfig} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />}
      {renderPreviewDirector()}

      {/* ─── Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20">
            <Monitor className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-black text-[var(--text-primary)] text-sm">Broadcast Overlays</h3>
            <p className="text-[11px] text-[var(--text-muted)]">{createdOverlays.length} deployed · Level {userLevel} access</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-blue-500/40 hover:text-white transition-all text-[var(--text-secondary)] text-sm font-bold">
            <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Settings</span>
            {sponsorConfig.sponsors.length > 0 && <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center border border-amber-500/30">{sponsorConfig.sponsors.length}</span>}
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] shadow-lg transition-all text-black font-black text-sm">
            <Plus className="w-4 h-4" /> Deploy
          </button>
        </div>
      </div>

      {/* Sponsors bar */}
      {sponsorConfig.sponsors.filter(s => s.name).length > 0 && (
        <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl">
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
        <div className="p-4 sm:p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
          <h4 className="font-black text-[var(--text-primary)] text-sm mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-400" /> Deploy New Overlay
          </h4>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            {/* ✅ Stack vertically on mobile */}
            <input type="text" placeholder="Overlay name (e.g. Main Scoreboard)" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all placeholder:text-[var(--text-muted)]" />
            <select value={createForm.template} onChange={e => setCreateForm({ ...createForm, template: e.target.value })}
              className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all">
              <option value="">Select template...</option>
              {templates.map(t => {
                const lvl: number = t.level ?? (t.id?.startsWith('lvl2') ? 2 : 1);
                const allowed = isAdmin || lvl <= userLevel;
                return <option key={t.id || t.file} value={t.file || t.id} disabled={!allowed}>{!allowed ? '🔒 ' : ''}{t.name} {lvl === 2 ? '[Enterprise]' : '[Premium]'}</option>;
              })}
            </select>
            <select value={createForm.match} onChange={e => setCreateForm({ ...createForm, match: e.target.value })}
              className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all">
              <option value="">Select Match (Optional)</option>
              {matches.map(m => <option key={m._id} value={m._id}>{m.team1Name} vs {m.team2Name}</option>)}
            </select>
            {(() => {
              const sel = templates.find(t => (t.file || t.id) === createForm.template);
              const lvl = sel?.level ?? 0;
              if (sel && !isAdmin && lvl > userLevel) return (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" /> Enterprise (Level {lvl}) required. You are on Level {userLevel}.
                </div>
              );
              return null;
            })()}
            <button type="submit" className="w-full sm:w-auto sm:self-start px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-all shadow-lg">Deploy →</button>
          </form>
        </div>
      )}

      {/* ─── Overlay Cards ─── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 sm:h-36 rounded-2xl bg-[var(--bg-card)] animate-pulse border border-[var(--border)]" />)}
        </div>
      ) : createdOverlays.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-[var(--border)] rounded-2xl">
          <ImageOff className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-[var(--text-muted)] mb-1">No overlays deployed yet</p>
          <p className="text-xs text-[var(--text-muted)] opacity-60">Tap "Deploy" to create your first broadcast overlay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {createdOverlays.map(overlay => {
            const filename = getTemplateFilename(overlay);
            const lvl = overlay.level ?? (filename.startsWith('lvl2') ? 2 : 1);
            return (
              <div key={overlay._id} className="group p-4 sm:p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl hover:border-green-500/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h4 className="font-black text-[var(--text-primary)] text-sm truncate">{overlay.name}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${lvl === 2 ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                        {lvl === 2 ? 'Enterprise' : 'Premium'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                      {overlay.match?.team1Name ? `${overlay.match.team1Name} vs ${overlay.match.team2Name}` : 'Global Overlay'}
                    </p>
                  </div>
                  <CountdownBadge expiresAt={overlay.urlExpiresAt} overlayId={overlay._id} onExpire={() => loadData()} />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setActivePreview(overlay)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 text-xs transition-all active:scale-95">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(generateOverlayUrl(overlay)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }}
                    className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white rounded-xl transition-all" title="Copy OBS URL">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(overlay._id)}
                    className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 rounded-xl transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}