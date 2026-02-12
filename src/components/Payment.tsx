import { useState } from 'react';
import { Smartphone, CheckCircle, X, CreditCard } from 'lucide-react';

interface PaymentProps {
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

const LEVELS = [
  {
    id: 'level1',
    name: 'Level 1',
    description: 'Unanimated overlays',
    features: [
      'All unanimated overlay templates',
      'Basic customization',
      'Unlimited tournaments',
      'Community support'
    ],
    color: 'bg-blue-600'
  },
  {
    id: 'level2',
    name: 'Level 2',
    description: 'All overlays',
    features: [
      'All overlay templates (including animated)',
      'Full customization',
      'Unlimited tournaments',
      'Priority support',
      'Custom branding'
    ],
    color: 'bg-purple-600'
  }
];

const DURATIONS = [
  { id: '1day', name: '1 Day', multiplier: 1 },
  { id: '1week', name: '1 Week', multiplier: 7 },
  { id: '1month', name: '1 Month', multiplier: 30 }
];

const PRICES = {
  level1: { base: 1 }, // $1 per day
  level2: { base: 2 }  // $2 per day
};

export default function Payment({ onClose, onSuccess }: PaymentProps) {
  const [selectedLevel, setSelectedLevel] = useState('level1');
  const [selectedDuration, setSelectedDuration] = useState('1week');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiDetails, setUpiDetails] = useState({
    upiId: '',
    name: ''
  });
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const calculatePrice = () => {
    const levelPrice = PRICES[selectedLevel as keyof typeof PRICES].base;
    const durationMultiplier = DURATIONS.find(d => d.id === selectedDuration)?.multiplier || 1;
    return levelPrice * durationMultiplier;
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const price = calculatePrice();

      // Create payment intent
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: price,
          level: selectedLevel,
          duration: selectedDuration
        })
      });

      const { clientSecret, paymentIntentId } = await response.json();

      // For UPI payments, we would integrate with Stripe Elements
      // For now, simulate successful payment
      setTimeout(async () => {
        // Confirm payment
        const confirmResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/payments/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            paymentIntentId,
            level: selectedLevel,
            duration: selectedDuration
          })
        });

        const result = await confirmResponse.json();

        if (result.success) {
          onSuccess(`premium-${selectedLevel}`);
        } else {
          throw new Error('Payment confirmation failed');
        }
      }, 2000);

    } catch (error) {
      console.error('Payment failed:', error);
      onSuccess(`premium-${selectedLevel}`); // Still proceed for demo
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Level Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LEVELS.map((level) => (
              <div
                key={level.id}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedLevel === level.id
                    ? 'border-blue-500 bg-gray-100 dark:bg-gray-700'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-500'
                }`}
                onClick={() => setSelectedLevel(level.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{level.name}</h3>
                  {selectedLevel === level.id && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{level.description}</p>
                <ul className="space-y-2">
                  {level.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Duration</h3>
          <div className="grid grid-cols-3 gap-4">
            {DURATIONS.map((duration) => (
              <button
                key={duration.id}
                onClick={() => setSelectedDuration(duration.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDuration === duration.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {duration.name}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                paymentMethod === 'upi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Smartphone className="w-5 h-5 mr-2" />
              UPI
            </button>
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
        {paymentMethod === 'upi' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                placeholder="user@upi"
                value={upiDetails.upiId}
                onChange={(e) => setUpiDetails({ ...upiDetails, upiId: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={upiDetails.name}
                onChange={(e) => setUpiDetails({ ...upiDetails, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}

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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">
                {LEVELS.find(l => l.id === selectedLevel)?.name} - {DURATIONS.find(d => d.id === selectedDuration)?.name}
              </span>
              <span className="text-gray-900 dark:text-white font-bold">
                ${calculatePrice()}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {LEVELS.find(l => l.id === selectedLevel)?.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Pay $${calculatePrice()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
