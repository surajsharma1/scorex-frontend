import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Download, Search, RefreshCw, TrendingUp } from 'lucide-react';
import { adminAPI } from '../services/api';

interface Payment {
  userId: string;
  username: string;
  email: string;
  amount: number;
  currency: string;
  level: string;
  date: string;
  status: string;
}

export default function AdminPaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPayments();
      setPayments(res.data.data || []);
    } catch { console.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handleExport = () => {
    adminAPI.exportPayments().then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'scorex-payments.csv';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    }).catch(() => alert('Export failed'));
  };

  const filtered = payments.filter(p =>
    (p.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.level || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.reduce((s, p) => s + (p.amount || 0), 0);

  const levelStyle = (level: string) => ({
    bg: level?.toLowerCase().includes('enterprise') ? 'rgba(168,85,247,0.15)' : 'rgba(34,197,94,0.15)',
    color: level?.toLowerCase().includes('enterprise') ? '#a855f7' : '#22c55e',
    border: level?.toLowerCase().includes('enterprise') ? 'rgba(168,85,247,0.3)' : 'rgba(34,197,94,0.3)',
  });

  const statusStyle = (status: string) => ({
    bg: status === 'completed' ? 'rgba(34,197,94,0.15)' : status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
    color: status === 'completed' ? '#22c55e' : status === 'failed' ? '#f87171' : '#f59e0b',
    border: status === 'completed' ? 'rgba(34,197,94,0.3)' : status === 'failed' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)',
  });

  const inp = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="space-y-4">
      {/* Revenue summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#22c55e' },
          { label: 'Transactions', value: filtered.length, icon: DollarSign, color: '#3b82f6' },
          { label: 'Avg. Value', value: filtered.length ? `₹${Math.round(totalRevenue / filtered.length).toLocaleString()}` : '₹0', icon: TrendingUp, color: '#a855f7' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <Icon className="w-4 h-4 mb-2" style={{ color: card.color }} />
              <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filtered.length} transactions</p>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search payments…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-52 focus:outline-none transition-all" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <button onClick={loadPayments} className="p-2.5 rounded-xl transition-all hover:scale-105"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['User', 'Plan', 'Amount', 'Date', 'Status'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading payments…</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center">
                <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No payments found</p>
              </td></tr>
            ) : filtered.map((p, i) => {
              const lv = levelStyle(p.level);
              const st = statusStyle(p.status);
              return (
                <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {(p.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.username}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ background: lv.bg, color: lv.color, border: `1px solid ${lv.border}` }}>{p.level}</span>
                  </td>
                  <td className="px-5 py-4 font-black text-base" style={{ color: 'var(--text-primary)' }}>
                    ₹{(p.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.date ? new Date(p.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{p.status}</span>
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
