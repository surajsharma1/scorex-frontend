import { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';
import { Trophy, Radio, Zap, Calendar } from 'lucide-react';

interface TickerItem {
  _id: string;
  name: string;
  status: string;
  liveScore?: string; // "145/2 (18.4)"
}

export default function Carousel() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await tournamentAPI.getTournaments(); // Calls backend
        // Handle both response formats: { tournaments: [...] } or direct array
        const tournaments = res.data.tournaments || res.data || [];
        // Filter for relevant items
        const active = (tournaments).map((t: any) => ({
          _id: t._id,
          name: t.name,
          status: t.status,
          // If backend provides a summary match score, use it, else default
          liveScore: t.activeMatch ? `${t.activeMatch.score1}/${t.activeMatch.wickets1}` : undefined
        })).filter((t: any) => t.status === 'ongoing' || t.status === 'upcoming');
        
        // If no live data, show placeholders so the UI doesn't look broken
        if (active.length === 0) {
            setItems([
                { _id: 'demo1', name: 'ScoreX Premier League', status: 'upcoming' },
                { _id: 'demo2', name: 'Global Championship', status: 'upcoming' }
            ]);
        } else {
            setItems(active);
        }
      } catch (error) {
        console.error("Ticker error", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black/90 backdrop-blur-xl border-b border-white/10 h-10 flex items-center overflow-hidden relative z-50">
      {/* Static Label */}
      <div className="bg-red-600 h-full px-4 flex items-center justify-center z-20 shadow-[4px_0_15px_rgba(220,38,38,0.5)]">
        <span className="font-orbitron font-bold text-white text-xs flex items-center gap-2">
            <Radio className="w-3 h-3 animate-pulse" /> LIVE FEED
        </span>
      </div>

      {/* Scrolling Container */}
      <div className="flex overflow-hidden w-full">
        <div className="animate-marquee flex items-center gap-12 pl-4">
          {/* Tripled list ensures seamless infinite scroll loop */}
          {[...items, ...items, ...items].map((t, i) => (
            <div key={`${t._id}-${i}`} className="flex items-center gap-3 text-sm font-medium whitespace-nowrap">
              {t.status === 'ongoing' ? (
                <span className="text-xs font-bold text-red-400 border border-red-500/30 px-1 rounded animate-pulse-soft">LIVE</span>
              ) : (
                <span className="text-xs font-bold text-blue-400 border border-blue-500/30 px-1 rounded">COMING SOON</span>
              )}
              
              <span className="text-gray-200 font-barlow tracking-wide text-base">{t.name}</span>
              
              {t.liveScore && (
                 <span className="text-green-400 font-mono">{t.liveScore}</span>
              )}
              
              <Zap className="w-3 h-3 text-yellow-500/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}