import { useState, useEffect, useCallback } from 'react';
import OverlayManager from './OverlayManager';
import MatchDetail from './MatchDetail';
import { useNavigate, useParams } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import {
  Plus, Trash2, Zap, BarChart2, Users, Trophy, LayoutGrid, CheckCircle2,
  Calendar, MapPin, ChevronRight, X, Filter
} from 'lucide-react';
import TeamManagement from './TeamManagement';
import BracketView from './BracketView';
import PointsTable from './Leaderboard'; // Reusing leaderboard for points
import StatusBadge from './StatusBadge';
import type { Tournament, Match, Team } from './types';

interface CreateMatchForm {
  team1: string;
  team2: string;
  date: string;
  venue: string;
  format: string;
  matchPhase: string; // New field
  name: string;
}

// ─── CREATE MATCH MODAL ───────────────────────────────────────────────────────
function CreateMatchModal({ tournamentId, teams, onClose, onCreated }: { tournamentId: string, teams: Team[], onClose: () => void, onCreated: () => void }) {
  const { addToast } = useToast();
  const [form, setForm] = useState<CreateMatchForm>({
    team1: '', team2: '', date: '', venue: '', format: 'T20', matchPhase: 'League', name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.team1 === form.team2) return addToast({ type: 'error', message: 'Teams must be different' });
    setLoading(true);
    try {
      const matchName = form.name || `${form.matchPhase}: Team 1 vs Team 2`;
      await matchAPI.createMatch({ ...form, tournamentId, name: matchName });
      addToast({ type: 'success', message: 'Match scheduled' });
      onCreated();
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Error creating match' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Schedule Match</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Team 1</label>
              <select required value={form.team1} onChange={e => setForm({...form, team1: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500">
                <option value="">Select Team 1</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Team 2</label>
              <select required value={form.team2} onChange={e => setForm({...form, team2: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500">
                <option value="">Select Team 2</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Match Phase</label>
              <select value={form.matchPhase} onChange={e => setForm({...form, matchPhase: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500">
                <option value="League">League Match</option>
                <option value="Quarter Final">Quarter Final</option>
                <option value="Semi Final">Semi Final</option>
                <option value="Final">Final</option>
                <option value="Custom">Custom Phase</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Date & Time</label>
              <input type="datetime-local" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Venue</label>
            <input type="text" required value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="Match location" className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-green-500/20 disabled:opacity-50">
            {loading ? 'Scheduling...' : 'Create Match'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN TOURNAMENT VIEW ──────────────────────────────────────────────────────
export default function TournamentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'teams' | 'brackets' | 'points' | 'overlays'>('overview');
  
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [tRes, mRes, tmRes] = await Promise.all([
        tournamentAPI.getTournament(id),
        tournamentAPI.getTournamentMatches(id),
        teamAPI.getTeams(id)
      ]);
      setSelected(tRes.data.data || tRes.data);
      setMatches(mRes.data.data || []);
      setTeams(tmRes.data.data || []);
    } catch (e: any) {
      addToast({ type: 'error', message: 'Error loading tournament data' });
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!selected) return <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  const isOwner = selected.organizer === user?.id || selected.organizer === user?._id || user?.role === 'admin';

  return (
    <div className="min-h-screen pb-20 bg-[var(--bg-primary)]">
      {/* Header Hero */}
      <div className="relative pt-12 pb-6 px-4 sm:px-8 border-b border-[var(--border)] overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={selected.status} />
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase border border-[var(--border)]">{selected.type.replace('_', ' ')}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] mb-2">{selected.name}</h1>
              <p className="text-sm sm:text-base text-[var(--text-muted)] flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {selected.venue || 'Location TBA'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Scrollable on mobile) */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-4 mt-8">
            {[
              { id: 'overview', icon: LayoutGrid, label: 'Overview' },
              { id: 'matches', icon: Zap, label: 'Matches' },
              { id: 'teams', icon: Users, label: 'Teams' },
              { id: 'brackets', icon: Filter, label: 'Brackets' },
              { id: 'points', icon: Trophy, label: 'Points' },
              { id: 'overlays', icon: BarChart2, label: 'Overlays' }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border border-transparent'}`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Tab Content Routing */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border)]">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Description</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{selected.description || 'No description provided.'}</p>
            </div>
            <div className="space-y-4">
              <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><Calendar className="w-6 h-6" /></div>
                <div><p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Start Date</p><p className="font-bold text-[var(--text-primary)]">{new Date(selected.startDate).toLocaleDateString()}</p></div>
              </div>
              <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><Trophy className="w-6 h-6" /></div>
                <div><p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Format</p><p className="font-bold text-[var(--text-primary)]">{selected.format}</p></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            {isOwner && (
              <button onClick={() => setShowMatchModal(true)} className="mb-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all">
                <Plus className="w-5 h-5" /> Schedule Match
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map(m => (
                <div key={m._id} onClick={() => setSelectedMatch(m._id)} 
                  className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] hover:border-green-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-green-500/5">
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={m.status} />
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{new Date(m.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-green-400 mb-3">{m.name || 'League Match'}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="font-bold text-[var(--text-primary)]">{m.team1.shortName || m.team1.name}</span><span className="font-mono text-[var(--text-secondary)]">{m.team1Score || 0}/{m.team1Wickets || 0}</span></div>
                    <div className="flex justify-between items-center"><span className="font-bold text-[var(--text-primary)]">{m.team2.shortName || m.team2.name}</span><span className="font-mono text-[var(--text-secondary)]">{m.team2Score || 0}/{m.team2Wickets || 0}</span></div>
                  </div>
                </div>
              ))}
              {matches.length === 0 && <div className="col-span-full py-12 text-center text-[var(--text-muted)]">No matches scheduled yet.</div>}
            </div>
          </div>
        )}

        {activeTab === 'teams' && <TeamManagement tournamentId={id} onTeamsChange={loadData} />}
        {activeTab === 'brackets' && <BracketView />}
        {activeTab === 'points' && <PointsTable />}
        {activeTab === 'overlays' && <OverlayManager tournamentId={id} matches={matches} />}
      </div>

      {/* Floating Responsive Match Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[90vh] sm:h-[85vh] bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--bg-card)]">
              <h2 className="text-lg sm:text-2xl font-black text-[var(--text-primary)] flex items-center gap-2"><Zap className="text-green-500 w-5 h-5" /> Match Center</h2>
              <button onClick={() => setSelectedMatch(null)} className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <MatchDetail matchId={selectedMatch} onBack={() => setSelectedMatch(null)} openScoreboard={() => navigate(`/matches/${selectedMatch}/score`)} />
            </div>
          </div>
        </div>
      )}

      {showMatchModal && <CreateMatchModal tournamentId={id!} teams={teams} onClose={() => setShowMatchModal(false)} onCreated={() => { setShowMatchModal(false); loadData(); }} />}
    </div>
  );
}