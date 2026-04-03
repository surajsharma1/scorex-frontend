import { useState, useEffect, useCallback } from 'react';
import OverlayManager from './OverlayManager';
import MatchDetail from './MatchDetail';
import { useNavigate, useParams } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import {
  Plus, Trash2, Zap, BarChart2, Users, Trophy, LayoutGrid, CheckCircle2,
  Calendar, MapPin, ChevronRight, X, ArrowLeft, Edit3
} from 'lucide-react';
import TeamManagement from './TeamManagement';
import PointsTable from './Leaderboard'; 
import StatusBadge from './StatusBadge';
import type { Tournament, Match, Team } from './types';

interface CreateMatchForm {
  team1: string;
  team2: string;
  date: string;
  venue: string;
  format: string;
  overs: number | '';
  matchPhase: string; 
  name: string;
}

// ─── EDIT TOURNAMENT MODAL ────────────────────────────────────────────────────
function EditTournamentModal({ tournament, onClose, onUpdated }: { tournament: Tournament, onClose: () => void, onUpdated: () => void }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: tournament.name || '',
    venue: tournament.venue || '',
    startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
    endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : '',
    format: tournament.format || 'T20',
    prizePool: tournament.prizePool || 0,
    rules: tournament.rules || '',
  });

  const [sponsors, setSponsors] = useState<string[]>(tournament.sponsors || []);

  const handleAddSponsor = () => setSponsors([...sponsors, '']);
  const handleSponsorChange = (index: number, value: string) => {
    const newSponsors = [...sponsors];
    newSponsors[index] = value;
    setSponsors(newSponsors);
  };
  const handleRemoveSponsor = (index: number) => {
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validSponsors = sponsors.filter(s => s.trim() !== '');
await tournamentAPI.updateTournament(tournament._id, { ...form, sponsors: validSponsors });
      addToast({ type: 'success', message: 'Tournament updated successfully' });
      onUpdated();
    } catch (error: any) {
      addToast({ type: 'error', message: error.response?.data?.message || 'Failed to update tournament' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-primary)] rounded-3xl w-full max-w-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-card)] flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-500" /> Edit Tournament Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form id="edit-tournament-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Core Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Tournament Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Venue</label>
                <input required type="text" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Start Date</label>
                <input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Format</label>
                <select value={form.format as 'T10' | 'T20' | 'ODI' | 'Test'} onChange={e => setForm({...form, format: e.target.value as 'T10' | 'T20' | 'ODI' | 'Test'})} className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl">
                  <option value="T10">T10</option>
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                </select>
              </div>
            </div>

            {/* Sponsor Management */}
            <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)]">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest">Broadcast Sponsors</label>
                <button
                  type="button"
                  onClick={handleAddSponsor}
                  className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 hover:bg-amber-500 hover:text-white transition-colors"
                >
                  + Add Sponsor
                </button>
              </div>
              
              {sponsors.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No sponsors added. Carousel will be hidden.</p>
              ) : (
                <div className="space-y-3">
                  {sponsors.map((sponsor, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="text" 
                        value={sponsor}
                        onChange={(e) => handleSponsorChange(index, e.target.value)} 
                        placeholder="e.g., Dream11, Tata Safari" 
                        className="flex-1 p-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSponsor(index)}
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Rules / Notes</label>
              <textarea 
                value={form.rules} 
                onChange={(e) => setForm({...form, rules: e.target.value})} 
                className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl" 
                rows={3} 
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)] flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500 text-gray-200 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="edit-tournament-form" 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            Save Changes
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE MATCH MODAL ───────────────────────────────────────────────────────
function CreateMatchModal({ tournamentId, teams, onClose, onCreated }: { tournamentId: string, teams: Team[], onClose: () => void, onCreated: () => void }) {
  const { addToast } = useToast();
  const [form, setForm] = useState<CreateMatchForm>({
    team1: '',
    team2: '',
    date: '',
    venue: '',
    format: 'T20',
    overs: '',
    matchPhase: 'League',
    name: ''
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
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Overs</label>
              <input type="number" required min="1" max="100" placeholder="20" value={form.overs} onChange={e => setForm({...form, overs: parseInt(e.target.value) || ''})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Date & Time</label>
              <input type="datetime-local" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Venue</label>
              <input type="text" required value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="Match location" className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-green-500" />
            </div>
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'teams' | 'points' | 'overlays'>('overview');
  
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
  }, [id, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!selected) return <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  const isOwner = selected.organizer === (user as any)?._id || selected.organizer === (user as any)?.id || user?.role === 'admin';

  const handleDeleteTournament = async () => {
    if (!confirm('WARNING: Are you absolutely sure you want to delete this entire tournament? This action cannot be undone.')) return;
    try {
      await tournamentAPI.deleteTournament(id!);
      addToast({ type: 'success', message: 'Tournament deleted successfully' });
      navigate('/tournaments');
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to delete tournament' });
    }
  };

  const handleDeleteMatch = async (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this match?')) return;
    try {
      await matchAPI.deleteMatch(matchId);
      addToast({ type: 'success', message: 'Match deleted successfully' });
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete match' });
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-[var(--bg-primary)] relative">
      {/* Header Hero */}
      <div className="relative pt-6 pb-6 px-4 sm:px-8 border-b border-[var(--border)] overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Action Bar (Back & Delete) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <button onClick={() => navigate('/tournaments')} className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white transition-all font-bold text-sm flex items-center gap-2 shadow-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Tournaments
            </button>
            {isOwner && (
              <div className="flex gap-2">
                <button onClick={() => setShowEditModal(true)} className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all font-bold text-sm flex items-center gap-2 shadow-sm">
                  <Edit3 className="w-4 h-4" /> Edit Tournament
                </button>
                <button onClick={handleDeleteTournament} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold text-sm flex items-center gap-2 shadow-sm">
                  <Trash2 className="w-4 h-4" /> Delete Tournament
                </button>
              </div>
            )}
          </div>

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

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-4 mt-8">
            {[
              { id: 'overview', icon: LayoutGrid, label: 'Overview' },
              { id: 'matches', icon: Zap, label: 'Matches' },
              { id: 'teams', icon: Users, label: 'Teams' },
              { id: 'points', icon: Trophy, label: 'Points' },
              { id: 'overlays', icon: BarChart2, label: 'Overlays' }
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === id ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border border-transparent'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        
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
                  className="relative bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] hover:border-green-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-green-500/5">
                  
                  {isOwner && (
                    <button onClick={(e) => handleDeleteMatch(e, m._id)} 
                      className="absolute top-4 right-4 p-1.5 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex justify-between items-start mb-4 pr-8">
                    <StatusBadge status={m.status} />
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{new Date(m.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-green-400 mb-3">{m.name || 'League Match'}</h4>
                  <div className="space-y-3">
                    <p className="text-[var(--text-primary)] font-semibold">{m.team1?.shortName || m.team1?.name || 'TBD'} <span className="text-[var(--text-muted)] font-normal text-xs ml-1">vs</span></p>
                    <p className="text-[var(--text-primary)] font-semibold">{m.team2?.shortName || m.team2?.name || 'TBD'}</p>
                  </div>
                </div>
              ))}
              {matches.length === 0 && <div className="col-span-full py-12 text-center text-[var(--text-muted)]">No matches scheduled yet.</div>}
            </div>
          </div>
        )}

        {activeTab === 'teams' && <TeamManagement tournamentId={id!} onTeamsChange={loadData} />}
        {activeTab === 'points' && <PointsTable tournamentId={id!} />}
        {activeTab === 'overlays' && <OverlayManager tournamentId={id!} />}
      </div>

      {/* Floating Match Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[90vh] sm:h-[85vh] bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--bg-card)]">
              <h2 className="text-lg sm:text-2xl font-black text-[var(--text-primary)] flex items-center gap-2"><Zap className="text-green-500 w-5 h-5" /> Match Center</h2>
              <button onClick={() => setSelectedMatch(null)} className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <MatchDetail matchId={selectedMatch} onBack={() => setSelectedMatch(null)} />
            </div>
          </div>
        </div>
      )}

      {showMatchModal && <CreateMatchModal tournamentId={id!} teams={teams} onClose={() => setShowMatchModal(false)} onCreated={() => { setShowMatchModal(false); loadData(); }} />}
      {showEditModal && <EditTournamentModal tournament={selected!} onClose={() => setShowEditModal(false)} onUpdated={() => { setShowEditModal(false); loadData(); }} />}
    </div>
  );
}

