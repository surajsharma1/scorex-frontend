import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MonitorPlay, X, Layout, Smartphone, Monitor, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Mock data matching test.html exactly ────────────────────────────────────
const SQUAD_MUMBAI = [
  { name: "R. Sharma",   runs: 45,  balls: 28, fours: 4, sixes: 2, sr: 160.7, role: '(C)' },
  { name: "V. Kohli",    runs: 82,  balls: 45, fours: 8, sixes: 3, sr: 182.2, role: '' },
  { name: "S. Yadav",    runs: 12,  balls: 8,  fours: 2, sixes: 0, sr: 150.0, role: '' },
  { name: "R. Pant",     runs: 30,  balls: 15, fours: 3, sixes: 2, sr: 200.0, role: '(WK)' },
  { name: "H. Pandya",   runs: 24,  balls: 12, fours: 1, sixes: 2, sr: 200.0, role: '', overs: 3, maidens: 0, wkts: 1, econ: 8.5 },
  { name: "R. Jadeja",   runs: 10,  balls: 5,  fours: 1, sixes: 0, sr: 200.0, role: '', overs: 4, maidens: 0, wkts: 2, econ: 6.0 },
  { name: "A. Patel",    runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '', overs: 4, maidens: 0, wkts: 1, econ: 7.2 },
  { name: "K. Yadav",    runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '', overs: 4, maidens: 0, wkts: 1, econ: 6.8 },
  { name: "J. Bumrah",   runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '', overs: 4, maidens: 1, wkts: 3, econ: 5.0 },
  { name: "M. Siraj",    runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '', overs: 4, maidens: 0, wkts: 1, econ: 8.0 },
  { name: "A. Singh",    runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '', overs: 4, maidens: 0, wkts: 2, econ: 7.5 },
];

const SQUAD_CHENNAI = [
  { name: "T. Head",     runs: 65,  balls: 30, fours: 6, sixes: 4, sr: 216.6, role: '' },
  { name: "D. Warner",   runs: 20,  balls: 15, fours: 3, sixes: 0, sr: 133.3, role: '' },
  { name: "M. Marsh",    runs: 45,  balls: 20, fours: 4, sixes: 3, sr: 225.0, role: '', overs: 2, maidens: 0, wkts: 0, econ: 12.0 },
  { name: "G. Maxwell",  runs: 10,  balls: 8,  fours: 1, sixes: 0, sr: 125.0, role: '', overs: 4, maidens: 0, wkts: 1, econ: 7.5 },
  { name: "M. Stoinis",  runs: 15,  balls: 10, fours: 2, sixes: 0, sr: 150.0, role: '', overs: 3, maidens: 0, wkts: 0, econ: 9.0 },
  { name: "T. David",    runs: 5,   balls: 4,  fours: 1, sixes: 0, sr: 125.0, role: '', overs: 2, maidens: 0, wkts: 0, econ: 10.0 },
  { name: "M. Wade",     runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '(WK)' },
  { name: "P. Cummins",  runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '(C)', overs: 4, maidens: 0, wkts: 2, econ: 8.5 },
  { name: "M. Starc",    runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '', overs: 4, maidens: 0, wkts: 1, econ: 8.0 },
  { name: "A. Zampa",    runs: 0,   balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '', overs: 4, maidens: 0, wkts: 3, econ: 6.5 },
  { name: "J. Hazlewood", runs: 0,  balls: 0,  fours: 0, sixes: 0, sr: 0,     role: '', overs: 4, maidens: 0, wkts: 1, econ: 9.0 },
];

const MOCK_SCORE = {
  team1Name: "MI", team2Name: "CSK",
  team1Score: 213, team1Wickets: 4, team1Overs: "19.4",
  strikerName: "R. Sharma", strikerRuns: 82, strikerBalls: 45,
  nonStrikerName: "H. Pandya", nonStrikerRuns: 24, nonStrikerBalls: 12,
  bowlerName: "P. Cummins", bowlerRuns: 34, bowlerWickets: 1, bowlerOvers: "3.4",
  target: 214, requiredRuns: 1, remainingBalls: 2,
  thisOver: ['1', 'W', '4', '6', '•', '1'],
  totalFours: 12, totalSixes: 5,
  sponsors: ['TATA', 'DREAM11', 'CEAT', 'RUPAY'],
};

// ─── Trigger definitions (matching test.html button layout) ──────────────────
const TRIGGER_GROUPS = [
  {
    label: 'Match Startup',
    color: 'blue',
    triggers: [
      { label: 'VS Screen',         type: 'VS_SCREEN',          data: { team1: 'MUMBAI', team2: 'CHENNAI' } },
      { label: 'Toss Result',       type: 'SHOW_TOSS',          data: { text: 'MUMBAI WON TOSS & BOWL' } },
      { label: 'Innings Intro',     type: 'START_INNINGS_INTRO', data: {} },
    ],
  },
  {
    label: 'Live Action',
    color: 'cyan',
    triggers: [
      { label: 'FOUR (4)',          type: 'FOUR',               data: {} },
      { label: 'SIX (6)',           type: 'SIX',                data: {} },
      { label: 'WICKET',            type: 'WICKET',             data: {} },
      { label: '3rd Umpire',        type: 'DECISION_PENDING',   data: {} },
      { label: '50 Runs',           type: '50_RUNS',            data: { playerName: 'R. SHARMA' } },
      { label: '100 Runs',          type: '100_RUNS',           data: { playerName: 'R. SHARMA' } },
    ],
  },
  {
    label: 'Player Events',
    color: 'purple',
    triggers: [
      { label: 'Batsman Profile',   type: 'BATSMAN_PROFILE',    data: { title: 'CURRENT BATSMAN', stats: [{ label: 'BATSMAN', value: 'R. SHARMA' }, { label: 'RUNS', value: '82 (45)' }, { label: 'STRIKE RATE', value: '182.2' }, { label: 'BOUNDARIES', value: '8×4, 3×6' }] } },
      { label: 'Bowler Profile',    type: 'BOWLER_PROFILE',     data: { title: 'CURRENT BOWLING', stats: [{ label: 'BOWLER', value: 'P. CUMMINS' }, { label: 'OVERS', value: '3.2' }, { label: 'FIGURES', value: '1 – 34' }, { label: 'ECONOMY', value: '10.2' }] } },
      { label: 'Wicket Switch',     type: 'WICKET_SWITCH',      data: { outName: 'R. SHARMA', outScore: '82 (45)', inName: 'S. YADAV' } },
      { label: 'Batsman Change',    type: 'BATSMAN_CHANGE',     data: { outName: 'V. KOHLI', outScore: 'RET', inName: 'R. PANT' } },
      { label: 'New Bowler',        type: 'NEW_BOWLER',         data: { title: 'NEW BOWLING SPELL', stats: [{ label: 'BOWLER', value: 'J. BUMRAH' }, { label: 'OVERS SO FAR', value: '0' }] } },
    ],
  },
  {
    label: 'Full Screen',
    color: 'green',
    triggers: [
      { label: 'Playing XI',        type: 'SHOW_SQUADS',        data: { team1Name: 'MUMBAI', team2Name: 'CHENNAI', team1Players: SQUAD_MUMBAI, team2Players: SQUAD_CHENNAI } },
      { label: 'Innings Break',     type: 'INNINGS_BREAK',      data: { chasingTeam: 'CHENNAI', target: 214 } },
      { label: 'Batting Summary',   type: 'BATTING_CARD',       data: { batsmen: SQUAD_MUMBAI.slice(0, 4) } },
      { label: 'Bowling Summary',   type: 'BOWLING_CARD',       data: { bowlers: SQUAD_CHENNAI.filter((p: any) => p.overs > 0) } },
      { label: 'Full Summary',      type: 'BOTH_CARDS',         data: { batsmen: SQUAD_MUMBAI.slice(0, 4), bowlers: SQUAD_CHENNAI.filter((p: any) => p.overs > 0) } },
      { label: 'Match End',         type: 'MATCH_END',          data: { team1: { name: 'MUMBAI', batsmen: SQUAD_MUMBAI, bowlers: SQUAD_MUMBAI.filter((p: any) => p.overs).map((p: any) => ({ ...p, wickets: p.wkts })) }, team2: { name: 'CHENNAI', batsmen: SQUAD_CHENNAI, bowlers: SQUAD_CHENNAI.filter((p: any) => p.overs).map((p: any) => ({ ...p, wickets: p.wkts })) } } },
    ],
  },
];

// ─── Template list ────────────────────────────────────────────────────────────
interface Template { name: string; url: string; level: 1 | 2; }

const ALL_TEMPLATES: Template[] = [
  { name: 'Modern Bar',       url: '/overlays/lvl1-modern-bar.html',           level: 1 },
  { name: 'Solid Edge',       url: '/overlays/lvl1-solid-edge.html',           level: 1 },
  { name: 'Clean Cloud',      url: '/overlays/lvl1-clean-cloud.html',          level: 1 },
  { name: 'Minimal Dark',     url: '/overlays/lvl1-minimal-dark.html',         level: 1 },
  { name: 'Franchise Gold',   url: '/overlays/lvl1-franchise-gold.html',       level: 1 },
  { name: 'Cyber Chevron',    url: '/overlays/lvl1-cyber-chevron.html',        level: 1 },
  { name: 'Retro Teal',       url: '/overlays/lvl1-paper-style.html',          level: 1 },
  { name: 'Yellow Impact',    url: '/overlays/lvl1-yellow-impact.html',        level: 1 },
  { name: 'Classic',          url: '/overlays/lvl1-classic-test.html',         level: 1 },
  { name: 'Broadcast Pro',    url: '/overlays/lvl2-broadcast-pro.html',        level: 2 },
  { name: 'Cyber Glitch',     url: '/overlays/lvl2-cyber-glitch.html',         level: 2 },
  { name: 'Flame Thrower',    url: '/overlays/lvl2-flame-thrower.html',        level: 2 },
  { name: 'Fluid Ribbon',     url: '/overlays/lvl2-Fluid-Ribbon.html',         level: 2 },
  { name: 'Glass Morphism',   url: '/overlays/lvl2-glass-morphism.html',       level: 2 },
  { name: 'Sports Ticker',    url: '/overlays/lvl2-Global-Sports-Ticker.html', level: 2 },
  { name: 'Hologram',         url: '/overlays/lvl2-hologram.html',             level: 2 },
  { name: 'Matrix Rain',      url: '/overlays/lvl2-matrix-rain.html',          level: 2 },
  { name: 'Neon Pulse',       url: '/overlays/lvl2-neon-pulse.html',           level: 2 },
  { name: 'Particle Storm',   url: '/overlays/lvl2-particle-storm.html',       level: 2 },
  { name: 'RGB Split',        url: '/overlays/lvl2-rgb-split.html',            level: 2 },
  { name: 'Water Flow',       url: '/overlays/lvl2-water-flow.html',           level: 2 },
];

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white',
  cyan:   'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white',
  green:  'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PreviewStudio() {
  const [searchParams] = useSearchParams();
  const levelParam   = searchParams.get('level');
  const templateParam = searchParams.get('template');

  const filteredTemplates = levelParam
    ? ALL_TEMPLATES.filter(t => t.level === Number(levelParam))
    : ALL_TEMPLATES;

  const initialTemplate =
    ALL_TEMPLATES.find(t => t.url === templateParam) ||
    filteredTemplates[0] ||
    ALL_TEMPLATES[0];

  const [selectedTemplate, setSelectedTemplate] = useState<Template>(initialTemplate);
  const [filterLevel, setFilterLevel] = useState<'all' | 1 | 2>(
    levelParam ? (Number(levelParam) as 1 | 2) : 'all'
  );
  const [zoom, setZoom] = useState(1); // 1 = fit-to-container
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['Live Action']));
  const [iframeKey, setIframeKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef    = useRef<HTMLIFrameElement>(null);

  const visibleTemplates = filterLevel === 'all'
    ? ALL_TEMPLATES
    : ALL_TEMPLATES.filter(t => t.level === filterLevel);

  // ── Compute ideal scale so 1920×1080 fits the container at zoom=1 ──────────
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setContainerSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) setContainerSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, []);

  const idealScale = containerSize.w > 0
    ? Math.min(containerSize.w / 1920, containerSize.h / 1080)
    : 0.1;

  const effectiveScale = idealScale * zoom;

  // Scroll-to-zoom: grows/shrinks from center, clamped so iframe never exceeds container
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.5, Math.min(4, z * delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Push live score to iframe ───────────────────────────────────────────────
  const pushScore = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'UPDATE_SCORE', data: MOCK_SCORE, raw: MOCK_SCORE }, '*');
  }, []);

  // Push score 600ms after iframe loads
  const handleIframeLoad = useCallback(() => {
    setTimeout(pushScore, 600);
  }, [pushScore]);

  // ── Fire trigger ────────────────────────────────────────────────────────────
  const fireTrigger = useCallback((type: string, data: any = {}) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'OVERLAY_TRIGGER', payload: { type, data } }, '*');
  }, []);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#030305] text-white overflow-hidden">

      {/* ── TOP NAVBAR ── */}
      <div className="h-14 shrink-0 bg-[#0a0a0f] border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <MonitorPlay className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wide">Preview<span className="text-blue-500">Studio</span></h1>
            <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">Broadcast Design Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            <button onClick={() => setZoom(z => Math.max(0.5, z * 0.8))} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-all" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-gray-400 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4, z * 1.25))} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-all" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom(1)} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-all" title="Reset Zoom">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Device mode */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            <button onClick={() => setDeviceMode('desktop')} className={`p-1.5 rounded transition-all ${deviceMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setDeviceMode('mobile')} className={`p-1.5 rounded transition-all ${deviceMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Push score */}
          <button onClick={pushScore} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-all">
            Push Live Data
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR: template list ── */}
        <div className="w-52 shrink-0 bg-[#0a0a0f] border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-800">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-blue-500" /> Templates
            </p>
            <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {(['all', 1, 2] as const).map(lvl => (
                <button key={lvl} onClick={() => {
                  setFilterLevel(lvl);
                  const first = lvl === 'all' ? ALL_TEMPLATES[0] : ALL_TEMPLATES.find(t => t.level === lvl);
                  if (first) { setSelectedTemplate(first); setIframeKey(k => k + 1); }
                }} className={`flex-1 py-1 rounded text-[10px] font-black transition-all ${filterLevel === lvl ? lvl === 2 ? 'bg-purple-600 text-white' : lvl === 1 ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white' : 'text-gray-600 hover:text-white'}`}>
                  {lvl === 'all' ? 'All' : lvl === 1 ? 'Prem' : 'Ent'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {visibleTemplates.map(t => (
              <button key={t.url} onClick={() => { setSelectedTemplate(t); setIframeKey(k => k + 1); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedTemplate.url === t.url
                    ? t.level === 2
                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-900 hover:text-white'
                }`}>
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.level === 2 ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER: iframe canvas ── */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundImage: 'radial-gradient(#1a1a24 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center overflow-hidden cursor-crosshair select-none"
            title="Scroll to zoom"
          >
            {/* Outer clipping box — same aspect ratio as container */}
            <div
              className={`relative bg-black rounded-xl border border-gray-800 shadow-2xl overflow-hidden ${deviceMode === 'mobile' ? 'aspect-[9/16] h-4/5' : 'aspect-video w-full max-w-[90%]'}`}
              style={{ maxHeight: deviceMode === 'desktop' ? '80%' : undefined }}
            >
              <iframe
                ref={iframeRef}
                id="preview-frame"
                key={iframeKey}
                src={selectedTemplate.url + '?preview=true'}
                onLoad={handleIframeLoad}
                style={{
                  width:  '1920px',
                  height: '1080px',
                  position: 'absolute',
                  top:  '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${effectiveScale})`,
                  transformOrigin: 'center center',
                  border: 'none',
                  pointerEvents: 'none',
                }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

          {/* ── TRIGGER GROUPS BAR ── */}
          <div className="shrink-0 bg-[#0a0a0f] border-t border-gray-800 max-h-52 overflow-y-auto">
            {TRIGGER_GROUPS.map(group => (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-900 transition-all border-b border-gray-900"
                >
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{group.label}</span>
                  {openGroups.has(group.label) ? <ChevronDown className="w-3.5 h-3.5 text-gray-600" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-600" />}
                </button>

                {openGroups.has(group.label) && (
                  <div className="px-3 py-2 flex flex-wrap gap-2">
                    {group.triggers.map(trigger => (
                      <button
                        key={trigger.type}
                        onClick={() => fireTrigger(trigger.type, trigger.data)}
                        className={`px-3 py-1.5 border rounded-lg font-bold text-[11px] transition-all active:scale-95 ${COLOR_MAP[group.color]}`}
                      >
                        {trigger.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Always-visible Restore */}
            <div className="px-3 py-2 border-t border-gray-800">
              <button
                onClick={() => fireTrigger('RESTORE')}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <X className="w-3.5 h-3.5" /> Restore Scoreboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
