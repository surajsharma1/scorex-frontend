import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await authAPI.forgotPassword(email);
      setStatus('success');
      setMsg('If an account exists with that email, a reset link has been sent.');
    } catch (e) {
      setStatus('error');
      setMsg('Unable to process request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
        <Link to="/login" className="flex items-center text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </Link>
        
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-400 mb-6">Enter your email to receive recovery instructions.</p>

        {status === 'success' ? (
          <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-lg text-green-200 text-sm">
            {msg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="bg-red-900/30 border border-red-500/50 p-3 rounded-lg text-red-200 text-sm">
                {msg}
              </div>
            )}
            
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

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all flex items-center justify-center"
            >
              {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}