import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { Trash2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../services/api';
import TeamManagement from './TeamManagement';
import TournamentStats from './TournamentStats';
import { Trophy, Calendar, MapPin, Users, Settings, Activity, LayoutGrid, ChevronRight, ArrowLeft } from 'lucide-react';
import React from 'react';

type TabType = 'overview' | 'teams' | 'matches' | 'stats' | 'settings';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({ name: '', venue: '', startDate: '', description: '', status: 'upcoming' });
  const [savingEdit, setSavingEdit] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    if (!id) return;
    tournamentAPI.getTournament(id)
      .then(res => {
        setTournament(res.data);
        setEditForm({
          name: res.data.name || '',
          venue: res.data.venue || '',
          startDate: res.data.startDate ? new Date(res.data.startDate).toISOString().slice(0, 16) : '',
          description: res.data.description || '',
          status: res.data.status || 'upcoming'
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user');
      }
    }
  }, []);

  const handleDeleteTournament = async () => {
    if (!confirm(`Delete "${tournament?.name || 'tournament'}"? All teams, matches and data will be permanently lost.`)) return;
    try {
      await tournamentAPI.deleteTournament(id!);
      addToast({ type: 'success', title: 'Tournament Deleted', message: 'Tournament has been deleted successfully.' });
      navigate('/tournaments');
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to delete tournament' });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
await tournamentAPI.updateTournament(id!, editForm);
      addToast({ type: 'success', message: 'Tournament settings saved successfully' });
      const res = await tournamentAPI.getTournament(id!);
      setTournament(res.data);
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Error saving tournament settings' });
    } finally {
      setSavingEdit(false);
    }
  };

  const isAuthorized = currentUser && (currentUser._id === tournament?.createdBy?._id || currentUser.role === 'admin');

  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );
  
  if (!tournament) return (
    <div className="p-8 text-center" style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>
      Tournament not found
    </div>
  );

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutGrid },
    { key: 'teams', label: 'Teams', icon: Users },
    { key: 'matches', label: 'Matches', icon: Activity },
    { key: 'stats', label: 'Stats', icon: Activity },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-6 max-w-6xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Background Orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      {/* Header */}
      <div className="mb-8 relative z-10">
        <button onClick={() => navigate('/tournaments')} className="flex items-center gap-2 text-sm font-semibold mb-4 transition-colors hover:text-green-400" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Tournaments
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
              <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{tournament.name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ml-2"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                {tournament.status}
              </span>
              {(currentUser?._id === tournament.createdBy?._id || currentUser?.role === 'admin') && (
                <button
                  onClick={handleDeleteTournament}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-200 transition-all ml-2"
                  title="Delete Tournament"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 ml-5">
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="w-4 h-4 opacity-70" /> {tournament.location || 'Location TBA'}
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-4 h-4 opacity-70" /> {new Date(tournament.startDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin-Style Scrollable Tabs */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-1 p-1 rounded-2xl w-full md:w-fit scrollbar-hide md:scrollbar-thin [&::-webkit-scrollbar]:hidden mb-8" 
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {tabs.map(s => (
          <button key={s.key} onClick={() => setActiveTab(s.key)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap snap-center shrink-0 md:flex-none md:px-4 md:py-2"
            style={activeTab === s.key
              ? { background: 'linear-gradient(135deg, var(--accent), #10b981)', color: 'white', boxShadow: '0 0 20px rgba(34,197,94,0.4)' }
              : { color: 'var(--text-secondary)' }}>
            <s.icon className="w-5 h-5" /> {s.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="relative z-10">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="col-span-1 md:col-span-2 rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
               <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>About Tournament</h3>
               <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                 {tournament.description || 'No description provided.'}
               </p>
             </div>
             <div className="space-y-6">
                <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Registered Teams</span>
                      <span className="font-black text-lg text-green-400">{tournament.teams?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Total Matches</span>
                      <span className="font-black text-lg text-green-400">{tournament.matches?.length || 0}</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}
        {activeTab === 'teams' && <TeamManagement tournamentId={id!} />}
        {activeTab === 'stats' && <TournamentStats tournamentId={id!} matches={[]} />}
        {activeTab === 'settings' && (
          <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Edit Tournament Settings</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Tournament Name</label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500">
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Start Date</label>
                  <input type="datetime-local" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Venue</label>
                <input type="text" value={editForm.venue} onChange={e => setEditForm({...editForm, venue: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Description</label>
                <textarea rows={4} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
              </div>
              <button type="submit" disabled={savingEdit} className="px-6 py-3 mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50">
                {savingEdit ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}
        {activeTab === 'matches' && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
             <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
             <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Match Schedule</h3>
             <p style={{ color: 'var(--text-secondary)' }}>Use the fully-featured Tournament View component instead of this fallback component for the best experience.</p>
          </div>
        )}
      </div>
    </div>
  );
}