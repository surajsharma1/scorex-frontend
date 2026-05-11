import { useState, useEffect, useRef } from 'react';
import { Zap, Crown, Tag } from 'lucide-react';
import api from '../services/api';

interface DiscountItem {
  label: string;        // e.g. "Premium LV1"
  discount: number;     // e.g. 20
  icon: React.ReactNode;
  color: string;
}

export default function DiscountBanner() {
  const [items, setItems] = useState<DiscountItem[]>([]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Fetch current prices from backend — check which plans have discounts
    api.get('/admin/membership-prices')
      .then(res => {
        const prices = res.data.prices || {};
        const found: DiscountItem[] = [];

        const levelMeta: Record<number, { label: string; icon: React.ReactNode; color: string }> = {
          1: { label: 'Premium LV1', icon: <Zap className="w-3.5 h-3.5" />, color: '#22c55e' },
          2: { label: 'Enterprise LV2', icon: <Crown className="w-3.5 h-3.5" />, color: '#a855f7' },
        };

        [1, 2].forEach(lvl => {
          if (!prices[lvl]) return;
          // Find the maximum discount across all durations for this level
          const maxDiscount = Math.max(...Object.values(prices[lvl] as Record<string, { price: number; discount: number }>).map(v => v?.discount ?? 0));
          if (maxDiscount > 0) {
            found.push({ ...levelMeta[lvl], discount: maxDiscount });
          }
        });

        setItems(found);
      })
      .catch(() => {});
  }, []);

  // Auto-slide every 4 seconds when multiple items
  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % items.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[current];

  return (
    <div className="relative z-30 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div
        key={current}
        className="flex items-center justify-center gap-3 py-2 px-4 text-sm font-bold"
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${item.color}18 50%, rgba(0,0,0,0) 100%)`,
          animation: 'slideInBanner 0.4s ease',
        }}>
        <Tag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
        <span style={{ color: item.color }} className="flex items-center gap-1.5">
          {item.icon}
          {item.label}
        </span>
        <span className="text-white/70">·</span>
        <span className="text-white font-black">{item.discount}% OFF</span>
        <span className="text-white/50 text-xs font-medium">on selected plans</span>
        {items.length > 1 && (
          <div className="flex gap-1 ml-2">
            {items.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === current ? item.color : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideInBanner {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </div>
  );
}
