import { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';
import { Trophy, Radio, Calendar, Zap } from 'lucide-react';

interface SimpleTournament {
  _id: string;
  name: string;
  status: string;
  format?: string;
}

export default function Carousel() {
  const [tournaments, setTournaments] = useState<SimpleTournament[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await tournamentAPI.getTournaments();
        // Filter for active or upcoming tournaments
        const active = (res.data || []).filter((t: SimpleTournament) => 
          t.status === 'ongoing' || t.status === 'upcoming'
        );
        // If empty, add placeholders so the design doesn't break
        if (active.length === 0) {
            setTournaments([
                { _id: '1', name: 'ScoreX Premier League', status: 'upcoming', format: 'T20' },
                { _id: '2', name: 'National Cup 2025', status: 'upcoming', format: 'ODI' }
            ]);
        } else {
            setTournaments(active);
        }
      } catch (error) {
        console.error("Failed to load ticker data");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full bg-black/80 backdrop-blur-md border-b border-white/10 h-12 flex items-center overflow-hidden relative z-50">
      {/* Label */}
      <div className="bg-red-600 h-full px-6 flex items-center justify-center z-20 shadow-[4px_0_24px_rgba(220,38,38,0.5)]">
        <span className="font-orbitron font-bold text-white tracking-wider text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" /> LIVE ACTION
        </span>
      </div>

      {/* Marquee Container */}
      <div className="flex overflow-hidden w-full mask-linear-gradient">
        <div className="animate-marquee flex items-center gap-16 pl-4">
          {/* We duplicate the array to create a seamless infinite loop effect */}
          {[...tournaments, ...tournaments, ...tournaments].map((t, i) => (
            <div key={`${t._id}-${i}`} className="flex items-center gap-3 text-sm font-medium whitespace-nowrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  t.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {t.status.toUpperCase()}
              </span>
              <span className="text-gray-100 font-barlow text-lg tracking-wide">{t.name}</span>
              <span className="text-gray-500 text-xs border border-gray-700 px-1 rounded">{t.format || 'T20'}</span>
              <Zap className="w-3 h-3 text-yellow-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}