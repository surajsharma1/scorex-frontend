import { Link } from 'react-router-dom';
import Carousel from './Carousel';
import { Trophy, BarChart3, ShieldCheck, Play, ArrowRight, Activity, Users, Video } from 'lucide-react';

export default function Frontpage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans overflow-x-hidden selection:bg-green-500/30">
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-lg rotate-3 flex items-center justify-center">
                    <span className="font-orbitron font-bold text-black text-lg">S</span>
                </div>
                <span className="font-orbitron font-bold text-2xl tracking-tight text-white">SCOREX</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                <a href="#features" className="hover:text-white transition">Features</a>
                <Link to="/matches/live" className="hover:text-white transition flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Live Matches
                </Link>
                <Link to="/tournaments" className="hover:text-white transition">Tournaments</Link>
            </div>

            <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition">Log In</Link>
                <Link to="/register" className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                    Sign Up
                </Link>
            </div>
        </div>
        {/* Ticker integration */}
        <Carousel />
      </nav>

      {/* 2. Hero Section */}
      <div className="relative pt-48 pb-32 px-6">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-green-400 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up">
            <Activity className="w-3 h-3" /> The Ultimate Cricket Platform
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black mb-6 leading-[1.1] font-orbitron tracking-tight">
            NEXT GEN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-500">
              CRICKET SCORING
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Manage tournaments, generate TV-grade overlays for live streams, and track advanced player analytics in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Link 
              to="/register" 
              className="flex items-center justify-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 text-black font-bold rounded-xl transition-all hover:scale-105 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
            >
              Create Tournament <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/matches/live" 
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-xl font-bold transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 fill-current" /> Watch Live
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Stats / Social Proof */}
      <div className="border-y border-white/10 bg-black/50 py-12">
          <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <StatItem value="10k+" label="Matches Scored" />
              <StatItem value="500+" label="Active Leagues" />
              <StatItem value="2M+" label="Runs Tracked" />
              <StatItem value="4.9/5" label="User Rating" />
          </div>
      </div>

      {/* 4. Features Grid */}
      <div id="features" className="py-32 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold font-orbitron mb-4">Pro Tools for Everyone</h2>
              <p className="text-gray-400">Everything you need to run a world-class cricket organization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Video className="w-8 h-8 text-cyan-400" />}
              title="Broadcast Overlays"
              desc="Professional OBS overlays for YouTube & Facebook live streams. Animated, automated, and instant."
              color="border-cyan-500/20 bg-cyan-500/5"
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-purple-400" />}
              title="Deep Analytics"
              desc="Wagon wheels, pitch maps, and worm charts generated automatically from your scoring data."
              color="border-purple-500/20 bg-purple-500/5"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-green-400" />}
              title="League Management"
              desc="Automated points tables, net run rate (NRR) calculations, and player transfer management."
              color="border-green-500/20 bg-green-500/5"
            />
          </div>
        </div>
      </div>

      {/* 5. Footer */}
      <footer className="py-12 border-t border-white/10 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-orbitron font-bold text-gray-500">SCOREX</div>
          <div className="text-gray-500 text-sm">
            &copy; 2025 ScoreX Sports Technology. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
    return (
        <div>
            <div className="text-3xl md:text-4xl font-black text-white font-barlow mb-1">{value}</div>
            <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</div>
        </div>
    )
}

function FeatureCard({ icon, title, desc, color }: any) {
  return (
    <div className={`p-8 rounded-3xl border ${color} hover:border-opacity-50 transition-all duration-300 group`}>
      <div className="mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 font-barlow text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
          {title}
      </h3>
      <p className="text-gray-400 leading-relaxed">
          {desc}
      </p>
    </div>
  );
}