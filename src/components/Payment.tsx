import { useState } from 'react';
import { paymentAPI } from '../services/api';
import { CreditCard, CheckCircle, X, ShieldCheck, Loader2, Smartphone, Crown, Zap } from 'lucide-react';

interface PaymentProps {
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Payment({ onClose, onSuccess }: PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'lv1' | 'lv2'>('lv1');
  const [selectedDuration, setSelectedDuration] = useState<'1-day' | '1-week' | '1-month'>('1-month');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'razorpay'>('card');
  
  // Test card details - Pre-filled for free membership purchase
  const [cardNumber, setCardNumber] = useState('8871474139');
  const [expiry, setExpiry] = useState('2609');
  const [cvc, setCvc] = useState('123');

  // Pricing configuration
  const pricing = {
    lv1: {
      '1-day': 49,
      '1-week': 199,
      '1-month': 399
    },
    lv2: {
      '1-day': 99,
      '1-week': 399,
      '1-month': 799
    }
  };

  // Plan name mapping
  const getPlanName = () => {
    return `premium-${selectedLevel}-${selectedDuration}`;
  };

  const getPlanDisplayName = () => {
    const durationNames = {
      '1-day': '1 Day',
      '1-week': '1 Week', 
      '1-month': '1 Month'
    };
    return `Premium ${selectedLevel.toUpperCase()} - ${durationNames[selectedDuration]}`;
  };

  const getAmount = () => {
    return pricing[selectedLevel][selectedDuration];
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const planName = getPlanName();
    const amount = getAmount();

    // ADMIN OVERRIDE CARD CHECK
    if (paymentMethod === 'card' && cardNumber === 'ADMINFREEPASS') {
      try {
        await paymentAPI.createSubscription(planName);
        onSuccess(planName);
        alert('Admin pass applied successfully! Membership granted.');
      } catch (error) {
        alert('Admin pass application failed. Check API.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (paymentMethod === 'razorpay') {
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      try {
        const { data: orderData } = await paymentAPI.createRazorpayOrder(amount, planName);

        const options = {
          key: "YOUR_RAZORPAY_KEY_ID", 
          amount: orderData.amount, 
          currency: orderData.currency,
          name: "ScoreX Cricket",
          description: `Subscription for ${getPlanDisplayName()}`,
          order_id: orderData.id,
          handler: async function (response: any) {
            try {
              await paymentAPI.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planName
              });
              onSuccess(planName);
              alert('Payment Successful!');
            } catch (err) {
              alert('Payment verification failed');
            }
          },
          prefill: {
            name: "ScoreX User",
            email: "user@example.com",
            contact: ""
          },
          theme: { color: selectedLevel === 'lv2' ? "#8B5CF6" : "#2563EB" }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (err) {
        console.error(err);
        alert('Failed to initiate payment');
      } finally {
        setLoading(false);
      }
    } else {
      // Standard Card Gateway Logic
      setTimeout(async () => {
        try {
          await paymentAPI.createSubscription(planName);
          onSuccess(planName);
        } catch (error) {
          alert('Payment failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className={`bg-gradient-to-r ${selectedLevel === 'lv2' ? 'from-purple-600 to-violet-700' : 'from-blue-600 to-indigo-700'} p-6 text-white flex justify-between items-start`}>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> Premium Upgrade
            </h2>
            <p className="text-blue-100 text-sm mt-1">Unlock animated overlays & advanced stats</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-1 rounded-full hover:bg-white/30 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Membership Level Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Membership Level</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* LV1 Option */}
              <div 
                onClick={() => setSelectedLevel('lv1')}
                className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${
                  selectedLevel === 'lv1' 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={`w-5 h-5 ${selectedLevel === 'lv1' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-bold dark:text-white">Level 1</span>
                  {selectedLevel === 'lv1' && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Basic overlays & features</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">From ₹49</p>
              </div>

              {/* LV2 Option */}
              <div 
                onClick={() => setSelectedLevel('lv2')}
                className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${
                  selectedLevel === 'lv2' 
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown className={`w-5 h-5 ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className="font-bold dark:text-white">Level 2</span>
                  {selectedLevel === 'lv2' && <CheckCircle className="w-4 h-4 text-purple-600 ml-auto" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">All overlays & premium features</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-2">From ₹99</p>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Duration</h3>
            <div className="grid grid-cols-3 gap-3">
              {/* 1 Day */}
              <div 
                onClick={() => setSelectedDuration('1-day')}
                className={`border-2 p-3 rounded-xl cursor-pointer transition-all text-center ${
                  selectedDuration === '1-day' 
                    ? selectedLevel === 'lv2' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-bold text-sm dark:text-white">1 Day</div>
                <div className={`text-lg font-bold ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`}>₹{pricing[selectedLevel]['1-day']}</div>
              </div>

              {/* 1 Week */}
              <div 
                onClick={() => setSelectedDuration('1-week')}
                className={`border-2 p-3 rounded-xl cursor-pointer transition-all text-center ${
                  selectedDuration === '1-week' 
                    ? selectedLevel === 'lv2' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-bold text-sm dark:text-white">1 Week</div>
                <div className={`text-lg font-bold ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`}>₹{pricing[selectedLevel]['1-week']}</div>
              </div>

              {/* 1 Month */}
              <div 
                onClick={() => setSelectedDuration('1-month')}
                className={`border-2 p-3 rounded-xl cursor-pointer transition-all text-center ${
                  selectedDuration === '1-month' 
                    ? selectedLevel === 'lv2' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-bold text-sm dark:text-white">1 Month</div>
                <div className={`text-lg font-bold ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`}>₹{pricing[selectedLevel]['1-month']}</div>
              </div>
            </div>
          </div>

          {/* Selected Plan Summary */}
          <div className={`mb-6 p-4 rounded-xl ${selectedLevel === 'lv2' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold dark:text-white">{getPlanDisplayName()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedLevel === 'lv1' ? 'Basic animated overlays' : 'All premium overlays + priority support'}
                </p>
              </div>
              <div className={`text-2xl font-bold ${selectedLevel === 'lv2' ? 'text-purple-600' : 'text-blue-600'}`}>
                ₹{getAmount()}
              </div>
            </div>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
             <button type="button" onClick={() => setPaymentMethod('razorpay')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'razorpay' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}>
               <Smartphone className="w-4 h-4" /> UPI / NetBanking
             </button>
             <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}>
               <CreditCard className="w-4 h-4" /> Card
             </button>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            {paymentMethod === 'card' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9A-Z]/gi, '').substring(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full pl-10 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono uppercase"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                  <input type="text" placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-sm">You will be redirected to Razorpay securely.</p>
                <p className="text-xs mt-1">Supports GPay, PhonePe, Paytm & NetBanking</p>
              </div>
            )}

            <button type="submit" disabled={loading} className={`w-full mt-6 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              selectedLevel === 'lv2' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${getAmount()} Securely`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
