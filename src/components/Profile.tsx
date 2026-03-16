import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../services/api';
import { User, Mail, Shield, CreditCard, Edit3, Save, X } from 'lucide-react';

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
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-black text-white mb-6">Profile</h1>

      {msg && <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/40 rounded-xl text-blue-300 text-sm">{msg}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl">
              {(profile?.username || user?.username || 'U')[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-white font-black text-xl">{profile?.username || user?.username}</h2>
              <p className="text-slate-500 text-sm">{profile?.email || user?.email}</p>
              <p className={`text-sm font-semibold mt-0.5 ${membershipColors[profile?.membershipLevel || 0]}`}>
                {membershipLabels[profile?.membershipLevel || 0]} Member
              </p>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-sm rounded-xl transition-all">
            {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit3 className="w-4 h-4" /> Edit</>}
          </button>
        </div>

        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-1 block">Username</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-1 block">Full Name</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="Your full name"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Email', value: profile?.email, icon: Mail },
              { label: 'Role', value: profile?.role, icon: Shield },
              { label: 'Full Name', value: profile?.fullName || '—', icon: User },
              { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: CreditCard },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                <f.icon className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <span className="text-slate-500 text-sm w-28">{f.label}</span>
                <span className="text-white text-sm capitalize">{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
