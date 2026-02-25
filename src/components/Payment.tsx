import { useState } from 'react';
import { paymentAPI } from '../services/api';
import { CreditCard, CheckCircle, X, ShieldCheck, Loader2 } from 'lucide-react';

interface PaymentProps {
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

export default function Payment({ onClose, onSuccess }: PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium-level1');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate network delay for payment gateway
    setTimeout(async () => {
      try {
        // In a real app, you would interact with Stripe/PayPal here
        // For now, we hit our backend to update the user status
        await paymentAPI.createSubscription(selectedPlan);
        onSuccess(selectedPlan);
      } catch (error) {
        alert('Payment failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> Secure Checkout
            </h2>
            <p className="text-blue-100 text-sm mt-1">Upgrade your ScoreX experience</p>
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
                <span className="font-bold dark:text-white">Level 1</span>
                {selectedPlan === 'premium-level1' && <CheckCircle className="w-5 h-5 text-blue-600" />}
              </div>
              <p className="text-2xl font-bold dark:text-white">$5<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <p className="text-xs text-gray-500 mt-2">Static Overlays & Basic Stats</p>
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
                <span className="font-bold dark:text-white">Level 2</span>
                {selectedPlan === 'premium-level2' && <CheckCircle className="w-5 h-5 text-purple-600" />}
              </div>
              <p className="text-2xl font-bold dark:text-white">$12<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <p className="text-xs text-gray-500 mt-2">Animated Overlays & API Access</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePayment} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
                <input 
                  type="text" 
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                <input 
                  type="text" 
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                  maxLength={3}
                  className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay Now`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}