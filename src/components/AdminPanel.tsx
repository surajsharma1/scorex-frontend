import { useState, useEffect } from 'react';
import { Users, Shield, Zap, BarChart3, Download, Settings, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

type Duration = '1day' | '1week' | '1month';
const DURATIONS: Duration[] = ['1day', '1week', '1month'];
const DURATION_LABELS: Record<Duration, string> = { '1day': '1 Day', '1week': '1 Week', '1month': '1 Month' };

const DEFAULT_PRICES = {
  1: { '1day': 49, '1week': 249, '1month': 499 },
  2: { '1day': 149, '1week': 749, '1month': 1499 },
};

export default function AdminPanel() {
  const [stats, setStats] = useState({ users: 0, tournaments: 0, matches: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [savingPrices, setSavingPrices] = useState(false);
  const [priceToast, setPriceToast] = useState('');
  const [activeSection, setActiveSection] = useState<'overview' | 'pricing' | 'users'>('overview');

  useEffect(() => {
    api.get('/stats/admin').then(res => { setStats(res.data); }).catch(() => {}).finally(() => setLoading(false));
    api.get('/admin/membership-prices').then(res => { if (res.data?.prices) setPrices(res.data.prices); }).catch(() => {});
  }, []);

  const savePrices = async () => {
    setSavingPrices(true);
    try {
      await api.post('/admin/membership-prices', { prices });
      setPriceToast('Prices saved successfully!');
      setTimeout(() => setPriceToast(''), 3000);
    } catch {
      setPriceToast('Failed to save prices');
      setTimeout(() => setPriceToast(''), 3000);
    } finally { setSavingPrices(false); }
  };

  const updatePrice = (level: 1 | 2, duration: Duration, value: string) => {
    const num = parseInt(value) || 0;
    setPrices(p => ({ ...p, [level]: { ...p[level], [duration]: num } }));
  };

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, gradient: 'from-blue-500 to-cyan-500', glow: 'rgba(6,182,212,0.2)' },
    { label: 'Tournaments', value: stats.tournaments, icon: Zap, gradient: 'from-green-500 to-emerald-500', glow: 'rgba(34,197,94,0.2)' },
    { label: 'Matches', value: stats.matches, icon: BarChart3, gradient: 'from-purple-500 to-violet-500', glow: 'rgba(168,85,247,0.2)' },
    { label: 'Revenue (₹)', value: stats.revenue, icon: Download, gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.2)' },
  ];

  const sections = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'pricing', label: 'Membership Pricing', icon: Settings },
    { key: 'users', label: 'User Management', icon: Users },
  ] as const;

  return (
    <div className="p-6 max-w-5xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)' }} />

      {/* Toast */}
      {priceToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
          style={{ background: priceToast.includes('Failed') ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)', color: '#fff', backdropFilter: 'blur(8px)' }}>
          {priceToast.includes('Failed') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {priceToast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-red-400 to-orange-500" />
          <h1 className="text-3xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-8 h-8 text-red-400" /> Admin Panel
            <span className="px-2 py-0.5 rounded-full text-xs font-black"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
              ADMIN
            </span>
          </h1>
        </div>
        <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>Platform overview & management</p>
      </div>

      {/* Section Nav */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={activeSection === s.key
              ? { background: 'linear-gradient(135deg, rgba(239,68,68,0.8), rgba(220,38,38,0.8))', color: '#fff', boxShadow: '0 0 12px rgba(239,68,68,0.25)' }
              : { color: 'var(--text-secondary)' }}>
            <s.icon className="w-4 h-4" /> {s.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(card => (
              <div key={card.label} className="rounded-2xl p-5 transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: `0 4px 24px ${card.glow}` }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {loading ? '–' : card.value.toLocaleString()}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'User Management', desc: 'View, ban, and manage user accounts' },
              { title: 'Tournament Audit', desc: 'Review and moderate tournaments' },
              { title: 'Payment Reports', desc: 'View subscription and payment history' },
              { title: 'Overlay Stats', desc: 'Track overlay usage and performance' },
              { title: 'System Logs', desc: 'View system and error logs' },
              { title: 'Export Data', desc: 'Export platform data as CSV/JSON', action: () => window.open('/api/stats/export/all', '_blank') },
            ].map(c => (
              <div key={c.title} onClick={c.action}
                className={`p-5 rounded-2xl transition-all hover:-translate-y-0.5 ${c.action ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{c.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MEMBERSHIP PRICING */}
      {activeSection === 'pricing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>Membership Prices</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Set prices for each plan and duration. Changes reflect immediately for new purchases.</p>
            </div>
            <button onClick={savePrices} disabled={savingPrices}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
              {savingPrices ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Prices</>}
            </button>
          </div>

          {([1, 2] as const).map(level => (
            <div key={level} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-6 py-4 flex items-center gap-3"
                style={{ background: level === 1 ? 'rgba(34,197,94,0.08)' : 'rgba(168,85,247,0.08)', borderBottom: '1px solid var(--border)' }}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm`}
                  style={{ background: level === 1 ? 'linear-gradient(135deg,#22c55e,#10b981)' : 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                  {level === 1 ? '★' : '♛'}
                </div>
                <div>
                  <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>
                    Level {level} — {level === 1 ? 'Premium' : 'Enterprise'}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Set price in ₹ for each duration</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {DURATIONS.map(d => (
                  <div key={d}>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {DURATION_LABELS[d]}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold" style={{ color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="number" min="0"
                        value={prices[level][d]}
                        onChange={e => updatePrice(level, d, e.target.value)}
                        className="w-full pl-7 pr-4 py-3 rounded-xl text-sm font-bold focus:outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        onFocus={e => (e.target.style.borderColor = level === 1 ? '#22c55e' : '#a855f7')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Price preview */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Price Preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-2 pr-4 font-bold" style={{ color: 'var(--text-muted)' }}>Plan</th>
                    {DURATIONS.map(d => (
                      <th key={d} className="text-left py-2 pr-4 font-bold" style={{ color: 'var(--text-muted)' }}>{DURATION_LABELS[d]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {([1, 2] as const).map(level => (
                    <tr key={level} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 pr-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                        {level === 1 ? 'Premium' : 'Enterprise'}
                      </td>
                      {DURATIONS.map(d => (
                        <td key={d} className="py-3 pr-4 font-black" style={{ color: level === 1 ? '#22c55e' : '#a855f7' }}>
                          ₹{prices[level][d]}
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

      {/* USER MANAGEMENT */}
      {activeSection === 'users' && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>User Management</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Full user management UI coming soon. Use the export function to view user data.</p>
          <button onClick={() => window.open('/api/stats/export/users', '_blank')}
            className="mt-4 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
            <Download className="w-4 h-4" /> Export Users
          </button>
        </div>
      )}
    </div>
  );
}
