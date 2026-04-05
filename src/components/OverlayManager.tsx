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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

  if (timeLeft <= 0) return (
    <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">
      EXPIRED
    </span>
  );
  const h = String(Math.floor((timeLeft / 1000 / 60 / 60) % 24)).padStart(2, '0');
  const m = String(Math.floor((timeLeft / 1000 / 60) % 60)).padStart(2, '0');
  const s = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, '0');
  return (
    <span className="px-2 py-0.5 bg-green-500/15 text-green-400 text-[10px] font-mono font-bold rounded-full border border-green-500/20 flex items-center gap-1">
      <Timer className="w-3 h-3" />{h}:{m}:{s}
    </span>
  );
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

function SettingsModal({
  globalConfig, setGlobalConfig, sponsorConfig, setSponsorConfig, onSave, onClose
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

  return createPortal(
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
          <button onClick={() => setTab('automation')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 ${tab === 'automation' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Automations</button>
          <button onClick={() => setTab('sponsors')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 ${tab === 'sponsors' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Sponsors</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'automation' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-4">These settings control how long animated overlay panels appear on screen during broadcasts.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Toss Screen Duration', key: 'tossDuration', unit: 'sec', max: 30 },
                  { label: 'Playing XI Duration', key: 'squadDuration', unit: 'sec', max: 30 },
                  { label: 'Batsman Intro Duration', key: 'introDuration', unit: 'sec', max: 30 },
                  { label: 'Stats Animation Duration', key: 'autoStatsDuration', unit: 'sec (Max 12)', max: 12 },
                ].map(({ label, key, unit, max }) => (
                  <div key={key} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" max={max} value={(globalConfig as any)[key]}
                        onChange={e => setGlobalConfig({ ...globalConfig, [key]: Math.min(max, Number(e.target.value)) })}
                        className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all" />
                      <span className="text-xs text-gray-600 font-bold">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                <select value={globalConfig.autoStatsStyle} onChange={e => setGlobalConfig({ ...globalConfig, autoStatsStyle: e.target.value as any })}
                  className="w-full p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all">
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
                    <button onClick={() => removeSponsor(i)} className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
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
      return saved ? JSON.parse(saved) : {
        tossDuration: 8, squadDuration: 12, introDuration: 12,
        autoBattingOvers: 2, autoBowlingOvers: 3,
        autoStatsStyle: 'TOGETHER', autoStatsDuration: 10
      };
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
    } catch (e) {
      console.error('loadData error:', e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, userLevel]);

  useEffect(() => { loadData(); }, [loadData]);

  // ✅ handleCreate: level guard + sends requiredMembershipLevel to backend
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return addToast({ type: 'error', message: 'Membership required to deploy overlays.' });
    if (!createForm.name.trim()) return addToast({ type: 'error', message: 'Overlay name is required.' });
    if (!createForm.template) return addToast({ type: 'error', message: 'Please select a template.' });

    const selectedTemplate = templates.find(t => (t.file || t.id) === createForm.template);
    const templateLevel: number = selectedTemplate?.level ?? (createForm.template.startsWith('lvl2') ? 2 : 1);

    // ✅ Block level 1 user from creating level 2 overlay on the frontend too
    if (!isAdmin && templateLevel > userLevel) {
      return addToast({
        type: 'error',
        message: `This template requires Enterprise membership (Level ${templateLevel}). You are on Level ${userLevel}.`
      });
    }

    try {
      await overlayAPI.createOverlay({
        name: createForm.name.trim(),
        template: createForm.template,
        match: createForm.match || undefined,
        tournamentId,
        config: globalConfig,
        requiredMembershipLevel: templateLevel, // ✅ Always send level to backend
      });
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

  // ✅ generateOverlayUrl: NO preview=true — real overlays must fetch live data
const generateOverlayUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    const baseUrl = BACKEND_URL.endsWith('/api/v1') ? BACKEND_URL.replace('/api/v1', '') : BACKEND_URL;
    const cfg = encodeURIComponent(JSON.stringify({ ...globalConfig, sponsors: sponsorConfig.sponsors }));
    let url = `${baseUrl}/api/v1/overlays/o/pub/${overlay.publicId}?template=${filename}&cfg=${cfg}`;
    if (overlay.match) {
      const matchId = typeof overlay.match === 'string' ? overlay.match : overlay.match._id;
      url += `&matchId=${matchId}`;
    }
    if (tournamentId || overlay.tournamentId) {
      url += `&tournamentId=${tournamentId || overlay.tournamentId}`;
    }
    return url;
  };

  // ✅ Preview URL: goes through backend with preview=true so it gets injected demo data
const generatePreviewUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    const baseUrl = BACKEND_URL.endsWith('/api/v1') ? BACKEND_URL.replace('/api/v1', '') : BACKEND_URL;
    return `${baseUrl}/api/v1/overlays/o/pub/${overlay.publicId}?template=${filename}&preview=true&progress=${previewProgress}`;
  };

  // ✅ OBS URL: full backend URL for direct iframe embedding in OBS
  const generateObsUrl = (overlay: any) => {
    return generateOverlayUrl(overlay);
  };

  // ─── Trigger animation in preview iframe ──────────────────────────────────
  const triggerAnimation = (eventType: string) => {
    const iframe = document.getElementById('main-preview') as HTMLIFrameElement | null;
    let payload: any = { type: eventType, duration: 8, data: {} };
    if (eventType === 'SHOW_SQUADS') {
      payload.data = {
        team1Name: 'INDIA', team2Name: 'AUSTRALIA',
        team1Players: [{ name: 'R. Sharma', role: 'BAT' }, { name: 'V. Kohli', role: 'BAT' }, { name: 'J. Bumrah', role: 'BOWL' }],
        team2Players: [{ name: 'T. Head', role: 'BAT' }, { name: 'P. Cummins', role: 'BOWL' }, { name: 'M. Starc', role: 'BOWL' }]
      };
    } else if (eventType === 'SHOW_TOSS') {
      payload.data = { text: 'INDIA WON THE TOSS AND CHOSE TO BAT' };
    } else if (eventType === 'WICKET') {
      payload.data = { playerName: 'V. Kohli', matches: 280, runs: 12500, sr: 138.5 };
    } else if (eventType === 'BATSMAN_CARD') {
      payload.data = { playerName: 'R. Sharma', stat1: '45', stat2: '28', stat3: '4/2' };
    } else if (eventType === 'BOWLER_CARD') {
      payload.data = { playerName: 'M. Starc', stat1: '3.0', stat2: '2', stat3: '6.5' };
    } else if (eventType === 'MANHATTAN') {
      payload.data = { runsPerOver: [5, 12, 4, 8, 16, 2, 7, 14] };
    }
    iframe?.contentWindow?.postMessage({ type: 'OVERLAY_TRIGGER', payload }, '*');
  };

  // ─── Not eligible screen ──────────────────────────────────────────────────
  if (!isEligible) return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
        <Sparkles className="w-7 h-7 text-amber-400" />
      </div>
      <h3 className="text-lg font-black text-white mb-2">Overlay Engine Locked</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Upgrade to Premium or Enterprise to deploy broadcast overlays for your tournaments.
      </p>
      <a href="/membership" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl shadow-lg text-sm">
        <ChevronRight className="w-4 h-4" /> Upgrade Membership
      </a>
    </div>
  );

  // ─── Preview Director Modal ────────────────────────────────────────────────
  const renderPreviewDirector = () => {
    if (!activePreview) return null;
    const effectiveScale = idealScale * previewZoom;
    const templateFilename = getTemplateFilename(activePreview);
    const level = templateFilename.startsWith('lvl2') ? '2' : '1';

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-800 bg-[#0a0a0f] shrink-0">
          {/* Left: title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">Preview Director</span>
            <span className="text-xs text-gray-600 font-mono truncate">— {activePreview.name}</span>
          </div>

          {/* Right: controls */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {/* Progress */}
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5">
              <label className="text-[10px] text-gray-500 font-bold whitespace-nowrap">Progress:</label>
              <input type="range" min="0" max="100" step="4" value={previewProgress}
                onChange={e => setPreviewProgress(Number(e.target.value))}
                className="w-20 h-1.5 accent-green-500 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              <span className="text-xs font-bold text-green-400 w-8 text-right tabular-nums">{previewProgress}%</span>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5">
              <button onClick={() => setPreviewZoom(z => Math.max(0.1, z * 0.8))} className="p-1 hover:text-white text-gray-500 rounded"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-xs font-bold text-gray-400 w-9 text-center tabular-nums">{Math.round(previewZoom * 100)}%</span>
              <button onClick={() => setPreviewZoom(z => Math.min(3, z * 1.25))} className="p-1 hover:text-white text-gray-500 rounded"><ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPreviewZoom(1)} className="p-1 hover:text-white text-gray-500 rounded"><RotateCcw className="w-3.5 h-3.5" /></button>
            </div>

            {/* Full Studio */}
            <button
              onClick={() => window.open(`/studio?level=${level}&template=/overlays/${templateFilename}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors text-sm"
            >
              <MonitorPlay className="w-4 h-4" /> Full Studio
            </button>

            {/* Copy OBS URL */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateOverlayUrl(activePreview));
                addToast({ type: 'success', message: 'OBS URL Copied!' });
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              <Copy className="w-3.5 h-3.5" /> Copy OBS URL
            </button>

            {/* Close */}
            <button onClick={() => { setActivePreview(null); setPreviewZoom(1); setPreviewProgress(50); }}
              className="p-2 rounded-xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas — aspect-ratio based, mobile-safe */}
        <div className="flex-1 bg-[#030305] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div
            ref={previewContainerRef}
            className="relative w-full border border-gray-800 bg-black rounded-2xl shadow-2xl overflow-hidden"
            style={{ aspectRatio: '16/9', maxHeight: 'calc(100vh - 220px)' }}
          >
            <iframe
              id="main-preview"
              key={`${activePreview._id}-${previewProgress}`}
              src={generatePreviewUrl(activePreview)}
              style={{
                width: '1920px', height: '1080px',
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
                border: 'none', position: 'absolute', top: 0, left: 0,
              }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

        {/* Advanced Triggers */}
        <div className="shrink-0 px-4 pb-4 pt-2 overflow-x-auto">
          <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800 shadow-inner min-w-[360px]">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Advanced Triggers:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => triggerAnimation('SHOW_SQUADS')} className="p-3 bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30 rounded-xl hover:bg-purple-500 hover:text-white transition-all text-xs">Full Squads</button>
              <button onClick={() => triggerAnimation('SHOW_TOSS')} className="p-3 bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30 rounded-xl hover:bg-purple-500 hover:text-white transition-all text-xs">Toss Result</button>
              <button onClick={() => triggerAnimation('FOUR')} className="p-3 bg-green-500/10 text-green-400 font-bold border border-green-500/30 rounded-xl hover:bg-green-500 hover:text-white transition-all text-xs">FOUR (4)</button>
              <button onClick={() => triggerAnimation('SIX')} className="p-3 bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30 rounded-xl hover:bg-blue-500 hover:text-white transition-all text-xs">SIX (6)</button>
              <button onClick={() => triggerAnimation('WICKET')} className="p-3 bg-red-500/10 text-red-400 font-bold border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs">Wicket & Career</button>
              <button onClick={() => triggerAnimation('BATSMAN_CARD')} className="p-3 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30 rounded-xl hover:bg-amber-500 hover:text-white transition-all text-xs">Batsman Summary</button>
              <button onClick={() => triggerAnimation('BOWLER_CARD')} className="p-3 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30 rounded-xl hover:bg-amber-500 hover:text-white transition-all text-xs">Bowler Summary</button>
              <button onClick={() => triggerAnimation('MANHATTAN')} className="p-3 bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/30 rounded-xl hover:bg-indigo-500 hover:text-white transition-all text-xs">Manhattan Graph</button>
              <button onClick={() => triggerAnimation('DECISION_PENDING')} className="col-span-2 p-3 bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/30 rounded-xl hover:bg-yellow-500 hover:text-white transition-all text-xs">Decision Pending</button>
              <button onClick={() => triggerAnimation('SHOW_SCOREBOARD')} className="col-span-2 p-3 bg-slate-500/10 text-slate-400 font-bold border border-slate-500/30 rounded-xl hover:bg-slate-500 hover:text-white transition-all text-xs">Restore Scoreboard</button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-5">
      {showSettings && (
        <SettingsModal
          globalConfig={globalConfig} setGlobalConfig={setGlobalConfig}
          sponsorConfig={sponsorConfig} setSponsorConfig={setSponsorConfig}
          onSave={handleSaveSettings} onClose={() => setShowSettings(false)}
        />
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
            <p className="text-[11px] text-[var(--text-muted)]">{createdOverlays.length} deployed · Level {userLevel} access</p>
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

      {/* ─── Active Sponsors ─── */}
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
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Overlay name (e.g. Main Scoreboard)"
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                className="flex-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all placeholder:text-[var(--text-muted)]"
              />

              {/* ✅ Template select with level badge + disabled for locked templates */}
              <select
                value={createForm.template}
                onChange={e => setCreateForm({ ...createForm, template: e.target.value })}
                className="flex-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all"
              >
                <option value="">Select template...</option>
                {templates.map(t => {
                  const lvl: number = t.level ?? (t.id?.startsWith('lvl2') ? 2 : 1);
                  const allowed = isAdmin || lvl <= userLevel;
                  return (
                    <option key={t.id || t.file} value={t.file || t.id} disabled={!allowed}>
                      {!allowed ? '🔒 ' : ''}{t.name} {lvl === 2 ? '[Enterprise]' : '[Premium]'}
                    </option>
                  );
                })}
              </select>

              <select
                value={createForm.match}
                onChange={e => setCreateForm({ ...createForm, match: e.target.value })}
                className="flex-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all"
              >
                <option value="">Select Match (Optional)</option>
                {matches.map(m => <option key={m._id} value={m._id}>{m.team1Name} vs {m.team2Name}</option>)}
              </select>
            </div>

            {/* Level warning if selected template is above user level */}
            {(() => {
              const sel = templates.find(t => (t.file || t.id) === createForm.template);
              const lvl = sel?.level ?? 0;
              if (sel && !isAdmin && lvl > userLevel) {
                return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    This template requires Enterprise (Level {lvl}) membership. You are on Level {userLevel}.
                  </div>
                );
              }
              return null;
            })()}

            <button
              type="submit"
              className="self-start px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-all shadow-lg whitespace-nowrap"
            >
              Deploy →
            </button>
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
          {createdOverlays.map(overlay => {
            const filename = getTemplateFilename(overlay);
            const lvl = overlay.level ?? (filename.startsWith('lvl2') ? 2 : 1);
            return (
              <div key={overlay._id} className="group p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl hover:border-green-500/30 transition-all hover:shadow-lg hover:shadow-green-500/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
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
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setActivePreview(overlay)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 text-xs transition-all hover:scale-[1.02] shadow-md shadow-blue-500/20"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(generateOverlayUrl(overlay)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }}
                    className="p-2 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white rounded-xl transition-all hover:border-gray-600"
                    title="Copy OBS URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(overlay._id)}
                    className="p-2 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Delete overlay"
                  >
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