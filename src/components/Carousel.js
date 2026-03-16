import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';
import { Radio, Zap } from 'lucide-react';
export default function Carousel() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await tournamentAPI.getTournaments(); // Calls backend
                // Handle both response formats: { tournaments: [...] } or direct array
                const tournaments = res.data.tournaments || res.data || [];
                // Filter for relevant items
                const active = (tournaments).map((t) => ({
                    _id: t._id,
                    name: t.name,
                    status: t.status,
                    // If backend provides a summary match score, use it, else default
                    liveScore: t.activeMatch ? `${t.activeMatch.score1}/${t.activeMatch.wickets1}` : undefined
                })).filter((t) => t.status === 'ongoing' || t.status === 'upcoming');
                // If no live data, show placeholders so the UI doesn't look broken
                if (active.length === 0) {
                    setItems([
                        { _id: 'demo1', name: 'ScoreX Premier League', status: 'upcoming' },
                        { _id: 'demo2', name: 'Global Championship', status: 'upcoming' }
                    ]);
                }
                else {
                    setItems(active);
                }
            }
            catch (error) {
                console.error("Ticker error", error);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("div", { className: "flex items-center overflow-hidden w-full h-full bg-transparent", children: [_jsx("div", { className: "bg-red-600 px-2 h-6 flex items-center justify-center shrink-0 rounded-sm", children: _jsxs("span", { className: "font-orbitron font-bold text-white text-[10px] flex items-center gap-1", children: [_jsx(Radio, { className: "w-2.5 h-2.5 animate-pulse" }), " LIVE"] }) }), _jsx("div", { className: "overflow-hidden flex-1 ml-2", children: _jsx("div", { className: "animate-marquee flex items-center gap-8 whitespace-nowrap", children: [...items, ...items, ...items].map((t, i) => (_jsxs("div", { className: "flex items-center gap-2 text-xs font-medium", children: [t.status === 'ongoing' ? (_jsx("span", { className: "text-[10px] font-bold text-red-400", children: "LIVE" })) : (_jsx("span", { className: "text-[10px] font-bold text-blue-400", children: "SOON" })), _jsx("span", { className: "text-gray-300 text-xs", children: t.name }), t.liveScore && (_jsx("span", { className: "text-green-400 font-mono text-xs", children: t.liveScore })), _jsx(Zap, { className: "w-2.5 h-2.5 text-yellow-500/50" })] }, `${t._id}-${i}`))) }) })] }));
}
