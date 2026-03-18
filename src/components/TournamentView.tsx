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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">New Tournament</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
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
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. IPL Season 1"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Venue</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              required
              placeholder="e.g. Wankhede Stadium"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CreateTournamentForm['type'] })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="round_robin">Round Robin</option>
                <option value="knockout">Knockout</option>
                <option value="league">League</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Format</label>
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="T10">T10</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Prize Pool (₹)</label>
            <input
              type="number"
              value={form.prizePool}
              onChange={(e) => setForm({ ...form, prizePool: e.target.value })}
              placeholder="0"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Rules (optional)</label>
            <textarea
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
              rows={2}
              placeholder="Tournament rules..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all"
          >
            {loading ? 'Creating...' : 'Create Tournament'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── CREATE MATCH MODAL ───────────────────────────────────────────────────────
function CreateMatchModal({
  tournamentId,
  teams,
  onClose,
  onCreated,
}: {
  tournamentId: string;
  teams: Team[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateMatchForm>({
    team1: '', team2: '', date: '', venue: '', format: 'T20', name: ''
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
        date: new Date(form.date).toISOString()
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Schedule Match</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
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
                <label className="text-slate-400 text-xs font-semibold mb-1 block">
                  Team {i + 1}
                </label>
                <select
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Team</option>
                  {teams.map((tm) => (
                    <option key={tm._id} value={tm._id}>
                      {tm.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold mb-1 block">Date & Time</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Format</label>
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="T10">T10</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1 block">Venue</label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g. Home Ground"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all"
          >
            {loading ? 'Scheduling...' : 'Schedule Match'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── POINTS TABLE ─────────────────────────────────────────────────────────────
function PointsTable({ tournamentId }: { tournamentId: string }) {
  const [table, setTable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentAPI
      .getPointsTable(tournamentId)
      .then((r) => setTable(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-4 px-4 font-semibold text-slate-300">#</th>
            <th className="text-left py-4 px-4 font-semibold text-slate-300">Team</th>
            <th className="text-center py-4 px-2 font-semibold text-slate-300">P</th>
            <th className="text-center py-4 px-2 font-semibold text-slate-300">W</th>
            <th className="text-center py-4 px-2 font-semibold text-slate-300">L</th>
            <th className="text-center py-4 px-2 font-semibold text-slate-300">T/NR</th>
            <th className="text-center py-4 px-2 font-semibold text-slate-300">NRR</th>
            <th className="text-center py-4 px-2 font-bold text-blue-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row: any, idx: number) => (
            <tr
              key={row._id}
              className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                idx === 0 ? 'bg-yellow-500/10' : ''
              }`}
            >
              <td className="py-4 px-4 text-slate-400 font-semibold">{idx + 1}</td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  {idx === 0 && <span className="text-yellow-400">👑</span>}
                  <div>
                    <div className="text-white font-semibold">{row.name}</div>
                    <div className="text-slate-500 text-xs">{row.shortName}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-2 text-center text-slate-400">{row.played}</td>
              <td className="py-4 px-2 text-center text-emerald-400 font-semibold">{row.won}</td>
              <td className="py-4 px-2 text-center text-red-400">{row.lost}</td>
              <td className="py-4 px-2 text-center text-slate-400">
                {row.tied + row.nr}
              </td>
              <td
                className={`py-4 px-2 text-center font-mono text-xs ${
                  row.nrr >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {row.nrr >= 0 ? '+' : ''}{row.nrr?.toFixed(2)}
              </td>
              <td className="py-4 px-2 text-center text-blue-400 font-black text-lg">
                {row.points}
              </td>
            </tr>
          ))}
          {table.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="py-12 text-center text-slate-500"
              >
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'matches' | 'teams' | 'overlays' | 'leaderboard'
  >('overview');
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
      let res;
      if (tournamentAPI.getMyTournaments) {
        res = await tournamentAPI.getMyTournaments();
      } else {
        res = await tournamentAPI.getTournaments();
      }
      const list = res.data.data || res.data.tournaments || [];
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
      setMatches((prev) =>
        prev.map((m) => (m._id === matchId ? { ...m, status: status as Match['status'] } : m))
      );
      setStatusMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (
      !confirm(
        'Delete this tournament? This cannot be undone and will delete all matches.'
      )
    )
      return;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    'overview',
    'matches',
    'teams',
    'overlays',
    'leaderboard',
  ] as const;

  return (
    <div className="min-h-screen text-white" style={{ background: 'var(--bg-primary)' }}>

      {/* Tournament Selector Overlay */}
{showTournamentSelector && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowTournamentSelector(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-all">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Tournaments</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateTournament(true)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-500/40 text-emerald-300 transition-all text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </button>
                <button
                  onClick={() => setShowTournamentSelector(false)}
                  className="p-2 rounded-xl hover:bg-slate-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-140px)] space-y-3">
              {tournaments.map((t) => (
                <button
                  key={t._id}
                  onClick={() => {
                    setSelected(t);
                    setShowTournamentSelector(false);
                  }}
                  className={`w-full p-4 rounded-xl transition-all flex items-center gap-4 ${
                    selected?._id === t._id
                      ? 'bg-blue-500/20 border-2 border-blue-500 shadow-lg shadow-blue-500/25'
                      : 'hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{t.name}</p>
                    <p className="text-sm text-slate-400">
                      {t.format} • {t.type?.replace('_', ' ')}
                    </p>
                  </div>
                  <StatusBadge status={t.status || 'upcoming' as const} className="text-xs" />
                </button>
              ))}
              {tournaments.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-25" />
                  <p className="text-lg mb-4">No tournaments yet</p>
                  <button
                    onClick={() => setShowCreateTournament(true)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    Create First Tournament
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showCreateTournament && (
        <CreateTournamentModal
          onClose={() => setShowCreateTournament(false)}
          onCreated={loadTournaments}
        />
      )}
      {showCreateMatch && selected && (
        <CreateMatchModal
          tournamentId={selected._id}
          teams={teams}
          onClose={() => setShowCreateMatch(false)}
            onCreated={async () => {
              const res = await matchAPI.getMatches({
                tournament: selected._id,
                limit: 100,
              });
              setMatches(res.data?.data || []);
            }}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {!selected ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-20">
            <Trophy className="w-20 h-20 text-slate-500 mb-6 opacity-50" />
            <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-slate-300 to-slate-100 bg-clip-text text-transparent">
              Select a Tournament
            </h1>
            <p className="text-xl text-slate-500 mb-8 max-w-md">
              Choose from your tournaments or create a new one
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateTournament(true)}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all text-lg"
              >
                <Plus className="w-6 h-6 inline mr-2" />
                Create New
              </button>
              <button
                onClick={() => setShowTournamentSelector(true)}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-2xl transition-all text-lg"
              >
                My Tournaments
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tournament Header */}
            <div className="rounded-3xl p-6 md:p-8" style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)' }}> 

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                  <button
                    onClick={() => setShowTournamentSelector(true)}
                    className="group hover:bg-slate-800/70 transition-all rounded-2xl p-4 border border-slate-700 hover:border-blue-500/50"
                    style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}

                  >
                      <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>

                          Select Tournament
                          {selected?.name && (
                            <>
                              <span className="text-slate-400 font-normal text-sm">• {selected.name}</span>
                            </>
                          )}
                        </p>
                        {selected?.format && (
                          <p className="text-sm text-slate-400">
                            {selected.format}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                      {selected.name}
                    </h1>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <Calendar className="w-4 h-4" />
                    {selected.startDate
                      ? new Date(selected.startDate).toLocaleDateString('en-IN')
                      : 'TBD'}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <MapPin className="w-4 h-4" />
                    {selected.venue || 'TBD'}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <Shield className="w-4 h-4" />
                    {selected.format}
                  </div>
                  <StatusBadge status={selected.status || 'upcoming'} />
                  <button
                    onClick={() => handleDeleteTournament(selected._id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all"
                    title="Delete Tournament"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex flex-wrap gap-2 -mx-2 px-2 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>

                {tabs.map((tab) => {
                  const Icon =
                    tab === 'overview'
                      ? Trophy
                      : tab === 'matches'
                      ? Zap
                      : tab === 'teams'
                      ? Users
                      : BarChart2;
                  const label =
                    tab === 'leaderboard' ? 'Points' : tab.slice(0, 1).toUpperCase() + tab.slice(1);
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/25'
                          : 'bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </button>
                  );
                })}
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: 'Teams',
                      value: selected.teams?.length || 0,
                      icon: Users,
                      color: 'from-blue-500 to-cyan-500',
                    },
                    {
                      label: 'Matches',
                      value: matches.length,
                      icon: Zap,
                      color: 'from-emerald-500 to-green-500',
                    },
                    {
                      label: 'Live',
                      value: matches.filter((m) => m.status === 'live').length,
                      icon: Zap,
                      color: 'from-orange-500 to-red-500',
                    },
                    {
                      label: 'Completed',
                      value: matches.filter((m) => m.status === 'completed').length,
                      icon: CheckCircle2,
                      color: 'from-purple-500 to-violet-500',
                    },
                  ].map(({ label, value, icon: Icon, color }, i) => (
                    <div
                      key={label}
                      className="group relative overflow-hidden rounded-3xl p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 hover:border-blue-500/50"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 blur-xl`}
                      />
                      <div
                        className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-slate-400 text-sm font-semibold uppercase tracking-wide mb-1">
                        {label}
                      </p>
                      <p className="text-3xl font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'matches' && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black">Matches ({matches.length})</h2>
                      <p className="text-slate-400">Manage scheduled matches</p>
                    </div>
                    <button
                      onClick={() => setShowCreateMatch(true)}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all self-start sm:self-auto whitespace-nowrap"
                    >
                      <Plus className="w-5 h-5 inline mr-2" />
                      Schedule Match
                    </button>
                  </div>
                  {matches.length === 0 ? (
                    <div className="text-center py-20">
                      <Zap className="w-20 h-20 text-slate-500 mx-auto mb-6 opacity-50" />
                      <h3 className="text-2xl font-bold mb-4 text-slate-300">No Matches Yet</h3>
                      <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Schedule your first match to get started with live scoring and overlays.
                      </p>
                      <button
                        onClick={() => setShowCreateMatch(true)}
                        className="px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all text-lg"
                      >
                        <Plus className="w-6 h-6 inline mr-2" />
                        Schedule First Match
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">

                      {matches.map((match) => (
                        <div
                          key={match._id}
                          className="group rounded-2xl p-4 transition-all hover:-translate-y-1 snap-center shadow-lg hover:shadow-xl"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}

                        >
                          {/* Status Badge */}
                  <StatusBadge
                            status={match.status}
                            className="!absolute top-6 right-6 !shadow-2xl !shadow-black/50 z-20"
                          />
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteMatch(match._id)}
                            className="absolute top-6 left-6 flex items-center justify-center w-12 h-12 bg-red-500/20 hover:bg-red-500/40 border-2 border-red-500/40 text-red-400 hover:text-red-300 font-semibold shadow-lg hover:shadow-xl transition-all rounded-2xl opacity-0 group-hover:opacity-100 z-20"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>

                          {/* Match Info */}
                          <h3 className="font-black text-xl mb-6 pr-14 line-clamp-2 z-10 relative">
                            {match.name ||
                              `${match.team1Name || 'Team 1'} vs ${match.team2Name || 'Team 2'}`}
                          </h3>

                          {/* Teams */}
                          <div className="space-y-4 mb-6 z-10 relative">
                            <div className="flex items-center gap-4">
                              <div className="flex-1 text-right">
                                <p className="text-lg font-black">
                                  {match.team1Name || match.team1?.name}
                                </p>
                                <div className="flex items-center justify-end gap-2 text-sm text-slate-400 mt-1">
                                  <span>{Number(match.team1Overs || 0).toFixed(1)} ov</span>
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="w-20 h-1 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full mb-3 group-hover:from-blue-500 group-hover:to-blue-400 transition-colors"></div>
                                <div className="text-slate-500 font-bold text-base uppercase tracking-wider mb-3">
                                  VS
                                </div>
                                <div className="w-20 h-1 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full group-hover:from-blue-500 group-hover:to-blue-400 transition-colors"></div>
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-black text-left">
                                  {match.team2Name || match.team2?.name}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                  <span>{Number(match.team2Overs || 0).toFixed(1)} ov</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 pt-4 border-t border-slate-800 z-10 relative">
                            <div className="flex-1 relative">
                              <button
                                onClick={() =>
                                  setStatusMenu(
                                    statusMenu === match._id ? null : match._id
                                  )
                                }
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                              >
                                <Clock className="w-4 h-4" />
                                {match.status.toUpperCase()}
                                <ChevronRight className="w-4 h-4 ml-auto transition-transform" />
                              </button>
                              {statusMenu === match._id && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl py-1 z-30">
                                  {(['upcoming', 'live', 'completed', 'abandoned'] as const).map(
                                    (s) => (
                                      <button
                                        key={s}
                                        onClick={() => handleStatusChange(match._id, s)}
                                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-blue-500/20 border-b border-slate-800 last:border-b-0 capitalize transition-all hover:text-blue-300"
                                      >
                                        {s.replace('_', ' ').toUpperCase()}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
<button
                              onClick={() => setSelectedMatch(match._id)}
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => navigate(`/matches/${match._id}/score`)}
                              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                            >
                              Live Score
                            </button>
                          </div>

                          {/* Background Effects */}
                          <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br from-blue-500/20 to-blue-600/20 blur-xl -z-10" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'teams' && (
                <TeamManagement tournamentId={selected._id} onTeamsChange={() => {}} />
              )}

              {activeTab === 'overlays' && selected && (
                <OverlayManager tournamentId={selected._id} />
              )}

              {activeTab === 'leaderboard' && (
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
                    <div>
                      <h2 className="text-3xl font-black">Points Table</h2>
                      <p className="text-slate-400">
                        {selected.name} • {selected.format}
                      </p>
                    </div>
                  </div>
                  <PointsTable tournamentId={selected._id} />
                </div>
              )}
            </div>
          </div>

          {/* Status Menu Backdrop */}
            {statusMenu && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => setStatusMenu(null)}
            />
          )}
          {selectedMatch && (
            <MatchDetail 
              matchId={selectedMatch} 
              onBack={() => setSelectedMatch(null)} 
              openScoreboard={() => {
                navigate(`/matches/${selectedMatch}/score`);
                setSelectedMatch(null);
              }} 
            />
          )}
        </div>
      )}
    </div>
  </div>
  );
}



