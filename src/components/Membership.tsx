import { useState, useEffect } from 'react';
import Payment from './Payment';

export default function Membership() {
  const [showPayment, setShowPayment] = useState(true);
  const [currentMembership, setCurrentMembership] = useState<string>('free');
  const [membershipExpiresAt, setMembershipExpiresAt] = useState<Date | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    // Read current membership from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        let membership = payload.membership || 'free';
        
        // Check if membership has expired
        if (payload.membershipExpiresAt) {
          const expiryDate = new Date(payload.membershipExpiresAt);
          setMembershipExpiresAt(expiryDate);
          if (expiryDate < new Date()) {
            // Membership has expired, reset to free
            membership = 'free';
          }
        }
        
        setCurrentMembership(membership);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  const handleClose = () => {
    setShowPayment(false);
  };

  const handleSuccess = (plan: string) => {
    console.log('Membership upgraded to:', plan);
    setShowPayment(false);
    setCurrentMembership(plan);
    setSuccessMessage(`Successfully upgraded to ${plan}!`);
    
    // The payment confirmation endpoint now returns a new token
    // which is already saved by the Payment component
    // Just update the local state to reflect the change
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };


  return (
    <div className="space-y-8 bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-light min-h-screen p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-dark-accent mb-4">Membership</h1>
        <p className="text-gray-600 dark:text-dark-accent">Upgrade your plan to unlock more features</p>
      </div>

      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded text-center">
          {successMessage}
        </div>
      )}

      {/* Current Membership Status */}
      <div className="bg-white dark:bg-dark-bg-alt rounded-xl shadow-sm border border-gray-200 dark:border-dark-primary/30 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-light mb-4">Current Plan</h2>
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
          currentMembership === 'free' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
          currentMembership.includes('level1') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
        }`}>
          {currentMembership === 'free' ? 'Free Plan' :
           currentMembership === 'premium-level1' ? 'Premium Level 1' :
           currentMembership === 'premium-level2' ? 'Premium Level 2' :
           currentMembership.charAt(0).toUpperCase() + currentMembership.slice(1)}
        </div>
        {membershipExpiresAt && currentMembership !== 'free' && (
          <p className="mt-3 text-sm text-gray-600 dark:text-dark-accent">
            {membershipExpiresAt > new Date() ? (
              <span>Expires on: <strong>{membershipExpiresAt.toLocaleDateString()}</strong></span>
            ) : (
              <span className="text-red-500">Expired on: {membershipExpiresAt.toLocaleDateString()}</span>
            )}
          </p>
        )}
      </div>

      {showPayment && (
        <Payment onClose={handleClose} onSuccess={handleSuccess} />
      )}

      {!showPayment && currentMembership !== 'free' && (
        <div className="text-center">
          <p className="text-gray-600 dark:text-dark-accent mb-4">You already have an active membership!</p>
          <button
            onClick={() => setShowPayment(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {!showPayment && currentMembership === 'free' && (
        <div className="text-center">
          <button
            onClick={() => setShowPayment(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Get Premium
          </button>
        </div>
      )}
    </div>
  );
}
