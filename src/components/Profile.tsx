import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../services/api';
import { User, Mail, Shield, CreditCard, Edit3, Save, X, RefreshCw } from 'lucide-react';


export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', fullName: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const u = r.data.data;
      setProfile(u);
      setForm({ username: u.username || '', fullName: u.fullName || '' });
    }).catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      setProfile((p: any) => ({ ...p, ...form }));
      setEditing(false);
      setMsg('Profile updated!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const membershipLabels = ['Free', 'Premium', 'Enterprise'];
  const membershipColors = ['text-slate-400', 'text-amber-400', 'text-purple-400'];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-2 h-10 rounded-full bg-gradient-to-b from-[var(--accent)] to-green-600" />
        <h1 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Profile</h1>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-3xl text-sm backdrop-blur-xl shadow-2xl ${
          msg.includes('updated') ? 'bg-green-900/20 border border-green-700/40 text-green-300' : 'bg-red-900/20 border border-red-700/40 text-red-300'
        }`} style={{ border: '1px solid var(--border)' }}>
          {msg}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8" style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border)', 
        borderRadius: '1.5rem', 
        padding: '2rem', 
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Profile Header */}
        <div className="md:col-span-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 md:pb-12 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-6">
            <div className="relative group" style={{ 
              width: '5rem', height: '5rem', 
              background: 'linear-gradient(135deg, var(--accent), #10b981)', 
              borderRadius: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '1.5rem', color: 'white',
              boxShadow: '0 0 0 0.25rem rgba(34,197,94,0.2)'
            }}>
              <span>{(profile?.username || user?.username || 'U')[0]?.toUpperCase()}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] blur-xl animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                {profile?.username || user?.username}
              </h2>
              <p className="text-lg mt-1" style={{ color: 'var(--text-muted)' }}>{profile?.email || user?.email}</p>
              <p className={`text-base font-bold mt-1 px-3 py-1 rounded-xl inline-block ${
                profile?.membershipLevel === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/30' :
                profile?.membershipLevel === 2 ? 'bg-purple-500/10 text-purple-400 border border-purple-400/30' :
                'bg-slate-800/50 text-slate-400 border border-slate-700/50'
              }`}>
                {membershipLabels[profile?.membershipLevel || 0]} Member
              </p>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="group flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-hover)',
              color: 'var(--text-secondary)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
            }}>
            {editing ? (
              <>
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        {/* Edit Form or Details */}
        <div className={editing ? 'md:col-span-2' : ''}>
          {editing ? (
            <form onSubmit={save} className="space-y-6" style={{ backdropFilter: 'blur(12px)' }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Username</label>
                  <input 
                    value={form.username} 
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full px-4 py-3.5 text-sm font-semibold rounded-2xl focus:outline-none focus:ring-2 ring-[var(--accent)] transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                  <input 
                    value={form.fullName} 
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3.5 text-sm font-semibold rounded-2xl focus:outline-none focus:ring-2 ring-[var(--accent)] transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--accent)] to-green-600 hover:from-green-600 hover:to-emerald-600 text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6" style={{ backdropFilter: 'blur(12px)' }}>
              {[
                { label: 'Email', value: profile?.email || '—', icon: Mail, className: '' },
                { label: 'Role', value: profile?.role || 'User', icon: Shield, className: profile?.role === 'admin' ? 'border-red-500/30 bg-red-500/5' : '' },
                { label: 'Full Name', value: profile?.fullName || '—', icon: User, className: '' },
                { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: CreditCard, className: '' },
              ].map(({ label, value, icon: Icon, className }, i) => (
                <div key={label} className={`flex items-center gap-4 p-5 rounded-2xl group hover:-translate-y-1 transition-all ${className}`} 
                     style={{
                       background: 'var(--bg-elevated)',
                       border: '1px solid var(--border)',
                       boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                     }}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 p-3 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-all">
                    <Icon className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold block mb-1 opacity-80" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span className="text-lg font-black capitalize" style={{ color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

