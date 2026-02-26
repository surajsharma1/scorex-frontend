import { useState, useEffect, useCallback } from 'react';
import Payment from './Payment';
import { Clock, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate: Date;
  onExpired: () => void;
}

function CountdownTimer({ expiryDate, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = expiryDate.getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference
      };
    };

    // Initial calculation
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime.total <= 0) {
      onExpired();
      return;
    }

    // Update every second
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);

      if (newTime.total <= 0) {
        clearInterval(timer);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate, onExpired]);

  if (timeLeft.total <= 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-600 dark:text-dark-accent mb-2">Time Remaining:</p>
      <div className="flex flex-wrap gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center min-w-[70px]">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{timeLeft.days}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Days</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center min-w-[70px]">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{timeLeft.hours}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Hours</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center min-w-[70px]">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{timeLeft.minutes}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Minutes</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center min-w-[70px]">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{timeLeft.seconds}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Seconds</div>
        </div>
      </div>
    </div>
  );
}

export default function Membership() {
  const [showPayment, setShowPayment] = useState(true);
  const [currentMembership, setCurrentMembership] = useState<string>('free');
  const [membershipExpiresAt, setMembershipExpiresAt] = useState<Date | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const fetchMembershipFromToken = useCallback(() => {
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
            // Membership has expired
            membership = 'free';
            setIsExpired(true);
          } else {
            setIsExpired(false);
          }
        } else {
          setMembershipExpiresAt(null);
          setIsExpired(false);
        }
        
        setCurrentMembership(membership);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchMembershipFromToken();
  }, [fetchMembershipFromToken]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Fetch fresh data from server
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Update localStorage with fresh token if available
        if (userData.token) {
          localStorage.setItem('token', userData.token);
        }
      }
      
      // Refresh from token
      fetchMembershipFromToken();
      
      setSuccessMessage('Membership refreshed!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error refreshing membership:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClose = () => {
    setShowPayment(false);
  };

  const handleSuccess = (plan: string, expiryDate?: Date) => {
    console.log('Membership upgraded to:', plan);
    setShowPayment(false);
    setCurrentMembership(plan);
    if (expiryDate) {
      setMembershipExpiresAt(expiryDate);
      setIsExpired(false);
    }
    setSuccessMessage(`Successfully upgraded to ${plan}!`);
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const handleExpired = useCallback(() => {
    setIsExpired(true);
    setCurrentMembership('free');
    setMembershipExpiresAt(null);
  }, []);

  const getMembershipColor = (membership: string) => {
    if (membership === 'free') {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
    if (membership.includes('lv1')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
    if (membership.includes('lv2')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };

  const getMembershipName = (membership: string) => {
    if (membership === 'free') return 'Free Plan';
    if (membership.includes('lv1')) {
      // Parse duration from plan name
      if (membership.includes('1-day')) return 'Premium LV1 - 1 Day';
      if (membership.includes('1-week')) return 'Premium LV1 - 1 Week';
      if (membership.includes('1-month')) return 'Premium LV1 - 1 Month';
      return 'Premium Level 1';
    }
    if (membership.includes('lv2')) {
      // Parse duration from plan name
      if (membership.includes('1-day')) return 'Premium LV2 - 1 Day';
      if (membership.includes('1-week')) return 'Premium LV2 - 1 Week';
      if (membership.includes('1-month')) return 'Premium LV2 - 1 Month';
      return 'Premium Level 2';
    }
    return membership.charAt(0).toUpperCase() + membership.slice(1);
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
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-light">Current Plan</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getMembershipColor(currentMembership)}`}>
            {currentMembership !== 'free' && <CheckCircle className="w-4 h-4" />}
            {getMembershipName(currentMembership)}
          </div>
          
          {isExpired && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm">
              <AlertCircle className="w-4 h-4" />
              Expired
            </div>
          )}
        </div>

        {/* Countdown Timer */}
        {membershipExpiresAt && currentMembership !== 'free' && !isExpired && (
          <CountdownTimer expiryDate={membershipExpiresAt} onExpired={handleExpired} />
        )}

        {/* Expiry Date Display */}
        {membershipExpiresAt && currentMembership !== 'free' && (
          <p className="mt-4 text-sm text-gray-600 dark:text-dark-accent">
            {isExpired ? (
              <span className="text-red-500">Expired on: {membershipExpiresAt.toLocaleDateString()}</span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Expires on: <strong>{membershipExpiresAt.toLocaleDateString()}</strong> at{' '}
                <strong>{membershipExpiresAt.toLocaleTimeString()}</strong>
              </span>
            )}
          </p>
        )}

        {!membershipExpiresAt && currentMembership === 'free' && (
          <p className="mt-4 text-sm text-gray-500 dark:text-dark-accent/70">
            You are on the free plan with no expiration.
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
