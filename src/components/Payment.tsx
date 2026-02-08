import { useState } from 'react';
import { CreditCard, CheckCircle, X } from 'lucide-react';

interface PaymentProps {
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Classic Score overlay',
      'Basic customization',
      'Up to 2 tournaments',
      'Community support'
    ],
    color: 'bg-gray-600'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    features: [
      'Modern Minimal overlay',
      'Advanced customization',
      'Up to 10 tournaments',
      'Priority support',
      'Custom branding'
    ],
    color: 'bg-blue-600'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    features: [
      'All overlay templates',
      'Full customization',
      'Unlimited tournaments',
      'Live score integration',
      'Custom branding',
      'API access',
      'White-label option'
    ],
    color: 'bg-purple-600'
  }
];

export default function Payment({ onClose, onSuccess }: PaymentProps) {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const handlePayment = async () => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(async () => {
      setLoading(false);
      // Update user membership on backend
      try {
        // Assuming we have an API to update membership
        // await userAPI.updateMembership(selectedPlan);
        // For now, just call onSuccess
        onSuccess(selectedPlan);
      } catch (error) {
        console.error('Failed to update membership:', error);
        onSuccess(selectedPlan); // Still proceed for demo
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-blue-500 bg-gray-100 dark:bg-gray-700'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                {selectedPlan === plan.id && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                )}
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                paymentMethod === 'card'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Credit Card
            </button>
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                paymentMethod === 'paypal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              PayPal
            </button>
          </div>
        </div>

        {/* Payment Form */}
        {paymentMethod === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CVC
              </label>
              <input
                type="text"
                placeholder="123"
                value={cardDetails.cvc}
                onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Payment Summary</h4>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">
              {PLANS.find(p => p.id === selectedPlan)?.name} Plan
            </span>
            <span className="text-gray-900 dark:text-white font-bold">
              ${PLANS.find(p => p.id === selectedPlan)?.price}/month
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Pay $${PLANS.find(p => p.id === selectedPlan)?.price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
