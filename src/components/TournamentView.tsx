import { useState, useEffect, useCallback } from 'react';
import OverlayManager from './OverlayManager';
import MatchDetail from './MatchDetail';
import { useNavigate, useParams } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { useAuth } from '../App';
import {
  Plus, Trash2, Zap, BarChart2, Users, Trophy, Shield, CheckCircle2,
  Calendar, MapPin, ChevronRight, X, ChevronDown, Clock,
} from 'lucide-react';
import TeamManagement from './TeamManagement';
import StatusBadge from './StatusBadge';
import type { Tournament, Match, Team } from './types';

interface CreateTournamentForm {
  name: string;
  type: 'round_robin' | 'knockout' | 'league';
  format: string;
  startDate: string;
  venue: string;
  prizePool: string;
  rules: string;
}

interface CreateMatchForm {
  team1: string;
  team2: string;
  date: string;
  venue: string;
  format: string;
  name: string;
  maxOvers?: number;
}

// ─── CREATE TOURNAMENT MODAL ──────────────────────────────────────────────────
function CreateTournamentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateTournamentForm>({
    name: '', type: 'round_robin', format: 'T20',
    startDate: '', venue: '', prizePool: '', rules: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
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
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="rounded-2xl p-6 w-full max-w-md relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>New Tournament</h2>
          <button onClick={onClose} className="transition-colors hover:text-red-400" style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. IPL Season 1"
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Venue</label>
            <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required placeholder="e.g. Wankhede Stadium"
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CreateTournamentForm['type'] })}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                <option value="round_robin">Round Robin</option>
                <option value="knockout">Knockout</option>
                <option value="league">League</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Format</label>
              <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                <option value="T10">T10</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Prize Pool (₹)</label>
            <input type="number" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} placeholder="0"
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Rules (optional)</label>
            <textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={2} placeholder="Tournament rules..."
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 disabled:opacity-40 font-bold rounded-xl transition-all shadow-lg hover:scale-105 mt-4"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
            {loading ? 'Creating...' : 'Create Tournament'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── CREATE MATCH MODAL ───────────────────────────────────────────────────────
function CreateMatchModal({ tournamentId, teams, onClose, onCreated }: { tournamentId: string; teams: Team[]; onClose: () => void; onCreated: () => void; }) {
  const [form, setForm] = useState<CreateMatchForm>({
    team1: '', team2: '', date: '', venue: '', format: 'T20', name: '', maxOvers: 20
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.team1 === form.team2) {
      setError('Teams must be different');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await matchAPI.createMatch({
        ...form,
        tournamentId,
        date: new Date(form.date).toISOString(),
        maxOvers: form.format === 'Custom' ? form.maxOvers : undefined
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="rounded-2xl p-6 w-full max-w-md relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Schedule Match</h2>
          <button onClick={onClose} className="transition-colors hover:text-red-400" style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['team1', 'team2'] as const).map((field, i) => (
              <div key={field}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Team {i + 1}</label>
                <select value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                  <option value="">Select Team</option>
                  {teams.map((tm) => (
                    <option key={tm._id} value={tm._id}>{tm.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Date & Time</label>
            <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Format</label>
              <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all mb-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                <option value="T10">T10</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
                <option value="Custom">Custom Overs</option>
              </select>

              {form.format === 'Custom' && (
                <div>
                  <label className="text-xs font-semibold mb-1 block text-green-400">Number of Overs</label>
                  <input type="number" min="1" max="999" value={form.maxOvers} onChange={(e) => setForm({ ...form, maxOvers: Number(e.target.value) })}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Venue</label>
              <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Home Ground"
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 disabled:opacity-40 font-bold rounded-xl transition-all shadow-lg hover:scale-105 mt-4"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
            {loading ? 'Scheduling...' : 'Schedule Match'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── POINTS TABLE ─────────────────────────────────────────────────────────────
function PointsTable({ tournamentId }: { tournamentId: string }) {
  interface PointsTableRow {
    _id: string;
    name: string;
    shortName: string;
    played: number;
    won: number;
    lost: number;
    tied: number;
    nr: number;
    nrr: number;
    points: number;
  }

  const [table, setTable] = useState<PointsTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const r = await tournamentAPI.getPointsTable?.(tournamentId) ?? [];
        const tableData = Array.isArray(r) ? r : (r?.data?.data && Array.isArray(r.data.data) ? r.data.data : []);
        setTable(tableData);
      } catch {
        setTable([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTable();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <th className="text-left py-4 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>#</th>
            <th className="text-left py-4 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Team</th>
            <th className="text-center py-4 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>P</th>
            <th className="text-center py-4 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>W</th>
            <th className="text-center py-4 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>L</th>
            <th className="text-center py-4 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>T/NR</th>
            <th className="text-center py-4 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>NRR</th>
            <th className="text-center py-4 px-2 font-black text-green-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row: any, idx: number) => (
            <tr key={row._id} className="transition-colors hover:bg-white/5" 
                style={{ borderBottom: '1px solid var(--border)', background: idx === 0 ? 'rgba(34,197,94,0.05)' : 'transparent' }}>
              <td className="py-4 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  {idx === 0 && <span className="text-amber-400">👑</span>}
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.shortName}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-2 text-center" style={{ color: 'var(--text-secondary)' }}>{row.played}</td>
              <td className="py-4 px-2 text-center text-green-400 font-semibold">{row.won}</td>
              <td className="py-4 px-2 text-center text-red-400">{row.lost}</td>
              <td className="py-4 px-2 text-center" style={{ color: 'var(--text-muted)' }}>
                {(row.tied ?? 0) + (row.nr ?? 0)}
              </td>
              <td className={`py-4 px-2 text-center font-mono text-xs font-bold ${row.nrr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {((row.nrr ?? 0) >= 0 ? '+' : '') + ((row.nrr ?? 0)?.toFixed(2) ?? '0.00')}
              </td>
              <td className="py-4 px-2 text-center font-black text-lg text-green-400">
                {row.points}
              </td>
            </tr>
          ))}
          {table.length === 0 && (
            <tr>
              <td colSpan={8} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                No matches completed yet
              </td>
            </tr>
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

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'teams' | 'overlays' | 'leaderboard'>('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);

  const [statusMenu, setStatusMenu] = useState<string | null>(null);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  // Load user's tournaments
  const loadTournaments = useCallback(async () => {
    try {
      const res = await (tournamentAPI.getMyTournaments?.() ?? tournamentAPI.getTournaments());
      const list = res.data?.data ?? res.data?.tournaments ?? [];

      setTournaments(list);
      if (paramId) {
        const found = list.find((t: Tournament) => t._id === paramId);
        if (found) setSelected(found);
      } else if (list.length > 0 && !selected) {
        setSelected(list[0]);
      }
    } catch (e) {
      console.error('Failed to load tournaments', e);
    } finally {
      setLoading(false);
    }
  }, [paramId, selected]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  // Load tournament details
  useEffect(() => {
    if (!selected?._id) return;
    const loadDetails = async () => {
      try {
        const [matchRes, teamRes] = await Promise.all([
          matchAPI.getMatches({ tournament: selected._id, limit: 100 }),
          teamAPI.getTeams(selected._id),
        ]);
        setMatches(matchRes.data.data || []);
        setTeams(teamRes.data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadDetails();
  }, [selected?._id]);

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Delete this match?')) return;
    try {
      await matchAPI.deleteMatch(matchId);
      setMatches((prev) => prev.filter((m) => m._id !== matchId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (matchId: string, status: string) => {
    try {
      await matchAPI.updateStatus(matchId, status);
      setMatches((prev) => prev.map((m) => (m._id === matchId ? { ...m, status: status as Match['status'] } : m)));
      setStatusMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm('Delete this tournament? This cannot be undone and will delete all matches.')) return;
    try {
      await tournamentAPI.deleteTournament(id);
      setTournaments((prev) => prev.filter((t) => t._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && tournaments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} />
      </div>
    );
  }

  const tabs = ['overview', 'matches', 'teams', 'overlays', 'leaderboard'] as const;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background Orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      {/* Tournament Selector Overlay Slide-Out */}
      {showTournamentSelector && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowTournamentSelector(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full md:w-96 shadow-2xl transform transition-all" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Tournaments</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowCreateTournament(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <Plus className="w-4 h-4" /> Create
                </button>
                <button onClick={() => setShowTournamentSelector(false)} className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-140px)] space-y-3">
              {tournaments.map((t) => (
                <button key={t._id} onClick={() => { setSelected(t); setShowTournamentSelector(false); }}
                  className="w-full p-4 rounded-xl transition-all flex items-center gap-4 text-left"
                  style={selected?._id === t._id 
                    ? { background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', boxShadow: '0 0 15px rgba(34,197,94,0.1)' }
                    : { background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                    <Trophy className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.format} • {t.type?.replace('_', ' ')}</p>
                  </div>
                  <StatusBadge status={t.status || 'upcoming' as const} className="text-xs" />
                </button>
              ))}
              {tournaments.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-25" />
                  <p className="text-lg mb-4">No tournaments yet</p>
                  <button onClick={() => setShowCreateTournament(true)}
                    className="w-full py-3 font-bold rounded-xl transition-all shadow-xl hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
                    <Plus className="w-5 h-5 inline mr-2" /> Create First Tournament
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showCreateTournament && <CreateTournamentModal onClose={() => setShowCreateTournament(false)} onCreated={loadTournaments} />}
      {showCreateMatch && selected && (
        <CreateMatchModal tournamentId={selected._id} teams={teams} onClose={() => setShowCreateMatch(false)}
          onCreated={async () => {
            const res = await matchAPI.getMatches({ tournament: selected._id, limit: 100 });
            setMatches(res.data?.data || []);
          }} />
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10">
        {!selected ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-20">
            <Trophy className="w-20 h-20 mb-6 opacity-20" style={{ color: 'var(--text-primary)' }} />
            <h1 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
              Select a Tournament
            </h1>
            <p className="text-xl mb-8 max-w-md" style={{ color: 'var(--text-muted)' }}>
              Choose from your tournaments or create a new one
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowCreateTournament(true)}
                className="px-8 py-4 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all text-lg"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
                <Plus className="w-6 h-6 inline mr-2" /> Create New
              </button>
              <button onClick={() => setShowTournamentSelector(true)}
                className="px-8 py-4 font-bold rounded-2xl transition-all text-lg"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                My Tournaments
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Header & Solid Green Select Button */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
               <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                 {/* Solid Green "Select Tournament" Button */}
                 <button onClick={() => setShowTournamentSelector(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg w-full sm:w-auto hover:scale-105 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
                    Select Tournament <ChevronDown className="w-4 h-4" />
                 </button>
                 
                 <div className="flex-1 min-w-0 md:ml-2">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600 hidden md:block" />
                      <h1 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                        {selected.name}
                      </h1>
                    </div>
                 </div>
               </div>

               <div className="flex flex-wrap items-center gap-3 text-sm shrink-0">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <Calendar className="w-4 h-4 opacity-70" /> {selected.startDate ? new Date(selected.startDate).toLocaleDateString('en-IN') : 'TBD'}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <MapPin className="w-4 h-4 opacity-70" /> {selected.venue || 'TBD'}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <Shield className="w-4 h-4 opacity-70" /> {selected.format}
                  </div>
                  <StatusBadge status={selected.status || 'upcoming'} />
                  <button onClick={() => handleDeleteTournament(selected._id)}
                    className="p-2 rounded-xl transition-all hover:bg-red-500/20 text-red-400" title="Delete Tournament">
                    <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* Admin-Style Scrollable Tabs */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-1 p-1 rounded-2xl w-full scrollbar-hide md:scrollbar-thin [&::-webkit-scrollbar]:hidden" 
                 style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {tabs.map((tab) => {
                const Icon = tab === 'overview' ? Trophy : tab === 'matches' ? Zap : tab === 'teams' ? Users : BarChart2;
                const label = tab === 'leaderboard' ? 'Points' : tab.slice(0, 1).toUpperCase() + tab.slice(1);
                const isActive = activeTab === tab;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap snap-center shrink-0 md:flex-none"
                    style={isActive
                      ? { background: 'linear-gradient(135deg, var(--accent), #10b981)', color: 'white', boxShadow: '0 0 20px rgba(34,197,94,0.4)' }
                      : { color: 'var(--text-secondary)' }}>
                    <Icon className="w-5 h-5 flex-shrink-0" /> {label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content Area */}
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Teams', value: selected.teams?.length || 0, icon: Users },
                    { label: 'Matches', value: matches.length, icon: Zap },
                    { label: 'Live', value: matches.filter((m) => m.status === 'live').length, icon: Zap },
                    { label: 'Completed', value: matches.filter((m) => m.status === 'completed').length, icon: CheckCircle2 }
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2"
                         style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                           style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <Icon className="w-7 h-7 text-green-400" />
                      </div>
                      <p className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'matches' && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Matches ({matches.length})</h2>
                      <p style={{ color: 'var(--text-muted)' }}>Manage scheduled matches</p>
                    </div>
                    <button onClick={() => setShowCreateMatch(true)}
                      className="px-8 py-3 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all self-start sm:self-auto whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
                      <Plus className="w-5 h-5 inline mr-2" /> Schedule Match
                    </button>
                  </div>
                  {matches.length === 0 ? (
                    <div className="text-center py-20 rounded-3xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <Zap className="w-20 h-20 mx-auto mb-6 opacity-20" style={{ color: 'var(--text-primary)' }} />
                      <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>No Matches Yet</h3>
                      <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>Schedule your first match to get started with live scoring and overlays.</p>
                      <button onClick={() => setShowCreateMatch(true)}
                        className="px-6 py-3 font-bold rounded-xl shadow-xl hover:scale-105 transition-all"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
                        <Plus className="w-6 h-6 inline mr-2" /> Schedule First Match
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {matches.map((match) => (
                        <div key={match._id} className="group relative rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
                             style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <StatusBadge status={match.status} className="!absolute top-6 right-6 z-20" />
                          
                          <button onClick={() => handleDeleteMatch(match._id)}
                            className="absolute top-6 left-6 flex items-center justify-center w-12 h-12 rounded-2xl transition-all opacity-0 group-hover:opacity-100 z-20 hover:scale-105"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                            <Trash2 className="w-5 h-5" />
                          </button>
                          
                          <h3 className="font-black text-xl mb-6 pr-14 line-clamp-2 z-10 relative text-center" style={{ color: 'var(--text-primary)' }}>
                            {match.name || `${match.team1Name || 'Team 1'} vs ${match.team2Name || 'Team 2'}`}
                          </h3>
                          
                          <div className="space-y-4 mb-6 z-10 relative">
                            <div className="flex items-center gap-4 justify-between">
                              <div className="flex-1 text-right">
                                <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{match.team1Name || match.team1?.name}</p>
                                <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{Number(match.team1Overs || 0).toFixed(1)} ov</div>
                              </div>
                              <div className="text-center px-4">
                                <div className="text-green-400 font-black text-lg uppercase tracking-widest">VS</div>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{match.team2Name || match.team2?.name}</p>
                                <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{Number(match.team2Overs || 0).toFixed(1)} ov</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 pt-4 z-10 relative" style={{ borderTop: '1px solid var(--border)' }}>
                            <div className="flex-1 relative">
                              <button onClick={() => setStatusMenu(statusMenu === match._id ? null : match._id)}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                <Clock className="w-4 h-4" /> {match.status.toUpperCase()} <ChevronRight className="w-4 h-4 ml-auto" />
                              </button>
                              {statusMenu === match._id && (
                                <div className="absolute top-full mt-2 left-0 right-0 rounded-2xl shadow-2xl py-1 z-30"
                                     style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                  {(['upcoming', 'live', 'completed', 'abandoned'] as const).map((s) => (
                                    <button key={s} onClick={() => handleStatusChange(match._id, s)}
                                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors text-sm"
                                      style={{ color: s === match.status ? '#4ade80' : 'var(--text-primary)', fontWeight: s === match.status ? 'bold' : 'normal' }}>
                                      {s.replace('_', ' ').toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={() => setSelectedMatch(match._id)}
                              className="px-8 py-3 font-bold rounded-xl transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap ml-auto"
                              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} title="View Match Details">
                              View Details <ChevronRight className="w-4 h-4 text-green-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'teams' && <TeamManagement tournamentId={selected._id} onTeamsChange={() => {}} />}
              {activeTab === 'overlays' && selected && <OverlayManager tournamentId={selected._id} />}
              {activeTab === 'leaderboard' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-6 h-6 text-green-400" />
                    <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Points Table</p>
                  </div>
                  <PointsTable tournamentId={selected._id} />
                </div>
              )}
            </div>
              
{statusMenu && <div className="fixed inset-0 z-30" onClick={() => setStatusMenu(null)} />}
            
            {/* Match Details Overlay Modal */}
{selectedMatch && (
  <>
    {/* Match Details Backdrop */}
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[59]" 
      onClick={() => setSelectedMatch(null)}
    />
    
    {/* Match Details Top Floating Modal */}
    <div className="fixed inset-0 z-[60] flex items-start pt-24 p-4 justify-center">
      <div className="w-full max-w-4xl max-h-[85vh] mx-auto bg-[var(--bg-card)] rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden animate-in slide-in-from-top-4 duration-300 fade-in zoom-in-95">
        <MatchDetail 
          matchId={selectedMatch} 
          onBack={() => setSelectedMatch(null)} 
          openScoreboard={() => {}}
        />
      </div>
    </div>
  </>
)}

          </div>
        )}
      </div>
    </div>
  );
}
