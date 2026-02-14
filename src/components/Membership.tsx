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
    // Update user membership in localStorage by calling the API to get updated token
    const updateMembership = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/v1/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ membership: plan })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update token if returned, otherwise update local user data
          if (data.token) {
            localStorage.setItem('token', data.token);
          } else if (data.user) {
            // Store membership info separately if no new token
            localStorage.setItem('userMembership', plan);
          }
          console.log('Membership updated successfully');
        } else {
          // Fallback: store membership locally
          localStorage.setItem('userMembership', plan);
        }
      } catch (error) {
        console.error('Error updating membership:', error);
        // Fallback: store membership locally
        localStorage.setItem('userMembership', plan);
      }
    };
    
    updateMembership();
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
