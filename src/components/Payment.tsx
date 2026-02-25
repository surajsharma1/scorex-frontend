import { useState } from 'react';
import { paymentAPI } from '../services/api';
import { CreditCard, CheckCircle, X, ShieldCheck, Loader2, Smartphone, TestTube } from 'lucide-react';

interface PaymentProps {
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

// Add Razorpay type to window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Payment({ onClose, onSuccess }: PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium-level1');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'razorpay'>('razorpay');
  
  // Card Details State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // --- NEW: Test Payment Function ---
  const handleTestPayment = async () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(async () => {
      try {
        // In a real app, this would be a specific "test" endpoint or just a mock
        // We'll assume the backend allows this for now, or we just client-side bypass
        await paymentAPI.createSubscription(selectedPlan); 
        alert(`Test Payment Successful! You are now subscribed to ${selectedPlan}.`);
        onSuccess(selectedPlan);
      } catch (error) {
        console.error("Test payment error", error);
        // Fallback for testing even if API fails
        onSuccess(selectedPlan); 
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (paymentMethod === 'razorpay') {
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      try {
        const amount = selectedPlan === 'premium-level1' ? 399 : 999;
        // 1. Create Order
        const { data: orderData } = await paymentAPI.createRazorpayOrder(amount, selectedPlan);

        // 2. Open Razorpay
        const options = {
          key: "YOUR_RAZORPAY_KEY_ID", 
          amount: orderData.amount, 
          currency: orderData.currency,
          name: "ScoreX Cricket",
          description: `Subscription for ${selectedPlan}`,
          order_id: orderData.id,
          handler: async function (response: any) {
            try {
              await paymentAPI.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan
              });
              onSuccess(selectedPlan);
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
          theme: { color: "#2563EB" }
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
      // Card Mock
      setTimeout(async () => {
        try {
          await paymentAPI.createSubscription(selectedPlan);
          onSuccess(selectedPlan);
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
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start">
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
          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div 
              onClick={() => setSelectedPlan('premium-level1')}
              className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${
                selectedPlan === 'premium-level1' 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold dark:text-white">Silver</span>
                {selectedPlan === 'premium-level1' && <CheckCircle className="w-5 h-5 text-blue-600" />}
              </div>
              <p className="text-2xl font-bold dark:text-white">₹399<span className="text-sm font-normal text-gray-500">/mo</span></p>
            </div>

            <div 
              onClick={() => setSelectedPlan('premium-level2')}
              className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${
                selectedPlan === 'premium-level2' 
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold dark:text-white">Gold</span>
                {selectedPlan === 'premium-level2' && <CheckCircle className="w-5 h-5 text-purple-600" />}
              </div>
              <p className="text-2xl font-bold dark:text-white">₹999<span className="text-sm font-normal text-gray-500">/mo</span></p>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
             <button
               type="button"
               onClick={() => setPaymentMethod('razorpay')}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                 paymentMethod === 'razorpay' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 dark:text-gray-300'
               }`}
             >
               <Smartphone className="w-4 h-4" /> UPI / NetBanking
             </button>
             <button
               type="button"
               onClick={() => setPaymentMethod('card')}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                 paymentMethod === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 dark:text-gray-300'
               }`}
             >
               <CreditCard className="w-4 h-4" /> Card
             </button>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            {paymentMethod === 'card' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g,'').substring(0,16))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full pl-10 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="CVC"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-sm">You will be redirected to Razorpay securely.</p>
                <p className="text-xs mt-1">Supports GPay, PhonePe, Paytm & NetBanking</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay Securely'}
            </button>
            
            {/* TEST BUTTON */}
            <button 
              type="button" 
              onClick={handleTestPayment}
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              <TestTube className="w-5 h-5" /> Test Mode (Free Upgrade)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}