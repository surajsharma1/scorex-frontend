import { useState } from 'react';
import { useAuth } from '../App';
import { Check, Zap, Crown, Star } from 'lucide-react';

const PLANS = [
  {
    name: 'Free', price: 0, period: '', icon: Zap, color: 'border-slate-700',
    headerColor: 'from-slate-800 to-slate-900',
    features: ['Up to 3 tournaments', 'Basic scoring', '5 overlays', 'Standard support'],
    level: 0
  },
  {
    name: 'Premium', price: 499, period: '/month', icon: Star, color: 'border-blue-500/50',
    headerColor: 'from-blue-900/60 to-blue-800/40',
    features: ['Unlimited tournaments', 'Live scoring + undo', '20 premium overlays', 'Priority support', 'Match analytics', 'Export data'],
    level: 1, popular: true
  },
  {
    name: 'Enterprise', price: 1499, period: '/month', icon: Crown, color: 'border-purple-500/50',
    headerColor: 'from-purple-900/60 to-purple-800/40',
    features: ['Everything in Premium', 'Custom overlays', 'White-label', 'API access', 'Dedicated support', 'Club management'],
    level: 2
  },
];

export default function Membership() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: typeof PLANS[0]) => {
    if (plan.level === 0) return;
    setLoading(plan.name);
    // Razorpay integration placeholder
    setTimeout(() => {
      alert(`Razorpay checkout for ${plan.name} - ₹${plan.price}/month\n\nIntegrate Razorpay SDK here with your key.`);
      setLoading(null);
    }, 500);
  };

  const currentLevel = (user as any)?.membershipLevel || 0;

  return (
    <div className="p-6 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-white">Membership Plans</h1>
        <p className="text-slate-500 mt-2">Upgrade to unlock premium features and overlays</p>
        {currentLevel > 0 && (
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-sm font-semibold">
            <Star className="w-4 h-4" /> Currently on {PLANS[currentLevel]?.name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isCurrent = plan.level === currentLevel;
          const isLower = plan.level < currentLevel;
          return (
            <div key={plan.name} className={`relative bg-slate-900 border-2 rounded-2xl overflow-hidden transition-all ${plan.color} ${plan.popular ? 'scale-105 shadow-xl shadow-blue-500/10' : ''}`}>
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold text-center py-1">
                  MOST POPULAR
                </div>
              )}
              <div className={`bg-gradient-to-br ${plan.headerColor} px-6 pt-${plan.popular ? '8' : '6'} pb-6`}>
                <plan.icon className={`w-8 h-8 mb-3 ${plan.level === 0 ? 'text-slate-400' : plan.level === 1 ? 'text-blue-400' : 'text-purple-400'}`} />
                <h3 className="text-white font-black text-xl">{plan.name}</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-black text-white">₹{plan.price}</span>
                  <span className="text-slate-400 text-sm mb-0.5">{plan.period}</span>
                </div>
              </div>
              <div className="px-6 py-5">
                <ul className="space-y-3 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.level === 2 ? 'text-purple-400' : plan.level === 1 ? 'text-blue-400' : 'text-slate-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || isLower || loading === plan.name}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:cursor-not-allowed
                    ${isCurrent ? 'bg-green-900/30 border border-green-500/40 text-green-400 cursor-default' :
                      isLower ? 'bg-slate-800 text-slate-600' :
                      plan.level === 2 ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20' :
                      plan.level === 1 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' :
                      'bg-slate-700 text-slate-300'}`}>
                  {loading === plan.name ? 'Processing...' :
                   isCurrent ? '✓ Current Plan' :
                   isLower ? 'Downgrade' :
                   plan.level === 0 ? 'Free Forever' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
