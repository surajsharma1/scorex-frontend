import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import MembershipPreview from './MembershipPreview';
import OverlayPreview from './OverlayPreview';
import FloatingOverlayPreview from './FloatingOverlayPreview';
import { getBackendBaseUrl } from '../services/env';
import { overlayAPI, paymentAPI } from '../services/api';
import api from '../services/api';
import type { OverlayTemplate } from '../types/overlay';
import { Check, Zap, Crown, Star, Clock, Calendar, AlertCircle, Eye } from 'lucide-react';





type Duration = '1day' | '1week' | '1month';

const DURATION_LABELS: Record<Duration, string> = {
  '1day':   '1 Day',
  '1week':  '1 Week',
  '1month': '1 Month',
};

const DURATION_MS: Record<Duration, number> = {
  '1day':   86400000,
  '1week':  604800000,
  '1month': 2592000000,
};

// Default prices — overridden by admin settings fetched from backend
const DEFAULT_PRICES: Record<number, Record<Duration, number>> = {
  1: { '1day': 149,  '1week': 499,  '1month': 1499  },
  2: { '1day': 249, '1week': 999,  '1month': 2499 },
};

function formatTimeLeft(expiryISO: string): string {
  const ms = new Date(expiryISO).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Membership() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Duration>('1month');
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [membership, setMembership] = useState<any>(null);
  const [backendUser, setBackendUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);

  const [showFloatingPreview, setShowFloatingPreview] = useState(false);
  const [floatingPreviewLevel, setFloatingPreviewLevel] = useState(1);
  const [selectedFloatingOverlay, setSelectedFloatingOverlay] = useState('lvl1-modern-bar.html');

// Fetch overlay templates (unchanged)
  useEffect(() => {
    overlayAPI.getOverlayTemplates().then(res => {
      setTemplates(res.data);
    }).catch(console.error);
  }, []);

// Fetch admin-configured prices
  useEffect(() => {
    api.get('/admin/membership-prices').then(res => {
      if (res.data?.prices) setPrices(res.data.prices);
    }).catch(() => {/* use defaults */});
  }, []);


  // Fetch fresh user data for accurate current membership status
  useEffect(() => {
    api.get('/auth/me').then(res => {
      const freshUser = res.data.data;
      localStorage.setItem('user', JSON.stringify(freshUser));
      setBackendUser(freshUser);
      if (freshUser.membershipLevel > 0 && freshUser.membershipExpiresAt) {
        setMembership({
          level: freshUser.membershipLevel,
          expiry: freshUser.membershipExpiresAt,
          purchasedAt: freshUser.membershipStartedAt || freshUser.membershipPurchasedAt,
          duration: '1month', // Compute from expiry diff if needed
        });
      }
    }).catch(() => {});
  }, []);

  // Live countdown
  useEffect(() => {
    if (!membership?.expiry) return;
    const tick = () => setTimeLeft(formatTimeLeft(membership.expiry));
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [membership]);

  const backendLevel = backendUser?.membershipLevel || 0;
  const backendExpires = backendUser?.membershipExpiresAt;
  const backendIsActive = backendLevel > 0 && backendExpires && new Date(backendExpires) > new Date();
  const currentLevel = backendIsActive ? backendLevel : 0;
  const isExpired = backendIsActive ? false : (membership !== null);

  const PLANS = [
    {
      name: 'Free', level: 0, icon: Zap,
      gradient: 'from-slate-600 to-slate-700',
      accentColor: 'rgba(100,116,139,0.2)',
      borderColor: 'rgba(100,116,139,0.3)',
      iconColor: '#94a3b8',
      features: ['Up to 3 tournaments', 'Basic scoring', '5 overlays', 'Standard support'],
    },
    {
      name: 'Premium', level: 1, icon: Star,
      gradient: 'from-green-600 to-emerald-600',
      accentColor: 'rgba(34,197,94,0.1)',
      borderColor: 'rgba(34,197,94,0.3)',
      iconColor: '#22c55e',
      popular: true,
      features: ['Unlimited tournaments', 'Live scoring + undo', '20 premium overlays', 'Priority support', 'Match analytics', 'Export data'],
    },
    {
      name: 'Enterprise', level: 2, icon: Crown,
      gradient: 'from-purple-600 to-violet-600',
      accentColor: 'rgba(168,85,247,0.1)',
      borderColor: 'rgba(168,85,247,0.3)',
      iconColor: '#a855f7',
      features: ['Everything in Premium', 'Custom overlays', 'White-label', 'API access', 'Dedicated support', 'Club management'],
    },
  ];

  const handleUpgrade = async (plan: typeof PLANS[0]) => {
    if (plan.level === 0) return;
    setLoading(plan.name);
    try {
      const amount = prices[plan.level][selectedDuration];
      const res = await paymentAPI.createRazorpayOrder(amount, plan.name);
      const order = res.data;
      // Razorpay checkout
      const options = {
        key: (window as any).__RAZORPAY_KEY__ || '',
        amount: order.amount,
        currency: 'INR',
        name: 'ScoreX',
        description: `${plan.name} — ${DURATION_LABELS[selectedDuration]}`,
        order_id: order.id,
        handler: async (response: any) => {
          await paymentAPI.verifyRazorpayPayment({ ...response, plan: plan.name, duration: selectedDuration });
          window.location.reload();
        },
        prefill: { name: user?.username, email: user?.email },
        theme: { color: '#22c55e' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      alert(`Razorpay integration — set your key.\nPlan: ${plan.name} | Duration: ${DURATION_LABELS[selectedDuration]} | ₹${prices[plan.level]?.[selectedDuration]}`);
    } finally { setLoading(null); }
  };

  return (
    <div className="p-6 max-w-5xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* BG orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      {/* Header */}
      <div className="text-center mb-10 relative">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
          <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Membership Plans</h1>
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Upgrade to unlock premium features and overlays</p>

        {/* Current membership status */}
        {membership && !isExpired && (
          <div className="inline-flex flex-col items-center gap-1 mt-4 px-5 py-3 rounded-2xl"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">
                Active: {PLANS.find(p => p.level === membership.level)?.name} Plan
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Purchased {formatDate(membership.purchasedAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {DURATION_LABELS[membership.duration as Duration] || membership.duration}</span>
              <span>·</span>
              <span className="font-bold text-green-400">{timeLeft}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Expires {formatDate(membership.expiry)}</p>
          </div>
        )}

        {membership && isExpired && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">Your membership has expired. Renew below.</span>
          </div>
        )}
      </div>

      {/* Duration selector (for paid plans) */}
      <div className="flex justify-center mb-8">
        <div className="flex rounded-xl p-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {(Object.keys(DURATION_LABELS) as Duration[]).map(d => (
            <button key={d} onClick={() => setSelectedDuration(d)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={selectedDuration === d
                ? { background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 12px rgba(34,197,94,0.3)' }
                : { color: 'var(--text-secondary)' }}>
              {DURATION_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const overlayCount = templates.filter((t: any) => t.level === plan.level).length;
          const isCurrent = plan.level === currentLevel;
          const isLower = plan.level < currentLevel;
          const price = plan.level > 0 ? prices[plan.level]?.[selectedDuration] : 0;

          return (
            <div key={plan.name}

              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isCurrent ? plan.borderColor : 'var(--border)'}`,
                boxShadow: isCurrent ? `0 0 24px ${plan.accentColor}` : undefined,
              }}>

              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 py-1 text-center text-xs font-black text-black"
                  style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)' }}>
                  MOST POPULAR
                </div>
              )}

              {/* Header */}
              <div className={`px-6 pt-${plan.popular ? '8' : '6'} pb-5`}
                style={{ background: plan.accentColor, borderBottom: '1px solid var(--border)' }}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {plan.level === 0 ? 'Free' : `₹${price}`}
                  </span>
                  {plan.level > 0 && (
                    <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                      / {DURATION_LABELS[selectedDuration]}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="px-6 py-5">
                <ul className="space-y-3 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: plan.accentColor }}>
                        <Check className="w-3 h-3" style={{ color: plan.iconColor }} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Preview Button - Dropdown + Preview Modal */}
                {plan.level > 0 && (
                  <button
                    onClick={() => {
                      setFloatingPreviewLevel(plan.level);
                      setSelectedFloatingOverlay(plan.level === 1 ? 'lvl1-modern-bar.html' : 'lvl2-broadcast-pro.html');
                      setShowFloatingPreview(true);
                    }}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg hover:shadow-xl transition-all mb-4 flex items-center justify-center gap-3 group"
                  >
                    <Eye className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>Preview {plan.name} Overlays ({overlayCount})</span>
                  </button>
                )}



                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || isLower || loading === plan.name}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg"
                  style={isCurrent
                    ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }
                    : isLower
                    ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', opacity: 0.5 }
                    : plan.level === 0
                    ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
                    : { background: `linear-gradient(135deg, ${plan.gradient.replace('from-', '').replace(' to-', ', ')})`.replace(/from-\S+/, '#22c55e').replace(/to-\S+/, '#10b981'), color: plan.level === 2 ? '#fff' : '#000', boxShadow: `0 0 20px ${plan.accentColor}` }
                  }>
                  {loading === plan.name ? 'Processing...' :
                   isCurrent ? '✓ Current Plan' :
                   isLower ? 'Downgrade' :
                   plan.level === 0 ? 'Free Forever' :
                   `Get ${plan.name} — ₹${price}`}
                </button>

              </div>
            </div>
          );
        })}
        <FloatingOverlayPreview 
          isOpen={showFloatingPreview}
          onClose={() => setShowFloatingPreview(false)}
          level={floatingPreviewLevel}
          templates={templates}
          selectedOverlay={selectedFloatingOverlay}
          onOverlaySelect={setSelectedFloatingOverlay}
        />
      </div>
    </div>
  );
}
