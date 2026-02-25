import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setStatus('loading');
    try {
      await authAPI.resetPassword(token, password);
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (e) {
      setStatus('error');
      setError('Failed to reset password. Link may be expired.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-sm">
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
        <h1 className="text-2xl font-bold mb-6 text-center">Set New Password</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all flex items-center justify-center"
          >
            {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}