import { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';
import { Radio, Zap } from 'lucide-react';

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
        // Handle API response formats safely: {success, data:[]}, {tournaments:[]}, or direct []
        const tournaments = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.tournaments)
          ? res.data.tournaments
          : Array.isArray(res.data)
          ? res.data
          : [];
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
    <div className="flex items-center overflow-hidden w-full h-full bg-transparent">
      {/* Live Label */}
      <div className="bg-red-600 px-2 h-6 flex items-center justify-center shrink-0 rounded-sm">
        <span className="font-orbitron font-bold text-white text-[10px] flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
        </span>
      </div>

      {/* Scrolling Container */}
      <div className="overflow-hidden flex-1 ml-2">
        <div className="animate-marquee gpu-accelerate flex items-center gap-8 whitespace-nowrap">
          {/* Tripled list ensures seamless infinite scroll loop */}
          {[...items, ...items, ...items].map((t, i) => (

            <div key={`${t._id}-${i}`} className="flex items-center gap-2 text-xs font-medium">
              {t.status === 'ongoing' ? (
                <span className="text-[10px] font-bold text-red-400">LIVE</span>
              ) : (
                <span className="text-[10px] font-bold text-blue-400">SOON</span>
              )}
              
              <span className="text-gray-300 text-xs">{t.name}</span>
              
              {t.liveScore && (
                 <span className="text-green-400 font-mono text-xs">{t.liveScore}</span>
              )}
              
              <Zap className="w-2.5 h-2.5 text-yellow-500/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
