import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Calendar, Edit } from 'lucide-react';
import api from '../services/api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setUser(res.data.data || res.data.user);
      setFormData({ username: res.data.data?.username || '', email: res.data.data?.email || '' });
      setLoading(false);
    }).catch(() => navigate('/login'));
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', formData);
      setUser(res.data.data);
      setEditing(false);
    } catch (error) {
      alert('Update failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>No user data</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <User className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">{user.username}</h1>
          <p className="text-xl text-slate-400">{user.email}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 space-y-8">
          {/* Profile Form */}
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="flex items-center gap-3 text-slate-300 font-medium mb-3">
                <User className="w-5 h-5" />
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!editing}
              />
            </div>

            <div>
              <label className="flex items-center gap-3 text-slate-300 font-medium mb-3">
                <Mail className="w-5 h-5" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!editing}
              />
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={!editing}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </form>

          {/* Membership Info */}
          <div className="pt-8 border-t border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Membership
            </h3>
            <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 p-6 rounded-2xl border border-purple-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-purple-100 font-bold text-xl">{user.membership?.level === 1 ? 'Premium' : 'Free'}</p>
                  <p className="text-purple-200">Expires {user.membership?.expires?.toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-300">Unlimited overlays</p>
                  <p className="text-sm text-purple-300">Priority support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

