/**
 * ResetPassword.tsx — Fixed & Rewritten
 *
 * BUG FIXED:
 * Called authAPI.resetPassword(token, password) using the old broken API signature.
 * The backend's reset-password endpoint is:
 *   POST /auth/reset-password  with body { email, otp, newPassword }
 * There is no URL token — the user receives a 6-digit OTP by email.
 * FIX: Collect email + OTP + new password in a 3-field form.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, Lock, KeyRound, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!otp.trim()) {
      setError('Please enter the OTP from your email');
      return;
    }

    setStatus('loading');
    try {
      // FIX: correct signature — (email, otp, newPassword)
      await authAPI.resetPassword(email, otp.trim(), newPassword);
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.message || 'Failed to reset password. The OTP may be expired.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-sm border border-gray-700">
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Password Reset!</h2>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
        <Link to="/login" className="flex items-center text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </Link>

        <h1 className="text-2xl font-bold mb-2 text-center">Set New Password</h1>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Enter the OTP from your email along with your new password.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* OTP */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">OTP Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none tracking-widest"
                placeholder="6-digit code from email"
                maxLength={6}
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Min 6 characters"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Retype password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
