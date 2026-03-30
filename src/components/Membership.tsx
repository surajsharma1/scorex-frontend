import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../App';
import FloatingOverlayPreview from './FloatingOverlayPreview';
import { getBackendBaseUrl } from '../services/env';
import { overlayAPI, paymentAPI } from '../services/api';
import api from '../services/api';
import {
  Check, Zap, Crown, Star, Clock, Calendar,
  AlertCircle, Eye, ChevronRight, Shield, Sparkles
} from 'lucide-react';

type Duration = '1day' | '1week' | '1month';

const DURATION_LABELS: Record<Duration, string> = {
  '1day':  '1 Day',
  '1week': '1 Week',
  '1month':'1 Month',
};

const DEFAULT_PRICES: Record<number, Record<Duration, number>> = {
  1: { '1day': 149,  '1week': 499,  '1month': 1499  },
  2: { '1day': 249,  '1week': 999,  '1month': 2499  },
};

function formatTimeLeft(expiryISO: string): string {
  const ms = new Date(expiryISO).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const days  = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins  = Math.floor((ms % 3600000) / 60000);
  if (days  > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PLANS = [
  {
    name: 'Free',
    level: 0,
    icon: Zap,
    gradient: 'from-slate-600 to-slate-700',
    accentColor: 'rgba(100,116,139,0.2)',
    borderColor: 'rgba(100,116,139,0.35)',
    iconBg: '#334155',
    iconColor: '#94a3b8',
    glowColor: 'rgba(100,116,139,0)',
    features: [
      'Up to 3 tournaments',
      'Basic live scoring',
      '5 overlay templates',
      'Standard support',
    ],
  },
  {
    name: 'Premium',
    level: 1,
    icon: Star,
    gradient: 'from-emerald-500 to-green-600',
    accentColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.4)',
    iconBg: 'linear-gradient(135deg, #22c55e, #10b981)',
    iconColor: '#fff',
    glowColor: 'rgba(34,197,94,0.18)',
    popular: true,
    features: [
      'Unlimited tournaments',
      'Live scoring + undo',
      '20 premium overlays',
      'Priority support',
      'Match analytics',
      'Export data',
    ],
  },
  {
    name: 'Enterprise',
    level: 2,
    icon: Crown,
    gradient: 'from-purple-500 to-violet-600',
    accentColor: 'rgba(168,85,247,0.08)',
    borderColor: 'rgba(168,85,247,0.4)',
    iconBg: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    iconColor: '#fff',
    glowColor: 'rgba(168,85,247,0.18)',
    features: [
      'Everything in Premium',
      'Custom overlays',
      'White-label branding',
      'API access',
      'Dedicated support',
      'Club management',
    ],
  },
] as const;

export default function Membership() {
  const { user } = useAuth();
  const { addToast } = useToast();


  const [loading, setLoading] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Duration>('1month');
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [membership, setMembership] = useState<any>(null);
  const [backendUser, setBackendUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [showFloatingPreview, setShowFloatingPreview] = useState(false);
  const [floatingPreviewLevel, setFloatingPreviewLevel] = useState(1);
  const [selectedFloatingOverlay, setSelectedFloatingOverlay] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);

  // Load ALL templates from public static file (no auth filter — used for preview & count display)
  useEffect(() => {
    fetch('/templates.json')
      .then(r => r.json())
      .then((data: Array<{ id: string; name: string; file: string; category: string; color: string }>) => {
        const mapped = data.map(t => ({
          ...t,
          url: `/overlays/${t.file}`,
          level: t.id.startsWith('lvl2') ? 2 : 1,
        }));
        setTemplates(mapped);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    api.get('/admin/membership-prices').then(res => {
      if (res.data?.prices) setPrices(res.data.prices);
    }).catch(() => {});
  }, []);

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
          duration: '1month',
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!membership?.expiry) return;
    const tick = () => setTimeLeft(formatTimeLeft(membership.expiry));
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [membership]);

  const backendLevel    = backendUser?.membershipLevel || 0;
  const backendExpires  = backendUser?.membershipExpiresAt;
  const backendIsActive = backendLevel > 0 && backendExpires && new Date(backendExpires) > new Date();
  const currentLevel    = backendIsActive ? backendLevel : 0;
  const isExpired       = backendIsActive ? false : membership !== null;

  const handleUpgrade = async (plan: typeof PLANS[number]) => {
    if (plan.level === 0) return;
    
    setLoading('paying');
    
    try {
      addToast({ type: 'success', message: 'Creating secure payment order...' });


      
      const amount = prices[plan.level][selectedDuration];
      const res = await paymentAPI.createRazorpayOrder(amount, plan.name);
      const order = res.data;
      
      // Check Razorpay SDK & key
      const Razorpay = (window as any).Razorpay;
      const key = (window as any).__RAZORPAY_KEY__;

      
      if (!Razorpay) {        addToast({ type: 'error', message: '❌ Razorpay SDK not loaded. Refresh page.' });        return;      }
      if (!key || key.length < 10) {
        addToast({ type: 'error', message: '❌ Payment key invalid. Contact admin.' });
        return;
      }
      
      addToast({ type: 'success', message: 'Opening payment gateway...' });

      
      const options: any = {
        key,
        amount: order.amount,
        currency: 'INR',
        name: 'ScoreX Pro',
        description: `${plan.name} (${DURATION_LABELS[selectedDuration]})`,
        order_id: order.id,
        handler: async (response: any) => {
            addToast({ type: 'success', message: 'Securing membership...' });

          try {
            await paymentAPI.verifyRazorpayPayment({ 
              ...response, 
              plan: plan.name, 
              duration: selectedDuration 
            });
            addToast({ type: 'success', message: '🎉 Membership activated! Refreshing...' });

            setTimeout(() => window.location.reload(), 1200);
          } catch (verifyErr) {
            addToast({ type: 'error', message: 'Payment OK but membership sync failed' });

            console.error(verifyErr);
          }
        },
        prefill: { 
          name: user?.username || user?.fullName || '',
          email: user?.email || '',
          contact: ''
        },
        theme: { color: '#22c55e' },
        modal: {
          ondismiss: function() {
            addToast({ type: 'success', message: 'Payment dismissed. Try again anytime!' });
          }
        }
      };
      
      const rzp = new Razorpay(options);
      rzp.open();
      
    } catch (error: any) {
      console.error('[Upgrade Error]', error);
      addToast({ type: 'error', message: error.message || 'Payment setup failed. Try again.' });
    } finally {
      if (loading === 'paying') setLoading(null);
    }
  };


  return (
    <div
      className="min-h-screen relative"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background glow orbs — matches dashboard style */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              Membership Plans
            </h1>
          </div>
          <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Unlock premium overlays, analytics, and advanced features
          </p>
        </div>

        {/* ── Active membership banner ── */}
        {membership && !isExpired && (
          <div
            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-2xl p-4 sm:p-5 mb-8"
            style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#22c55e' }}>
                  {PLANS.find(p => p.level === membership.level)?.name} Plan Active
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Expires {formatDate(membership.expiry)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs sm:ml-auto" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(membership.purchasedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {DURATION_LABELS[membership.duration as Duration] || membership.duration}
              </span>
              <span className="font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                {timeLeft}
              </span>
            </div>
          </div>
        )}

        {membership && isExpired && (
          <div
            className="flex items-center gap-3 rounded-2xl p-4 mb-8"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400 font-medium">Your membership has expired. Renew below.</span>
          </div>
        )}

        {/* ── Duration selector ── */}
        <div className="flex justify-center sm:justify-start mb-8">
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {(Object.keys(DURATION_LABELS) as Duration[]).map(d => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={
                  selectedDuration === d
                    ? { background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 12px rgba(34,197,94,0.35)' }
                    : { color: 'var(--text-secondary)' }
                }
              >
                {DURATION_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {PLANS.map(plan => {
            const overlayCount = templates.filter((t: any) => t.level === plan.level).length;
            const isCurrent = plan.level === currentLevel;
            const isLower   = plan.level < currentLevel;
            const price     = plan.level > 0 ? prices[plan.level]?.[selectedDuration] : 0;

            return (
              <div
                key={plan.name}
                className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isCurrent ? plan.borderColor : 'var(--border)'}`,
                  boxShadow: isCurrent
                    ? `0 8px 32px ${plan.glowColor}, 0 0 0 1px ${plan.borderColor}`
                    : '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                {/* Popular badge */}
                {'popular' in plan && plan.popular && (
                  <div
                    className="absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-black tracking-wider text-black"
                    style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)' }}
                  >
                    ✦ MOST POPULAR
                  </div>
                )}

                {/* Card header */}
                <div
                  className="px-6 pt-6 pb-5"
                  style={{
                    paddingTop: 'popular' in plan && plan.popular ? '2.75rem' : '1.5rem',
                    background: plan.accentColor,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                    style={{ background: plan.iconBg }}
                  >
                    <plan.icon className="w-5 h-5" style={{ color: plan.iconColor }} />
                  </div>

                  <h3 className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                    {plan.name}
                  </h3>

                  <div className="flex items-end gap-1">
                    <span className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                      {plan.level === 0 ? 'Free' : `₹${price}`}
                    </span>
                    {plan.level > 0 && (
                      <span className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        / {DURATION_LABELS[selectedDuration]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 px-6 py-5">
                  <ul className="space-y-3 mb-5">
                    {plan.features.map(f => (
                      <li
                        key={f}
                        className="flex items-center gap-2.5 text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: plan.accentColor }}
                        >
                          <Check className="w-3 h-3" style={{ color: plan.iconColor }} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Preview button */}
                  {plan.level > 0 && (
                    <button
                      onClick={() => {
                        setFloatingPreviewLevel(plan.level);
                        setSelectedFloatingOverlay(''); // user picks from dropdown
                        setShowFloatingPreview(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] mb-3"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: `1px solid ${plan.borderColor}`,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Eye className="w-4 h-4" style={{ color: plan.iconColor === '#fff' ? undefined : plan.iconColor }} />
                      Preview {overlayCount} Overlays
                    </button>
                  )}

                  {/* CTA button */}
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={!!loading || isLower}


                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg"
                    style={
                      isCurrent
                        ? { 
                            background: 'linear-gradient(135deg, #22c55e, #10b981)', 
                            color: '#000', 
                            boxShadow: '0 0 25px rgba(34,197,94,0.4)',
                            border: `1px solid ${plan.borderColor}`
                          }
                        : isLower
                        ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', opacity: 0.5 }
                        : plan.level === 0
                        ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                        : plan.level === 1
                        ? { background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 20px rgba(34,197,94,0.35)' }
                        : { background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff', boxShadow: '0 0 20px rgba(168,85,247,0.35)' }
                    }
                  >
                    {loading === plan.name
                      ? (loading ? 'Processing...' : 'Extend Now')
                      : isCurrent
                      ? `Extend ${plan.name}`

                      : isLower
                      ? 'Downgrade'
                      : plan.level === 0
                      ? 'Free Forever'
                      : (
                        <>
                          Get {plan.name}
                          {plan.level > 0 && <ChevronRight className="w-4 h-4" />}
                        </>
                      )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Feature comparison highlight ── */}
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-green-400" />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Why upgrade?
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Pro Overlays', desc: 'Stream-quality broadcast overlays for live matches', color: '#22c55e' },
              { title: 'Deep Analytics', desc: 'NRR, run-rates, player stats & match insights', color: '#3b82f6' },
              { title: 'Club Tools', desc: 'Manage clubs, memberships and team hierarchies', color: '#a855f7' },
            ].map(item => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: item.color }}
                />
                <div>
                  <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating overlay preview modal */}
      <FloatingOverlayPreview
        isOpen={showFloatingPreview}
        onClose={() => setShowFloatingPreview(false)}
        level={floatingPreviewLevel}
        templates={templates.filter((t: any) => t.level === floatingPreviewLevel)}
        selectedOverlay={selectedFloatingOverlay}
        onOverlaySelect={setSelectedFloatingOverlay}
      />
    </div>
  );
}


