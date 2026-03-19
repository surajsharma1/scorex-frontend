import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import { Zap, Activity, RefreshCw, MapPin, Shield } from 'lucide-react';

export default function LiveMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLive = async () => {
    try {
      const res = await matchAPI.getLiveMatches();
      setMatches(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadLive();
    const iv = setInterval(loadLive, 15000);
    socket.get().on('scoreUpdate', () => loadLive());
    return () => { clearInterval(iv); socket.get().off('scoreUpdate'); };
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-red-400" /> Live Matches
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time scores • Updates every 15s</p>
        </div>
        <button onClick={loadLive} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-sm rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <Activity className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-semibold">No live matches right now</p>
          <p className="text-slate-600 text-sm mt-1">Start scoring a match from your tournament page</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map(m => {
            const inn = m.innings?.[m.currentInnings - 1] || {};
            const battingTeam = inn.teamName || m.team1Name;
            return (
              <div key={m._id} className="bg-slate-900 border border-red-500/20 rounded-2xl overflow-hidden hover:border-red-500/40 transition-all">
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                      </span>
                      <span className="text-slate-500 text-xs flex items-center gap-1"><Shield className="w-3 h-3" />{m.format}</span>
                      {m.venue && <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{m.venue}</span>}
                    </div>
                    <span className="text-slate-600 text-xs">Inn {m.currentInnings}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center mb-4">
                    <div className="text-center">
                      <p className="text-white font-black text-lg">{m.team1Name}</p>
                      <p className="text-slate-300 font-bold text-2xl">{m.team1Score}/{m.team1Wickets}</p>
                      <p className="text-slate-500 text-xs">({typeof m.team1Overs === 'number' ? m.team1Overs.toFixed(1) : '0.0'} ov)</p>
                    </div>
                    <div className="text-center text-slate-600 font-bold">vs</div>
                    <div className="text-center">
                      <p className="text-white font-black text-lg">{m.team2Name}</p>
                      <p className="text-slate-300 font-bold text-2xl">{m.team2Score}/{m.team2Wickets}</p>
                      <p className="text-slate-500 text-xs">({typeof m.team2Overs === 'number' ? m.team2Overs.toFixed(1) : '0.0'} ov)</p>
                    </div>
                  </div>

                  {/* Live details */}
                  {m.strikerName && (
                    <div className="bg-slate-800/60 rounded-xl p-3 text-xs grid grid-cols-3 gap-2 mb-3">
                      <div><span className="text-slate-500">🏏 </span><span className="text-white">{m.strikerName}*</span></div>
                      <div><span className="text-slate-500">⬤ </span><span className="text-white">{m.nonStrikerName}</span></div>
                      <div><span className="text-slate-500">🎳 </span><span className="text-white">{m.currentBowlerName}</span></div>
                    </div>
                  )}

                  {inn.targetScore && (
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl px-3 py-2 mb-3 text-xs">
                      <span className="text-blue-400 font-semibold">Target: {inn.targetScore}</span>
                      <span className="text-slate-500 ml-2">Need {inn.requiredRuns} @ RRR {inn.requiredRunRate?.toFixed(2)}</span>
                    </div>
                  )}

                  <button onClick={() => navigate(`/matches/${m._id}/score`)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Open Scoreboard
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
