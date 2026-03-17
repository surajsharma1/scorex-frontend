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

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    live: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    ongoing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${map[status] || map['upcoming']}`}>
      {status === 'live' ? '● LIVE' : status}
    </span>
  );
};

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
  }, [selected, activeTab]);

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
<div className="w-64 sm:w-72 lg:w-80 flex flex-col flex-shrink-0" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b" style={{ borderColor: 'var(--border)' }} className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>Tournaments</h2>
          <button onClick={() => setShowCreateTournament(true)}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all shadow-glow">
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">

          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">No tournaments yet</p>
              <button onClick={() => setShowCreateTournament(true)}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold">
                + Create First Tournament
              </button>
            </div>
          ) : (
            tournaments.map(t => (
              <button key={t._id} onClick={() => { setSelected(t); setActiveTab('overview'); }}
                className={`w-full text-left p-3 rounded-xl transition-all group ${selected?._id === t._id ? 'bg-blue-600/20 border border-blue-500/40' : 'hover:bg-slate-800 border border-transparent'}`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-sm truncate ${selected?._id === t._id ? 'text-white' : 'text-slate-300'}`}>{t.name}</p>
                    <p className="text-slate-600 text-xs mt-0.5">{t.format} · {t.type?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <StatusBadge status={t.status || 'upcoming'} />
                    <button onClick={e => { e.stopPropagation(); handleDeleteTournament(t._id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
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
            <div className="border-b" style={{ borderColor: 'var(--border)' }} className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {[
                      { label: 'Teams', value: selected.teams?.length || 0, icon: Users, gradient: 'from-blue-500 to-cyan-500', glow: 'rgba(6,182,212,0.2)' },
                      { label: 'Matches', value: matches.length, icon: Activity, gradient: 'from-green-500 to-emerald-500', glow: 'rgba(34,197,94,0.2)' },
                      { label: 'Live Now', value: matches.filter((m: any) => m.status === 'live').length, icon: Zap, gradient: 'from-red-500 to-rose-500', glow: 'rgba(239,68,68,0.2)' },
                      { label: 'Completed', value: matches.filter((m: any) => m.status === 'completed').length, icon: CheckCircle, gradient: 'from-purple-500 to-violet-500', glow: 'rgba(168,85,247,0.2)' },
                    ].map(stat => (
                      <button key={stat.label} className="rounded-2xl p-4 sm:p-5 text-left transition-all group hover:-translate-y-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: `0 4px 24px ${stat.glow}` }}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl p-5 sm:p-6 lg:p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-xl sm:text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Tournament Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm lg:text-base">
                      <div className="space-y-1"><span style={{ color: 'var(--text-muted)' }}>Type</span><div style={{ color: 'var(--text-primary)' }} className="capitalize font-medium">{selected.type?.replace('_', ' ')}</div></div>
                      <div className="space-y-1"><span style={{ color: 'var(--text-muted)' }}>Format</span><div style={{ color: 'var(--text-primary)' }} className="font-medium">{selected.format}</div></div>
                      <div className="space-y-1"><span style={{ color: 'var(--text-muted)' }}>Start Date</span><div style={{ color: 'var(--text-primary)' }}>{selected.startDate ? new Date(selected.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}</div></div>
                      <div className="space-y-1"><span style={{ color: 'var(--text-muted)' }}>Venue</span><div style={{ color: 'var(--text-primary)' }}>{selected.venue || 'TBD'}</div></div>
                      {selected.prizePool > 0 && <div className="space-y-1"><span style={{ color: 'var(--text-muted)' }}>Prize Pool</span><div style={{ color: 'var(--text-primary)' }} className="font-semibold">₹{selected.prizePool.toLocaleString()}</div></div>}
                    </div>
                    {selected.rules && (
                      <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Rules</p>
                        <p className="whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{selected.rules}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* MATCHES */}
              {activeTab === 'matches' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg">Matches ({matches.length})</h2>
                    <button onClick={() => setShowCreateMatch(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all">
                      <Plus className="w-4 h-4" /> Schedule Match
                    </button>
                  </div>

                  {matches.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
                      <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500">No matches scheduled yet</p>
                      <button onClick={() => setShowCreateMatch(true)} className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold">+ Schedule First Match</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matches.map(match => (
                        <div key={match._id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all group">
                          <div className="flex items-center justify-between">
                            <button onClick={() => setSelectedMatch(match)} className="flex-1 text-left">
                              <div className="flex items-center gap-3 mb-2">
                                <StatusBadge status={match.status} />
                                <span className="text-slate-600 text-xs">{match.format} · {match.venue}</span>
                                <span className="text-slate-600 text-xs">{match.date ? new Date(match.date).toLocaleDateString('en-IN') : ''}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right flex-1">
                                  <p className="text-white font-bold">{match.team1Name || match.team1?.name}</p>
                                  {match.status !== 'upcoming' && <p className="text-slate-400 text-sm">{match.team1Score || 0}/{match.team1Wickets || 0} ({(match.team1Overs || 0).toFixed ? (match.team1Overs || 0).toFixed(1) : 0})</p>}
                                </div>
                                <div className="text-slate-600 font-bold text-sm">vs</div>
                                <div className="flex-1">
                                  <p className="text-white font-bold">{match.team2Name || match.team2?.name}</p>
                                  {match.status !== 'upcoming' && <p className="text-slate-400 text-sm">{match.team2Score || 0}/{match.team2Wickets || 0} ({(match.team2Overs || 0).toFixed ? (match.team2Overs || 0).toFixed(1) : 0})</p>}
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-2 ml-4">
                              {/* Status button */}
                              <div className="relative">
                                <button onClick={() => setStatusMenu(statusMenu === match._id ? null : match._id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-all border border-slate-700">
                                  <Clock className="w-3 h-3" /> Status
                                </button>
                                {statusMenu === match._id && (
                                  <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden w-36">
                                    {['upcoming', 'live', 'completed', 'abandoned'].map(s => (
                                      <button key={s} onClick={() => handleStatusChange(match._id, s)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 capitalize transition-colors">
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {/* Live score button */}
                              <button onClick={() => navigate(`/matches/${match._id}/score`)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 text-red-400 text-xs font-semibold transition-all">
                                <Zap className="w-3 h-3" /> Live Score
                              </button>
                              {/* Delete */}
                              <button onClick={() => handleDeleteMatch(match._id)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
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
                <div>
                  <h2 className="text-white font-bold text-lg mb-4">Points Table</h2>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-slate-400 text-sm font-semibold">{selected.name} · {selected.format}</span>
                    </div>
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
