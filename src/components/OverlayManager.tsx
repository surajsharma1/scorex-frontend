import { useState, useEffect, useRef, useCallback } from 'react';
import { getBackendBaseUrl } from '../services/env';
import { createPortal } from 'react-dom';
import {
  Eye, Trash2, Copy, X, Settings,
  Timer, Maximize2, Plus, Sparkles, Tag,
  ChevronRight, Star, ImageOff, Building2, Check,
  Monitor, ZoomIn, ZoomOut, RotateCcw, MonitorPlay, Activity
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0d0d14]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Overlay Settings</h3>
              <p className="text-[11px] text-gray-500">Configure automations & sponsors</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button onClick={() => setTab('automation')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 ${tab === 'automation' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            Automations
          </button>
          <button onClick={() => setTab('sponsors')} className={`flex-1 py-3.5 text-sm font-bold border-b-2 ${tab === 'sponsors' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            Sponsors
          </button>
        </div>

        {/* Content - Automation Tab */}
        {tab === 'automation' && (
          <div className="p-5 space-y-3 overflow-y-auto flex-1">
            <p className="text-xs text-gray-500">These settings control overlay panel timings during broadcasts.</p>
            {/* Timers grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Toss', key: 'tossDuration', max: 30 },
                { label: 'Squads', key: 'squadDuration', max: 30 },
                { label: 'Batsman Intro', key: 'introDuration', max: 30 },
                { label: 'Stats Duration', key: 'autoStatsDuration', max: 12 }
              ].map(({ label, key, max }) => (
                <div key={key} className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                  <label className="block text-xs font-bold text-gray-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min="1" max={max}
                    value={(globalConfig as any)[key]}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, [key]: Number(e.target.value) })}
                    className="w-full p-2 bg-black/50 border border-gray-700 rounded text-sm focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex gap-3 bg-[#0d0d14]">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-800 text-gray-400 hover:bg-gray-800 font-medium">
            Cancel
          </button>
          <button onClick={onSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
            Save Settings
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OverlayManager({ tournamentId }: { tournamentId?: string }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [createdOverlays, setCreatedOverlays] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const [activePreview, setActivePreview] = useState<any | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    tossDuration: 8, squadDuration: 12, introDuration: 12,
    autoBattingOvers: 2, autoBowlingOvers: 3,
    autoStatsStyle: 'TOGETHER', autoStatsDuration: 10 
  });

  const [sponsorConfig, setSponsorConfig] = useState<SponsorConfig>({
    sponsors: [], showDuration: 6, position: 'bottom'
  });

  const userLevel = (user as any)?.membership?.level || 0;
  const isEligible = userLevel > 0 || user?.role === 'admin';

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [templatesRes, overlaysRes, matchesRes] = await Promise.all([
          overlayAPI.getOverlayTemplates(),
          overlayAPI.getOverlays(tournamentId || ''),
  tournamentId ? matchAPI.getMatchesByTournament(tournamentId) : Promise.resolve({ data: [] })
        ]);
        setTemplates(templatesRes.data?.data || templatesRes.data || []);
        setCreatedOverlays(overlaysRes.data?.data || overlaysRes.data || []);
        setMatches(matchesRes.data?.data || matchesRes.data || []);
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId]);

const generateOverlayUrl = useCallback((overlay: any) => {
    const backendUrl = getBackendBaseUrl();
    const filename = getTemplateFilename(overlay);
    return backendUrl + '/api/v1/overlays/public/' + (overlay.publicId || overlay._id) + '?template=' + filename;
  }, []);

  if (!isEligible) {
    return (
      <div className="py-16 text-center">
        <ImageOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-black text-gray-300 mb-2">Overlay Access Locked</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">Upgrade to membership level 1+ to deploy and manage live broadcast overlays.</p>
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-6 py-3 rounded-xl text-sm font-bold text-amber-400">
          <Sparkles className="w-4 h-4" />
          Membership Required
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent mb-1">
            Live Overlays
          </h1>
          <p className="text-gray-500">Deploy broadcast-ready scoreboards for OBS/VMix</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {showSettings && (
        <SettingsModal
          globalConfig={globalConfig}
          setGlobalConfig={setGlobalConfig}
          sponsorConfig={sponsorConfig}
          setSponsorConfig={setSponsorConfig}
          onSave={() => {
            localStorage.setItem('overlayConfig', JSON.stringify({ globalConfig, sponsorConfig }));
            setShowSettings(false);
            addToast({ type: 'success', message: 'Settings saved!' });
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Overlays Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-900 rounded-2xl p-8"></div>
          ))}
        </div>
      ) : createdOverlays.length === 0 ? (
        <div className="text-center py-24">
          <MonitorPlay className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-gray-300 mb-2">No Active Overlays</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Create your first live scoreboard overlay for broadcast.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {createdOverlays.map((overlay) => (
            <div key={overlay._id} className="group bg-gradient-to-b from-gray-900/80 to-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-8 hover:border-gray-700/70 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="font-black text-xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1">
                    {overlay.name}
                  </h4>
                  {overlay.expiresAt && (
                    <CountdownBadge 
                      expiresAt={overlay.expiresAt} 
                      overlayId={overlay._id!} 
                      onExpire={(id) => setCreatedOverlays(prev => prev.filter(o => o._id !== id))}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-blue-400 transition-all">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
onClick={async () => {
                      try {
                        await overlayAPI.deleteOverlay(overlay._id!);
                        setCreatedOverlays(prev => prev.filter(o => o._id !== overlay._id));
                        addToast({ type: 'success', message: 'Overlay deleted' });
                      } catch (e) {
                        addToast({ type: 'error', message: 'Delete failed' });
                      }
                    }} 
                    className="p-2 hover:bg-red-500/10 rounded-xl text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Tag className="w-4 h-4" />
                  {getTemplateFilename(overlay)}
                </div>
                {overlay.match && (
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Activity className="w-4 h-4" />
                    Match: {typeof overlay.match === 'string' ? overlay.match : overlay.match?.name || 'Live'}
                  </div>
                )}
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="w-5 h-5 text-gray-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">OBS Browser Source</span>
                </div>
                <div className="relative">
                  <input 
                    readOnly 
                    value={generateOverlayUrl(overlay)} 
                    className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-2.5 text-sm font-mono pr-20 text-gray-200 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateOverlayUrl(overlay));
                      addToast({ type: 'success', message: 'OBS URL copied!' });
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setActivePreview(overlay)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <ZoomIn className="w-4 h-4" />
                Live Preview
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal - simplified */}
      {activePreview && (
        <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button 
              onClick={() => setActivePreview(null)} 
              className="absolute -top-12 right-0 p-2 bg-gray-900/80 hover:bg-gray-800 rounded-full border border-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={generateOverlayUrl(activePreview) + '&preview=true'}
              className="w-full h-[70vh] border-0 rounded-2xl shadow-2xl bg-black"
              title="Live Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

