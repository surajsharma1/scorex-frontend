import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin?: (userData: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();


      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/');
      } else {
        alert(data.message);
      }


    } catch (error) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            ScoreX
          </h1>
          <p className="text-xl text-slate-300">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 font-medium mb-3">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-3">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400">
          Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

