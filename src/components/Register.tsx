import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { authAPI } from '../services/api';
import { Mail, Lock, User, Zap, AlertTriangle } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.register({ username: form.username, email: form.email, password: form.password });
      if (res.data.success) { login(res.data); navigate('/dashboard'); }
      else setError(res.data.message || 'Registration failed');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'username', label: 'Username', type: 'text', icon: User, placeholder: 'johndoe' },
    { key: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: '••••••••' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: Lock, placeholder: '••••••••' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Join ScoreX</h1>
          <p className="text-slate-500 mt-1">Create your account</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl flex items-center gap-2 text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="text-slate-400 text-sm font-semibold mb-1.5 block">{f.label}</label>
                <div className="relative">
                  <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder} required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center mt-5 text-slate-500 text-sm">
            Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
