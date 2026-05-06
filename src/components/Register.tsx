import { useTheme } from './ThemeProvider';
import { Zap, Sun, Moon, ShieldCheck, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Register() {
  const { isDark, toggleTheme } = useTheme();

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
            Join Score<span style={{ color: 'var(--accent)' }}>X</span>
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Create your free account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
          <div className="absolute top-0 left-6 right-6 h-px rounded-full"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.4),transparent)' }} />

          {/* Verified-only notice */}
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
            <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Verified accounts only</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                ScoreX requires a verified email to sign up. Sign in with Google so we know your account is real — no fake or disposable addresses.
              </p>
            </div>
          </div>

          {/* Google Sign Up — primary CTA */}
          <a
            href={`${import.meta.env.VITE_API_URL || ''}/api/v1/auth/google`}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] mb-3"
            style={{
              background: 'linear-gradient(135deg,#22c55e,#10b981)',
              color: '#000',
              boxShadow: '0 0 24px rgba(34,197,94,0.3)',
            }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#1a1a1a" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#1a1a1a" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#1a1a1a" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#1a1a1a" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </a>

          {/* What they'll get */}
          <div className="rounded-xl p-3 mb-5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>What happens when you sign up:</p>
            <ul className="space-y-1.5">
              {[
                'Google confirms your email is real',
                'Choose your ScoreX username & password',
                'Full access to tournaments & overlays',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer notice about email login */}
          <div className="flex items-start gap-2 mb-5 p-3 rounded-xl"
            style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
            <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#ca8a04' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Already have an account with email &amp; password?{' '}
              <Link to="/login" className="font-bold" style={{ color: '#ca8a04' }}>Sign in here</Link> — email login still works.
            </p>
          </div>

          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
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
