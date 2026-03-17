import { useState, useEffect, useCallback } from 'react';
import { clubAPI } from '../services/api';
import { Building2, Plus, Users, LogIn, X, Search, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface Club {
  _id: string;
  name: string;
  description?: string;
  type: 'public' | 'initiation_required';
  location?: string;
  members: any[];
  owner: any;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function ClubManagement() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    type: 'public' as 'public' | 'initiation_required',
    location: '' 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);


  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadClubs(searchTerm);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const loadClubs = async (search = '') => {
    console.log('[CLUBS] Loading clubs...', { search });
    setLoading(true);
    setApiError('');
    const params = search ? { search, limit: 50 } : { limit: 20 };
    
    // Load public clubs (independent)
    try {
      const allRes = await clubAPI.getClubs(params);
      setClubs(allRes.data?.data || allRes.data || []);
      console.log('[CLUBS] Public clubs loaded:', allRes.data?.data?.length || 0);
    } catch (e: any) {
      console.error('[CLUBS] Public clubs FAILED:', e.response?.status, e.message);
      setApiError(`Public clubs failed: ${e.response?.data?.message || e.message}`);
    }
    
    // Load my clubs (independent)
    try {
      const myRes = await clubAPI.getMyClubs(params);
      setMyClubs(myRes.data?.data || myRes.data || []);
      console.log('[CLUBS] My clubs loaded:', myRes.data?.data?.length || 0);
    } catch (e: any) {
      console.error('[CLUBS] My clubs FAILED:', e.response?.status, e.message);
      setApiError(prev => prev ? `${prev}; My clubs failed` : `My clubs failed: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };



  const load = useCallback(() => loadClubs(searchTerm), [searchTerm]);

  useEffect(() => { load(); }, []);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clubAPI.createClub(form);
      setForm({ name: '', description: '', type: 'public', location: '' });
      setShowCreate(false);
      addToast('Club created successfully!', 'success');
      load();
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Failed to create club', 'error');
    } finally {
      setSaving(false);
    }
  };

  const joinClub = async (id: string) => {
    try {
      await clubAPI.joinClub(id);
      addToast('Joined club!', 'success');
      load();
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Failed to join', 'error');
    }
  };

  // Server-side filtering - no client filter needed
  const filteredClubs = Array.isArray(clubs) ? clubs : [];
  const safeMyClubs = Array.isArray(myClubs) ? myClubs : [];

  // Debug logging
  useEffect(() => {
    console.log('[CLUBS DEBUG] Render:', { 
      clubs: clubs?.length || 0, 
      myClubs: myClubs?.length || 0, 
      filtered: filteredClubs.length, 
      loading, 
      apiError 
    });
  }, [clubs, myClubs, filteredClubs.length, loading, apiError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 max-w-4xl mx-auto relative z-10">
      {/* ERROR OVERLAY DEBUG - RED FLASH */}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">

        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" /> Clubs
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {searchTerm ? `Searching for "${searchTerm}"` : 'Join or create clubs to connect with cricket fans'}
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Create Club
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search clubs by name or description..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); loadClubs(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={load}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-full transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={createClub} className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mb-8 space-y-4 shadow-2xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" /> New Club
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Club name *" 
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <select 
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="public">Public (anyone can join)</option>
              <option value="initiation_required">Private (approval required)</option>
            </select>
          </div>
          <input 
            value={form.location} 
            onChange={e => setForm({ ...form, location: e.target.value })}
            placeholder="Location (e.g., Mumbai)" 
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <textarea 
            value={form.description} 
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" 
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-vertical"
          />
          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={saving || !form.name.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Club
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={() => setShowCreate(false)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Toasts */}
      {toasts.map(toast => (
        <div key={toast.id} className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl max-w-sm animate-in slide-in-from-right-2 fade-in duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500/90 backdrop-blur-sm border border-green-400/50 text-white' 
            : 'bg-red-500/90 backdrop-blur-sm border border-red-400/50 text-white'
        }`}>
          <div className="flex items-start gap-3">
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-100" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-100" />
            )}
            <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
          </div>
        </div>
      ))}

      {/* API Error Banner */}
      {apiError && (
        <div className="bg-yellow-500/90 text-yellow-900 p-4 rounded-2xl mb-6 border-2 border-yellow-400/50 shadow-xl">
          <AlertCircle className="w-5 h-5 inline ml-1 mb-1" />
          <strong>API Error:</strong> {apiError}
          <br />
          <small className="font-mono text-xs mt-1 block">Check Console (F12) for details. Backend may be slow/offline.</small>
        </div>
      )}
      
      {/* Clubs List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20 rounded-3xl p-8">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6 shadow-2xl" />
          <p className="text-blue-300 text-xl font-semibold">Loading clubs from server...</p>
          <p className="text-slate-400 text-sm mt-2">Contacting scorex-backend.onrender.com</p>
        </div>

      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-24 bg-gradient-to-br from-lime-500/20 to-emerald-500/20 border-4 border-dashed border-lime-400/50 rounded-3xl shadow-2xl animate-pulse">
          <div className="w-24 h-24 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl p-6">
            <Building2 className="w-16 h-16 text-white drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            🏏 {searchTerm ? 'No Clubs Found' : 'No Clubs Yet!'}
          </h2>
          <p className="text-xl text-lime-100 mb-8 max-w-lg mx-auto leading-relaxed drop-shadow-md">
            {searchTerm 
              ? `No clubs match "${searchTerm}". Try different search or be the first!`
              : 'No clubs available. Create your first cricket club or join existing ones!'
            }
          </p>
          {!searchTerm && (
            <button 
              onClick={() => setShowCreate(true)}
              className="px-10 py-4 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-white font-black text-lg rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto drop-shadow-2xl"
            >
              <Plus className="w-6 h-6" />
              Create First Club
            </button>
          )}
          <p className="text-lime-200/80 text-sm mt-8 font-medium">
            💡 Console (F12) shows detailed API status
          </p>
        </div>

      ) : (
        <div className="space-y-4">
          {filteredClubs.map(club => {
            const isMember = safeMyClubs.some((c: Club) => c && c._id === club._id);
            return (
              <div key={club._id} className="group bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 hover:shadow-2xl transition-all duration-300 rounded-2xl p-6 hover:-translate-y-1">

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-2xl">
                      {club.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-bold text-lg truncate group-hover:text-blue-400 transition-colors mb-1">
                        {club.name}
                      </h3>
                      <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                        {club.description || 'No description available.'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          club.type === 'public' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}>
                          {club.type === 'public' ? 'Public' : 'Private'}
                        </span>
                        {club.location && (
                          <span className="flex items-center gap-1">
                            📍 {club.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{club.members?.length || 0}</p>
                      <p className="text-slate-500 text-xs">members</p>
                    </div>
                    <button 
                      onClick={() => !isMember && joinClub(club._id)}
                      disabled={isMember}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                        isMember 
                          ? 'bg-green-900/50 border-2 border-green-500/50 text-green-400 cursor-default shadow-green-500/25' 
                          : 'bg-blue-600/90 hover:bg-blue-700 border-2 border-blue-500/50 text-white hover:shadow-blue-500/25 hover:scale-[1.02] shadow-lg'
                      }`}
                    >
                      {isMember ? (
                        <>
                          ✓ Member
                          <Users className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          Join
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
