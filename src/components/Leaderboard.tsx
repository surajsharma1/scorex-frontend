import { useState, useEffect } from 'react';
import { tournamentAPI, matchAPI } from '../services/api';
import { Trophy, BarChart2, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [pointsTable, setPointsTable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tournamentAPI.getMyTournaments().then(r => {
      const list = r.data.data || [];
      setTournaments(list);
      if (list.length > 0) setSelectedTournament(list[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;
    setLoading(true);
    tournamentAPI.getPointsTable(selectedTournament)
      .then(r => setPointsTable(r.data.data || []))
      .catch(() => setPointsTable([]))
      .finally(() => setLoading(false));
  }, [selectedTournament]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" /> Leaderboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Tournament points table</p>
        </div>
        {tournaments.length > 0 && (
          <select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !selectedTournament ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Create a tournament first to see its leaderboard</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-bold">Points Table</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">#</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Team</th>
                  <th className="text-center py-3 px-3 text-slate-400 font-semibold">M</th>
                  <th className="text-center py-3 px-3 text-slate-400 font-semibold">W</th>
                  <th className="text-center py-3 px-3 text-slate-400 font-semibold">L</th>
                  <th className="text-center py-3 px-3 text-slate-400 font-semibold">T/NR</th>
                  <th className="text-center py-3 px-3 text-slate-400 font-semibold">NRR</th>
                  <th className="text-center py-3 px-3 text-blue-400 font-bold">PTS</th>
                </tr>
              </thead>
              <tbody>
                {pointsTable.map((row, i) => (
                  <tr key={row._id} className={`border-b border-slate-800 transition-colors hover:bg-slate-800/40 ${i === 0 ? 'bg-yellow-500/5' : i === 1 ? 'bg-slate-800/20' : ''}`}>
                    <td className="py-4 px-4">
                      <span className={`font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white font-bold">{row.name}</p>
                      <p className="text-slate-600 text-xs">{row.shortName}</p>
                    </td>
                    <td className="py-4 px-3 text-center text-slate-300">{row.played}</td>
                    <td className="py-4 px-3 text-center text-green-400 font-semibold">{row.won}</td>
                    <td className="py-4 px-3 text-center text-red-400">{row.lost}</td>
                    <td className="py-4 px-3 text-center text-slate-500">{(row.tied || 0) + (row.nr || 0)}</td>
                    <td className={`py-4 px-3 text-center font-mono text-xs font-semibold ${row.nrr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.nrr >= 0 ? '+' : ''}{(row.nrr || 0).toFixed(3)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="text-blue-400 font-black text-lg">{row.points}</span>
                    </td>
                  </tr>
                ))}
                {pointsTable.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-600">No matches completed yet in this tournament</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
