import { useState, useEffect, useRef } from 'react';
import { tournamentAPI } from '../services/api';
import { Radio, Zap } from 'lucide-react';

interface TickerItem {
  _id: string;
  name: string;
  status: string;
  liveScore?: string;
}

export default function Carousel() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await tournamentAPI.getTournaments();
        const tournaments = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.tournaments)
          ? res.data.tournaments
          : Array.isArray(res.data)
          ? res.data
          : [];
        const active = tournaments.map((t: any) => ({
          _id: t._id,
          name: t.name,
          status: t.status,
          liveScore: t.activeMatch
            ? `${t.activeMatch.score1}/${t.activeMatch.wickets1}`
            : undefined,
        })).filter((t: any) => t.status === 'ongoing' || t.status === 'upcoming');

        setItems(
          active.length > 0
            ? active
            : [
                { _id: 'demo1', name: 'ScoreX Premier League', status: 'upcoming' },
                { _id: 'demo2', name: 'Global Championship', status: 'upcoming' },
                { _id: 'demo3', name: 'City Cricket Cup', status: 'upcoming' },
              ]
        );
      } catch {
        setItems([
          { _id: 'demo1', name: 'ScoreX Premier League', status: 'upcoming' },
          { _id: 'demo2', name: 'Global Championship', status: 'upcoming' },
          { _id: 'demo3', name: 'City Cricket Cup', status: 'upcoming' },
        ]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Duplicate items enough times so the ticker always fills the screen
  // and scrolls seamlessly: we render 4 copies, animate exactly 1-copy-width left.
  // The CSS animation goes 0 → -25% (1 of 4 copies), then resets seamlessly.
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="flex items-center overflow-hidden w-full h-full bg-transparent select-none">
      {/* Live badge */}
      <div className="bg-red-600 px-2 h-5 flex items-center justify-center shrink-0 rounded-sm mr-3">
        <span className="font-bold text-white text-[10px] flex items-center gap-1">
          <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
        </span>
      </div>

      {/* Track wrapper — clips overflow, always starts from left edge */}
      <div className="flex-1 overflow-hidden relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)' }} />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }} />

        <div
          ref={trackRef}
          className="flex items-center gap-8 whitespace-nowrap"
          style={{
            animation: 'ticker-scroll 28s linear infinite',
            willChange: 'transform',
          }}
        >
          {repeated.map((t, i) => (
            <div key={`${t._id}-${i}`} className="flex items-center gap-2 text-xs font-medium shrink-0">
              {t.status === 'ongoing' ? (
                <span className="text-[10px] font-black text-red-400 uppercase">● Live</span>
              ) : (
                <span className="text-[10px] font-black text-blue-400 uppercase">Soon</span>
              )}
              <span className="text-gray-300">{t.name}</span>
              {t.liveScore && (
                <span className="text-green-400 font-mono">{t.liveScore}</span>
              )}
              <Zap className="w-2.5 h-2.5 text-yellow-500/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
