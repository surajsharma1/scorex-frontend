import { useState } from 'react';
import Payment from './Payment';

export default function Membership() {
  const [showPayment, setShowPayment] = useState(true);

  const handleClose = () => {
    setShowPayment(false);
  };

  const handleSuccess = (plan: string) => {
    console.log('Membership upgraded to:', plan);
    setShowPayment(false);
    // TODO: Update user membership status in state/context
  };

  return (
    <div className="space-y-8 bg-gray-900 text-white min-h-screen p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-400 mb-4">Membership</h1>
        <p className="text-gray-300">Upgrade your plan to unlock more features</p>
      </div>

      {showPayment && (
        <Payment onClose={handleClose} onSuccess={handleSuccess} />
      )}

      {!showPayment && (
        <div className="text-center">
          <p className="text-gray-300">Membership management coming soon...</p>
        </div>
      )}
    </div>
  );
}
