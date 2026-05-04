import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from './ThemeProvider';
import { authAPI } from '../services/api';
import { Lock, User, Zap, AlertTriangle, Eye, EyeOff, Sun, Moon, Mail, CheckCircle2 } from 'lucide-react';

export default function CompleteProfile() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const tempToken = params.get('tempToken') || '';
  const email = params.get('email') || '';
  const name = params.get('name') || '';

  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);

  useEffect(() => {
    if (!tempToken) navigate('/register');
    // Pre-fill username from Google name
    if (name) {
      const suggested = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      setForm(f => ({ ...f, username: suggested.slice(0, 20) }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await authAPI.completeGoogleProfile({
        tempToken,
        username: form.username.trim(),
        password: form.password,
      });
      if (res.data.success) {
        login(res.data);
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Failed to complete registration');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  const pwStrength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: '#ef4444', width: '20%' };
    if (p.length < 8) return { label: 'Weak', color: '#f97316', width: '40%' };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: 'Strong', color: '#22c55e', width: '100%' };
    return { label: 'Fair', color: '#eab308', width: '65%' };
  })();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>

      {/* Theme toggle */}
      <button onClick={toggleTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
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
            Almost there!
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
            Complete your Score<span style={{ color: 'var(--accent)' }}>X</span> account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
          <div className="absolute top-0 left-6 right-6 h-px rounded-full"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.4),transparent)' }} />

          {/* Google account info banner */}
          <div className="mb-5 p-3 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="mt-0.5">
              <svg width="18" height="18" viewBox="0 0 48 48" className="flex-shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)' }}>
                <CheckCircle2 className="w-3 h-3 inline mr-1" />Google verified
              </p>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              {name && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{name}</p>}
            </div>
          </div>

          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Choose a username and set a password to finish setting up your account.
            You can use either Google or email+password to sign in going forward.
          </p>

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
                  placeholder="choose_a_username" required minLength={3} maxLength={30} autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all outline-none" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <p className="text-xs mt-1 ml-0.5" style={{ color: 'var(--text-muted)' }}>3–30 characters, letters/numbers/underscores</p>
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
              {pwStrength && (
                <div className="mt-1.5 ml-0.5">
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: pwStrength.width, background: pwStrength.color }} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: pwStrength.color }}>{pwStrength.label}</p>
                </div>
              )}
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
              {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 6 && (
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
              ) : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
