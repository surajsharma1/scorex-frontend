import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
 MonitorPlay, X, Layout, Smartphone, Monitor,
 ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronUp, Menu
} from 'lucide-react';

const SQUAD_MUMBAI = [
 { name: 'R. Sharma', runs: 45, balls: 28, fours: 4, sixes: 2, sr: 160.7, role: '(C)', overs: 0, maidens: 0, wkts: 0, econ: 0 },
 { name: 'V. Kohli', runs: 82, balls: 45, fours: 8, sixes: 3, sr: 182.2, role: '', overs: 0, maidens: 0, wkts: 0, econ: 0 },
 { name: 'H. Pandya', runs: 24, balls: 12, fours: 1, sixes: 2, sr: 200.0, role: '', overs: 3, maidens: 0, wkts: 1, econ: 8.5 },
 { name: 'R. Jadeja', runs: 10, balls: 5, fours: 1, sixes: 0, sr: 200.0, role: '', overs: 4, maidens: 0, wkts: 2, econ: 6.0 },
 { name: 'J. Bumrah', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, role: '', overs: 4, maidens: 1, wkts: 3, econ: 5.0 },
 { name: 'M. Siraj', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, role: '', overs: 4, maidens: 0, wkts: 1, econ: 8.0 },
];
const SQUAD_CHENNAI = [
 { name: 'T. Head', runs: 65, balls: 30, fours: 6, sixes: 4, sr: 216.6, role: '', overs: 0, maidens: 0, wkts: 0, econ: 0 },
 { name: 'P. Cummins', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, role: '(C)', overs: 4, maidens: 0, wkts: 2, econ: 8.5 },
 { name: 'M. Starc', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, role: '', overs: 4, maidens: 0, wkts: 1, econ: 8.0 },
 { name: 'A. Zampa', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, role: '', overs: 4, maidens: 0, wkts: 3, econ: 6.5 },
];

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
 { raw: 'W', runs: 0, isWicket: true, isWide: false, isNoBall: false, isFour: false, isSix: false },
 { raw: '4', runs: 4, isWicket: false, isWide: false, isNoBall: false, isFour: true, isSix: false },
 { raw: '6', runs: 6, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: true },
 { raw: '\u2022', runs: 0, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
 { raw: '1', runs: 1, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
 ],
 sponsors: [{ name: 'TATA', tagline: 'Power of We' }, { name: 'DREAM11', tagline: '' }],
};

const TRIGGER_GROUPS = [
 {
 label: 'MATCH STARTUP', color: 'blue',
 triggers: [
 { label: 'VS Screen', type: 'VS_SCREEN', data: { team1: 'MUMBAI', team2: 'CHENNAI' } },
 { label: 'Toss Result', type: 'SHOW_TOSS', data: { text: 'MUMBAI WON TOSS & BOWL' } },
 { label: 'Innings Intro', type: 'START_INNINGS_INTRO', data: {} },
 ],
 },
 {
 label: 'LIVE ACTION', color: 'cyan',
 triggers: [
 { label: 'FOUR (4)', type: 'FOUR', data: {} },
 { label: 'SIX (6)', type: 'SIX', data: {} },
 { label: 'WICKET', type: 'WICKET', data: {} },
 { label: '3rd Umpire', type: 'DECISION_PENDING', data: {} },
 { label: '50 Runs', type: '50_RUNS', data: { playerName: 'R. SHARMA' } },
 { label: '100 Runs', type: '100_RUNS', data: { playerName: 'R. SHARMA' } },
 ],
 },
 {
 label: 'PLAYER EVENTS', color: 'purple',
 triggers: [
 { label: 'Batsman Profile', type: 'BATSMAN_PROFILE', data: { title: 'CURRENT BATSMAN', stats: [{ label: 'BATSMAN', value: 'R. SHARMA' }, { label: 'RUNS', value: '82 (45)' }, { label: 'SR', value: '182.2' }] } },
 { label: 'Bowler Profile', type: 'BOWLER_PROFILE', data: { title: 'CURRENT BOWLING', stats: [{ label: 'BOWLER', value: 'P. CUMMINS' }, { label: 'FIGURES', value: '1–34' }, { label: 'ECON', value: '10.2' }] } },
 { label: 'Wicket Out', type: 'WICKET_SWITCH', data: { outName: 'R. SHARMA', outScore: '82 (45)', inName: 'S. YADAV' } },
 { label: 'New Bowler', type: 'NEW_BOWLER', data: { title: 'NEW SPELL', stats: [{ label: 'BOWLER', value: 'J. BUMRAH' }] } },
 ],
 },
 {
 label: 'FULL SCREEN', color: 'green',
 triggers: [
 { label: 'Playing XI', type: 'SHOW_SQUADS', data: { team1Name: 'MUMBAI', team2Name: 'CHENNAI', team1Players: SQUAD_MUMBAI, team2Players: SQUAD_CHENNAI } },
 { label: 'Innings Break', type: 'INNINGS_BREAK', data: { chasingTeam: 'CHENNAI', target: 214 } },
 { label: 'Batting Card', type: 'BATTING_CARD', data: { batsmen: SQUAD_MUMBAI.slice(0, 4) } },
 { label: 'Bowling Card', type: 'BOWLING_CARD', data: { bowlers: SQUAD_CHENNAI.filter((p: any) => p.overs > 0) } },
 { label: 'Both Cards', type: 'BOTH_CARDS', data: { batsmen: SQUAD_MUMBAI.slice(0, 4), bowlers: SQUAD_CHENNAI.filter((p: any) => p.overs > 0) } },
 { label: 'Match End', type: 'MATCH_END', data: { team1: { name: 'MUMBAI', batsmen: SQUAD_MUMBAI }, team2: { name: 'CHENNAI', batsmen: SQUAD_CHENNAI } } },
 ],
 },
];

interface Template { name: string; url: string; level: 1 | 2; }

const ALL_TEMPLATES: Template[] = [
 { name: 'Modern Bar', url: '/overlays/lvl1-modern-bar.html', level: 1 },
 { name: 'Solid Edge', url: '/overlays/lvl1-solid-edge.html', level: 1 },
 { name: 'Clean Cloud', url: '/overlays/lvl1-clean-cloud.html', level: 1 },
 { name: 'Minimal Dark', url: '/overlays/lvl1-minimal-dark.html', level: 1 },
 { name: 'Franchise Gold', url: '/overlays/lvl1-franchise-gold.html', level: 1 },
 { name: 'Cyber Chevron', url: '/overlays/lvl1-cyber-chevron.html', level: 1 },
 { name: 'Retro Teal', url: '/overlays/lvl1-paper-style.html', level: 1 },
 { name: 'Yellow Impact', url: '/overlays/lvl1-yellow-impact.html', level: 1 },
 { name: 'Classic', url: '/overlays/lvl1-classic-test.html', level: 1 },
 { name: 'Broadcast Pro', url: '/overlays/lvl2-broadcast-pro.html', level: 2 },
 { name: 'Cyber Glitch', url: '/overlays/lvl2-cyber-glitch.html', level: 2 },
 { name: 'Flame Thrower', url: '/overlays/lvl2-flame-thrower.html', level: 2 },
 { name: 'Fluid Ribbon', url: '/overlays/lvl2-Fluid-Ribbon.html', level: 2 },
 { name: 'Glass Morphism', url: '/overlays/lvl2-glass-morphism.html', level: 2 },
 { name: 'Sports Ticker', url: '/overlays/lvl2-Global-Sports-Ticker.html', level: 2 },
 { name: 'Hologram', url: '/overlays/lvl2-hologram.html', level: 2 },
 { name: 'Matrix Rain', url: '/overlays/lvl2-matrix-rain.html', level: 2 },
 { name: 'Neon Pulse', url: '/overlays/lvl2-neon-pulse.html', level: 2 },
 { name: 'Particle Storm', url: '/overlays/lvl2-particle-storm.html', level: 2 },
 { name: 'RGB Split', url: '/overlays/lvl2-rgb-split.html', level: 2 },
 { name: 'Water Flow', url: '/overlays/lvl2-water-flow.html', level: 2 },
];

const COLOR_MAP: Record<string, string> = {
 blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white',
 cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white',
 purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white',
 green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white',
};

export default function PreviewStudio() {
 const [searchParams] = useSearchParams();
 const levelParam = searchParams.get('level');
 const templateParam = searchParams.get('template');

 const initialTemplate =
 ALL_TEMPLATES.find(t => t.url === templateParam) ||
 (levelParam ? ALL_TEMPLATES.find(t => t.level === Number(levelParam)) : null) ||
 ALL_TEMPLATES[0];

 const [selectedTemplate, setSelectedTemplate] = useState<Template>(initialTemplate);
 const [filterLevel, setFilterLevel] = useState<'all' | 1 | 2>(
 levelParam ? (Number(levelParam) as 1 | 2) : 'all'
 );
 const [zoom, setZoom] = useState(1);
 const [iframeKey, setIframeKey] = useState(0);
 const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['LIVE ACTION']));
 // ✅ Mobile sidebar toggle
 const [sidebarOpen, setSidebarOpen] = useState(false);

 const containerRef = useRef<HTMLDivElement>(null);
 const iframeRef = useRef<HTMLIFrameElement>(null);

 const visibleTemplates = filterLevel === 'all'
 ? ALL_TEMPLATES
 : ALL_TEMPLATES.filter(t => t.level === filterLevel);

 // ── Scale computation ───────────────────────────────────────────────────────
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

 const idealScale = containerSize.w > 0 ? Math.min(containerSize.w / 1920, containerSize.h / 1080) : 0.1;
 const effectiveScale = idealScale * zoom;

 // ── Scroll-to-zoom ──────────────────────────────────────────────────────────
 const handleWheel = useCallback((e: WheelEvent) => {
 e.preventDefault();
 setZoom(z => Math.max(0.3, Math.min(4, z * (e.deltaY > 0 ? 0.9 : 1.1))));
 }, []);
 useEffect(() => {
 const el = containerRef.current;
 if (!el) return;
 el.addEventListener('wheel', handleWheel, { passive: false });
 return () => el.removeEventListener('wheel', handleWheel);
 }, [handleWheel]);

 // ── Push live score ─────────────────────────────────────────────────────────
 const pushScore = useCallback(() => {
 const iframe = iframeRef.current;
 if (!iframe?.contentWindow) return;
 iframe.contentWindow.postMessage({ type: 'UPDATE_SCORE', data: MOCK_SCORE, raw: MOCK_SCORE }, '*');
 // Also dispatch sponsors
 iframe.contentWindow.postMessage({ type: 'UPDATE_SPONSORS', sponsors: MOCK_SCORE.sponsors, duration: 6 }, '*');
 }, []);

 const handleIframeLoad = useCallback(() => {
 setTimeout(pushScore, 500);
 }, [pushScore]);

 // ── Fire trigger ────────────────────────────────────────────────────────────
 const fireTrigger = useCallback((type: string, data: any = {}) => {
 const iframe = iframeRef.current;
 if (!iframe?.contentWindow) return;
 iframe.contentWindow.postMessage({ type: 'OVERLAY_TRIGGER', payload: { type, data } }, '*');
 }, []);

 // ✅ RESTORE works by posting RESTORE trigger type
 const handleRestore = useCallback(() => {
 fireTrigger('RESTORE', {});
 }, [fireTrigger]);

 const toggleGroup = (label: string) => {
 setOpenGroups(prev => {
 const next = new Set(prev);
 next.has(label) ? next.delete(label) : next.add(label);
 return next;
 });
 };

 const selectTemplate = (t: Template) => {
 setSelectedTemplate(t);
 setIframeKey(k => k + 1);
 setSidebarOpen(false); // close sidebar on mobile after selection
 };

 return (
 <div className="flex flex-col h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>


 {/* ── TOP NAV ── */}
 <div className="h-14 flex items-center justify-between px-2 sm:px-4 shrink-0 shadow-md relative z-10"
 style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>

 <div className="flex items-center gap-2 min-w-0">
 {/* ✅ Mobile hamburger to open sidebar */}
 <button
 className="md:hidden p-2 rounded-lg flex-shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
 onClick={() => setSidebarOpen(o => !o)}
 >
 <Menu className="w-4 h-4" />
 </button>
 <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
 <MonitorPlay className="w-4 h-4 text-white" />
 </div>
 <div className="hidden sm:block min-w-0">
 <h1 className="text-sm font-black tracking-wide truncate">Preview<span className="text-blue-500">Studio</span></h1>
 <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Broadcast Design Editor</p>
 </div>
 </div>

 <div className="flex items-center gap-1.5 flex-shrink-0">
 {/* Zoom controls */}
 <div className="flex items-center gap-0.5 rounded-lg p-1 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
 <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} className="p-1.5 rounded transition-all" style={{ color: 'var(--text-muted)' }}>
 <ZoomOut className="w-3.5 h-3.5" />
 </button>
 <span className="text-xs font-bold w-10 text-center tabular-nums" style={{ color: 'var(--text-secondary)' }}>{Math.round(zoom * 100)}%</span>
 <button onClick={() => setZoom(z => Math.min(4, z * 1.25))} className="p-1.5 rounded transition-all" style={{ color: 'var(--text-muted)' }}>
 <ZoomIn className="w-3.5 h-3.5" />
 </button>
 <button onClick={() => setZoom(1)} className="p-1.5 rounded transition-all" style={{ color: 'var(--text-muted)' }}>
 <RotateCcw className="w-3.5 h-3.5" />
 </button>
 </div>

 <button onClick={pushScore} className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-all whitespace-nowrap">
 Push Data
 </button>

 {/* ✅ RESTORE always visible in navbar on mobile */}
 <button
 onClick={handleRestore}
 className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
 >
 <X className="w-3 h-3" /> Restore
 </button>
 </div>
 </div>

 <div className="flex-1 flex overflow-hidden relative">

 {/* ✅ Mobile overlay backdrop */}
 {sidebarOpen && (
 <div
 className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
 onClick={() => setSidebarOpen(false)}
 />
 )}

 {/* ── LEFT SIDEBAR ── */}
 <div className={`
 w-52 shrink-0 flex flex-col overflow-hidden border-r
 md:relative md:translate-x-0 md:z-auto
 fixed inset-y-0 left-0 z-50 transition-transform duration-300
 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
 `} style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', top: '56px' }}>

 <div className="p-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
 <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
 <Layout className="w-3.5 h-3.5 text-blue-500" /> Templates
 </p>
 <div className="flex gap-1 rounded-lg p-1 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
 {(['all', 1, 2] as const).map(lvl => (
 <button key={lvl} onClick={() => {
 setFilterLevel(lvl);
 const first = lvl === 'all' ? ALL_TEMPLATES[0] : ALL_TEMPLATES.find(t => t.level === lvl);
 if (first) selectTemplate(first);
 }} className={`flex-1 py-1 rounded text-[10px] font-black transition-all ${
 filterLevel === lvl
 ? lvl === 2 ? 'bg-purple-600 text-white' : lvl === 1 ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
 : 'transition-colors'
 }`}
 style={filterLevel !== lvl ? { color: 'var(--text-muted)' } : {}}>
 {lvl === 'all' ? 'All' : lvl === 1 ? 'Prem' : 'Ent'}
 </button>
 ))}
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
 {visibleTemplates.map(t => (
 <button key={t.url} onClick={() => selectTemplate(t)}
 className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
 selectedTemplate.url === t.url
 ? t.level === 2
 ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
 : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
 : 'border-transparent transition-all'
 }`}
 style={selectedTemplate.url !== t.url ? { color: 'var(--text-secondary)' } : {}}>
 <span className="flex items-center gap-1.5">
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.level === 2 ? 'bg-purple-400' : 'bg-emerald-400'}`} />
 {t.name}
 </span>
 </button>
 ))}
 </div>
 </div>

 {/* ── CENTER: canvas + triggers ── */}
 <div className="flex-1 flex flex-col overflow-hidden min-w-0" 
 style={{ 
 backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', 
 backgroundSize: '20px 20px', 
 backgroundColor: 'var(--bg-elevated)' 
 }}>


 {/* Canvas */}
 <div
 ref={containerRef}
 className="flex-1 flex items-center justify-center overflow-hidden cursor-crosshair select-none p-2"
 >
 <div
 className="relative bg-black rounded-xl border shadow-2xl overflow-hidden w-full"
 style={{ aspectRatio: '16/9', maxHeight: '100%' }}
 >
 <iframe
 ref={iframeRef}
 id="preview-frame"
 key={iframeKey}
 src={selectedTemplate.url + '?preview=true'}
 onLoad={handleIframeLoad}
 style={{
 width: '1920px', height: '1080px',
 position: 'absolute', top: '50%', left: '50%',
 transform: `translate(-50%, -50%) scale(${effectiveScale})`,
 transformOrigin: 'center center',
 border: 'none', pointerEvents: 'none',
 }}
 sandbox="allow-scripts allow-same-origin"
 />
 </div>
 </div>

 {/* ── TRIGGER GROUPS — scrollable, mobile friendly ── */}
 <div className="shrink-0 border-t overflow-y-auto" style={{ maxHeight: '45vh', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>

 {TRIGGER_GROUPS.map(group => (
 <div key={group.label}>
 <button
 onClick={() => toggleGroup(group.label)}
 className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-all border-b sticky top-0 z-10" style={{ background: 'var(--bg-card)' }}
 >
 <span className="text-[10px] font-black uppercase tracking-widest">{group.label}</span>
 {openGroups.has(group.label)
 ? <ChevronDown className="w-3.5 h-3.5 " />
 : <ChevronUp className="w-3.5 h-3.5 " />}
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

 {/* ✅ Restore Scoreboard — always at bottom, full width */}
 <div className="px-3 py-2 border-t sticky bottom-0 " style={{ background: 'var(--bg-card)' }}>
 <button
 onClick={handleRestore}
 className="w-full py-2.5 hover:bg-white/5 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2"
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