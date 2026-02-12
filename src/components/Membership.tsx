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
    // Update user membership in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        payload.membership = plan;
        const newToken = btoa(JSON.stringify(payload));
        localStorage.setItem('token', newToken);
      } catch (error) {
        console.error('Error updating token:', error);
      }
    }
    // TODO: Update user membership status in global state/context if needed
  };

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">Membership</h1>
        <p className="text-gray-600 dark:text-gray-300">Upgrade your plan to unlock more features</p>
      </div>

      {showPayment && (
        <Payment onClose={handleClose} onSuccess={handleSuccess} />
      )}

      {!showPayment && (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Membership management coming soon...</p>
        </div>
      )}
    </div>
  );
}
