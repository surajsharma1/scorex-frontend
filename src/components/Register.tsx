import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Loader2, Mail, Lock, User, CheckCircle } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      // Auto login or redirect to login
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        navigate('/');
      } else {
        alert("Account created! Please log in.");
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join ScoreX to manage your tournaments</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="cricket_fan_99"
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="you@example.com"
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Min 6 characters"
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Retype password"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-green-400 hover:text-green-300 font-bold">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}