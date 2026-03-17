import { useState, useEffect, useCallback } from 'react';
import { clubAPI } from '../services/api';
import { Building2, Plus, Users, LogIn, X, Search, RefreshCw, AlertCircle, CheckCircle, LogOut, Crown, MapPin, Lock, Globe, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../App';

interface Club {
  _id: string;
  name: string;
  description?: string;
  type: 'public' | 'initiation_required';
  location?: string;
  members: any[];
  owner: any;
}
interface Toast { id: string; type: 'success' | 'error'; message: string; }

export default function ClubManagement() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'mine'>('browse');
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', type: 'public' as 'public' | 'initiation_required', location: '' });
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const t = setTimeout(() => loadClubs(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadClubs = async (search = '') => {
    setLoading(true); setApiError('');
    const params = search ? { search, limit: 50 } : { limit: 20 };
    try {
      const [allRes, myRes] = await Promise.allSettled([
        clubAPI.getClubs(params),
        clubAPI.getMyClubs(params),
      ]);
      if (allRes.status === 'fulfilled') setClubs(allRes.value.data?.data || allRes.value.data || []);
      else setApiError('Could not load public clubs.');
      if (myRes.status === 'fulfilled') setMyClubs(myRes.value.data?.data || myRes.value.data || []);
    } finally { setLoading(false); }
  };

  const load = useCallback(() => loadClubs(searchTerm), [searchTerm]);
  useEffect(() => { load(); }, []);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await clubAPI.createClub(form);
      setForm({ name: '', description: '', type: 'public', location: '' });
      setShowCreate(false);
      addToast('Club created!', 'success'); load();
    } catch (e: any) { addToast(e.response?.data?.message || 'Failed to create club', 'error'); }
    finally { setSaving(false); }
  };

  const joinClub = async (id: string) => {
    try { await clubAPI.joinClub(id); addToast('Joined club!', 'success'); load(); }
    catch (e: any) { addToast(e.response?.data?.message || 'Failed to join', 'error'); }
  };

  const leaveClub = async (id: string) => {
    if (!confirm('Leave this club?')) return;
    try { await clubAPI.leaveClub(id); addToast('Left club.', 'success'); load(); }
    catch (e: any) { addToast(e.response?.data?.message || 'Failed to leave', 'error'); }
  };

  const safeMyClubs = Array.isArray(myClubs) ? myClubs : [];
  const filteredClubs = Array.isArray(clubs) ? clubs : [];
  const displayClubs = activeTab === 'browse' ? filteredClubs : safeMyClubs;

  const SXInput = ({ className = '', ...props }: any) => (
    <input className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all ${className}`}
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      {...props} />
  );

  return (
    <div className="p-6 max-w-4xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* BG orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-right duration-300"
            style={{ background: t.type === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)', color: '#fff', border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`, backdropFilter: 'blur(8px)' }}>
            {t.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Building2 className="w-6 h-6 text-green-400" /> Clubs
            </h1>
          </div>
          <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>
            {searchTerm ? `Searching "${searchTerm}"` : 'Join or create clubs to connect with cricket fans'}
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
          <Plus className="w-4 h-4" /> Create Club
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {(['browse', 'mine'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={activeTab === tab
              ? { background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }
              : { color: 'var(--text-secondary)' }}>
            {tab === 'browse' ? 'Browse All' : `My Clubs (${safeMyClubs.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search clubs by name or description..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-9 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        )}
        <button onClick={load} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all hover:text-green-400" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={createClub} className="rounded-2xl p-6 mb-6 space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(34,197,94,0.08)' }}>
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Building2 className="w-5 h-5 text-green-400" /> New Club
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SXInput value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="Club name *" required />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <option value="public">Public (anyone can join)</option>
              <option value="initiation_required">Private (approval required)</option>
            </select>
          </div>
          <SXInput value={form.location} onChange={(e: any) => setForm({ ...form, location: e.target.value })} placeholder="Location (e.g., Mumbai)" />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-vertical"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !form.name.trim()}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.25)' }}>
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Club</>}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-5 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* API Error */}
      {apiError && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {apiError}
        </div>
      )}

      {/* Club List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading clubs...</p>
        </div>
      ) : displayClubs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {activeTab === 'mine' ? 'You haven\'t joined any clubs yet' : searchTerm ? `No clubs match "${searchTerm}"` : 'No clubs yet'}
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'mine' ? 'Browse and join clubs from the Browse All tab' : 'Be the first to create one!'}
          </p>
          {activeTab === 'browse' && !searchTerm && (
            <button onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
              Create First Club
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayClubs.map(club => {
            const isMember = safeMyClubs.some((c: Club) => c?._id === club._id);
            const isOwner = club.owner?._id === user?.id || club.owner === user?.id;
            const isExpanded = expandedClub === club._id;
            return (
              <div key={club._id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', border: `1px solid ${isMember ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`, boxShadow: isMember ? '0 4px 16px rgba(34,197,94,0.08)' : undefined }}>
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                      {club.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{club.name}</h3>
                        {isOwner && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                          <Crown className="w-3 h-3" /> Owner</span>}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium`}
                          style={club.type === 'public'
                            ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                            : { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                          {club.type === 'public' ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Private</>}
                        </span>
                      </div>
                      {club.description && <p className="text-sm mb-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{club.description}</p>}
                      <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                        {club.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {club.location}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {club.members?.length || 0} members</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {club.description && (
                      <button onClick={() => setExpandedClub(isExpanded ? null : club._id)}
                        className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    {isMember && !isOwner && (
                      <button onClick={() => leaveClub(club._id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                        <LogOut className="w-3.5 h-3.5" /> Leave
                      </button>
                    )}
                    {isMember && isOwner && (
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
                        <Settings className="w-3.5 h-3.5" /> Manage
                      </button>
                    )}
                    {!isMember && (
                      <button onClick={() => joinClub(club._id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 12px rgba(34,197,94,0.2)' }}>
                        <LogIn className="w-3.5 h-3.5" />
                        {club.type === 'public' ? 'Join' : 'Request'}
                      </button>
                    )}
                    {isMember && !isOwner && (
                      <span className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>
                        ✓ Member
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded && club.description && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {club.description}
                    </div>
                    {club.members?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Members</p>
                        <div className="flex flex-wrap gap-2">
                          {club.members.slice(0, 8).map((m: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-black font-bold text-[10px]"
                                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                                {(m.username || m.name || '?')[0]?.toUpperCase()}
                              </div>
                              {m.username || m.name || 'Member'}
                            </div>
                          ))}
                          {club.members.length > 8 && (
                            <span className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
                              +{club.members.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
