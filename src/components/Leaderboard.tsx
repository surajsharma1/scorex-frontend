import { useState, useEffect, useCallback } from 'react';
import { tournamentAPI, matchAPI } from '../services/api';
import { Trophy, BarChart2, Download, Loader2 } from 'lucide-react';

interface Props { tournamentId?: string; }

// ─── Pure client-side XLSX export using SheetJS (already in vite deps via xlsx) ──
async function exportTournamentXlsx(tournamentId: string, tournamentName: string, pointsTable: any[], matches: any[]) {
  // Dynamically import xlsx — it's a large lib, lazy load it
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Tournament Points Table ──────────────────────────────────────
  const ptHeader = ['#', 'Team', 'Short', 'Played', 'Won', 'Lost', 'Tied/NR', 'NRR', 'Points'];
  const ptRows = pointsTable.map((row: any, i: number) => [
    i + 1, row.name || '', row.shortName || '',
    row.played ?? 0, row.won ?? 0, row.lost ?? 0,
    (row.tied ?? 0) + (row.nr ?? 0),
    parseFloat((row.nrr ?? 0).toFixed(3)),
    row.points ?? 0,
  ]);
  const ptSheet = XLSX.utils.aoa_to_sheet([ptHeader, ...ptRows]);

  // Column widths
  ptSheet['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 10 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];

  // Style header row bold (xlsx-js-style not available; use cell comments as fallback)
  XLSX.utils.book_append_sheet(wb, ptSheet, 'Points Table');

  // ── One sheet per completed match ─────────────────────────────────────────
  const completedMatches = matches.filter((m: any) => m.status === 'completed');

  for (const match of completedMatches) {
    // Fetch full match data for innings details
    let fullMatch: any = match;
    try {
      const res = await matchAPI.getMatch(match._id);
      fullMatch = res.data.data || res.data;
    } catch { /* use what we have */ }

    const sheetName = (fullMatch.name || `${fullMatch.team1Name} vs ${fullMatch.team2Name}`)
      .replace(/[\\/*?[\]]/g, '')  // Excel sheet name restrictions
      .slice(0, 31);               // Max 31 chars

    const rows: any[][] = [];

    // Match header
    rows.push([`Match: ${fullMatch.name || sheetName}`]);
    rows.push([`${fullMatch.team1Name} vs ${fullMatch.team2Name}`]);
    rows.push([`Date: ${new Date(fullMatch.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, '', `Venue: ${fullMatch.venue || 'N/A'}`]);
    rows.push([`Result: ${fullMatch.resultSummary || 'N/A'}`]);
    rows.push([]);

    for (const innings of (fullMatch.innings || [])) {
      rows.push([`━━ ${innings.teamName} Innings ━━`]);
      rows.push([`Score: ${innings.score}/${innings.wickets}`, '', `Overs: ${innings.overs}.${innings.balls}`, '', `Run Rate: ${(innings.runRate ?? 0).toFixed(2)}`]);
      rows.push([`Extras: ${innings.extras?.total ?? 0}`, `Wides: ${innings.extras?.wides ?? 0}`, `No Balls: ${innings.extras?.noBalls ?? 0}`, `Byes: ${innings.extras?.byes ?? 0}`, `Leg Byes: ${innings.extras?.legByes ?? 0}`]);
      rows.push([]);

      // Batting
      rows.push(['BATTING', '', '', '', '', '', '', '']);
      rows.push(['Batter', 'Status', 'R', 'B', '4s', '6s', 'SR', '']);
      for (const b of (innings.batsmen || [])) {
        if (!b.balls && !b.runs && !b.isStriker && !b.isOut) continue; // skip phantom entries
        const outDesc = b.isOut
          ? (b.outType === 'run_out' ? 'Run Out' : b.outType?.replace(/_/g, ' ') || 'Out')
          : (b.isStriker ? 'batting*' : 'not out');
        rows.push([
          b.name || '—', outDesc,
          b.runs ?? 0, b.balls ?? 0, b.fours ?? 0, b.sixes ?? 0,
          b.balls ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : 0, '',
        ]);
      }
      rows.push([]);

      // Bowling
      rows.push(['BOWLING', '', '', '', '', '', '', '']);
      rows.push(['Bowler', 'O', 'M', 'R', 'W', 'Econ', '', '']);
      for (const bw of (innings.bowlers || [])) {
        if (!bw.balls && !bw.runs) continue;
        rows.push([
          bw.name || '—',
          `${Math.floor(bw.balls / 6)}.${bw.balls % 6}`,
          bw.maidens ?? 0, bw.runs ?? 0, bw.wickets ?? 0,
          bw.balls ? parseFloat(((bw.runs / bw.balls) * 6).toFixed(2)) : 0,
          '', '',
        ]);
      }
      rows.push([]);
    }

    const matchSheet = XLSX.utils.aoa_to_sheet(rows);
    matchSheet['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 6 }, { wch: 6 }, { wch: 5 }, { wch: 5 }, { wch: 8 }, { wch: 6 }];
    XLSX.utils.book_append_sheet(wb, matchSheet, sheetName);
  }

  // ── Download ───────────────────────────────────────────────────────────────
  const safeName = tournamentName.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  XLSX.writeFile(wb, `${safeName}_records.xlsx`);
}

export default function Leaderboard({ tournamentId }: Props) {
  const [pointsTable, setPointsTable] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tournamentName, setTournamentName] = useState('Tournament');

  const load = useCallback(() => {
    if (!tournamentId) return;
    setLoading(true);
    Promise.all([
      tournamentAPI.getPointsTable(tournamentId),
      tournamentAPI.getTournamentMatches(tournamentId),
      tournamentAPI.getTournament(tournamentId),
    ]).then(([ptRes, mRes, tRes]) => {
      setPointsTable(ptRes.data.data || []);
      setMatches(mRes.data.data || []);
      const t = tRes.data.data || tRes.data;
      setTournamentName(t?.name || 'Tournament');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTournamentXlsx(tournamentId!, tournamentName, pointsTable, matches);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExporting(false);
    }
  };

  if (!tournamentId) return (
    <div className="text-center py-20 rounded-3xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <Trophy className="w-16 h-16 opacity-20 mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
      <p className="font-semibold text-lg" style={{ color: 'var(--text-muted)' }}>View points from a specific tournament page</p>
    </div>
  );

  const completedCount = matches.filter((m: any) => m.status === 'completed').length;

  return (
    <div className="p-6 max-w-5xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      <div className="flex items-center justify-between mb-8 relative">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
            <h1 className="text-3xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Trophy className="w-8 h-8 text-green-400" /> Leaderboard
            </h1>
          </div>
          <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>Points table · {tournamentName}</p>
        </div>

        {/* Export button — enabled when there are completed matches */}
        <button
          onClick={handleExport}
          disabled={exporting || completedCount === 0}
          title={completedCount === 0 ? 'Available after matches complete' : `Export ${completedCount} completed match(es) + points table`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Exporting…' : `Export XLSX${completedCount > 0 ? ` (${completedCount})` : ''}`}
        </button>
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
                  {['#', 'Team', 'M', 'W', 'L', 'T/NR', 'NRR', 'PTS'].map((h, i) => (
                    <th key={h} className={`py-4 px-4 font-bold ${i <= 1 ? 'text-left' : 'text-center'} ${h === 'PTS' ? 'text-green-400' : ''}`} style={{ color: h === 'PTS' ? '#22c55e' : 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pointsTable.map((row, i) => (
                  <tr key={row._id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'rgba(34,197,94,0.05)' : i === 1 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td className="py-4 px-4">
                      <span className={`font-black text-lg ${i === 0 ? 'text-green-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                    </td>
                    <td className="py-4 px-4">
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
                    <td className="py-4 px-4 text-center">
                      <span className="text-green-400 font-black text-xl">{row.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info about export */}
      {completedCount > 0 && (
        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          Export creates an Excel file with the points table + one sheet per completed match (batting & bowling scorecards).
        </p>
      )}
    </div>
  );
}
