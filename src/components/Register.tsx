import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dob: '',
    googleId: '',
  });
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Prefill from query params if from Google OAuth
    const email = searchParams.get('email');
    const fullName = searchParams.get('fullName');
    const googleId = searchParams.get('googleId');
    if (email) setFormData(prev => ({ ...prev, email }));
    if (fullName) setFormData(prev => ({ ...prev, fullName }));
    if (googleId) setFormData(prev => ({ ...prev, googleId }));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        dob: formData.dob,
        googleId: formData.googleId,
      });
      // Always show OTP input after registration
      setShowOtp(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.verifyOtp({
        email: formData.email,
        otp,
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/profile');
      } else {
        setError('Verification failed: No token received');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 w-full max-w-md animate-slide-in rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join ScoreX</h2>
          <p className="text-gray-600 dark:text-gray-400">Create your tournament management account</p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {showOtp ? (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-gray-600 dark:text-gray-400">An OTP has been sent to your email. Please enter it below to complete registration.</p>
            </div>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-6"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>



            <div className="text-center">
              <button
                onClick={() => setShowOtp(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                Back to Registration
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Create a password"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-5"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>



            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
