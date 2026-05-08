import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3, ShieldCheck, Play, ArrowRight,
  Activity, Video, Trophy, Users, Zap,
  Sparkles, ChevronDown, Star,
  Instagram, Youtube,
  MonitorPlay, ExternalLink, Eye, Globe, Radio,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { matchAPI } from '../services/api';
import Carousel from './Carousel';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-sm font-medium text-gray-300 hover:text-white transition relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300" />
    </a>
  );
}

function StatCard({ number, label, icon }: { number: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center p-4 group">
      {icon && <div className="flex justify-center mb-2 text-green-400/60 group-hover:text-green-400 transition-colors">{icon}</div>}
      <div className="text-3xl md:text-4xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>{number}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient, accent }: { icon: React.ReactNode; title: string; desc: string; gradient: string; accent: string }) {
  return (
    <div className={`p-7 rounded-2xl bg-gradient-to-br ${gradient} border border-white/5 hover:border-white/15 transition-all duration-300 group cursor-pointer hover:-translate-y-1`}>
      <div className={`mb-4 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
        style={{ background: accent }}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function TestimonialCard({ name, role, avatar, content, rating }: { name: string; role: string; avatar: string; content: string; rating: number }) {
  return (
    <div className="p-7 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/12 transition-all hover:-translate-y-0.5">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
      </div>
      <p className="text-gray-300 mb-5 leading-relaxed text-sm">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black text-sm"
          style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>{avatar}</div>
        <div>
          <div className="font-bold text-white text-sm">{name}</div>
          <div className="text-xs text-gray-500">{role}</div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, period, features, highlight }: { name: string; price: string; period: string; features: string[]; highlight: boolean }) {
  return (
    <div className={`relative p-7 rounded-2xl transition-all hover:-translate-y-1 ${highlight
      ? 'bg-gradient-to-br from-green-600/15 to-emerald-600/15 border-2 border-green-500/40'
      : 'bg-white/[0.03] border border-white/8 hover:border-white/15'}`}>
      {highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-black text-[10px] font-black rounded-full tracking-wider">MOST POPULAR</div>}
      <h3 className="text-xl font-black mb-1 text-white">{name}</h3>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-4xl font-black text-white">{price}</span>
        <span className="text-gray-500 text-sm">{period}</span>
      </div>
      <ul className="space-y-2.5 mb-7">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
            <div className="w-4 h-4 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            {f}
          </li>
        ))}
      </ul>
      <Link to="/register" className={`block w-full py-3.5 rounded-xl font-bold text-center text-sm transition-all hover:scale-[1.02] ${highlight
        ? 'bg-green-500 hover:bg-green-400 text-black'
        : 'bg-white/8 hover:bg-white/15 text-white border border-white/10'}`}>
        Get Started
      </Link>
    </div>
  );
}

function SocialLink({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/12 hover:text-white transition-all hover:scale-110">
      {icon}
    </a>
  );
}

// ─── Overlay templates list ────────────────────────────────────────────────
const OVERLAY_TEMPLATES = [
  { name: 'Neon Pulse',      category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-neon-pulse.html',      gradient: 'from-green-500 to-cyan-600' },
  { name: 'Broadcast Pro',   category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-broadcast-pro.html',   gradient: 'from-blue-500 to-indigo-700' },
  { name: 'Cyber Glitch',    category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-cyber-glitch.html',    gradient: 'from-pink-500 to-purple-700' },
  { name: 'Water Flow',      category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-water-flow.html',      gradient: 'from-blue-400 to-cyan-600' },
  { name: 'Modern Bar',      category: 'Premium',    level: 1 as const, url: '/overlays/lvl1-modern-bar.html',      gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Franchise Gold',  category: 'Premium',    level: 1 as const, url: '/overlays/lvl1-franchise-gold.html',  gradient: 'from-yellow-500 to-orange-600' },
  { name: 'Hologram',        category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-hologram.html',        gradient: 'from-cyan-500 to-blue-800' },
  { name: 'Matrix Rain',     category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-matrix-rain.html',     gradient: 'from-green-600 to-black' },
  { name: 'Flame Thrower',   category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-flame-thrower.html',   gradient: 'from-orange-500 to-red-700' },
  { name: 'Glass Morphism',  category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-glass-morphism.html',  gradient: 'from-white/10 to-blue-500/20' },
  { name: 'Particle Storm',  category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-particle-storm.html',  gradient: 'from-violet-600 to-indigo-800' },
  { name: 'Solid Edge',      category: 'Premium',    level: 1 as const, url: '/overlays/lvl1-solid-edge.html',      gradient: 'from-gray-500 to-gray-800' },
  { name: 'Minimal Dark',    category: 'Premium',    level: 1 as const, url: '/overlays/lvl1-minimal-dark.html',    gradient: 'from-gray-700 to-black' },
  { name: 'Yellow Impact',   category: 'Premium',    level: 1 as const, url: '/overlays/lvl1-yellow-impact.html',   gradient: 'from-yellow-400 to-amber-600' },
  { name: 'Arctic Ice',      category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-arctic-ice.html',      gradient: 'from-cyan-300 to-blue-600' },
  { name: 'Midnight Gold',   category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-midnight-gold.html',   gradient: 'from-yellow-600 to-black' },
];

const MOCK_SCORE = {
  team1Name: 'MI', team2Name: 'CSK',
  team1Score: 187, team1Wickets: 4, team1Overs: '18.2',
  teamName: 'MI', teamScore: 187, teamWickets: 4, teamOvers: '18.2',
  score: 187, wickets: 4, overs: '18.2',
  strikerName: 'R. Sharma', strikerRuns: 72, strikerBalls: 41,
  nonStrikerName: 'H. Pandya', nonStrikerRuns: 18, nonStrikerBalls: 9,
  bowlerName: 'P. Cummins', bowlerRuns: 28, bowlerWickets: 1, bowlerOvers: '3.1',
  thisOver: [
    { raw: '1', runs: 1, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
    { raw: '4', runs: 4, isWicket: false, isWide: false, isNoBall: false, isFour: true,  isSix: false },
    { raw: 'W', runs: 0, isWicket: true,  isWide: false, isNoBall: false, isFour: false, isSix: false },
    { raw: '6', runs: 6, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: true  },
  ],
};

// ─── Big single-iframe overlay showcase ───────────────────────────────────
function OverlayShowcase() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [scale, setScale] = useState(0.3);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backendBase = (import.meta.env.VITE_API_URL || '').replace('/api/v1', '');

  const selected = OVERLAY_TEMPLATES[selectedIdx];
  const previewSrc = backendBase
    ? `${backendBase}${selected.url}?preview=true`
    : `${selected.url}?preview=true`;

  // Compute scale from actual container width so it always fits perfectly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setScale(Math.min(width / 1920, height / 1080));
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Push mock score data into iframe after it loads
  const pushScore = useCallback(() => {
    const iw = iframeRef.current?.contentWindow;
    if (!iw) return;
    iw.postMessage({ type: 'UPDATE_SCORE', data: MOCK_SCORE, raw: {} }, '*');
  }, []);

  const handleLoad = useCallback(() => {
    setIframeLoaded(true);
    setTimeout(pushScore, 600);
  }, [pushScore]);

  // When template changes update src without remounting iframe
  const prevIdx = useRef(selectedIdx);
  useEffect(() => {
    if (prevIdx.current === selectedIdx) return;
    prevIdx.current = selectedIdx;
    setIframeLoaded(false);
    if (iframeRef.current) {
      const src = backendBase
        ? `${backendBase}${OVERLAY_TEMPLATES[selectedIdx].url}?preview=true`
        : `${OVERLAY_TEMPLATES[selectedIdx].url}?preview=true`;
      iframeRef.current.src = src;
    }
  }, [selectedIdx, backendBase]);

  const prev = () => setSelectedIdx(i => (i - 1 + OVERLAY_TEMPLATES.length) % OVERLAY_TEMPLATES.length);
  const next = () => setSelectedIdx(i => (i + 1) % OVERLAY_TEMPLATES.length);

  return (
    <div className="flex flex-col gap-6 items-center w-full">

      {/* ── Big iframe preview ── */}
      <div className="w-full max-w-4xl mx-auto">
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl"
          style={{ aspectRatio: '16/9' }}
        >
          {/* Loading shimmer */}
          {!iframeLoaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${selected.gradient} opacity-20 flex items-center justify-center z-10`}>
              <Eye className="w-10 h-10 text-white/40 animate-pulse" />
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={previewSrc}
            onLoad={handleLoad}
            title={selected.name}
            className="border-none pointer-events-none absolute"
            style={{
              width: '1920px',
              height: '1080px',
              /* Anchor to center of container, then scale from center */
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          />

          {/* Prev / Next arrows */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white hover:bg-black/90 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white hover:bg-black/90 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Level badge */}
          <div className="absolute top-3 left-3 z-20">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black backdrop-blur-sm ${selected.level === 2 ? 'bg-purple-500/80 text-white' : 'bg-emerald-500/80 text-white'}`}>
              {selected.category}
            </span>
          </div>

          {/* Open in Studio hover CTA */}
          <div className="absolute inset-0 z-20 flex items-end justify-center pb-5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="pointer-events-auto">
              <Link
                to={`/studio?template=${selected.url}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-100 transition shadow-xl"
              >
                <MonitorPlay className="w-4 h-4" /> Open in Studio
              </Link>
            </div>
          </div>
        </div>

        {/* Name + counter below preview */}
        <div className="flex items-center justify-between mt-3 px-1">
          <h4 className="font-black text-white text-base">{selected.name}</h4>
          <span className="text-xs text-gray-500 font-bold">{selectedIdx + 1} / {OVERLAY_TEMPLATES.length}</span>
        </div>
      </div>

      {/* ── Dropdown selector ── */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="relative">
          <select
            value={selectedIdx}
            onChange={e => setSelectedIdx(Number(e.target.value))}
            className="w-full appearance-none bg-white/5 border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-blue-500/50 cursor-pointer hover:bg-white/8 transition"
          >
            {OVERLAY_TEMPLATES.map((t, i) => (
              <option key={t.url} value={i} style={{ background: '#111', color: '#fff' }}>
                {t.name}  —  {t.category}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Dot indicators ── */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
        {OVERLAY_TEMPLATES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === selectedIdx ? 'bg-blue-400 scale-125' : 'bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}

function LiveMatchCard({ match }: { match: any }) {
  const innings = match.innings?.[match.currentInnings - 1] || {};
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 hover:border-green-500/25 transition-all group hover:-translate-y-0.5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live</span>
        <span className="text-[10px] text-gray-600 ml-auto">{match.format} · {match.overs || '?'} ov</span>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-black text-white text-sm">{match.team1?.shortName || match.team1?.name || 'TBD'}</span>
        <span className="text-xl font-black text-green-400">{innings.score ?? '—'}/{innings.wickets ?? '—'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-medium">vs {match.team2?.shortName || match.team2?.name || 'TBD'}</span>
        <span className="text-xs text-gray-600">{innings.overs || '0'}.{(innings.balls || 0) % 6} ov</span>
      </div>
      {match.venue && <p className="text-[11px] text-gray-600 mt-2 truncate">{match.venue}</p>}
    </div>
  );
}

// ─── Main Frontpage ────────────────────────────────────────────────────────
export default function Frontpage() {
  const [scrollY, setScrollY] = useState(0);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    matchAPI.getLiveMatches()
      .then(res => setLiveMatches((res.data.data || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col font-sans selection:bg-green-500/30 overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-black/96 backdrop-blur-xl border-b border-white/6' : 'bg-black/70 backdrop-blur-md'}`}>
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5 shrink-0 cursor-pointer group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)', boxShadow: scrollY > 50 ? '0 0 20px rgba(34,197,94,0.3)' : 'none' }}>
                  <Zap className="w-5 h-5 text-black" fill="currentColor" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight leading-none block" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>SCOREX</span>
                <span className="text-[8px] text-green-400/50 font-medium tracking-[0.25em] uppercase">Live Scoring</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-7 mx-6">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#live">Live</NavLink>
              <NavLink href="#overlays">Overlays</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/studio"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.03]"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}>
                <MonitorPlay className="w-3.5 h-3.5" /> Studio
              </Link>
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition px-3 py-1.5">Sign In</Link>
              <Link to="/register"
                className="px-4 py-2 text-black text-sm font-bold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Ticker ── */}
      <div className={`fixed top-16 left-0 right-0 z-40 h-8 transition-all duration-500 ${scrollY > 50 ? 'bg-black/96 backdrop-blur-xl' : 'bg-black/60 backdrop-blur-sm'}`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="container mx-auto h-full px-4 lg:px-6">
          <Carousel />
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative pt-32 pb-24 px-6 flex flex-col justify-center overflow-hidden min-h-screen">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 48V0M48 0H0' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='1'/%3E%3C/svg%3E\")" }} />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-2/3 left-2/3 w-64 h-64 bg-purple-600/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/4 border border-white/8 text-green-400 text-xs font-bold uppercase tracking-widest mb-10 hover:bg-white/8 transition cursor-pointer">
            <Radio className="w-3 h-3 animate-pulse" /> Live Cricket Broadcasting Platform <Sparkles className="w-3 h-3 opacity-50" />
          </div>

          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)', boxShadow: '0 0 60px rgba(34,197,94,0.4)' }}>
                <Zap className="w-8 h-8 text-black" fill="currentColor" />
              </div>
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-15"
                style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }} />
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black mb-6 leading-[0.88] tracking-tight"
            style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
            <span className="text-white">NEXT</span><br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg,#22c55e,#10b981,#06b6d4)' }}>GEN</span><br />
            <span className="text-white text-4xl sm:text-6xl md:text-7xl">CRICKET</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Professional live scoring, <span className="text-white font-semibold">TV-grade broadcast overlays</span>, and{' '}
            <span className="text-white font-semibold">deep tournament analytics</span> — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/register"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 font-bold rounded-2xl transition-all text-black"
              style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)', boxShadow: '0 0 40px rgba(34,197,94,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 60px rgba(34,197,94,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 40px rgba(34,197,94,0.4)')}>
              Start Tournament Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/studio"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all"
              style={{ background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              <MonitorPlay className="w-5 h-5" /> Try Overlay Studio
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <StatCard number="10K+" label="Tournaments"    icon={<Trophy className="w-5 h-5" />} />
            <StatCard number="500K+" label="Matches Scored" icon={<Activity className="w-5 h-5" />} />
            <StatCard number="21"    label="Overlay Templates" icon={<Video className="w-5 h-5" />} />
            <StatCard number="99.9%" label="Uptime"         icon={<Globe className="w-5 h-5" />} />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-40">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* ── Live Matches ── */}
      <section id="live" className="relative py-20 px-6" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7))' }}>
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-2xl sm:text-3xl font-black" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>Live Now</h2>
            </div>
            <Link to="/login" className="flex items-center gap-1.5 text-sm text-green-400 font-bold hover:text-green-300 transition">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveMatches.map(m => <LiveMatchCard key={m._id} match={m} />)}
            </div>
          ) : (
            <div className="py-14 text-center border border-dashed border-white/8 rounded-2xl">
              <Activity className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 font-bold mb-1 text-sm">No live matches right now</p>
              <p className="text-gray-700 text-xs mb-4">Check back during match hours</p>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
                Start Your Own Match <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-28 px-6 bg-black">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)' }} />
        </div>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-green-400 text-xs font-black uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
              Everything You Need
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
              Run professional cricket tournaments from scoring to broadcasting — no extra tools needed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={<Video className="w-6 h-6 text-cyan-300" />}     title="Broadcast Overlays"    accent="rgba(6,182,212,0.15)"   gradient="from-cyan-500/10 to-blue-500/10"   desc="21 OBS-ready animated overlay templates — from clean scoreboards to full IPL-style broadcast graphics." />
            <FeatureCard icon={<BarChart3 className="w-6 h-6 text-purple-300" />} title="Deep Analytics"      accent="rgba(168,85,247,0.15)"  gradient="from-purple-500/10 to-pink-500/10" desc="Run rate graphs, NRR, player stats, wagon wheels, and over-by-over breakdowns in real time." />
            <FeatureCard icon={<Zap className="w-6 h-6 text-green-300" />}       title="Live Scoring Engine"  accent="rgba(34,197,94,0.15)"   gradient="from-green-500/10 to-emerald-500/10" desc="Ball-by-ball scoring with socket updates, undo, extras, wickets, and instant strike rotation." />
            <FeatureCard icon={<Trophy className="w-6 h-6 text-yellow-300" />}   title="Tournament Management" accent="rgba(234,179,8,0.15)"  gradient="from-yellow-500/10 to-orange-500/10" desc="Round robin, knockout, and league formats with automatic bracket generation and points tables." />
            <FeatureCard icon={<Users className="w-6 h-6 text-blue-300" />}      title="Team & Club System"   accent="rgba(59,130,246,0.15)"  gradient="from-blue-500/10 to-cyan-500/10"   desc="Manage teams, players, clubs, memberships, and friend lists — all from one dashboard." />
            <FeatureCard icon={<ShieldCheck className="w-6 h-6 text-red-300" />} title="Secure & Scalable"    accent="rgba(239,68,68,0.15)"   gradient="from-red-500/10 to-pink-500/10"    desc="Role-based access for scorers, organizers, and admins. JWT auth with Google OAuth support." />
          </div>
        </div>
      </section>

      {/* ── Overlay Showcase ── */}
      <section id="overlays" className="relative py-28 px-6" style={{ background: 'linear-gradient(180deg, #000, #030305)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)' }} />
        </div>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-3">21 Templates</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
              Broadcast Overlays
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              Professional OBS overlays that make any match look like a TV broadcast. Use the dropdown to browse all templates.
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-10">
            <Link to="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              <MonitorPlay className="w-4 h-4" /> Open Full Preview Studio
            </Link>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition text-sm">
              Get Access <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Single big iframe showcase */}
          <OverlayShowcase />
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="relative py-28 px-6 bg-black">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-3">Reviews</p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
              Loved by Organizers
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TestimonialCard name="Rahul Sharma"  role="Cricket Club Owner"   avatar="RS" rating={5} content="ScoreX completely changed how we run our club tournaments. The live scoring and overlays are professional grade." />
            <TestimonialCard name="Michael Chen"  role="Tournament Director"  avatar="MC" rating={5} content="The broadcast overlays are stunning. Our YouTube stream looks like an IPL broadcast now. Incredible product." />
            <TestimonialCard name="Priya Reddy"   role="Sports Academy Coach" avatar="PR" rating={5} content="Best platform for amateur cricket. Easy setup, beautiful overlays, and the analytics help me track player progress." />
            <TestimonialCard name="David Patel"   role="League Organizer"     avatar="DP" rating={5} content="We manage 40+ teams across 3 tournaments simultaneously. ScoreX handles it all without a single issue." />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative py-28 px-6" style={{ background: 'linear-gradient(180deg, #000, #030305)' }}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <p className="text-green-400 text-xs font-black uppercase tracking-widest mb-3">Simple Pricing</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
              Start Free
            </h2>
            <p className="text-gray-400 text-sm">Upgrade when you need broadcast-quality overlays and advanced features.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <PricingCard name="Free" price="₹0" period="/month" highlight={false} features={[
              'Up to 3 tournaments', 'Basic live scoring', '5 overlay templates', 'Community support', 'Points table & bracket',
            ]} />
            <PricingCard name="Premium" price="₹499" period="/month" highlight={true} features={[
              'Unlimited tournaments', 'All 9 premium overlays', 'Full overlay studio', 'Match analytics & NRR', 'Priority support', 'Export data CSV',
            ]} />
            <PricingCard name="Enterprise" price="₹999" period="/month" highlight={false} features={[
              'Everything in Premium', 'All 21 overlay templates', 'Custom branding', 'Club management', 'API access', 'Dedicated support',
            ]} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 px-6 overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-green-600/6 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto text-center relative z-10 max-w-2xl">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-5"
            style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
            Ready to <span style={{ color: '#22c55e' }}>Level Up?</span>
          </h2>
          <p className="text-gray-400 mb-10 text-sm leading-relaxed">
            Join tournament organizers who trust ScoreX for professional cricket broadcasting.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-3 px-9 py-4 bg-white text-black font-bold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] text-sm">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/studio"
              className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full font-bold transition-all hover:scale-[1.03] text-sm"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              <MonitorPlay className="w-4 h-4" /> Preview Overlays
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-black py-14 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
                  <Zap className="w-4 h-4 text-black" fill="currentColor" />
                </div>
                <span className="font-black text-lg" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>SCOREX</span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                Professional cricket scoring and tournament management with broadcast-quality overlays.
              </p>
              <div className="flex gap-2">
                <SocialLink icon={<Youtube className="w-3.5 h-3.5" />} href="https://www.youtube.com/@ScoreX-Live" label="YouTube" />
                <SocialLink icon={<Instagram className="w-3.5 h-3.5" />} href="https://www.instagram.com/scorex_live?igsh=MWZkdzA1ZTN0b2xmZw==" label="Instagram" />
                <SocialLink icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>} href="https://www.facebook.com/share/1CoY1Sfmki/" label="Facebook" />
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm">Product</h4>
              <ul className="space-y-2.5 text-gray-500 text-xs">
                <li><a href="#features" className="hover:text-green-400 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-green-400 transition">Pricing</a></li>
                <li><Link to="/studio" className="hover:text-green-400 transition">Overlay Studio</Link></li>
                <li><a href="#overlays" className="hover:text-green-400 transition">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm">Platform</h4>
              <ul className="space-y-2.5 text-gray-500 text-xs">
                <li><Link to="/register" className="hover:text-green-400 transition">Get Started</Link></li>
                <li><Link to="/login" className="hover:text-green-400 transition">Sign In</Link></li>
                <li><a href="#live" className="hover:text-green-400 transition">Live Matches</a></li>
                <li><a href="#testimonials" className="hover:text-green-400 transition">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm">Legal</h4>
              <ul className="space-y-2.5 text-gray-500 text-xs">
                <li><Link to="/privacy" className="hover:text-green-400 transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-green-400 transition">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-600 text-xs">© 2026 ScoreX. All rights reserved.</p>
            <p className="text-gray-700 text-xs">Built for cricket. Designed for broadcast.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}