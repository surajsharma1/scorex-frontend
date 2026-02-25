import { Link } from 'react-router-dom';
import Carousel from './Carousel';
import { 
  BarChart3, ShieldCheck, Play, ArrowRight, 
  Activity, Video, Trophy, Users 
} from 'lucide-react';

export default function Frontpage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-green-500/30">
      
      {/* 1. Top Ticker */}
      <Carousel />

      {/* 2. Navbar */}
      <nav className="w-full z-40 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-lg flex items-center justify-center font-orbitron font-bold text-black">S</div>
                <span className="font-orbitron font-bold text-2xl tracking-tighter">SCOREX</span>
            </div>
            
            <div className="flex items-center gap-6">
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition">Sign In</Link>
                <Link to="/register" className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    Get Started
                </Link>
            </div>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <div className="relative pt-20 pb-32 px-6 flex-1 flex flex-col justify-center overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse-soft"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-green-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Activity className="w-3 h-3" /> The Future of Sports Tech
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.95] font-orbitron tracking-tighter">
            NEXT GEN<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-500 glow-text">
              CRICKET
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Professional scoring, TV-grade broadcast overlays, and deep tournament analytics. All in one platform.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/register" 
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 text-black font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)]"
            >
              Start Tournament <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/matches/live" 
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all backdrop-blur-sm"
            >
              <Play className="w-5 h-5 fill-current" /> Watch Live
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Features Grid */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature 
              icon={<Video className="w-6 h-6 text-cyan-400" />}
              title="Broadcast Overlays"
              desc="OBS-ready animated overlays for your live streams."
            />
            <Feature 
              icon={<BarChart3 className="w-6 h-6 text-purple-400" />}
              title="Pro Analytics"
              desc="Wagon wheels, pitch maps, and run rate graphs."
            />
            <Feature 
              icon={<ShieldCheck className="w-6 h-6 text-yellow-400" />}
              title="Secure Platform"
              desc="Role-based access for scorers and organizers."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition group">
      <div className="mb-4 bg-black/50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2 font-orbitron">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}