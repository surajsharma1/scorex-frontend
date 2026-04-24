import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye, Trash2, Copy, X, Settings, Timer, Plus, Sparkles, Tag,
  ChevronRight, Star, ImageOff, Building2, Check, Monitor,
  ZoomIn, ZoomOut, RotateCcw, MonitorPlay, Lock
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

// ── Neon green design tokens matching the ScoreX site theme ─────────────────
const S = {
  bg: '#070d0f', bgCard: '#0c1418', bgElevated: '#111c20',
  border: '#1a2e35', accent: '#00ff88', accentGlow: 'rgba(0,255,136,0.10)',
  accentBorder: 'rgba(0,255,136,0.25)', text: '#e8f5f0',
  textSec: '#8ba89e', textMuted: '#4a6560',
  red: '#ff4444', redDim: 'rgba(255,68,68,0.10)', redBorder: 'rgba(255,68,68,0.25)',
  amber: '#f59e0b', amberDim: 'rgba(245,158,11,0.10)', amberBorder: 'rgba(245,158,11,0.25)',
};

function SettingsModal({ globalConfig, setGlobalConfig, sponsorConfig, setSponsorConfig, onSave, onClose }: {
  globalConfig: GlobalConfig; setGlobalConfig: (c: GlobalConfig) => void;
  sponsorConfig: SponsorConfig; setSponsorConfig: (c: SponsorConfig) => void;
  onSave: () => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<'automation' | 'sponsors' | 'animations'>('automation');
  const addSponsor = () => setSponsorConfig({ ...sponsorConfig, sponsors: [...sponsorConfig.sponsors, { name: '', tagline: '' }] });
  const removeSponsor = (i: number) => setSponsorConfig({ ...sponsorConfig, sponsors: sponsorConfig.sponsors.filter((_, idx) => idx !== i) });
  const updateSponsor = (i: number, field: 'name' | 'tagline', val: string) => {
    const updated = [...sponsorConfig.sponsors];
    updated[i] = { ...updated[i], [field]: val };
    setSponsorConfig({ ...sponsorConfig, sponsors: updated });
  };

  const inputStyle = { background: S.bgElevated, border: `1px solid ${S.border}`, color: S.text, borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%' };
  const cardStyle = { background: S.bgElevated, border: `1px solid ${S.border}`, borderRadius: 14, padding: '14px 16px' };
  const labelStyle = { color: S.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 };

  const timingFields = [
    { label: 'Toss Screen', key: 'tossDuration', max: 30, icon: '🪙' },
    { label: 'Playing XI', key: 'squadDuration', max: 30, icon: '👥' },
    { label: 'Innings Intro', key: 'introDuration', max: 30, icon: '🏏' },
    { label: 'Stats Card', key: 'autoStatsDuration', max: 20, icon: '📊' },
  ];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: S.bgCard, border: `1px solid ${S.accentBorder}`, borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: `0 0 60px ${S.accentGlow}, 0 25px 50px rgba(0,0,0,0.8)`, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${S.accentGlow}` }}>
              <Settings style={{ width: 16, height: 16, color: S.bg }} />
            </div>
            <div>
              <div style={{ color: S.accent, fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>Overlay Settings</div>
              <div style={{ color: S.textMuted, fontSize: 11, marginTop: 1 }}>Animation timings, automation & sponsors</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: S.bgElevated, border: `1px solid ${S.border}`, color: S.textMuted, borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
          {(['automation', 'animations', 'sponsors'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '12px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', borderBottom: `2px solid ${tab === t ? S.accent : 'transparent'}`, background: tab === t ? S.accentGlow : 'transparent', color: tab === t ? S.accent : S.textMuted, textTransform: 'uppercase', letterSpacing: 1, transition: 'all 0.2s' }}>
              {t === 'automation' ? '⚙ Auto' : t === 'animations' ? '🎬 Timing' : '⭐ Sponsors'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

          {tab === 'automation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ color: S.textMuted, fontSize: 11, lineHeight: 1.5, padding: '10px 14px', background: S.bgElevated, borderRadius: 10, border: `1px solid ${S.border}` }}>
                Auto-trigger batting/bowling cards after a set number of overs. Set to 0 to disable.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: '🎯 Batting Card every', key: 'autoBattingOvers', note: 'overs (0 = off)' },
                  { label: '🎳 Bowling Card every', key: 'autoBowlingOvers', note: 'overs (0 = off)' },
                ].map(({ label, key, note }) => (
                  <div key={key} style={cardStyle}>
                    <label style={labelStyle}>{label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min="0" max="20"
                        value={(globalConfig as any)[key]}
                        onChange={e => setGlobalConfig({ ...globalConfig, [key]: Number(e.target.value) })}
                        style={{ ...inputStyle, width: 60, textAlign: 'center', padding: '6px 8px' }} />
                      <span style={{ color: S.textMuted, fontSize: 11 }}>{note}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={cardStyle}>
                <label style={labelStyle}>When Batting & Bowling trigger on same over</label>
                <select value={globalConfig.autoStatsStyle}
                  onChange={e => setGlobalConfig({ ...globalConfig, autoStatsStyle: e.target.value as any })}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="TOGETHER">Show Both Together</option>
                  <option value="SEQUENTIAL">Sequential — Batting first, then Bowling</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'animations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ color: S.textMuted, fontSize: 11, lineHeight: 1.5, padding: '10px 14px', background: S.bgElevated, borderRadius: 10, border: `1px solid ${S.border}` }}>
                Control how long each animation panel stays visible. These apply globally to all overlays.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {timingFields.map(({ label, key, max, icon }) => (
                  <div key={key} style={cardStyle}>
                    <label style={labelStyle}>{icon} {label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="range" min="2" max={max}
                        value={(globalConfig as any)[key]}
                        onChange={e => setGlobalConfig({ ...globalConfig, [key]: Number(e.target.value) })}
                        style={{ flex: 1, accentColor: S.accent }} />
                      <span style={{ color: S.accent, fontWeight: 900, fontSize: 14, minWidth: 32, textAlign: 'right' }}>
                        {(globalConfig as any)[key]}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'sponsors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: S.text, fontWeight: 700, fontSize: 13 }}>Sponsor Ticker</div>
                  <div style={{ color: S.textMuted, fontSize: 11, marginTop: 2 }}>Scrolls in the overlay sponsor bar. Shown on all lvl2 overlays.</div>
                </div>
                <button onClick={addSponsor}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: S.accentGlow, border: `1px solid ${S.accentBorder}`, color: S.accent, borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  <Plus style={{ width: 13, height: 13 }} /> Add
                </button>
              </div>
              {sponsorConfig.sponsors.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', border: `1px dashed ${S.border}`, borderRadius: 14 }}>
                  <Building2 style={{ width: 28, height: 28, color: S.textMuted, margin: '0 auto 8px' }} />
                  <div style={{ color: S.textMuted, fontSize: 12 }}>No sponsors added yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sponsorConfig.sponsors.map((sp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: S.bgElevated, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: S.amberDim, border: `1px solid ${S.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Star style={{ width: 12, height: 12, color: S.amber }} />
                      </div>
                      <input type="text" placeholder="Sponsor name" value={sp.name}
                        onChange={e => updateSponsor(i, 'name', e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: `1px solid ${S.border}`, color: S.text, fontSize: 13, outline: 'none', paddingBottom: 2 }} />
                      <input type="text" placeholder="Tagline (optional)" value={sp.tagline}
                        onChange={e => updateSponsor(i, 'tagline', e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: `1px solid ${S.border}`, color: S.textSec, fontSize: 12, outline: 'none', paddingBottom: 2 }} />
                      <button onClick={() => removeSponsor(i)}
                        style={{ padding: 6, background: 'transparent', border: 'none', color: S.textMuted, cursor: 'pointer', borderRadius: 8 }}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${S.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: S.bgElevated, border: `1px solid ${S.border}`, color: S.textSec, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: S.accent, border: 'none', color: S.bg, fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 0 20px ${S.accentGlow}` }}>
            <Check style={{ width: 15, height: 15 }} /> Save Settings
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
            {/* ── Open in Full Studio for testing animations ── */}
            <button
              onClick={() => window.open(`/studio?level=${level}&template=/overlays/${templateFilename}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              <MonitorPlay className="w-3.5 h-3.5" /> Test in Studio
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
                pointerEvents: 'none',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
              }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

        {/* Bottom bar — OBS URL only */}
        <div className="shrink-0 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest shrink-0" style={{ color: 'var(--text-muted)' }}>OBS URL</span>
            <code className="flex-1 text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>{generateOverlayUrl(activePreview)}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(generateOverlayUrl(activePreview)); addToast({ type: 'success', message: 'OBS URL Copied!' }); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shrink-0"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
              <Copy className="w-3.5 h-3.5" /> Copy for OBS
            </button>
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
              <option value="">Select Match</option>
              {matches.filter((m:any) => m.status !== 'completed').map(m => <option key={m._id} value={m._id}>{m.team1Name} vs {m.team2Name} ({m.status})</option>)}
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