import { Link } from 'react-router-dom';
import Carousel from './Carousel';
import { Trophy, BarChart3, Users, ShieldCheck, Play, ArrowRight, Zap } from 'lucide-react';

export default function Frontpage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* 1. Top News Ticker */}
      <Carousel />

      {/* 2. Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]"></div>

        <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            SCOREX
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-green-400 transition">Log In</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-bold bg-white text-black rounded-full hover:bg-gray-200 transition">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              Cricket Scoring
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Professional scorecards, live streaming overlays, and tournament management in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="flex items-center justify-center gap-2 px-8 py-4 bg-green-600 rounded-full font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-900/20">
              Create Tournament <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/matches/live" className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 border border-gray-700 rounded-full font-bold text-lg hover:bg-gray-700 transition">
              <Play className="w-5 h-5 fill-current" /> Watch Live
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Features Grid */}
      <div className="bg-gray-900/50 py-24 border-y border-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-blue-400" />}
              title="Pro Analytics"
              desc="Deep dive into player run rates, wagon wheels, and bowling economy."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Live Overlays"
              desc="Broadcast-quality animated overlays for your YouTube or OBS streams."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-green-400" />}
              title="Secure Management"
              desc="Role-based access for organizers, scorers, and team managers."
            />
          </div>
        </div>
      </div>

      {/* 4. Footer */}
      <footer className="py-12 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>&copy; 2025 ScoreX Sports. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="p-8 bg-gray-800/40 rounded-2xl border border-gray-700 hover:border-green-500/50 transition duration-300">
      <div className="mb-4 bg-gray-900 w-fit p-3 rounded-lg">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}