import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Trash2, Download, Search, RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api, { adminAPI, tournamentAPI } from '../services/api';

interface Tournament {
  _id: string;
  name: string;
  status: string;
  startDate: string;
  endDate?: string;
  registrationFee: number;
  organizer: { username: string } | string;
  type?: string;
}

interface Toast { id: number; msg: string; type: 'success' | 'error' }

export default function AdminTournamentsTable() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const toast = useCallback((msg: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tournamentAPI.getTournaments();
      setTournaments(res.data.data || []);
    } catch {
      toast('Failed to load tournaments', 'error');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  // Admin delete — uses admin route which bypasses organizer ownership check
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?\n\nThis will permanently remove the tournament and all its matches, teams, and overlays from the database.`)) return;
    setDeleting(id);
    try {
      // Use admin-specific delete endpoint
      await api.delete(`/admin/tournaments/${id}`);
      setTournaments(t => t.filter(x => x._id !== id));
      toast(`"${name}" deleted successfully`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to delete tournament', 'error');
    } finally { setDeleting(null); }
  };

  const downloadCSV = () => {
    adminAPI.exportTournaments().then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'scorex-tournaments.csv';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast('Exported successfully', 'success');
    }).catch(() => toast('Export failed', 'error'));
  };

  const filteredTournaments = tournaments.filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (typeof t.organizer === 'object' ? t.organizer?.username : t.organizer || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusStyle = (status: string) => ({
    bg: status === 'ongoing' ? 'rgba(34,197,94,0.15)' : status === 'completed' ? 'rgba(100,116,139,0.15)' : status === 'upcoming' ? 'rgba(59,130,246,0.15)' : 'var(--bg-elevated)',
    color: status === 'ongoing' ? '#22c55e' : status === 'completed' ? '#94a3b8' : status === 'upcoming' ? '#60a5fa' : 'var(--text-muted)',
    border: status === 'ongoing' ? 'rgba(34,197,94,0.3)' : status === 'completed' ? 'rgba(100,116,139,0.3)' : status === 'upcoming' ? 'rgba(59,130,246,0.3)' : 'var(--border)',
  });

  const inp = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

  // Days until auto-delete (3 days after endDate)
  const autoDeleteIn = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const deleteAt = end + 3 * 24 * 60 * 60 * 1000;
    const ms = deleteAt - Date.now();
    if (ms <= 0) return 'Pending deletion';
    const days = Math.floor(ms / 86400000);
    const hrs = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return `Auto-deletes in ${days}d`;
    return `Auto-deletes in ${hrs}h`;
  };

  return (
    <div className="space-y-4">
      {/* Toasts */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl pointer-events-auto"
            style={{ background: t.type === 'success' ? 'rgba(34,197,94,0.92)' : 'rgba(239,68,68,0.92)', color: '#fff', backdropFilter: 'blur(12px)', minWidth: '240px' }}>
            {t.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Auto-delete notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-bold text-amber-400">Auto-delete active:</span> Completed/ongoing tournaments are automatically removed from MongoDB 3 days after their end date, including all matches, teams, and overlays.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filteredTournaments.length} tournaments</p>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search tournaments…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-56 focus:outline-none transition-all" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <button onClick={loadTournaments} className="p-2.5 rounded-xl transition-all hover:scale-105"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Tournament', 'Status', 'Start Date', 'End Date', 'Fee', 'Organizer', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading tournaments…</p>
              </td></tr>
            ) : filteredTournaments.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center">
                <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tournaments found</p>
              </td></tr>
            ) : filteredTournaments.map(t => {
              const st = statusStyle(t.status);
              const autoDelete = (t.status === 'completed' || t.status === 'ongoing') ? autoDeleteIn(t.endDate) : null;
              return (
                <tr key={t._id} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                  <td className="px-5 py-4">
                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                    {t.type && <div className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>{t.type.replace('_', ' ')}</div>}
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{t.status}</span>
                  </td>

                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t.startDate ? new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.endDate ? new Date(t.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </div>
                    {autoDelete && (
                      <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: '#f59e0b' }}>
                        <Clock className="w-2.5 h-2.5" /> {autoDelete}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {t.registrationFee ? `₹${t.registrationFee}` : 'Free'}
                  </td>

                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {typeof t.organizer === 'object' ? t.organizer?.username : t.organizer || 'N/A'}
                  </td>

                  <td className="px-5 py-4">
                    <button onClick={() => handleDelete(t._id, t.name)} disabled={deleting === t._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                      title="Delete tournament (admin)">
                      {deleting === t._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
