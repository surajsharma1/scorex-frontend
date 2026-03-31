import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Zap, BarChart3, Download, Settings, Save, RefreshCw,
  CheckCircle, AlertCircle, Users, Eye, DollarSign, FileText,
  Activity, TrendingUp, Crown, Star, UserCheck, Clock, X
} from 'lucide-react';
import api, { adminAPI } from '../services/api';
import AdminUserTable from './AdminUserTable';
import AdminPaymentsTable from './AdminPaymentsTable';
import AdminTournamentsTable from './AdminTournamentsTable';
import AdminLogsTable from './AdminLogsTable';

type Duration = '1day' | '1week' | '1month';
type Section = 'overview' | 'pricing' | 'users' | 'payments' | 'tournaments' | 'logs';

const DURATIONS: Duration[] = ['1day', '1week', '1month'];
const DURATION_LABELS: Record<Duration, string> = {
  '1day': '1 Day',
  '1week': '1 Week',
  '1month': '1 Month',
};

const DEFAULT_PRICES = {
  1: { '1day': 149, '1week': 499, '1month': 1499 },
  2: { '1day': 249, '1week': 999, '1month': 2499 },
};

interface Stats {
  users: number;
  tournaments: number;
  matches: number;
  revenue: number;
  premiumUsers?: number;
  enterpriseUsers?: number;
  activeTournaments?: number;
  liveMatches?: number;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats>({ users: 0, tournaments: 0, matches: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [savingPrices, setSavingPrices] = useState(false);
  const [priceSaveStatus, setPriceSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const loadStats = api.get('/stats/admin')
      .then(res => setStats(res.data))
      .catch(() => setStatsError(true));

    const loadPrices = api.get('/admin/membership-prices')
      .then(res => {
        let loaded = res.data.prices || DEFAULT_PRICES;
        if (loaded.basic && loaded.premium) {
          loaded = {
            1: { '1day': loaded.basic.price, '1week': loaded.basic.price * 3, '1month': loaded.basic.price * 10 },
            2: { '1day': loaded.premium.price, '1week': loaded.premium.price * 3, '1month': loaded.premium.price * 10 },
          };
        }
        setPrices(loaded);
      })
      .catch(() => {});

    Promise.all([loadStats, loadPrices]).finally(() => setLoading(false));
  }, []);

  const savePrices = async () => {
    setSavingPrices(true);
    setPriceSaveStatus('idle');
    try {
      await api.post('/admin/membership-prices', { prices });
      setPriceSaveStatus('success');
      addToast('Prices saved and will apply to new purchases immediately.', 'success');
    } catch {
      setPriceSaveStatus('error');
      addToast('Failed to save prices. Please try again.', 'error');
    } finally {
      setSavingPrices(false);
      setTimeout(() => setPriceSaveStatus('idle'), 4000);
    }
  };

  const updatePrice = (level: 1 | 2, duration: Duration, value: string) => {
    const num = parseInt(value) || 0;
    setPrices(p => ({ ...p, [level]: { ...p[level], [duration]: num } }));
    setPriceSaveStatus('idle');
  };

  const sections: { key: Section; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'overview',     label: 'Overview',     icon: BarChart3,   color: '#3b82f6' },
    { key: 'pricing',      label: 'Pricing',       icon: Settings,    color: '#22c55e' },
    { key: 'users',        label: 'Users',         icon: Users,       color: '#8b5cf6' },
    { key: 'tournaments',  label: 'Tournaments',   icon: Zap,         color: '#f59e0b' },
    { key: 'payments',     label: 'Payments',      icon: DollarSign,  color: '#10b981' },
    { key: 'logs',         label: 'Logs',          icon: FileText,    color: '#64748b' },
  ];

  const statCards = [
    {
      label: 'Total Users',
      value: stats.users,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'rgba(6,182,212,0.15)',
      sub: stats.premiumUsers != null ? `${stats.premiumUsers} premium` : undefined,
    },
    {
      label: 'Tournaments',
      value: stats.tournaments,
      icon: Zap,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'rgba(245,158,11,0.15)',
      sub: stats.activeTournaments != null ? `${stats.activeTournaments} active` : undefined,
    },
    {
      label: 'Matches',
      value: stats.matches,
      icon: BarChart3,
      gradient: 'from-purple-500 to-violet-500',
      glow: 'rgba(168,85,247,0.15)',
      sub: stats.liveMatches != null ? `${stats.liveMatches} live` : undefined,
    },
    {
      label: 'Revenue (₹)',
      value: stats.revenue,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      glow: 'rgba(34,197,94,0.15)',
      sub: stats.enterpriseUsers != null ? `${stats.enterpriseUsers} enterprise` : undefined,
    },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)' }} />

      {/* Toast Stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl pointer-events-auto"
            style={{
              background: t.type === 'success' ? 'rgba(34,197,94,0.92)' : 'rgba(239,68,68,0.92)',
              color: '#fff',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              minWidth: '260px',
              maxWidth: '340px',
            }}
          >
            {t.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-red-400 to-orange-500" />
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-red-400" />
              <h1 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                Admin Panel
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-black tracking-wide"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                ADMIN
              </span>
            </div>
          </div>
          <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Platform management &amp; analytics
          </p>
        </div>

        {/* Section Nav */}
        <div
          className="flex overflow-x-auto gap-1 p-1 rounded-2xl mb-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            scrollbarWidth: 'none',
          }}
        >
          {sections.map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0"
                style={
                  isActive
                    ? { background: s.color, color: '#fff', boxShadow: `0 0 16px ${s.color}55` }
                    : { color: 'var(--text-secondary)' }
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ── */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Stats Error Banner */}
            {statsError && (
              <div className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-red-400">Stats API failed to load</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Check that <code>/stats/admin</code> is reachable and your auth token is valid.
                  </p>
                </div>
              </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(card => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="group rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      boxShadow: `0 4px 24px ${card.glow}`,
                    }}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-all`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-black mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {loading ? <span className="inline-block w-12 h-7 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} /> : (card.value ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                    {card.sub && (
                      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{card.sub}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Action Cards */}
            <div>
              <h2 className="font-bold text-sm mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    title: 'User Management',
                    desc: 'Manage accounts, roles, bans & memberships',
                    icon: Users,
                    iconGrad: 'from-purple-500 to-violet-500',
                    action: () => setActiveSection('users'),
                  },
                  {
                    title: 'Membership Pricing',
                    desc: 'Set prices for Premium & Enterprise plans',
                    icon: Settings,
                    iconGrad: 'from-green-500 to-emerald-500',
                    action: () => setActiveSection('pricing'),
                  },
                  {
                    title: 'Payments',
                    desc: 'View payment history & revenue reports',
                    icon: DollarSign,
                    iconGrad: 'from-amber-500 to-orange-500',
                    action: () => setActiveSection('payments'),
                  },
                  {
                    title: 'Tournaments',
                    desc: 'Audit and moderate all tournaments',
                    icon: Zap,
                    iconGrad: 'from-blue-500 to-cyan-500',
                    action: () => setActiveSection('tournaments'),
                  },
                  {
                    title: 'System Logs',
                    desc: 'View and download server logs',
                    icon: FileText,
                    iconGrad: 'from-slate-500 to-slate-600',
                    action: () => setActiveSection('logs'),
                  },
                  {
                    title: 'Export Users CSV',
                    desc: 'Download complete user list',
                    icon: Download,
                    iconGrad: 'from-rose-500 to-pink-500',
                    action: () => {
                      adminAPI.exportUsers()
                        .then(res => {
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const a = document.createElement('a');
                          a.href = url;
                          a.setAttribute('download', 'scorex-users.csv');
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                          addToast('Users exported successfully', 'success');
                        })
                        .catch(() => addToast('Export failed', 'error'));
                    },
                  },
                ].map(c => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.title}
                      onClick={c.action}
                      className="text-left p-4 rounded-2xl transition-all hover:-translate-y-0.5 group"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${c.iconGrad} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all shadow-md`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Membership Tier Summary */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Membership Overview</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Free', icon: Zap, color: '#64748b', value: stats.users - (stats.premiumUsers || 0) - (stats.enterpriseUsers || 0) },
                  { label: 'Premium', icon: Star, color: '#22c55e', value: stats.premiumUsers ?? '—' },
                  { label: 'Enterprise', icon: Crown, color: '#a855f7', value: stats.enterpriseUsers ?? '—' },
                ].map(tier => {
                  const Icon = tier.icon;
                  return (
                    <div key={tier.label} className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: tier.color }} />
                      <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                        {loading ? '–' : (typeof tier.value === 'number' && tier.value < 0 ? 0 : tier.value)}
                      </p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{tier.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── MEMBERSHIP PRICING ── */}
        {activeSection === 'pricing' && (
          <div className="space-y-6">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>Membership Pricing</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Prices apply to new purchases immediately. Existing subscribers are unaffected.
                </p>
              </div>
              <button
                onClick={savePrices}
                disabled={savingPrices}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-60 flex-shrink-0"
                style={
                  priceSaveStatus === 'success'
                    ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }
                    : priceSaveStatus === 'error'
                    ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }
                    : { background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }
                }
              >
                {savingPrices
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                  : priceSaveStatus === 'success'
                  ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                  : priceSaveStatus === 'error'
                  ? <><AlertCircle className="w-4 h-4" /> Retry</>
                  : <><Save className="w-4 h-4" /> Save Prices</>}
              </button>
            </div>

            {([1, 2] as const).map(level => (
              <div
                key={level}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="px-6 py-4 flex items-center gap-3"
                  style={{
                    background: level === 1 ? 'rgba(34,197,94,0.07)' : 'rgba(168,85,247,0.07)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black"
                    style={{ background: level === 1 ? 'linear-gradient(135deg,#22c55e,#10b981)' : 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
                  >
                    {level === 1 ? <Star className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>
                      {level === 1 ? 'Premium' : 'Enterprise'} Plan
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Set price in ₹ for each duration</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {DURATIONS.map(d => (
                    <div key={d}>
                      <label className="flex items-center gap-2 text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3.5 h-3.5" />
                        {DURATION_LABELS[d]}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: 'var(--text-muted)' }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          value={prices[level][d]}
                          onChange={e => updatePrice(level, d, e.target.value)}
                          className="w-full pl-8 pr-4 py-3 rounded-xl text-sm font-bold focus:outline-none transition-colors"
                          style={{
                            background: 'var(--bg-elevated)',
                            border: `1px solid var(--border)`,
                            color: 'var(--text-primary)',
                          }}
                          onFocus={e => (e.target.style.borderColor = level === 1 ? '#22c55e' : '#a855f7')}
                          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Preview table */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Price Preview</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left py-2 pr-6 font-bold" style={{ color: 'var(--text-muted)' }}>Plan</th>
                      {DURATIONS.map(d => (
                        <th key={d} className="text-left py-2 pr-6 font-bold" style={{ color: 'var(--text-muted)' }}>
                          {DURATION_LABELS[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {([1, 2] as const).map(level => (
                      <tr key={level} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 pr-6 font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                          {level === 1
                            ? <><Star className="w-3.5 h-3.5 text-green-400" /> Premium</>
                            : <><Crown className="w-3.5 h-3.5 text-purple-400" /> Enterprise</>}
                        </td>
                        {DURATIONS.map(d => (
                          <td key={d} className="py-3 pr-6 font-black" style={{ color: level === 1 ? '#22c55e' : '#a855f7' }}>
                            ₹{prices[level][d].toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── USER MANAGEMENT ── */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>User Management</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage roles, bans, and memberships</p>
              </div>
            </div>
            <AdminUserTable />
          </div>
        )}

        {/* ── TOURNAMENTS ── */}
        {activeSection === 'tournaments' && <AdminTournamentsTable />}

        {/* ── PAYMENTS ── */}
        {activeSection === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Payment History</h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All membership transactions</p>
                </div>
              </div>
              <button
                onClick={() => {
                  adminAPI.exportPayments()
                    .then(res => {
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const a = document.createElement('a');
                      a.href = url;
                      a.setAttribute('download', 'scorex-payments.csv');
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                      addToast('Payments exported', 'success');
                    })
                    .catch(() => addToast('Export failed', 'error'));
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <AdminPaymentsTable />
          </div>
        )}

        {/* ── LOGS ── */}
        {activeSection === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>System Logs</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Download and inspect server activity logs</p>
              </div>
            </div>
            <AdminLogsTable />
          </div>
        )}

      </div>
    </div>
  );
}
