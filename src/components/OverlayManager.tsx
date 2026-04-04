import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Eye, Trash2, Copy, X, PlaySquare, Settings,
  Timer, Globe, Maximize2, Plus, Sparkles, Tag,
  ChevronRight, Star, ImageOff, Building2, Check,
  RefreshCw, Zap, Monitor
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
  const m = String(Math.floor((timeLeft / 1000 / 60) % 60)).padStart(2, '0');
  const s = String(Math.floor((timeLeft / 1000) % 60)).padStart(2, '0');
  return <span className="px-2 py-0.5 bg-green-500/15 text-green-400 text-[10px] font-mono font-bold rounded-full border border-green-500/20 flex items-center gap-1"><Timer className="w-3 h-3" />{m}:{s}</span>;
};

// ─── Settings Modal ────────────────────────────────────────────────────────────
interface GlobalConfig {
  tossDuration: number;
  squadDuration: number;
  introDuration: number;
  autoStatsOvers: number;
  autoStatsType: string;
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

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
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
          {[
            { id: 'automation', label: 'Automations', icon: Zap },
            { id: 'sponsors', label: 'Sponsors', icon: Building2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all border-b-2 ${
                tab === id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'automation' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-4">These settings control how long animated overlay panels appear on screen during broadcasts.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Toss Screen Duration', key: 'tossDuration', unit: 'sec' },
                  { label: 'Playing XI Duration', key: 'squadDuration', unit: 'sec' },
                  { label: 'Batsman Intro Duration', key: 'introDuration', unit: 'sec' },
                  { label: 'Auto-Stats Every N Overs', key: 'autoStatsOvers', unit: 'overs' },
                  { label: 'Auto-Stats Duration', key: 'autoStatsDuration', unit: 'sec' },
                ].map(({ label, key, unit }) => (
                  <div key={key} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={(globalConfig as any)[key]}
                        onChange={e => setGlobalConfig({ ...globalConfig, [key]: Number(e.target.value) })}
                        className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                      />
                      <span className="text-xs text-gray-600 font-bold">{unit}</span>
                    </div>
                  </div>
                ))}
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-all">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Auto-Stats Layout</label>
                  <select
                    value={globalConfig.autoStatsType}
                    onChange={e => setGlobalConfig({ ...globalConfig, autoStatsType: e.target.value })}
                    className="w-full p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="BATTING_CARD">Batting Card</option>
                    <option value="BOWLING_CARD">Bowling Card</option>
                    <option value="BOTH_CARDS">Both Cards</option>
                  </select>
                </div>
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
                <button
                  onClick={addSponsor}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Sponsor
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Display Duration</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={sponsorConfig.showDuration}
                      onChange={e => setSponsorConfig({ ...sponsorConfig, showDuration: Number(e.target.value) })}
                      className="flex-1 p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-600 font-bold">sec</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Position</label>
                  <select
                    value={sponsorConfig.position}
                    onChange={e => setSponsorConfig({ ...sponsorConfig, position: e.target.value as 'top' | 'bottom' })}
                    className="w-full p-2 bg-black/60 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                  </select>
                </div>
              </div>

              {sponsorConfig.sponsors.length === 0 && (
                <div className="py-10 text-center border border-dashed border-gray-800 rounded-2xl">
                  <Building2 className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No sponsors added yet.</p>
                  <button onClick={addSponsor} className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-bold">+ Add your first sponsor</button>
                </div>
              )}

              <div className="space-y-3">
                {sponsorConfig.sponsors.map((sp, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-900/60 border border-gray-800 rounded-xl group hover:border-gray-700 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Sponsor Name"
                      value={sp.name}
                      onChange={e => updateSponsor(i, 'name', e.target.value)}
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none border-b border-gray-800 focus:border-blue-500 pb-0.5 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Tagline (optional)"
                      value={sp.tagline}
                      onChange={e => updateSponsor(i, 'tagline', e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-400 placeholder-gray-700 outline-none border-b border-gray-800 focus:border-blue-500 pb-0.5 transition-all"
                    />
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
}

// ─── Main OverlayManager ───────────────────────────────────────────────────────
export default function OverlayManager({ tournamentId }: { tournamentId?: string }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [createdOverlays, setCreatedOverlays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePreview, setActivePreview] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', template: '', match: '' });

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { idealScale } = usePreviewScale({ containerRef: previewContainerRef });

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(() => {
    const saved = localStorage.getItem('scorex_global_overlay_config');
    return saved ? JSON.parse(saved) : { tossDuration: 8, squadDuration: 12, introDuration: 12, autoStatsOvers: 5, autoStatsType: 'BOTH_CARDS', autoStatsDuration: 10 };
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
      const [tRes, oRes] = await Promise.all([overlayAPI.getOverlayTemplates(), overlayAPI.getOverlays(tournamentId!)]);
      // Backend returns the array directly (not wrapped in {data:[...]})
      const rawTemplates = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data || []);
      setTemplates(rawTemplates);
      setCreatedOverlays(oRes.data?.data || []);
    } catch (e) {} finally { setLoading(false); }
  }, [tournamentId, userLevel]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return addToast({ type: 'error', message: 'Membership required to deploy overlays.' });
    if (!createForm.name || !createForm.template) return addToast({ type: 'error', message: 'Name and template required.' });
    try {
      await overlayAPI.createOverlay({ ...createForm, tournamentId });
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
    if (activePreview) {
      const cur = activePreview;
      setActivePreview(null);
      setTimeout(() => setActivePreview(cur), 80);
    }
  };

  const generateOverlayUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    const expTime = overlay.urlExpiresAt ? new Date(overlay.urlExpiresAt).getTime() : Date.now() + 86400000;
    const cfg = encodeURIComponent(JSON.stringify({ ...globalConfig, sponsors: sponsorConfig.sponsors }));
    return `/overlays/${filename}?tournament=${tournamentId || overlay.tournamentId}&exp=${expTime}&preview=true&cfg=${cfg}`;
  };

  const triggerAnim = (eventType: string) => {
    const iframe = document.getElementById('main-preview') as HTMLIFrameElement;
    if (!iframe?.contentWindow) return;
    const mockData: any = {
      SHOW_SQUADS: { team1Name: 'RCB', team2Name: 'CSK', team1Players: [{ name: 'V. Kohli', role: 'BAT' }, { name: 'G. Maxwell', role: 'ALL' }], team2Players: [{ name: 'M. Dhoni', role: 'WK' }, { name: 'R. Jadeja', role: 'ALL' }] },
      BATTING_CARD: { team1: { name: 'RCB', batsmen: [{ name: 'V. Kohli', runs: 82, balls: 53, fours: 6, sixes: 4, sr: 154.7 }], bowlers: [] } },
      BOWLING_CARD: { team1: { name: 'RCB', batsmen: [], bowlers: [{ name: 'M. Siraj', overs: '4.0', maidens: 0, runs: 28, wickets: 2, econ: 7.0 }] } },
      INNINGS_BREAK: { chasingTeam: 'CSK', target: 214 },
      WICKET_SWITCH: { outName: 'V. Kohli', outScore: '82 (53)', inName: 'G. Maxwell' },
    }[eventType] || {};
    iframe.contentWindow.postMessage({ type: 'OVERLAY_TRIGGER', payload: { type: eventType, duration: 8, data: mockData } }, '*');
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

  return (
    <div className="space-y-5">
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          globalConfig={globalConfig} setGlobalConfig={setGlobalConfig}
          sponsorConfig={sponsorConfig} setSponsorConfig={setSponsorConfig}
          onSave={handleSaveSettings} onClose={() => setShowSettings(false)}
        />
      )}

      {/* Preview Director Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-[#0a0a0f] shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Preview Director</span>
              </div>
              <span className="text-xs text-gray-600 font-mono">— {activePreview.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.origin + generateOverlayUrl(activePreview)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all"
              >
                <Copy className="w-3.5 h-3.5" /> Copy OBS URL
              </button>
              <button onClick={() => setActivePreview(null)} className="p-2 rounded-xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-[#030305] flex items-center justify-center p-4 overflow-hidden">
            <div ref={previewContainerRef} className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl" style={{ maxWidth: '90vw' }}>
              <iframe
                id="main-preview"
                src={generateOverlayUrl(activePreview)}
                style={{ width: '1920px', height: '1080px', transform: `scale(${idealScale})`, transformOrigin: 'center center', border: 'none', position: 'absolute', top: '50%', left: '50%', marginTop: '-540px', marginLeft: '-960px' }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

          {/* Triggers bar */}
          <div className="shrink-0 bg-[#0a0a0f] border-t border-gray-800 px-4 py-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest shrink-0 mr-1">Triggers</span>
            {[
              { label: 'VS', type: 'SHOW_VS_SCREEN', color: 'slate' },
              { label: 'Toss', type: 'SHOW_TOSS', color: 'yellow' },
              { label: 'Squads', type: 'SHOW_SQUADS', color: 'purple' },
              { label: 'Intro', type: 'START_INNINGS_INTRO', color: 'blue' },
            ].map(b => (
              <button key={b.type} onClick={() => triggerAnim(b.type)} className={`px-3 py-1.5 bg-${b.color}-500/10 border border-${b.color}-500/20 text-${b.color}-400 text-xs font-bold rounded-lg shrink-0 hover:bg-${b.color}-500 hover:text-white transition-all`}>{b.label}</button>
            ))}
            <div className="w-px h-6 bg-gray-800 mx-1" />
            <button onClick={() => triggerAnim('FOUR')} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-lg shrink-0 hover:bg-blue-500 hover:text-white transition-all">FOUR</button>
            <button onClick={() => triggerAnim('SIX')} className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg shrink-0 hover:bg-green-500 hover:text-white transition-all">SIX</button>
            <button onClick={() => triggerAnim('WICKET')} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg shrink-0 hover:bg-red-500 hover:text-white transition-all">OUT</button>
            <div className="w-px h-6 bg-gray-800 mx-1" />
            <button onClick={() => triggerAnim('BATTING_CARD')} className="px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold rounded-lg shrink-0 hover:bg-fuchsia-500 hover:text-white transition-all">Bat Stats</button>
            <button onClick={() => triggerAnim('BOWLING_CARD')} className="px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold rounded-lg shrink-0 hover:bg-fuchsia-500 hover:text-white transition-all">Bowl Stats</button>
            <button onClick={() => triggerAnim('INNINGS_BREAK')} className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-lg shrink-0 hover:bg-orange-500 hover:text-white transition-all">Innings Break</button>
            <button onClick={() => triggerAnim('RESTORE')} className="ml-auto px-4 py-1.5 bg-white/10 text-white text-xs font-black rounded-lg shrink-0 hover:bg-white hover:text-black transition-all">RESTORE</button>
          </div>
        </div>
      )}

      {/* ─── Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20">
            <Monitor className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-black text-[var(--text-primary)] text-sm">Broadcast Overlays</h3>
            <p className="text-[11px] text-[var(--text-muted)]">{createdOverlays.length} overlay{createdOverlays.length !== 1 ? 's' : ''} deployed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-blue-500/40 transition-all text-sm font-bold"
          >
            <Settings className="w-4 h-4" /> Settings
            {sponsorConfig.sponsors.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center border border-amber-500/30">
                {sponsorConfig.sponsors.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black text-sm shadow-lg hover:shadow-green-500/20 hover:scale-[1.02] transition-all"
          >
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
            <input
              type="text"
              placeholder="Overlay name (e.g. Main Scoreboard)"
              value={createForm.name}
              onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              className="flex-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all placeholder:text-[var(--text-muted)]"
            />
            <select
              value={createForm.template}
              onChange={e => setCreateForm({ ...createForm, template: e.target.value })}
              className="flex-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-green-500/50 transition-all"
            >
              <option value="">Select template...</option>
              {templates.map(t => (
                <option key={t.id || t.file} value={t.file || t.id}>{t.name}</option>
              ))}
            </select>
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-all shadow-lg whitespace-nowrap">
              Deploy →
            </button>
          </form>
        </div>
      )}

      {/* ─── Overlay Cards ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-2xl bg-[var(--bg-card)] animate-pulse border border-[var(--border)]" />
          ))}
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
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-[var(--text-primary)] text-sm truncate">{overlay.name}</h4>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono truncate mt-0.5">{getTemplateFilename(overlay)}</p>
                </div>
                <CountdownBadge expiresAt={overlay.urlExpiresAt} overlayId={overlay._id} onExpire={() => {}} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActivePreview(overlay)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 text-xs transition-all hover:scale-[1.02] shadow-md shadow-blue-500/20"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.origin + generateOverlayUrl(overlay)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }}
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
          ))}
        </div>
      )}
    </div>
  );
}
