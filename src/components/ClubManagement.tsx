import { useState, useEffect } from 'react';
import { clubAPI } from '../services/api';
import { Building2, Plus, Users, LogIn, X } from 'lucide-react';

export default function ClubManagement() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [all, my] = await Promise.all([clubAPI.getClubs(), clubAPI.getMyClubs()]);
      setClubs(all.data.data || all.data || []);
      setMyClubs(my.data.data || my.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await clubAPI.createClub(form);
      setForm({ name: '', description: '' });
      setShowCreate(false);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create club');
    } finally { setSaving(false); }
  };

  const joinClub = async (id: string) => {
    try { await clubAPI.joinClub(id); await load(); }
    catch (e: any) { alert(e.response?.data?.message || 'Failed to join'); }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-400" /> Clubs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Join or create clubs to connect with other cricket fans</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Create Club
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createClub} className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6 space-y-3">
          <h3 className="text-white font-bold">New Club</h3>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Club name *" required
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" rows={2}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-slate-800 text-slate-400 text-sm rounded-xl transition-all hover:bg-slate-700">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {clubs.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
              <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No clubs yet. Create the first one!</p>
            </div>
          ) : clubs.map(club => {
            const isMember = myClubs.some((c: any) => c._id === club._id);
            return (
              <div key={club._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-black">
                    {club.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold">{club.name}</p>
                    <p className="text-slate-500 text-xs flex items-center gap-1"><Users className="w-3 h-3" />{club.members?.length || 0} members {club.description && `· ${club.description}`}</p>
                  </div>
                </div>
                <button onClick={() => !isMember && joinClub(club._id)}
                  disabled={isMember}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isMember ? 'bg-green-900/30 border border-green-500/30 text-green-400 cursor-default' :
                    'bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-400'
                  }`}>
                  {isMember ? '✓ Member' : <><LogIn className="w-3.5 h-3.5" /> Join</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
