import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { useAuth } from '../App';
import {
  Plus, Trash2, Zap, BarChart2, Users, Trophy, Shield,
  Calendar, MapPin, ChevronRight, X, ArrowLeft, Edit3,
  Activity, Target, TrendingUp, Layers, CheckCircle, Clock
} from 'lucide-react';
import TeamManagement from './TeamManagement';
import MatchDetail from './MatchDetail';
import OverlayManager from './OverlayManager';
import StatusBadge from './StatusBadge';

// ─── Create Tournament Modal ──────────────────────────────────────────────────
function CreateTournamentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', type: 'round_robin', format: 'T20',
    startDate: '', venue: '', rules: '', prizePool: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await tournamentAPI.createTournament({
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        prizePool: Number(form.prizePool) || 0
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create tournament');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md my-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">New Tournament</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          {[
            { label: 'Tournament Name', key: 'name', type: 'text', required: true, placeholder: 'e.g. IPL Season 1' },
            { label: 'Venue / Location', key: 'venue', type: 'text', required: true, placeholder: 'e.g. Wankhede Stadium' },
            { label: 'Start Date', key: 'startDate', type: 'date', required: true },
            { label: 'Prize Pool (₹)', key: 'prizePool', type: 'number', placeholder: '0' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">{f.label}</label>
              <input
                type={f.type} value={(form as any)[f.key]} required={f.required}
                placeholder={f.placeholder}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                <option value="round_robin">Round Robin</option>
                <option value="knockout">Knockout</option>
                <option value="league">League</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Format</label>
              <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                {['T10', 'T20', 'ODI', 'Test'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Rules (optional)</label>
            <textarea value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })}
              rows={2} placeholder="Tournament rules..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
            {loading ? 'Creating...' : 'Create Tournament'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Create Match Modal ───────────────────────────────────────────────────────
function CreateMatchModal({ tournamentId, teams, onClose, onCreated }: {
  tournamentId: string; teams: any[]; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({ team1: '', team2: '', date: '', venue: '', format: 'T20', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.team1 === form.team2) { setError('Teams must be different'); return; }
    setLoading(true); setError('');
    try {
      await matchAPI.createMatch({ ...form, tournamentId, date: new Date(form.date).toISOString() });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create match');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md my-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">Schedule Match</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['team1', 'team2'].map((t, i) => (
              <div key={t}>
                <label className="text-slate-400 text-xs font-semibold mb-1 block">Team {i + 1}</label>
                <select value={(form as any)[t]} onChange={e => setForm({ ...form, [t]: e.target.value })} required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">-- Select --</option>
                  {teams.map(tm => <option key={tm._id} value={tm._id}>{tm.name}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Match Name (optional)</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Auto-generated if empty"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Date & Time</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Format</label>
              <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                {['T10', 'T20', 'ODI', 'Test'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Venue</label>
            <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. Home Ground"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
            {loading ? 'Scheduling...' : 'Schedule Match'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Points Table ─────────────────────────────────────────────────────────────
function PointsTable({ tournamentId }: { tournamentId: string }) {
  const [table, setTable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentAPI.getPointsTable(tournamentId)
      .then(r => setTable(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-3 text-slate-400 font-semibold">#</th>
            <th className="text-left py-3 px-3 text-slate-400 font-semibold">Team</th>
            <th className="text-center py-3 px-2 text-slate-400 font-semibold">P</th>
            <th className="text-center py-3 px-2 text-slate-400 font-semibold">W</th>
            <th className="text-center py-3 px-2 text-slate-400 font-semibold">L</th>
            <th className="text-center py-3 px-2 text-slate-400 font-semibold">T/NR</th>
            <th className="text-center py-3 px-2 text-slate-400 font-semibold">NRR</th>
            <th className="text-center py-3 px-2 text-blue-400 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row: any, idx: number) => (
            <tr key={row._id} className={`border-b border-slate-800 hover:bg-slate-800/40 transition-colors ${idx === 0 ? 'bg-yellow-500/5' : ''}`}>
              <td className="py-3 px-3 text-slate-400 font-semibold">{idx + 1}</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  {idx === 0 && <span className="text-yellow-500">👑</span>}
                  <div>
                    <div className="text-white font-semibold">{row.name}</div>
                    <div className="text-slate-600 text-xs">{row.shortName}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2 text-center text-slate-300">{row.played}</td>
              <td className="py-3 px-2 text-center text-green-400 font-semibold">{row.won}</td>
              <td className="py-3 px-2 text-center text-red-400">{row.lost}</td>
              <td className="py-3 px-2 text-center text-slate-400">{row.tied + row.nr}</td>
              <td className={`py-3 px-2 text-center font-mono text-xs ${row.nrr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {row.nrr >= 0 ? '+' : ''}{row.nrr?.toFixed(3)}
              </td>
              <td className="py-3 px-2 text-center text-blue-400 font-black text-base">{row.points}</td>
            </tr>
          ))}
          {table.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-slate-600">No matches completed yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TournamentView() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'teams' | 'overlays' | 'leaderboard'>('overview');
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [statusMenu, setStatusMenu] = useState<string | null>(null);

  // Load user's tournaments (account-distinct)
  const loadTournaments = useCallback(async () => {
    try {
      const res = await tournamentAPI.getMyTournaments();
      const list = res.data.data || [];
      setTournaments(list);
      if (paramId) {
        const found = list.find((t: any) => t._id === paramId);
        if (found) setSelected(found);
      } else if (list.length > 0 && !selected) {
        setSelected(list[0]);
      }
    } catch (e) {
      console.error('Failed to load tournaments', e);
    } finally {
      setLoading(false);
    }
  }, [paramId]);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  // Load tournament details when selected changes
useEffect(() => {
    if (!selected?._id) return;
    const loadDetails = async () => {
      try {
        const [matchRes, teamRes] = await Promise.all([
          matchAPI.getMatches({ tournament: selected._id, limit: 100 }),
          teamAPI.getTeams(selected._id)
        ]);
        setMatches(matchRes.data.data || []);
        setTeams(teamRes.data.data || []);
      } catch (e) { console.error(e); }
    };
    loadDetails();
  }, [selected?._id]);

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Delete this match?')) return;
    try {
      await matchAPI.deleteMatch(matchId);
      setMatches(prev => prev.filter(m => m._id !== matchId));
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (matchId: string, status: string) => {
    try {
      await matchAPI.updateStatus(matchId, status);
      setMatches(prev => prev.map(m => m._id === matchId ? { ...m, status } : m));
      setStatusMenu(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm('Delete this tournament? This cannot be undone.') ) return;
    try {
      await tournamentAPI.deleteTournament(id);
      setTournaments(prev => prev.filter(t => t._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (e) { console.error(e); }
  };

  // If a match is selected, show MatchDetail
  if (selectedMatch) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <MatchDetail
          matchId={selectedMatch._id}
          onBack={() => setSelectedMatch(null)}
          openScoreboard={() => navigate(`/matches/${selectedMatch._id}/score`)}
        />
      </div>
    );
  }

  const tabs = ['overview', 'matches', 'teams', 'overlays', 'leaderboard'] as const;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>

      {/* Modals */}
      {showCreateTournament && (
        <CreateTournamentModal onClose={() => setShowCreateTournament(false)} onCreated={loadTournaments} />
      )}
      {showCreateMatch && selected && (
        <CreateMatchModal
          tournamentId={selected._id}
          teams={teams}
          onClose={() => setShowCreateMatch(false)}
          onCreated={async () => {
            const res = await matchAPI.getMatches({ tournament: selected._id, limit: 100 });
            setMatches(res.data.data || []);
          }}
        />
      )}

      {/* Left panel: tournament list */}
<div className="w-full md:w-64 lg:w-72 xl:w-80 h-screen md:h-auto flex flex-col flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
        <div className="p-4 md:px-3 md:py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm md:text-base lg:text-lg font-black truncate" style={{ color: 'var(--text-primary)' }}>Tournaments</h2>
          <button onClick={() => setShowCreateTournament(true)}
            className="w-10 h-10 md:w-8 md:h-8 flex-shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center justify-center transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95">
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-2 lg:p-3 space-y-2 md:space-y-1 scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-transparent">

          {loading ? (
            <div className="flex justify-center py-12 md:py-8"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-16 md:py-12 px-4">
              <Trophy className="w-12 h-12 md:w-10 md:h-10 text-slate-600/50 mx-auto mb-4" />
              <p className="text-slate-500 text-sm md:text-base font-medium mb-3 px-2">No tournaments yet</p>
              <button onClick={() => setShowCreateTournament(true)}
                className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl active:scale-95 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create First Tournament
              </button>
            </div>
          ) : (
            tournaments.map(t => (
              <button key={t._id} onClick={() => { setSelected(t); setActiveTab('overview'); }}
                className={`w-full text-left p-4 md:p-3 rounded-2xl transition-all group hover:-translate-y-0.5 active:scale-[0.98] ${
                  selected?._id === t._id 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/40 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30' 
                    : 'hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 border border-transparent hover:border-slate-700/50 hover:shadow-lg hover:shadow-slate-500/20'
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-base md:text-sm truncate leading-tight ${
                      selected?._id === t._id ? 'text-emerald-300 bg-gradient-to-r bg-clip-text from-emerald-400 to-green-400 text-transparent' : 'text-slate-200 group-hover:text-white'
                    }`}>{t.name}</p>
                    <p className="text-slate-500 text-xs md:text-xs mt-1 leading-tight flex flex-wrap items-center gap-1">
                      <span className="capitalize">{t.format}</span>
                      <span>•</span>
                      <span className="capitalize">{t.type?.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-1 ml-2">
                    <StatusBadge status={t.status || 'upcoming'} className="!shadow-md" />
                    <button onClick={e => { e.stopPropagation(); handleDeleteTournament(t._id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-all shadow-sm hover:shadow-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: tournament detail */}
      <div className="flex-1 overflow-auto">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Select or create a tournament</p>
            </div>
          </div>
        ) : (
<div>
            {/* Tournament header */}
            <div className="border-b px-4 sm:px-6 lg:px-8 py-4 sm:py-5" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{selected.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm lg:text-base" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> {selected.startDate ? new Date(selected.startDate).toLocaleDateString('en-IN') : 'TBD'}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> {selected.venue || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Shield className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> {selected.format}</span>
                    <StatusBadge status={selected.status || 'upcoming'} />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-6 sm:mt-8 -mb-5 border-b pt-3 sm:pt-4" style={{ borderColor: 'var(--border)' }}>
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 sm:px-4 py-2 text-sm font-semibold capitalize transition-all border-b-2 -mb-px flex-1 lg:flex-none ${
                      activeTab === tab
                        ? 'border-emerald-500 text-emerald-400 font-black'
                        : 'border-transparent hover:text-gray-300 hover:border-gray-300'
                    }`} style={{ color: activeTab === tab ? '#22c55e' : 'var(--text-secondary)' }}>
                    {tab === 'leaderboard' ? 'Points Table' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
              <div className="space-y-8 md:space-y-6 pb-4 md:pb-0">
                {/* Tournament Stats - Dashboard Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { label: 'Teams', value: selected.teams?.length || 0, icon: Users, gradient: 'from-blue-500 to-cyan-600', glow: 'rgba(6,182,212,0.15)', action: () => setActiveTab('teams') },
                    { label: 'Matches', value: matches.length, icon: Activity, gradient: 'from-emerald-500 to-green-600', glow: 'rgba(34,197,94,0.15)', action: () => setActiveTab('matches') },
                    { label: 'Live Now', value: matches.filter((m: any) => m.status === 'live').length, icon: Zap, gradient: 'from-red-500 to-rose-600', glow: 'rgba(239,68,68,0.15)', action: null },
                    { label: 'Completed', value: matches.filter((m: any) => m.status === 'completed').length, icon: CheckCircle, gradient: 'from-purple-500 to-violet-600', glow: 'rgba(168,85,247,0.15)', action: null },
                  ].map(stat => (
                    <button key={stat.label} onClick={stat.action} className="group relative overflow-hidden rounded-2xl p-6 md:p-5 text-left transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border)', 
                        boxShadow: `0 8px 32px ${stat.glow}` 
                      }}>
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.gradient} blur-xl -z-10 scale-150`} />
                      <div className={`w-12 h-12 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 md:mb-3 shadow-2xl shadow-[${stat.gradient.replace('from-', '').replace('to-', '')}/0.3] group-hover:scale-110 transition-all duration-300`}>
                        <stat.icon className="w-6 h-6 md:w-5 md:h-5 text-white drop-shadow-lg" />
                      </div>
                      <p className="text-sm md:text-xs font-semibold mb-1 md:mb-0.5 tracking-tight px-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                      <p className="text-3xl md:text-2xl lg:text-[2rem] xl:text-3xl font-black leading-none drop-shadow-md" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                    </button>
                  ))}
                </div>

                {/* Tournament Details Card - Enhanced */}
                <div className="group relative overflow-hidden rounded-3xl p-8 md:p-6 lg:p-8 xl:p-10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl" 
                  style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 to-green-600/2 opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 blur-xl" />
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl rotate-12" />
                  <h3 className="text-2xl md:text-xl lg:text-2xl xl:text-3xl font-black mb-6 md:mb-4 leading-tight relative z-10" style={{ color: 'var(--text-primary)' }}>
                    Tournament Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-4 text-sm lg:text-base">
                    <div className="space-y-1.5 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Type</span>
                      <div className="text-lg lg:text-base font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{selected.type?.replace('_', ' ')}</div>
                    </div>
                    <div className="space-y-1.5 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Format</span>
                      <div className="text-lg lg:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selected.format}</div>
                    </div>
                    <div className="space-y-1.5 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Start</span>
                      <div className="text-lg lg:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        {selected.startDate ? new Date(selected.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}
                      </div>
                    </div>
                    <div className="space-y-1.5 group/item hover:translate-x-1 transition-transform duration-200">
                      <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Venue</span>
                      <div className="text-lg lg:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selected.venue || 'TBD'}</div>
                    </div>
                    {selected.prizePool > 0 && (
                      <div className="space-y-1.5 col-span-1 sm:col-span-2 lg:col-span-1 group/item hover:translate-x-1 transition-transform duration-200">
                        <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Prize Pool</span>
                        <div className="text-xl lg:text-lg font-black bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg" style={{ color: 'var(--text-primary)' }}>
                          ₹{selected.prizePool.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                  {selected.rules && (
                    <div className="mt-8 pt-8 border-t relative" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 rounded-2xl -z-10" />
                      <p className="text-base font-semibold mb-4 uppercase tracking-wider text-emerald-400 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        📜 Rules
                      </p>
                      <div className="prose prose-sm prose-invert max-w-none p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm" style={{ color: 'var(--text-secondary)' }}>
                        <p className="whitespace-pre-line leading-relaxed">{selected.rules}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}


              {/* MATCHES */}
              {activeTab === 'matches' && (
                <div className="space-y-6">
                  {/* Matches Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl md:text-2xl lg:text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                        Matches ({matches.length})
                      </h2>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage scheduled matches</p>
                    </div>
                    <button onClick={() => setShowCreateMatch(true)}
                      className="self-start sm:self-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 active:scale-95 flex items-center gap-2 text-sm">
                      <Plus className="w-5 h-5" /> Schedule Match
                    </button>
                  </div>

                  {matches.length === 0 ? (
                    <div className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center transition-all group hover:scale-[1.02]" 
                      style={{ 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                      }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-800/30 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                      <Activity className="w-20 h-20 md:w-16 md:h-16 text-slate-600/60 mx-auto mb-6 relative z-10 group-hover:scale-110 transition-transform" />
                      <h3 className="text-xl md:text-2xl font-black mb-3 relative z-10" style={{ color: 'var(--text-primary)' }}>No Matches Yet</h3>
                      <p className="text-slate-500 text-lg mb-6 max-w-md mx-auto relative z-10 leading-relaxed">Schedule your first match to get started with live scoring and overlays.</p>
                      <button onClick={() => setShowCreateMatch(true)} 
                        className="relative z-10 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 active:scale-95 inline-flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Schedule First Match
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 space-y-4 lg:space-y-0">
                      {matches.map(match => (
                        <div key={match._id} className="group relative overflow-hidden rounded-3xl p-6 lg:p-7 transition-all duration-400 hover:-translate-y-2 hover:scale-[1.01] hover:shadow-2xl active:scale-[0.98]" 
                          style={{ 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                          }}>
                          {/* Status badge - floating */}
                          <StatusBadge 
                            status={match.status} 
                            className="absolute top-4 right-4 !shadow-lg !shadow-black/30 !drop-shadow-2xl z-20"
                          />
                          
                          {/* Team matchup */}
                          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-4 relative z-10">
                            <button onClick={() => setSelectedMatch(match)} className="flex-1 text-left lg:pr-4">
                              <div className="flex items-center gap-2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="px-3 py-1 bg-slate-800/60 backdrop-blur-sm text-xs font-bold rounded-full text-slate-400 group-hover:text-emerald-400 transition-colors">
                                  {match.format}
                                </span>
                                <span className="px-3 py-1 bg-slate-800/60 backdrop-blur-sm text-xs font-bold rounded-full text-slate-400 group-hover:text-slate-300 transition-colors">
                                  {match.venue}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {match.date ? new Date(match.date).toLocaleDateString('en-IN') : ''}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-6">
                                  <div className="flex-1 text-right">
                                    <p className="text-xl lg:text-lg font-black truncate" style={{ color: 'var(--text-primary)' }}>
                                      {match.team1Name || match.team1?.name}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 text-sm text-slate-500 mt-1">
                                      {Number(match.team1Overs || 0).toFixed(1)} ov
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="w-20 h-1 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full group-hover:from-emerald-500 group-hover:to-green-500 transition-colors"></div>
                                    <div className="text-slate-600 font-bold text-base my-2 tracking-wider uppercase">VS</div>
                                    <div className="w-20 h-1 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full group-hover:from-emerald-500 group-hover:to-green-500 transition-colors"></div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xl lg:text-lg font-black truncate text-right" style={{ color: 'var(--text-primary)' }}>
                                      {match.team2Name || match.team2?.name}
                                    </p>
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1 justify-end">
                                      {Number(match.team2Overs || 0).toFixed(1)} ov
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>

                          {/* Actions - Bottom row */}
                          <div className="flex items-center gap-3 pt-4 border-t border-slate-800/50 relative z-10 backdrop-blur-sm">
                            {/* Status dropdown */}
                            <div className="relative flex-1">
                              <button onClick={() => setStatusMenu(statusMenu === match._id ? null : match._id)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/60 hover:to-slate-600/60 backdrop-blur-sm border border-slate-700/40 text-slate-300 text-sm font-semibold transition-all shadow-sm hover:shadow-md group-hover:shadow-emerald-500/20">
                                <Clock className="w-4 h-4" /> Status
                                <ChevronRight className="w-4 h-4 ml-auto transition-transform group-hover:rotate-90" />
                              </button>
                              {statusMenu === match._id && (
                                <div className="absolute bottom-12 left-0 right-0 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl py-1 overflow-hidden z-30">
                                  {['upcoming', 'live', 'completed', 'abandoned'].map(s => (
                                    <button key={s} onClick={() => handleStatusChange(match._id, s)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-green-500/10 border-b border-slate-800/30 last:border-b-0 capitalize transition-all hover:text-emerald-400">
                                      {s.replace('_', ' ').toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Live Score */}
                            <button onClick={() => navigate(`/matches/${match._id}/score`)}
                              className="px-6 py-2.5 bg-gradient-to-r from-red-600/90 to-rose-600/90 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 active:scale-95 flex items-center gap-2 text-sm whitespace-nowrap">
                              <Zap className="w-4 h-4" /> Live Score
                            </button>

                            {/* Delete */}
                            <button onClick={() => handleDeleteMatch(match._id)}
                              className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-all shadow-sm hover:shadow-md active:scale-95">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Background shimmer */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-r from-emerald-500/20 to-green-600/20 blur-3xl animate-pulse -z-10" />
                          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-green-500/5 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl -rotate-12 transition-all duration-700" />
                          <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-tr from-slate-800/30 rounded-2xl opacity-0 group-hover:opacity-100 backdrop-blur-sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TEAMS */}
{activeTab === 'teams' && (
                <TeamManagement tournamentId={selected._id} onTeamsChange={() => {}} />
              )}


              {/* OVERLAYS */}
{activeTab === 'overlays' && (
                <OverlayManager tournamentId={selected._id} matches={matches} />
              )}


              {/* POINTS TABLE */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-7 h-7 text-yellow-400 drop-shadow-lg" />
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Points Table</h2>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.name} • {selected.format}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900/50 backdrop-blur-xl border border-slate-800/50 shadow-2xl" style={{ background: 'var(--bg-card)' }}>
                    <PointsTable tournamentId={selected._id} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close status menu on click outside */}
      {statusMenu && <div className="fixed inset-0 z-10" onClick={() => setStatusMenu(null)} />}
    </div>
  );
}
