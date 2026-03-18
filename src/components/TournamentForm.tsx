import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, teamAPI } from '../services/api';
import { Team } from './types';
import { Calendar, Trophy, Users, CheckCircle, Lock } from 'lucide-react';

export default function TournamentForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',    
    startDate: '',
    endDate: '',
    format: 'T20',
    selectedTeams: [] as string[],
  });
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamAPI.getTeams();
        setAvailableTeams(res.data?.data || res.data?.teams || res.data || []);
      } catch (err) {
        console.error("Failed to load teams", err);
      }
    };
    fetchTeams();
  }, []);

  const toggleTeam = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTeams: prev.selectedTeams.includes(teamId)
        ? prev.selectedTeams.filter(id => id !== teamId)
        : [...prev.selectedTeams, teamId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await tournamentAPI.createTournament(formData);
      navigate('/tournaments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const SXInput = ({ className = '', ...props }: any) => (
    <input className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all ${className}`}
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      {...props} />
  );

  return (
    <div className="p-6 max-w-4xl mx-auto relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Background Orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
          <h1 className="text-3xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Trophy className="w-8 h-8 text-green-400" /> Create Tournament
          </h1>
        </div>
        <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>Set up a new cricket tournament</p>
      </div>

      <div className="rounded-2xl p-6 md:p-8 relative z-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Tournament Name</label>
              <SXInput required value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Summer Premier League 2026" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea 
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-vertical min-h-[100px]"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Tournament details, rules, and prizes..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
                <SXInput type="date" required value={formData.startDate} onChange={(e: any) => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>End Date</label>
                <SXInput type="date" required value={formData.endDate} onChange={(e: any) => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Match Format</label>
              <select 
                value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="T20">T20 (20 Overs)</option>
                <option value="ODI">ODI (50 Overs)</option>
                <option value="Test">Test Match</option>
                <option value="T10">T10 (10 Overs)</option>
                <option value="Custom">Custom Format</option>
              </select>
            </div>
          </div>

          <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <label className="flex items-center gap-2 text-sm font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>
              <Users className="w-5 h-5 text-green-400" /> Select Participating Teams
            </label>
            
            {availableTeams.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {availableTeams.map(team => (
                  <div key={team._id} onClick={() => toggleTeam(team._id)}
                    className="cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all hover:-translate-y-0.5"
                    style={formData.selectedTeams.includes(team._id) 
                      ? { background: 'rgba(34,197,94,0.1)', borderColor: '#22c55e', color: 'var(--text-primary)' }
                      : { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <span className="font-bold text-sm truncate">{team.name}</span>
                    {formData.selectedTeams.includes(team._id) && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                No teams available. You can create a tournament now and add teams later.
              </div>
            )}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
             <button type="button" onClick={() => navigate('/tournaments')}
               className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
               style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
               Cancel
             </button>
             <button type="submit" disabled={loading}
               className="px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:scale-105 disabled:opacity-50"
               style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
               {loading ? 'Creating...' : 'Create Tournament'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}