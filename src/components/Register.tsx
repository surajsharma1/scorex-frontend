import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from './ThemeProvider';
import { authAPI } from '../services/api';
import { Mail, Lock, User, Zap, AlertTriangle, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

export default function Register() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!isValidEmail(form.email)) { setError('Please enter a valid email address'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await authAPI.register({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (res.data.success) { login(res.data); navigate('/dashboard'); }
      else setError(res.data.message || 'Registration failed');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inp = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>

      {/* Theme toggle — top right corner */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        {isDark
          ? <><Sun className="w-3.5 h-3.5 text-amber-400" /><span>Light</span></>
          : <><Moon className="w-3.5 h-3.5 text-indigo-400" /><span>Dark</span></>}
      </button>

      {/* Background glows */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-96 max-h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: 'linear-gradient(var(--text-primary) 1px,transparent 1px),linear-gradient(90deg,var(--text-primary) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-flex mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)', boxShadow: '0 0 40px rgba(34,197,94,0.35)' }}>
              <Zap className="w-8 h-8 text-black" fill="currentColor" />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
              style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }} />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Join Score<span style={{ color: 'var(--accent)' }}>X</span>
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Create your free account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
          <div className="absolute top-0 left-6 right-6 h-px rounded-full"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.4),transparent)' }} />

          {error && (
            <div className="mb-5 p-3 rounded-xl flex items-center gap-2.5 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input type="text" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="johndoe" required minLength={3} autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all outline-none" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" required autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all outline-none" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" required minLength={6} autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all outline-none" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs mt-1 ml-0.5" style={{ color: 'var(--text-muted)' }}>Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input type={showCPw ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••" required autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all outline-none" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <button type="button" tabIndex={-1} onClick={() => setShowCPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all"
                  style={{ color: 'var(--text-muted)' }}>
                  {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs mt-1 ml-0.5 text-red-400">Passwords do not match</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs mt-1 ml-0.5" style={{ color: 'var(--accent)' }}>Passwords match ✓</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] mt-1"
              style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)', color: '#000', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-bold transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
