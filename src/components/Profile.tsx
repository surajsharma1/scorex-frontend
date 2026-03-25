import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../services/api';
import {
  User, Mail, Shield, CreditCard, Edit3, Save, X,
  RefreshCw, Calendar, Star, Crown, Zap, Key, Check
} from 'lucide-react';

const MEMBERSHIP = [
  { label: 'Free',       icon: Zap,   color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)' },
  { label: 'Premium',   icon: Star,  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)'   },
  { label: 'Enterprise',icon: Crown, color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)'  },
];

function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) { setMsg({ text: 'Passwords do not match', ok: false }); return; }
    if (form.next.length < 6) { setMsg({ text: 'Password must be at least 6 characters', ok: false }); return; }
    setSaving(true); setMsg(null);
    try {
      await api.put('/auth/change-password', { currentPassword: form.current, newPassword: form.next });
      setMsg({ text: 'Password changed!', ok: true });
      setForm({ current: '', next: '', confirm: '' });
      setTimeout(() => { setOpen(false); setMsg(null); }, 2000);
    } catch (e: any) {
      setMsg({ text: e.response?.data?.message || 'Failed to change password', ok: false });
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <button
        onClick={() => { setOpen(o => !o); setMsg(null); }}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-all"
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Key className="w-4 h-4" style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <p className="font-bold text-sm">Change Password</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Update your account password</p>
          </div>
        </div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{open ? '−' : '+'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)' }}>
          {msg && (
            <div className="mt-4 mb-3 p-3 rounded-xl flex items-center gap-2 text-sm"
              style={msg.ok
                ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }
                : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {msg.ok ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
              {msg.text}
            </div>
          )}
          <form onSubmit={save} className="space-y-3 mt-4">
            {[
              { label: 'Current Password', key: 'current' as const, placeholder: '••••••••' },
              { label: 'New Password',     key: 'next'    as const, placeholder: 'Min 6 characters' },
              { label: 'Confirm New',      key: 'confirm' as const, placeholder: 'Repeat new password' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                <input
                  type="password" value={form[f.key]} required
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Update Password</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', fullName: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const u = r.data.data;
      setProfile(u);
      setForm({ username: u.username || '', fullName: u.fullName || '' });
    }).catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.put('/users/profile', form);
      setProfile((p: any) => ({ ...p, ...form }));
      setEditing(false);
      setMsg({ text: 'Profile updated successfully!', ok: true });
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg({ text: e.response?.data?.message || 'Update failed', ok: false });
    } finally { setSaving(false); }
  };

  const level = profile?.membershipLevel || 0;
  const mem = MEMBERSHIP[level] || MEMBERSHIP[0];
  const MemIcon = mem.icon;

  const membershipExpiry = profile?.membershipExpiresAt
    ? new Date(profile.membershipExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      {/* BG orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        </div>

        {/* Status message */}
        {msg && (
          <div className="mb-5 p-3.5 rounded-2xl flex items-center gap-2.5 text-sm"
            style={msg.ok
              ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }
              : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {msg.ok ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
            {msg.text}
          </div>
        )}

        <div className="space-y-4">
          {/* ── Avatar card ── */}
          <div
            className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Avatar */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl flex-shrink-0 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                color: '#000',
                boxShadow: '0 0 0 4px rgba(34,197,94,0.15)',
              }}
            >
              {(profile?.username || user?.username || 'U')[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate" style={{ color: 'var(--text-primary)' }}>
                {profile?.username || user?.username}
              </h2>
              <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {profile?.email || user?.email}
              </p>
              {/* Membership badge */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: mem.bg, border: `1px solid ${mem.border}`, color: mem.color }}
                >
                  <MemIcon className="w-3 h-3" />
                  {mem.label} Member
                </div>
                {profile?.role === 'admin' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                    <Shield className="w-3 h-3" /> Admin
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => { setEditing(v => !v); setMsg(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] flex-shrink-0"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit3 className="w-4 h-4" /> Edit</>}
            </button>
          </div>

          {/* ── Edit form ── */}
          {editing && (
            <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Edit Profile</h3>
              <form onSubmit={save} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Username</label>
                  <input
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <button type="submit" disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}>
                  {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </form>
            </div>
          )}

          {/* ── Info cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Email',        value: profile?.email || '—',  icon: Mail,     iconColor: '#60a5fa' },
              { label: 'Full Name',    value: profile?.fullName || '—', icon: User,   iconColor: 'var(--accent)' },
              { label: 'Role',         value: profile?.role || 'viewer', icon: Shield, iconColor: profile?.role === 'admin' ? '#f87171' : 'var(--text-muted)' },
              { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: Calendar, iconColor: '#f59e0b' },
            ].map(({ label, value, icon: Icon, iconColor }) => (
              <div key={label}
                className="flex items-center gap-3.5 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-elevated)' }}>
                  <Icon className="w-4 h-4" style={{ color: iconColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-sm font-bold capitalize truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Membership expiry if active */}
          {level > 0 && membershipExpiry && (
            <div
              className="flex items-center gap-3.5 p-4 rounded-2xl"
              style={{ background: mem.bg, border: `1px solid ${mem.border}` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-card)' }}>
                <CreditCard className="w-4 h-4" style={{ color: mem.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Membership Expires</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: mem.color }}>{membershipExpiry}</p>
              </div>
            </div>
          )}

          {/* Password change */}
          <PasswordSection />
        </div>
      </div>
    </div>
  );
}
