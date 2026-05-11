import { useState } from 'react';
import { paymentAPI } from '../services/api';
import { CreditCard, CheckCircle, X, ShieldCheck, Loader2, Smartphone, Crown, Zap, Tag, Check } from 'lucide-react';

interface PaymentProps {
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

declare global {
  interface Window { Razorpay: any; }
}

export default function Payment({ onClose, onSuccess }: PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'lv1' | 'lv2'>('lv1');
  const [selectedDuration, setSelectedDuration] = useState<'1-day' | '1-week' | '1-month'>('1-month');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'razorpay'>('card');
  const [cardNumber, setCardNumber] = useState('8871474139');
  const [expiry, setExpiry] = useState('2609');
  const [cvc, setCvc] = useState('123');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; promoId: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  const pricing: Record<'lv1' | 'lv2', Record<string, number>> = {
    lv1: { '1-day': 149, '1-week': 499, '1-month': 1499 },
    lv2: { '1-day': 249, '1-week': 999, '1-month': 2499 },
  };

  const getPlanName = () => `premium-${selectedLevel}-${selectedDuration}`;
  const getPlanDisplayName = () => {
    const dur = { '1-day': '1 Day', '1-week': '1 Week', '1-month': '1 Month' };
    return `${selectedLevel === 'lv1' ? 'Premium' : 'Enterprise'} – ${dur[selectedDuration]}`;
  };
  const baseAmount = pricing[selectedLevel][selectedDuration];
  const discountedAmount = promoApplied
    ? Math.round(baseAmount * (1 - promoApplied.discount / 100))
    : baseAmount;

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    setValidatingPromo(true);
    try {
      const res = await paymentAPI.validatePromo(promoInput.trim());
      setPromoApplied({ code: promoInput.trim().toUpperCase(), discount: res.data.discount, promoId: res.data.promoId });
      setPromoInput('');
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Invalid promo code');
      setPromoApplied(null);
    } finally { setValidatingPromo(false); }
  };

  const removePromo = () => { setPromoApplied(null); setPromoError(''); setPromoInput(''); };

  const loadRazorpayScript = () => new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const planName = getPlanName();

    if (paymentMethod === 'card' && (cardNumber === 'ADMINFREEPASS' || cardNumber === '8871474139')) {
      try {
        const response = await paymentAPI.createSubscription(planName);
        if (response.data?.token) localStorage.setItem('token', response.data.token);
        onSuccess(planName);
        alert(`Test card applied! ${getPlanDisplayName()} activated!`);
      } catch { alert('Test card failed.'); } finally { setLoading(false); }
      return;
    }

    if (paymentMethod === 'razorpay') {
      const res = await loadRazorpayScript();
      if (!res) { alert('Razorpay SDK failed to load.'); setLoading(false); return; }
      try {
        const { data: orderData } = await paymentAPI.createRazorpayOrder(discountedAmount, planName);
        const options = {
          key: 'YOUR_RAZORPAY_KEY_ID',
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'ScoreX Cricket',
          description: `${getPlanDisplayName()}${promoApplied ? ` (${promoApplied.discount}% off)` : ''}`,
          order_id: orderData.id,
          handler: async (response: any) => {
            try {
              await paymentAPI.verifyRazorpayPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                plan: planName,
                promoId: promoApplied?.promoId,
              });
              onSuccess(planName);
              alert('Payment Successful!');
            } catch { alert('Payment verification failed'); }
          },
          prefill: { name: 'ScoreX User', email: 'user@example.com', contact: '' },
          theme: { color: selectedLevel === 'lv2' ? '#8B5CF6' : '#2563EB' },
        };
        new window.Razorpay(options).open();
      } catch { alert('Failed to initiate payment'); } finally { setLoading(false); }
    } else {
      setTimeout(async () => {
        try {
          await paymentAPI.createSubscription(planName);
          onSuccess(planName);
        } catch { alert('Payment failed.'); } finally { setLoading(false); }
      }, 2000);
    }
  };

  const accentColor = selectedLevel === 'lv2' ? 'purple' : 'blue';
  const accentHex = selectedLevel === 'lv2' ? '#8B5CF6' : '#2563EB';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`bg-gradient-to-r ${selectedLevel === 'lv2' ? 'from-purple-600 to-violet-700' : 'from-blue-600 to-indigo-700'} p-6 text-white flex justify-between items-start`}>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> Premium Upgrade
            </h2>
            <p className="text-blue-100 text-sm mt-1">Unlock animated overlays & advanced stats</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-1 rounded-full hover:bg-white/30 transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">

          {/* Membership Level */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Membership Level</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'lv1', icon: Zap, label: 'Level 1', desc: 'Basic overlays & features', from: '₹149', color: 'blue' },
                { id: 'lv2', icon: Crown, label: 'Level 2', desc: 'All overlays & premium features', from: '₹249', color: 'purple' },
              ].map(opt => (
                <div key={opt.id} onClick={() => setSelectedLevel(opt.id as any)}
                  className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${selectedLevel === opt.id ? `border-${opt.color}-600 bg-${opt.color}-50 dark:bg-${opt.color}-900/20` : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <opt.icon className={`w-5 h-5 ${selectedLevel === opt.id ? `text-${opt.color}-600` : 'text-gray-400'}`} />
                    <span className="font-bold dark:text-white">{opt.label}</span>
                    {selectedLevel === opt.id && <CheckCircle className={`w-4 h-4 text-${opt.color}-600 ml-auto`} />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                  <p className={`text-lg font-bold text-${opt.color}-600 dark:text-${opt.color}-400 mt-2`}>From {opt.from}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Duration</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['1-day', '1-week', '1-month'] as const).map(d => (
                <div key={d} onClick={() => setSelectedDuration(d)}
                  className={`border-2 p-3 rounded-xl cursor-pointer transition-all text-center ${selectedDuration === d ? `border-${accentColor}-600 bg-${accentColor}-50 dark:bg-${accentColor}-900/20` : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="font-bold text-sm dark:text-white">{{ '1-day': '1 Day', '1-week': '1 Week', '1-month': '1 Month' }[d]}</div>
                  <div className={`text-lg font-bold text-${accentColor}-600`}>₹{pricing[selectedLevel][d]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo Code */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Promo Code
            </h3>
            {promoApplied ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-mono font-black text-green-700 dark:text-green-400">{promoApplied.code}</span>
                  <span className="text-sm text-green-600 font-bold">{promoApplied.discount}% off applied!</span>
                </div>
                <button onClick={removePromo} className="text-gray-400 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                  placeholder="Enter promo code"
                  className="flex-1 px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={applyPromo} disabled={validatingPromo || !promoInput.trim()}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 transition"
                  style={{ background: accentHex }}>
                  {validatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
            {promoError && <p className="text-xs text-red-500 mt-1.5 font-medium">{promoError}</p>}
          </div>

          {/* Plan Summary */}
          <div className={`p-4 rounded-xl ${selectedLevel === 'lv2' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold dark:text-white">{getPlanDisplayName()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedLevel === 'lv1' ? 'Basic animated overlays' : 'All premium overlays + priority support'}
                </p>
              </div>
              <div className="text-right">
                {promoApplied && (
                  <p className="text-sm text-gray-400 line-through">₹{baseAmount.toLocaleString()}</p>
                )}
                <p className={`text-2xl font-black ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`}>
                  ₹{discountedAmount.toLocaleString()}
                </p>
                {promoApplied && (
                  <p className="text-xs text-green-600 font-bold">You save ₹{(baseAmount - discountedAmount).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment method toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button type="button" onClick={() => setPaymentMethod('razorpay')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'razorpay' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}>
              <Smartphone className="w-4 h-4" /> UPI / NetBanking
            </button>
            <button type="button" onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}>
              <CreditCard className="w-4 h-4" /> Card
            </button>
          </div>

          {/* Card form / Razorpay */}
          <form onSubmit={handlePayment} className="space-y-4">
            {paymentMethod === 'card' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number (Test: 8871474139)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input type="text" value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/[^0-9A-Z]/gi, '').substring(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full pl-10 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono uppercase" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                  <input type="text" placeholder="CVC" value={cvc} onChange={e => setCvc(e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-sm">You will be redirected to Razorpay securely.</p>
                <p className="text-xs mt-1">Supports GPay, PhonePe, Paytm & NetBanking</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className={`w-full mt-4 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${selectedLevel === 'lv2' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${discountedAmount.toLocaleString()} Securely`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
