import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  BarChart3, ShieldCheck, Play, ArrowRight,
  Activity, Video, Trophy, Users, Zap,
  Globe, Sparkles, ChevronDown, Star,
  Twitter, Instagram, Youtube, Github,
  MonitorPlay, ExternalLink, Eye
} from 'lucide-react';
import { matchAPI } from '../services/api';
import Carousel from './Carousel'; // ADDED CAROUSEL IMPORT

// ... (Sub-components: NavLink, StatCard, SectionHeader, FeatureCard, TestimonialCard, PricingCard, SocialLink, OverlayCard, LiveMatchCard remain exactly the same) ...

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-sm font-medium text-gray-300 hover:text-white transition relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300" />
    </a>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-3xl md:text-4xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>{number}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>{title}</h2>
      <p className="text-xl text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient }: { icon: React.ReactNode; title: string; desc: string; gradient: string }) {
  return (
    <div className={`p-8 rounded-3xl bg-gradient-to-br ${gradient} border border-white/5 hover:border-white/10 transition group cursor-pointer`}>
      <div className="mb-5 bg-black/30 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function TestimonialCard({ name, role, avatar, content, rating }: { name: string; role: string; avatar: string; content: string; rating: number }) {
  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-500 to-emerald-500 flex items-center justify-center font-bold text-black">{avatar}</div>
        <div>
          <div className="font-bold text-white">{name}</div>
          <div className="text-sm text-gray-500">{role}</div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, period, features, highlight }: { name: string; price: string; period: string; features: string[]; highlight: boolean }) {
  return (
    <div className={`relative p-8 rounded-3xl transition ${highlight ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50' : 'bg-white/5 border border-white/10'}`}>
      {highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-black text-xs font-bold rounded-full">POPULAR</div>}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-5xl font-black">{price}</span>
        <span className="text-gray-400">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-gray-300">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            {feature}
          </li>
        ))}
      </ul>
      <Link to="/register" className={`block w-full py-4 rounded-xl font-bold text-center transition ${highlight ? 'bg-green-600 hover:bg-green-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
        Get Started
      </Link>
    </div>
  );
}

function SocialLink({ icon }: { icon: React.ReactNode }) {
  return (
    <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition">
      {icon}
    </a>
  );
}

function OverlayCard({ name, category, level, url, gradient }: { name: string; category: string; level: 1 | 2; url: string; gradient: string }) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use the static overlay URL directly with ?preview=true
  // engine.js detects preview=true and loads demo data immediately
  const backendBase = (import.meta.env.VITE_API_URL || '').replace('/api/v1', '');
  const previewSrc = backendBase
    ? `${backendBase}${url}?preview=true`
    : `${url}?preview=true`;

  const handleLoad = () => {
    setLoaded(true);
    // Push rich mock score data after iframe loads so balls/players render
    setTimeout(() => {
      if (!iframeRef.current?.contentWindow) return;
      const MOCK_SCORE = {
        team1Name: 'MI', team1ShortName: 'MI',
        team2Name: 'CSK', team2ShortName: 'CSK',
        team1Score: 187, team1Wickets: 4, team1Overs: '18.2',
        teamName: 'MI', teamScore: 187, teamWickets: 4, teamOvers: '18.2',
        // lvl2 IDs
        score: 187, wickets: 4, overs: '18.2',
        strikerName: 'R. Sharma', strikerRuns: 72, strikerBalls: 41,
        nonStrikerName: 'H. Pandya', nonStrikerRuns: 18, nonStrikerBalls: 9,
        bowlerName: 'P. Cummins', bowlerRuns: 28, bowlerWickets: 1, bowlerOvers: '3.1',
        // lvl2 IDs
        striker: 'R. Sharma', 's-runs': 72, 's-balls': 41,
        nonstriker: 'H. Pandya', 'ns-runs': 18, 'ns-balls': 9,
        bowler: 'P. Cummins', 'b-wkts': 1, 'b-runs': 28, 'b-ov': '3.1',
        'bat-team': 'MI', 'bowl-team': 'CSK',
        thisOver: [
          { raw: '1',  runs: 1, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
          { raw: '4',  runs: 4, isWicket: false, isWide: false, isNoBall: false, isFour: true,  isSix: false },
          { raw: 'W',  runs: 0, isWicket: true,  isWide: false, isNoBall: false, isFour: false, isSix: false },
          { raw: '\u2022', runs: 0, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
          { raw: '6',  runs: 6, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: true  },
          { raw: '1',  runs: 1, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
        ],
      };
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_SCORE', data: MOCK_SCORE, raw: MOCK_SCORE }, '*');
    }, 800);
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-white/5 hover:border-white/20 transition cursor-pointer">
      {/* Iframe preview */}
      <div className="aspect-video relative bg-black overflow-hidden">
        {/* Gradient overlay shows until iframe loads */}
        {!loaded && (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-30 flex items-center justify-center`}>
            <Eye className="w-8 h-8 text-white/60 animate-pulse" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={previewSrc}
          className="border-none pointer-events-none"
          style={{
            width: '1920px',
            height: '1080px',
            transform: 'scale(0.208333)',
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          onLoad={handleLoad}
          title={name}
        />
        {/* Plan badge */}
        <div className="absolute top-2 right-2 z-10">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black backdrop-blur-sm ${level === 2 ? 'bg-purple-500/80 text-white' : 'bg-emerald-500/80 text-white'}`}>
            {category}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 flex items-center justify-between gap-2">
        <h4 className="font-bold text-white text-sm truncate">{name}</h4>
        <Link
          to={`/studio?template=${url}`}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/40 text-xs font-bold transition"
        >
          <MonitorPlay className="w-3 h-3" /> Studio
        </Link>
      </div>
    </div>
  );
}

function LiveMatchCard({ match }: { match: any }) {
  const innings = match.innings?.[match.currentInnings - 1] || {};
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-green-500/30 transition group">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live</span>
        <span className="text-[10px] text-gray-600 ml-auto">{match.format} · {match.overs || '?'} ov</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-black text-white">{match.team1?.shortName || match.team1?.name || 'TBD'}</span>
        <span className="text-2xl font-black text-green-400">{innings.score ?? '—'}/{innings.wickets ?? '—'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-medium">vs {match.team2?.shortName || match.team2?.name || 'TBD'}</span>
        <span className="text-xs text-gray-500">{innings.overs || '0'}.{(innings.balls || 0) % 6} ov</span>
      </div>
      {match.venue && <p className="text-[11px] text-gray-600 mt-2">{match.venue}</p>}
    </div>
  );
}

// ─── Main Frontpage ───────────────────────────────────────────────────────────
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

  const overlayShowcase = [
    { name: 'Neon Pulse',     category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-neon-pulse.html',      gradient: 'from-green-500 to-cyan-600' },
    { name: 'Broadcast Pro',  category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-broadcast-pro.html',   gradient: 'from-blue-500 to-indigo-700' },
    { name: 'Cyber Glitch',   category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-cyber-glitch.html',    gradient: 'from-pink-500 to-purple-700' },
    { name: 'Water Flow',     category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-water-flow.html',      gradient: 'from-blue-400 to-cyan-600' },
    { name: 'Modern Bar',     category: 'Premium',    level: 1 as const, url: '/overlays/lvl1-modern-bar.html',      gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Franchise Gold', category: 'Premium',    level: 1 as const, url: '/overlays/lvl1-franchise-gold.html',  gradient: 'from-yellow-500 to-orange-600' },
    { name: 'Hologram',       category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-hologram.html',        gradient: 'from-cyan-500 to-blue-800' },
    { name: 'Matrix Rain',    category: 'Enterprise', level: 2 as const, url: '/overlays/lvl2-matrix-rain.html',     gradient: 'from-green-600 to-black' },
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col font-sans selection:bg-green-500/30 overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-black/95 backdrop-blur-xl border-b border-white/5' : 'bg-black/80 backdrop-blur-sm'}`}>
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 group cursor-pointer shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-all" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                  <Zap className="w-6 h-6 text-black" fill="currentColor" />
                </div>

                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight leading-none" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>SCOREX</span>
                <span className="text-[8px] text-green-400/60 font-medium tracking-[0.3em] uppercase">Live Scoring</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 mx-4">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#live">Live</NavLink>
              <NavLink href="#overlays">Overlays</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/studio" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-bold transition">
                <MonitorPlay className="w-3.5 h-3.5" /> Preview Studio
              </Link>
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition px-3 py-1.5">Sign In</Link>
              <Link to="/register" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-105">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── RESTORED CAROUSEL (Sits directly beneath the nav bar seamlessly) ── */}
      <div className={`fixed top-16 left-0 right-0 z-40 h-8 transition-all duration-500 ${scrollY > 50 ? 'bg-black/95 backdrop-blur-xl border-b border-white/5' : 'bg-black/60 backdrop-blur-sm border-b border-white/5'}`}>
        <div className="container mx-auto h-full px-4 lg:px-6">
          <Carousel />
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative pt-24 pb-32 px-6 flex flex-col justify-center overflow-hidden min-h-screen">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 40L40 0M0 0L40 40' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E\")" }} />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-green-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto text-center relative z-10 max-w-5xl pt-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-green-400 text-xs font-bold uppercase tracking-widest mb-8 hover:bg-white/10 transition cursor-pointer group">
            <Zap className="w-3 h-3" /> The Future of Cricket Broadcasting <Sparkles className="w-3 h-3 opacity-50" />
          </div>

          {/* Logo from Login - small version */}
          <div className="text-center mb-8">
            <div className="relative inline-flex mb-4 mx-auto">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', boxShadow: '0 0 40px rgba(34,197,94,0.35)' }}>
                <Zap className="w-7 h-7 text-black" fill="currentColor" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }} />
            </div>
          </div>

          <h1 className="text-6xl md:text-9xl font-black mb-6 leading-[0.9] tracking-tight" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
            <span>NEXT</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400">GEN</span><br />
            <span className="text-5xl md:text-7xl">CRICKET</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Professional live scoring, <span className="text-white font-medium">TV-grade broadcast overlays</span>, and <span className="text-white font-medium">deep tournament analytics</span>. All in one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/register" className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-green-600 hover:bg-green-500 text-black font-bold rounded-2xl transition-all shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)]">
              Start Tournament Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/studio" className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-blue-600/20 border-2 border-blue-500/40 hover:bg-blue-600/30 rounded-2xl font-bold transition-all">
              <MonitorPlay className="w-5 h-5 text-blue-400" /> Try Overlay Studio
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <StatCard number="10K+" label="Tournaments Hosted" />
            <StatCard number="500K+" label="Matches Scored" />
            <StatCard number="21" label="Overlay Templates" />
            <StatCard number="99.9%" label="Uptime" />
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* ── Live Matches Section ── */}
      <section id="live" className="relative py-20 px-6 bg-gradient-to-b from-black/50 to-black">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-3xl font-black" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>Live Now</h2>
            </div>
            <Link to="/login" className="flex items-center gap-1.5 text-sm text-green-400 font-bold hover:text-green-300 transition">
              View All Live <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveMatches.map(m => <LiveMatchCard key={m._id} match={m} />)}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl">
              <Activity className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 font-bold mb-1">No live matches right now</p>
              <p className="text-gray-700 text-sm">Check back during match hours</p>
              <Link to="/register" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-bold hover:bg-green-600/30 transition">
                Start Your Own Match <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-black/50 to-black">
        <div className="container mx-auto">
          <SectionHeader title="Powerful Features" subtitle="Everything you need to run professional cricket tournaments" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            <FeatureCard icon={<Video className="w-7 h-7 text-cyan-400" />}     title="Broadcast Overlays"    desc="21 OBS-ready animated overlay templates. From basic scoreboards to full IPL-style broadcast graphics." gradient="from-cyan-500/20 to-blue-500/20" />
            <FeatureCard icon={<BarChart3 className="w-7 h-7 text-purple-400" />} title="Deep Analytics"        desc="Run rate graphs, NRR, player stats, wagon wheels, and over-by-over breakdowns." gradient="from-purple-500/20 to-pink-500/20" />
            <FeatureCard icon={<Zap className="w-7 h-7 text-green-400" />}       title="Live Scoring Engine"   desc="Real-time ball-by-ball scoring with socket updates, undo, extras, wickets, and strike rotation." gradient="from-green-500/20 to-emerald-500/20" />
            <FeatureCard icon={<Trophy className="w-7 h-7 text-yellow-400" />}   title="Tournament Management" desc="Round robin, knockout, and league formats with automatic bracket generation and points tables." gradient="from-yellow-500/20 to-orange-500/20" />
            <FeatureCard icon={<Users className="w-7 h-7 text-blue-400" />}      title="Team & Club System"    desc="Manage teams, players, clubs, memberships, and friend lists all in one place." gradient="from-blue-500/20 to-cyan-500/20" />
            <FeatureCard icon={<ShieldCheck className="w-7 h-7 text-red-400" />} title="Secure & Scalable"     desc="Role-based access for scorers, organizers, and admins. JWT auth with OAuth support." gradient="from-red-500/20 to-pink-500/20" />
          </div>
        </div>
      </section>

      {/* ── Overlay Showcase ── */}
      <section id="overlays" className="relative py-32 px-6 bg-black">
        <div className="container mx-auto">
          <SectionHeader title="Broadcast Overlays" subtitle="21 professional overlay templates. Click any card to preview in the Studio." />

          <div className="flex justify-center gap-3 mt-8 mb-12">
            <Link to="/studio" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition text-sm">
              <MonitorPlay className="w-4 h-4" /> Open Full Preview Studio
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition text-sm">
              Get Access <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-4">
            {overlayShowcase.map(o => (
              <OverlayCard key={o.url} {...o} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="relative py-32 px-6 bg-gradient-to-b from-black to-black/80">
        <div className="container mx-auto max-w-5xl">
          <SectionHeader title="Loved by Organizers" subtitle="What tournament organizers say about ScoreX" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            <TestimonialCard name="Rahul Sharma"   role="Cricket Club Owner"    avatar="RS" rating={5} content="ScoreX completely changed how we run our club tournaments. The live scoring and overlays are professional grade." />
            <TestimonialCard name="Michael Chen"   role="Tournament Director"   avatar="MC" rating={5} content="The broadcast overlays are stunning. Our YouTube stream looks like an IPL broadcast now. Incredible product." />
            <TestimonialCard name="Priya Reddy"    role="Sports Academy Coach"  avatar="PR" rating={5} content="Best platform for amateur cricket. Easy setup, beautiful overlays, and the analytics help me track player progress." />
            <TestimonialCard name="David Patel"    role="League Organizer"      avatar="DP" rating={5} content="We manage 40+ teams across 3 tournaments simultaneously. ScoreX handles it all without a single issue." />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative py-32 px-6 bg-black">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader title="Simple Pricing" subtitle="Start free, upgrade when you need broadcast-quality overlays" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <PricingCard name="Free" price="₹0" period="/month" highlight={false} features={[
              "Up to 3 tournaments", "Basic live scoring", "5 overlay templates", "Community support", "Points table & bracket",
            ]} />
            <PricingCard name="Premium" price="₹499" period="/month" highlight={true} features={[
              "Unlimited tournaments", "All 9 premium overlays", "Full overlay studio", "Match analytics & NRR", "Priority support", "Export data CSV",
            ]} />
            <PricingCard name="Enterprise" price="₹999" period="/month" highlight={false} features={[
              "Everything in Premium", "All 21 overlay templates", "Custom branding", "Club management", "API access", "Dedicated support",
            ]} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-black to-cyan-900/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[150px]" />
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black mb-6" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>
            Ready to <span className="text-green-400">Level Up?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join tournament organizers who trust ScoreX for professional cricket broadcasting.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/studio" className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600/20 border border-blue-500/40 rounded-full font-bold transition hover:bg-blue-600/30">
              <MonitorPlay className="w-5 h-5 text-blue-400" /> Preview Overlays
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-black/80 py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                  <Zap className="w-5 h-5 text-black" fill="currentColor" />
                </div>

                <span className="font-black text-xl" style={{ fontFamily: 'var(--font-orbitron, monospace)' }}>SCOREX</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Professional cricket scoring and tournament management. Broadcast-quality overlays for every match.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-green-400 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-green-400 transition">Pricing</a></li>
                <li><Link to="/studio" className="hover:text-green-400 transition">Overlay Studio</Link></li>
                <li><a href="#overlays" className="hover:text-green-400 transition">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/register" className="hover:text-green-400 transition">Get Started</Link></li>
                <li><Link to="/login" className="hover:text-green-400 transition">Sign In</Link></li>
                <li><a href="#live" className="hover:text-green-400 transition">Live Matches</a></li>
                <li><a href="#testimonials" className="hover:text-green-400 transition">Reviews</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Connect</h4>
              <div className="flex gap-3">
                <SocialLink icon={<Twitter className="w-4 h-4" />} />
                <SocialLink icon={<Instagram className="w-4 h-4" />} />
                <SocialLink icon={<Youtube className="w-4 h-4" />} />
                <SocialLink icon={<Github className="w-4 h-4" />} />
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© 2025 ScoreX. All rights reserved.</p>
            <div className="flex gap-6 text-gray-500 text-sm">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

