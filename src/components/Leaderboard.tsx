import { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';
import { Trophy, BarChart2, ChevronDown } from 'lucide-react';

interface Props {
  tournamentId?: string;
}

export default function Leaderboard({ tournamentId }: Props) {
  const [pointsTable, setPointsTable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!tournamentId) {
    return (
      <div className="text-center py-20 rounded-3xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <Trophy className="w-16 h-16 opacity-20 mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
        <p className="font-semibold text-lg" style={{ color: 'var(--text-muted)' }}>View points from a specific tournament page</p>
      </div>
    );
  }


  useEffect(() => {
    setLoading(true);
    tournamentAPI.getPointsTable(tournamentId)
      .then(r => setPointsTable(r.data.data || []))
      .catch(() => setPointsTable([]))
      .finally(() => setLoading(false));
  }, [tournamentId]);


  return (
    <div className="p-6 max-w-5xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Background Orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      <div className="flex items-center justify-between mb-8 relative">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
            <h1 className="text-3xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Trophy className="w-8 h-8 text-green-400" /> Leaderboard
            </h1>
          </div>
          <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>Points table</p>
        </div>
      </div>


      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : pointsTable.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Trophy className="w-16 h-16 opacity-20 mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
          <p className="font-semibold text-lg" style={{ color: 'var(--text-muted)' }}>No matches completed yet</p>
        </div>
      ) : (

        <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <BarChart2 className="w-6 h-6 text-green-400" />
            <h2 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Points Table</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: 'var(--text-muted)' }}>#</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: 'var(--text-muted)' }}>Team</th>
                  <th className="text-center py-4 px-4 font-bold" style={{ color: 'var(--text-muted)' }}>M</th>
                  <th className="text-center py-4 px-4 font-bold" style={{ color: 'var(--text-muted)' }}>W</th>
                  <th className="text-center py-4 px-4 font-bold" style={{ color: 'var(--text-muted)' }}>L</th>
                  <th className="text-center py-4 px-4 font-bold" style={{ color: 'var(--text-muted)' }}>T/NR</th>
                  <th className="text-center py-4 px-4 font-bold" style={{ color: 'var(--text-muted)' }}>NRR</th>
                  <th className="text-center py-4 px-6 font-black text-green-400">PTS</th>
                </tr>
              </thead>
              <tbody>
                {pointsTable.map((row, i) => (
                  <tr key={row._id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'rgba(34,197,94,0.05)' : i === 1 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td className="py-4 px-6">
                      <span className={`font-black text-lg ${i === 0 ? 'text-green-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{row.name}</p>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{row.shortName}</p>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>{row.played}</td>
                    <td className="py-4 px-4 text-center text-green-400 font-bold">{row.won}</td>
                    <td className="py-4 px-4 text-center text-red-400 font-bold">{row.lost}</td>
                    <td className="py-4 px-4 text-center font-semibold" style={{ color: 'var(--text-muted)' }}>{(row.tied || 0) + (row.nr || 0)}</td>
                    <td className={`py-4 px-4 text-center font-mono text-xs font-black tracking-wider ${row.nrr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.nrr >= 0 ? '+' : ''}{(row.nrr || 0).toFixed(3)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-green-400 font-black text-xl">{row.points}</span>
                    </td>
                  </tr>
                ))}
                {pointsTable.length === 0 && (
                  <tr><td colSpan={8} className="py-16 text-center text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>No matches completed yet in this tournament.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}