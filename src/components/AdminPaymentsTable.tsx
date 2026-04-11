import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Download, Search, RefreshCw, TrendingUp, CheckCircle, XCircle, Clock, Crown, Star, AlertCircle } from 'lucide-react';
import { adminAPI } from '../services/api';

interface Payment {
  userId: string;
  username: string;
  email: string;
  amount: number;
  currency: string;
  level?: string;
  plan?: string;
  date: string;
  status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  duration?: string;
}

export default function AdminPaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'created' | 'failed'>('all');

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

  const filtered = payments.filter(p => {
    const matchesSearch =
      (p.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.plan || p.level || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const successCount = payments.filter(p => p.status === 'completed').length;
  const pendingCount = payments.filter(p => p.status === 'created').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;

  const statusMeta = (status: string) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle, label: 'Paid', bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' };
      case 'created':   return { icon: Clock,       label: 'Pending', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
      case 'failed':    return { icon: XCircle,      label: 'Failed', bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.3)' };
      default:          return { icon: AlertCircle,  label: status,   bg: 'var(--bg-elevated)', color: 'var(--text-muted)', border: 'var(--border)' };
    }
  };

  const planMeta = (plan: string) => {
    const p = (plan || '').toLowerCase();
    if (p.includes('enterprise') || p.includes('lv2') || p.includes('level 2')) {
      return { label: 'Enterprise', icon: Crown, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' };
    }
    return { label: 'Premium', icon: Star, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  };

  const inp = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Revenue Collected', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#22c55e', note: 'from completed payments' },
          { label: 'Successful', value: successCount, icon: CheckCircle, color: '#22c55e', note: 'membership activated' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: '#f59e0b', note: 'payment initiated, not paid' },
          { label: 'Failed', value: failedCount, icon: XCircle, color: '#f87171', note: 'payment did not complete' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: card.color }} />
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{card.label}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.note}</p>
            </div>
          );
        })}
      </div>

      {/* Info banner about payment → membership flow */}
      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-bold text-blue-400">Payment Flow: </span>
          When a user pays via Razorpay, a <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>created</code> record is stored. After successful payment verification, it becomes <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>completed</code> and membership is immediately assigned. Only <strong>completed</strong> payments result in active memberships.
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'completed', 'created', 'failed'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
              style={statusFilter === f
                ? { background: 'var(--accent)', color: '#000' }
                : { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              {f === 'all' ? 'All' : f === 'completed' ? '✓ Paid' : f === 'created' ? '⏳ Pending' : '✗ Failed'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search payments…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-48 focus:outline-none transition-all" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <button onClick={loadPayments} className="p-2.5 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['User', 'Plan', 'Amount', 'Duration', 'Date', 'Status', 'Membership'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading payments…</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center">
                <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {statusFilter !== 'all' ? `No ${statusFilter} payments` : 'No payments found'}
                </p>
              </td></tr>
            ) : filtered.map((p, i) => {
              const sm = statusMeta(p.status);
              const pm = planMeta(p.plan || p.level || '');
              const PlanIcon = pm.icon;
              const StatusIcon = sm.icon;
              const membershipAssigned = p.status === 'completed';
              return (
                <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {(p.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.username || '—'}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.email || '—'}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: pm.bg, color: pm.color }}>
                      <PlanIcon className="w-3 h-3" />
                      {pm.label}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-black text-base" style={{ color: 'var(--text-primary)' }}>
                    {p.amount ? `₹${p.amount.toLocaleString()}` : '—'}
                  </td>

                  <td className="px-4 py-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {p.duration || '—'}
                  </td>

                  <td className="px-4 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.date ? new Date(p.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                      <StatusIcon className="w-3 h-3" />
                      {sm.label}
                    </span>
                    {p.razorpay_payment_id && (
                      <div className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                        {p.razorpay_payment_id.slice(0, 16)}…
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {membershipAssigned ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: '#22c55e' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3.5 h-3.5" />
                        {p.status === 'created' ? 'Awaiting payment' : 'Not assigned'}
                      </span>
                    )}
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
