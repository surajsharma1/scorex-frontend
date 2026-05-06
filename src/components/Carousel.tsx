import { useState, useEffect, useRef } from 'react';
import { tournamentAPI } from '../services/api';
import { Radio, Zap } from 'lucide-react';

interface TickerItem {
  _id: string;
  name: string;
  status: string;
  liveScore?: string;
}

const DEMO_ITEMS: TickerItem[] = [
  { _id: 'demo1', name: 'ScoreX Premier League', status: 'upcoming' },
  { _id: 'demo2', name: 'Global T20 Championship', status: 'upcoming' },
  { _id: 'demo3', name: 'City Cricket Cup', status: 'upcoming' },
  { _id: 'demo4', name: 'District Finals Series', status: 'upcoming' },
];

export default function Carousel() {
  const [items, setItems] = useState<TickerItem[]>(DEMO_ITEMS);
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef   = useRef(0);          // current translateX in px (always negative, scrolling left)
  const rafRef   = useRef<number>(0);
  const speedPx  = 0.55;              // px per frame — adjust to taste

  // Fetch real data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await tournamentAPI.getTournaments();
        const all: any[] = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.tournaments)
          ? res.data.tournaments
          : Array.isArray(res.data)
          ? res.data
          : [];
        const active = all
          .filter(t => t.status === 'ongoing' || t.status === 'upcoming')
          .map(t => ({
            _id: t._id,
            name: t.name,
            status: t.status,
            liveScore: t.activeMatch
              ? `${t.activeMatch.score1}/${t.activeMatch.wickets1}`
              : undefined,
          }));
        if (active.length > 0) setItems(active);
      } catch { /* keep demo items */ }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  // JS animation loop — starts at 0, always scrolls left, resets invisibly
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // We render 3 copies. One copy's pixel width = track.scrollWidth / 3
    const getCopyWidth = () => track.scrollWidth / 3;

    posRef.current = 0;
    track.style.transform = 'translateX(0px)';

    const tick = () => {
      posRef.current -= speedPx;
      const copyWidth = getCopyWidth();
      // Once we've scrolled a full copy width left, snap back to 0 — seamless loop
      if (copyWidth > 0 && posRef.current <= -copyWidth) {
        posRef.current += copyWidth;
      }
      track.style.transform = `translateX(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items]); // restart loop when items change

  // Pause on hover
  const pause = () => cancelAnimationFrame(rafRef.current);
  const resume = () => {
    const track = trackRef.current;
    if (!track) return;
    const getCopyWidth = () => track.scrollWidth / 3;
    const tick = () => {
      posRef.current -= speedPx;
      const copyWidth = getCopyWidth();
      if (copyWidth > 0 && posRef.current <= -copyWidth) posRef.current += copyWidth;
      track.style.transform = `translateX(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // 3 copies so the loop is seamless regardless of screen width
  const repeated = [...items, ...items, ...items];

  return (
    <div
      className="flex items-center overflow-hidden w-full h-full select-none"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* LIVE badge */}
      <div className="flex-shrink-0 flex items-center gap-1.5 mr-4 px-2 py-0.5 rounded bg-red-600/90">
        <Radio className="w-2.5 h-2.5 text-white animate-pulse" />
        <span className="text-[9px] font-black text-white tracking-widest uppercase">Live</span>
      </div>

      {/* Fade edges */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(3,3,5,0.9), transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgba(3,3,5,0.9), transparent)' }} />

        {/* Track — transform set via JS, no CSS animation */}
        <div
          ref={trackRef}
          className="flex items-center gap-10 whitespace-nowrap"
          style={{ willChange: 'transform' }}
        >
          {repeated.map((t, i) => (
            <div key={`${t._id}-${i}`} className="inline-flex items-center gap-2 flex-shrink-0">
              {t.status === 'ongoing'
                ? <span className="text-[9px] font-black text-red-400 uppercase tracking-wide">● Live</span>
                : <span className="text-[9px] font-black text-blue-400 uppercase tracking-wide">◆ Soon</span>}
              <span className="text-xs font-medium text-gray-300">{t.name}</span>
              {t.liveScore && (
                <span className="text-xs font-mono text-green-400 font-bold">{t.liveScore}</span>
              )}
              <Zap className="w-2.5 h-2.5 text-yellow-500/30 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
