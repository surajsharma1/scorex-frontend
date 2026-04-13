import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye, Trash2, Copy, X, Settings, Timer, Plus, Sparkles, Tag,
  ChevronRight, Star, ImageOff, Building2, Check, Monitor,
  ZoomIn, ZoomOut, RotateCcw, MonitorPlay, Activity, Lock, RefreshCw
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

// ── Rich mock score data — identical to PreviewStudio ────────────────────────
const MOCK_SCORE = {
  team1Name: 'MI', team2Name: 'CSK',
  team1ShortName: 'MI', team2ShortName: 'CSK',
  team1Score: 213, team1Wickets: 4, team1Overs: '19.4',
  strikerName: 'R. Sharma', strikerRuns: 82, strikerBalls: 45,
  nonStrikerName: 'H. Pandya', nonStrikerRuns: 24, nonStrikerBalls: 12,
  bowlerName: 'P. Cummins', bowlerRuns: 34, bowlerWickets: 1, bowlerOvers: '3.4',
  target: 214, requiredRuns: 1, remainingBalls: 2,
  tournamentName: 'IPL 2025',
  matchDisplayName: 'MI vs CSK',
  thisOver: [
    { raw: '1', runs: 1, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
    { raw: 'W', runs: 0, isWicket: true,  isWide: false, isNoBall: false, isFour: false, isSix: false },
    { raw: '4', runs: 4, isWicket: false, isWide: false, isNoBall: false, isFour: true,  isSix: false },
    { raw: '6', runs: 6, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: true  },
    { raw: '•', runs: 0, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
    { raw: '1', runs: 1, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
  ],
  sponsors: [{ name: 'TATA', tagline: 'Power of We' }, { name: 'DREAM11', tagline: '' }],
  battingSummary: [
    { name: 'R. Sharma', runs: 82, balls: 45, fours: 8, sixes: 3, isOut: false },
    { name: 'H. Pandya', runs: 24, balls: 12, fours: 1, sixes: 2, isOut: false },
    { name: 'S. Yadav',  runs: 18, balls: 10, fours: 2, sixes: 0, isOut: true  },
    { name: 'R. Jadeja', runs: 10, balls: 5,  fours: 1, sixes: 0, isOut: true  },
  ],
  bowlingSummary: [
    { name: 'P. Cummins', overs: '3.4', runs: 34, wickets: 1, economy: 9.3 },
    { name: 'M. Starc',   overs: '4.0', runs: 38, wickets: 1, economy: 9.5 },
    { name: 'A. Zampa',   overs: '4.0', runs: 28, wickets: 2, economy: 7.0 },
  ],
  team1Players: [
    { name: 'R. Sharma', role: '(C)' }, { name: 'V. Kohli', role: '' },
    { name: 'H. Pandya', role: '' },    { name: 'R. Jadeja', role: '' },
    { name: 'J. Bumrah', role: '' },
  ],
  team2Players: [
    { name: 'T. Head', role: '' },      { name: 'P. Cummins', role: '(C)' },
    { name: 'M. Starc', role: '' },     { name: 'A. Zampa', role: '' },
  ],
};

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
      <div className=" border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        <div className="p-4 sm:p-5 border-b flex justify-between items-center shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full sm:hidden" />
          <div className="flex items-center gap-3 mt-1 sm:mt-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Overlay Settings</h3>
              <p className="text-[10px] sm:text-[11px] ">Automations & sponsors</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b shrink-0">
          <button onClick={() => setTab('automation')} className={`flex-1 py-3 sm:py-3.5 text-sm font-bold border-b-2 ${tab === 'automation' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent hover:bg-white/5'}`}>Automations</button>
          <button onClick={() => setTab('sponsors')} className={`flex-1 py-3 sm:py-3.5 text-sm font-bold border-b-2 ${tab === 'sponsors' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent hover:bg-white/5'}`}>Sponsors</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-5">
          {tab === 'automation' && (
            <div className="space-y-3">
              <p className="text-xs mb-3">Controls how long animated overlay panels appear during broadcasts.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Toss Screen', key: 'tossDuration', unit: 'sec', max: 30 },
                  { label: 'Playing XI', key: 'squadDuration', unit: 'sec', max: 30 },
                  { label: 'Batsman Intro', key: 'introDuration', unit: 'sec', max: 30 },
                  { label: 'Stats Animation', key: 'autoStatsDuration', unit: 'sec', max: 12 },
                ].map(({ label, key, unit, max }) => (
                  <div key={key} className="p-3 sm:p-4 border rounded-xl">
                    <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" max={max} value={(globalConfig as any)[key]}
                        onChange={e => setGlobalConfig({ ...globalConfig, [key]: Math.min(max, Number(e.target.value)) })}
                        className="flex-1 p-2 bg-black/60 border text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all" />
                      <span className="text-xs font-bold shrink-0">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 sm:p-4 border rounded-xl">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2">Batting Card (Every N Overs)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={globalConfig.autoBattingOvers} onChange={e => setGlobalConfig({ ...globalConfig, autoBattingOvers: Number(e.target.value) })} className="flex-1 p-2 bg-black/60 border text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                    <span className="text-xs font-bold shrink-0">ov (0=off)</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 border rounded-xl">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2">Bowling Card (Every N Overs)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={globalConfig.autoBowlingOvers} onChange={e => setGlobalConfig({ ...globalConfig, autoBowlingOvers: Number(e.target.value) })} className="flex-1 p-2 bg-black/60 border text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                    <span className="text-xs font-bold shrink-0">ov (0=off)</span>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4 border rounded-xl">
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2">When Both Cards Trigger on Same Over</label>
                <select value={globalConfig.autoStatsStyle} onChange={e => setGlobalConfig({ ...globalConfig, autoStatsStyle: e.target.value as any })}
                  className="w-full p-2 bg-black/60 border text-white rounded-lg text-sm outline-none focus:border-blue-500 transition-all">
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
                  <p className="text-xs mt-0.5">Names shown inside overlay templates.</p>
                </div>
                <button onClick={addSponsor} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-all shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="p-3 sm:p-4 border rounded-xl">
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2">Display Duration</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={sponsorConfig.showDuration} onChange={e => setSponsorConfig({ ...sponsorConfig, showDuration: Number(e.target.value) })} className="w-20 p-2 bg-black/60 border text-white rounded-lg text-sm outline-none focus:border-blue-500" />
                  <span className="text-xs font-bold">seconds each</span>
                </div>
              </div>
              {sponsorConfig.sponsors.length === 0 && (
                <div className="py-8 text-center border border-dashed rounded-2xl">
                  <Building2 className="w-7 h-7 mx-auto mb-2" />
                  <p className="text-xs ">No sponsors yet. Tap Add to get started.</p>
                </div>
              )}
              <div className="space-y-2">
                {sponsorConfig.sponsors.map((sp, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 border rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-3 h-3 text-amber-400" />
                    </div>
                    <input type="text" placeholder="Sponsor name" value={sp.name} onChange={e => updateSponsor(i, 'name', e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-gray-600 outline-none border-b focus:border-blue-500 pb-0.5 transition-all" />
                    <input type="text" placeholder="Tagline" value={sp.tagline} onChange={e => updateSponsor(i, 'tagline', e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm placeholder-gray-700 outline-none border-b focus:border-blue-500 pb-0.5 transition-all hidden sm:block" />
                    <button onClick={() => removeSponsor(i)} className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t shrink-0 flex gap-3 ">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border hover:bg-white/10 font-bold text-sm transition-all">Cancel</button>
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
  // ── FIX: iframeKey only changes when the overlay changes, NOT on every slider move ──
  const [previewIframeKey, setPreviewIframeKey] = useState(0);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
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
        overlayAPI.getOverlays(tournamentId),
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
      const response = await overlayAPI.createOverlay({ name: createForm.name.trim(), template: createForm.template, match: createForm.match || undefined, tournamentId, config: globalConfig, requiredMembershipLevel: templateLevel });
      const newOverlay = {
        _id: response.data._id || 'temp-' + Date.now(),
        name: createForm.name.trim(),
        template: createForm.template,
        publicId: response.data.publicId,
        level: templateLevel,
        match: createForm.match ? { _id: createForm.match, team1Name: '', team2Name: '' } : null,
        tournamentId,
        urlExpiresAt: response.data.urlExpiresAt || new Date(Date.now() + 24*60*60*1000).toISOString(),
        createdAt: new Date().toISOString()
      };
      setCreatedOverlays(prev => [newOverlay, ...prev]);
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
    const isLevel2 = overlay.level === 2 || filename.startsWith('lvl2');
    const engineConfig = {
      tossDuration: globalConfig.tossDuration,
      squadDuration: globalConfig.squadDuration,
      introDuration: globalConfig.introDuration,
      autoStatsOvers: globalConfig.autoBattingOvers,
      autoStatsType: globalConfig.autoStatsStyle === 'TOGETHER' ? 'BOTH_CARDS' : 'SEQUENTIAL',
      autoStatsDuration: globalConfig.autoStatsDuration,
      sponsors: isLevel2 ? sponsorConfig.sponsors : []
    };
    const cfg = encodeURIComponent(JSON.stringify(engineConfig));
    let url = `${getBaseUrl()}/api/v1/overlays/public/${overlay.publicId}?template=${filename}&cfg=${cfg}`;
    if (overlay.match) {
      const matchId = typeof overlay.match === 'string' ? overlay.match : overlay.match._id;
      url += `&matchId=${matchId}`;
    }
    if (tournamentId || overlay.tournamentId) {
      url += `&tournamentId=${tournamentId || overlay.tournamentId}`;
    }
    return url;
  };

  // ── FIX: Preview URL no longer includes previewProgress in the URL
  // (that caused the iframe to reload on every slider move).
  // Instead, score is pushed via postMessage after load.
  const generatePreviewUrl = (overlay: any) => {
    const filename = getTemplateFilename(overlay);
    let url = `/overlays/${filename}?preview=true`;
    if (overlay.match) {
      const matchId = typeof overlay.match === 'string' ? overlay.match : overlay.match._id;
      url += `&matchId=${matchId}`;
    }
    return url;
  };

  // ── FIX: Push rich mock score into preview iframe via postMessage ──────────
  const pushPreviewScore = useCallback(() => {
    const iframe = previewIframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'UPDATE_SCORE', data: MOCK_SCORE, raw: MOCK_SCORE }, '*');
    iframe.contentWindow.postMessage({ type: 'UPDATE_SPONSORS', sponsors: MOCK_SCORE.sponsors, duration: 6 }, '*');
  }, []);

  const handlePreviewIframeLoad = useCallback(() => {
    // Give engine.js ~600ms to boot and register its message listener, then push data
    setTimeout(pushPreviewScore, 600);
  }, [pushPreviewScore]);

  const fireTrigger = useCallback((type: string, data: any = {}) => {
    const iframe = previewIframeRef.current;
    if (!iframe?.contentWindow) return;

    // Enrich trigger data with mock score context
    let enrichedData: any = { ...MOCK_SCORE, ...data };
    if (type === 'SHOW_SQUADS') {
      enrichedData = { team1Name: 'MUMBAI', team2Name: 'CHENNAI', team1Players: MOCK_SCORE.team1Players, team2Players: MOCK_SCORE.team2Players };
    } else if (type === 'SHOW_TOSS') {
      enrichedData = { tossWinnerName: 'MUMBAI', tossDecision: 'BAT', team1Name: 'MUMBAI', team2Name: 'CHENNAI' };
    } else if (type === 'SHOW_VS_SCREEN') {
      enrichedData = { team1Name: 'MUMBAI', team2Name: 'CHENNAI' };
    } else if (type === 'WICKET') {
      enrichedData = { playerName: 'R. Sharma', runs: MOCK_SCORE.strikerRuns, balls: MOCK_SCORE.strikerBalls };
    } else if (type === 'BATTING_CARD' || type === 'BATTING_SUMMARY') {
      enrichedData = { batsmen: MOCK_SCORE.battingSummary, teamName: 'MUMBAI', innings: 1 };
    } else if (type === 'BOWLING_CARD' || type === 'BOWLING_SUMMARY') {
      enrichedData = { bowlers: MOCK_SCORE.bowlingSummary, teamName: 'CHENNAI', innings: 1 };
    } else if (type === 'BOTH_CARDS') {
      enrichedData = { batsmen: MOCK_SCORE.battingSummary, bowlers: MOCK_SCORE.bowlingSummary, innings: 1 };
    } else if (type === 'INNINGS_BREAK') {
      enrichedData = { chasingTeam: 'CHENNAI', target: 214, inn1Score: 213, inn1Wickets: 4 };
    } else if (type === 'MATCH_END' || type === 'MATCH_WIN') {
      enrichedData = { winnerName: 'MUMBAI', resultSummary: 'Mumbai won by 5 wickets' };
    } else if (type === 'RESTORE') {
      enrichedData = {};
    }

    iframe.contentWindow.postMessage({ type: 'OVERLAY_TRIGGER', payload: { type, data: enrichedData, duration: 6 } }, '*');
  }, []);

  if (!isEligible) return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/20"><Sparkles className="w-7 h-7 text-amber-400" /></div>
      <h3 className="text-lg font-black text-white mb-2">Overlay Engine Locked</h3>
      <p className="text-sm mb-6 max-w-sm mx-auto">Upgrade to Premium or Enterprise to deploy broadcast overlays.</p>
      <a href="/membership" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl shadow-lg text-sm"><ChevronRight className="w-4 h-4" /> Upgrade Membership</a>
    </div>
  );

  // ─── Preview Director (full-screen overlay portal) ────────────────────────
  const renderPreviewDirector = () => {
    if (!activePreview) return null;
    const effectiveScale = idealScale * previewZoom;
    const templateFilename = getTemplateFilename(activePreview);
    const level = templateFilename.startsWith('lvl2') ? '2' : '1';

    const TRIGGER_BTNS = level === '2' ? [
      { label: '▶ VS Screen',      type: 'SHOW_VS_SCREEN',   color: '#3b82f6' },
      { label: '🪙 Toss',          type: 'SHOW_TOSS',        color: '#f59e0b' },
      { label: '🧑‍🤝‍🧑 Playing XI', type: 'SHOW_SQUADS',      color: '#8b5cf6' },
      { label: '🏏 Innings Intro', type: 'INNING_START',     color: '#06b6d4' },
      { label: '4️⃣ FOUR',         type: 'FOUR',             color: '#3b82f6' },
      { label: '6️⃣ SIX',          type: 'SIX',              color: '#22c55e' },
      { label: '🎯 WICKET',        type: 'WICKET',           color: '#ef4444' },
      { label: '⚖️ 3rd Umpire',   type: 'DECISION_PENDING', color: '#f59e0b' },
      { label: '🏏 Bat Card',      type: 'BATTING_SUMMARY',  color: '#60a5fa' },
      { label: '🎳 Bowl Card',     type: 'BOWLING_SUMMARY',  color: '#818cf8' },
      { label: '📊 Both Cards',    type: 'BOTH_CARDS',       color: '#c084fc' },
      { label: '👤 Bat Profile',   type: 'BATSMAN_PROFILE',  color: '#34d399' },
      { label: '👤 Bowl Profile',  type: 'BOWLER_PROFILE',   color: '#2dd4bf' },
      { label: '🔄 New Bowler',    type: 'NEW_BOWLER',       color: '#a78bfa' },
      { label: '🏃 Wicket Switch', type: 'WICKET_SWITCH',    color: '#f87171' },
      { label: '5️⃣0️⃣ 50 Runs',   type: '50_RUNS',          color: '#fbbf24' },
      { label: '💯 100 Runs',      type: '100_RUNS',         color: '#f59e0b' },
      { label: '🔚 Inns Break',    type: 'INNINGS_BREAK',    color: '#38bdf8' },
      { label: '🏆 Match End',     type: 'MATCH_WIN',        color: '#fb923c' },
      { label: '↩ Restore Live',   type: 'RESTORE',          color: '#6b7280' },
    ] : [
      { label: '4️⃣ FOUR',         type: 'FOUR',             color: '#3b82f6' },
      { label: '6️⃣ SIX',          type: 'SIX',              color: '#22c55e' },
      { label: '🎯 WICKET',        type: 'WICKET',           color: '#ef4444' },
      { label: '⚖️ 3rd Umpire',   type: 'DECISION_PENDING', color: '#f59e0b' },
      { label: '↩ Restore Live',   type: 'RESTORE',          color: '#6b7280' },
    ];

    return createPortal(
      <div className="fixed inset-0 z-[9999] backdrop-blur-md flex flex-col" style={{ background: 'rgba(0,0,0,0.97)' }}>
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b shrink-0"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>Live Overlay Preview</span>
            <span className="text-xs font-mono truncate hidden sm:inline" style={{ color: 'var(--text-muted)' }}>— {activePreview.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 rounded-lg px-1.5 py-1 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <button onClick={() => setPreviewZoom(z => Math.max(0.1, z * 0.8))} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-xs font-bold w-8 text-center tabular-nums" style={{ color: 'var(--text-secondary)' }}>{Math.round(previewZoom * 100)}%</span>
              <button onClick={() => setPreviewZoom(z => Math.min(3, z * 1.25))} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}><ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPreviewZoom(1)} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}><RotateCcw className="w-3 h-3" /></button>
            </div>
            {/* ── FIX: Push Data button so user can manually refresh mock score ── */}
            <button
              onClick={pushPreviewScore}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-500 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Push Data
            </button>
            <button
              onClick={() => window.open(`/studio?level=${level}&template=/overlays/${templateFilename}`, '_blank')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-black"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              <MonitorPlay className="w-3.5 h-3.5" /> Full Studio
            </button>
            <button onClick={() => { setActivePreview(null); setPreviewZoom(1); }}
              className="p-2 rounded-xl transition-all" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas — 1920×1080 iframe scaled to fit available space */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-3 overflow-hidden" style={{ background: '#030305' }}>
          <div ref={previewContainerRef} className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden"
            style={{ aspectRatio: '16/9', maxHeight: 'calc(100vh - 260px)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <iframe
              ref={previewIframeRef}
              id="main-preview"
              // ── FIX: key only changes when the overlay changes, not on slider move ──
              key={`preview-${activePreview._id}-${previewIframeKey}`}
              src={generatePreviewUrl(activePreview)}
              // ── FIX: push score data after iframe finishes loading ──
              onLoad={handlePreviewIframeLoad}
              style={{
                width: '1920px', height: '1080px',
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
                border: 'none',
                position: 'absolute', top: 0, left: 0,
                pointerEvents: 'none'
              }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

        {/* Bottom bar — OBS URL + Animation Triggers */}
        <div className="shrink-0 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {/* OBS URL row */}
          <div className="px-3 sm:px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-black uppercase tracking-widest shrink-0" style={{ color: 'var(--text-muted)' }}>OBS URL:</span>
            <button
              onClick={() => { navigator.clipboard.writeText(generateOverlayUrl(activePreview)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11px] transition-all border"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
              <Copy className="w-3 h-3" /> Copy OBS URL
            </button>
          </div>
          {/* Animation trigger buttons */}
          <div className="px-3 sm:px-4 py-2.5 overflow-x-auto">
            <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Activity className="w-3 h-3 text-red-400" /> Animation Triggers
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {TRIGGER_BTNS.map(btn => (
                <button
                  key={btn.type}
                  onClick={() => fireTrigger(btn.type)}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-[11px] border transition-all active:scale-95 whitespace-nowrap"
                  style={{ background: `${btn.color}18`, borderColor: `${btn.color}40`, color: btn.color }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${btn.color}30`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${btn.color}18`; }}
                >
                  {btn.label}
                </button>
              ))}
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
                  <button
                    onClick={() => {
                      setActivePreview(overlay);
                      setPreviewZoom(1);
                      // ── FIX: bump key so iframe reloads fresh for the new overlay ──
                      setPreviewIframeKey(k => k + 1);
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 text-xs transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(generateOverlayUrl(overlay)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }}
                    className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white rounded-xl transition-all" title="Copy OBS URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(overlay._id)}
                    className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 rounded-xl transition-all" title="Delete"
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
