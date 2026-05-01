import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { socket } from '../services/socket';
import { Zap, Activity, RefreshCw, MapPin, Shield, Search, ExternalLink, ChevronLeft, ChevronRight, User } from 'lucide-react';

const FORMATS = ['All', 'T10', 'T20', 'ODI', 'Test', 'Custom'];
const PAGE_SIZE = 8;

export default function LiveMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState('All');
  const [page, setPage] = useState(1);

  const loadLive = useCallback(async () => {
    try {
      const res = await matchAPI.getLiveMatches();
      const all = res.data.data || [];
      const valid = all.filter((m: any) => {
        if (!m.tournamentId) return true;
        return typeof m.tournamentId === 'object' && m.tournamentId !== null && m.tournamentId._id;
      });
      setMatches(valid);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadLive();
    const iv = setInterval(loadLive, 15000);
    socket.get().on('scoreUpdate', loadLive);
    return () => { clearInterval(iv); socket.get().off('scoreUpdate', loadLive); };
  }, [loadLive]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [search, format]);

  // Filter matches
  const filtered = matches.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || (m.name || '').toLowerCase().includes(q)
      || (m.team1Name || '').toLowerCase().includes(q)
      || (m.team2Name || '').toLowerCase().includes(q)
      || (m.venue || '').toLowerCase().includes(q)
      || (m.scorerName || m.scorerUsername || '').toLowerCase().includes(q);
    const matchesFormat = format === 'All' || m.format === format;
    return matchesSearch && matchesFormat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-responsive max-w-4xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="fluid-3xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Zap className="icon-fluid-base text-red-400" /> Live Matches
          </h1>
          <p className="fluid-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading…' : `${filtered.length} match${filtered.length !== 1 ? 'es' : ''} live`} · Updates every 15s
          </p>
        </div>
        <button
          onClick={loadLive}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw className="icon-fluid-sm" /> Refresh
        </button>
      </div>

      {/* Search + Format filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by match name, team, venue or scorer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FORMATS.map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: format === f ? 'var(--accent)' : 'var(--bg-card)',
                border: `1px solid ${format === f ? 'var(--accent)' : 'var(--border)'}`,
                color: format === f ? '#000' : 'var(--text-secondary)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-responsive">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-responsive rounded-2xl p-responsive" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Activity className="icon-fluid-xl mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="fluid-lg font-semibold" style={{ color: 'var(--text-muted)' }}>
            {search || format !== 'All' ? 'No matches found for your filters' : 'No live matches right now'}
          </p>
          <p className="fluid-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {search || format !== 'All' ? 'Try adjusting your search or format filter' : 'Start scoring a match from your tournament page'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map(m => {
              const inn = m.innings?.[m.currentInnings - 1] || {};
              const creatorName = m.scorerName || m.scorerUsername || null;
              return (
                <div key={m._id} className="rounded-2xl overflow-hidden transition-all" style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="px-responsive py-4">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                        </span>
                        <span className="fluid-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Shield className="icon-fluid-xs" />{m.format}</span>
                        {m.venue && <span className="fluid-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><MapPin className="icon-fluid-xs" />{m.venue}</span>}
                        {creatorName && (
                          <span className="fluid-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <User className="icon-fluid-xs" /> {creatorName}
                          </span>
                        )}
                      </div>
                      <span className="fluid-sm" style={{ color: 'var(--text-secondary)' }}>Inn {m.currentInnings}</span>
                    </div>

                    {/* Match name */}
                    {m.name && (
                      <p className="text-sm font-black mb-3" style={{ color: 'var(--accent)' }}>{m.name}</p>
                    )}

                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 items-center mb-4">
                      <div className="text-center">
                        <p className="font-black fluid-lg" style={{ color: 'var(--text-primary)' }}>{m.team1Name}</p>
                        <p className="font-bold fluid-2xl" style={{ color: 'var(--text-secondary)' }}>{m.team1Score}/{m.team1Wickets}</p>
                        <p className="fluid-sm" style={{ color: 'var(--text-muted)' }}>( {typeof m.team1Overs === 'number' ? m.team1Overs.toFixed(1) : '0.0'} ov )</p>
                      </div>
                      <div className="text-center font-bold xs:text-fluid-lg" style={{ color: 'var(--text-muted)' }}>vs</div>
                      <div className="text-center">
                        <p className="font-black fluid-lg" style={{ color: 'var(--text-primary)' }}>{m.team2Name}</p>
                        <p className="font-bold fluid-2xl" style={{ color: 'var(--text-secondary)' }}>{m.team2Score}/{m.team2Wickets}</p>
                        <p className="fluid-sm" style={{ color: 'var(--text-muted)' }}>( {typeof m.team2Overs === 'number' ? m.team2Overs.toFixed(1) : '0.0'} ov )</p>
                      </div>
                    </div>

                    {m.strikerName && (
                      <div className="rounded-xl p-3 text-fluid-xs grid grid-cols-2 xs:grid-cols-3 gap-2 mb-3" style={{ background: 'var(--bg-elevated)' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>🏏 </span><span style={{ color: 'var(--text-primary)' }}>{m.strikerName}*</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>⬤ </span><span style={{ color: 'var(--text-primary)' }}>{m.nonStrikerName}</span></div>
                        <div className="xs:col-span-1"><span style={{ color: 'var(--text-muted)' }}>🎳 </span><span style={{ color: 'var(--text-primary)' }}>{m.currentBowlerName}</span></div>
                      </div>
                    )}

                    {inn.targetScore && (
                      <div className="rounded-xl px-3 py-2 mb-3 text-fluid-xs" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                        <span className="font-semibold" style={{ color: '#60a5fa' }}>Target: {inn.targetScore}</span>
                        <span className="ml-2" style={{ color: 'var(--text-muted)' }}>Need {inn.requiredRuns} @ RRR {inn.requiredRunRate?.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className={`grid gap-2 ${m.streamUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <button
                        onClick={() => navigate(`/live/${m._id}`)}
                        className="w-full py-2.5 font-bold text-fluid-sm rounded-xl transition-all flex items-center justify-center gap-2"
                        style={{ background: 'var(--accent)', color: '#000' }}
                      >
                        <Zap className="icon-fluid-sm" /> Live Scoreboard
                      </button>
                      {m.streamUrl && (
                        <a
                          href={m.streamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 font-bold text-fluid-sm rounded-xl transition-all flex items-center justify-center gap-2"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                        >
                          <ExternalLink className="icon-fluid-sm" /> Watch Live
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                Page {page} of {totalPages} · {filtered.length} matches
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
