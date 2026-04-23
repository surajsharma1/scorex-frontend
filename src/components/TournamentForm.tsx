import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { tournamentAPI, teamAPI } from '../services/api';
import { Team } from './types';
import { Calendar, Trophy, MapPin, CheckCircle, Info, FileText } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function TournamentForm() {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',    
    startDate: '',
    endDate: '',
    type: 'round_robin',
    format: 'T20',
    selectedTeams: [] as string[],
  });
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

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
    try {
      const tournamentData = {
        ...formData,
        venue: formData.location,
        teams: formData.selectedTeams,
        prizePool: 0,
        organizer: user?._id || ''
      };
      await tournamentAPI.createTournament(tournamentData);
      addToast({ type: 'success', message: 'Tournament created successfully!' });
      navigate('/tournaments');
    } catch (err: any) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Creation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Trophy className="w-8 h-8 text-green-500" /> 
          Create Tournament
        </h1>
        <p className="text-sm sm:text-base mt-2" style={{ color: 'var(--text-muted)' }}>
          Set up the foundation for your new cricket series.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <div className="p-5 sm:p-8 rounded-2xl shadow-xl transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText className="w-5 h-5 text-green-400" /> Tournament Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Tournament Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 sm:p-4 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="e.g., Summer Premier League" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="w-4 h-4" /> Venue
              </label>
              <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full p-3 sm:p-4 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="e.g., Eden Gardens" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'white' }}>
                <Calendar className="w-4 h-4" /> Start Date
              </label>
              <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full p-3 sm:p-4 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', colorScheme: 'var(--color-scheme, dark)', accentColor: 'var(--accent)' }} />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'white' }}>
                <Calendar className="w-4 h-4" /> End Date
              </label>
              <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full p-3 sm:p-4 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', colorScheme: 'var(--color-scheme, dark)', accentColor: 'var(--accent)' }} />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Tournament Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full p-3 sm:p-4 rounded-xl outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="round_robin">Round Robin</option>
                <option value="knockout">Knockout</option>
                <option value="league">League</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Match Format</label>
              <select value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})}
                className="w-full p-3 sm:p-4 rounded-xl outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="T10">T10</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Additional Details (Optional)</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 sm:p-4 rounded-xl outline-none min-h-[100px] resize-y"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Enter rules, entry fees, or specific guidelines..." />
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">
              <strong>Data Retention Notice:</strong> To optimize system performance, this tournament and its associated match data will be automatically scheduled for deletion <strong>3 days after the selected End Date</strong>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
           <button type="button" onClick={() => navigate('/tournaments')}
             className="w-full sm:w-auto px-6 py-3 sm:py-4 rounded-xl font-bold text-sm transition-all text-center"
             style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
             Cancel
           </button>
           <button type="submit" disabled={loading}
             className="w-full sm:w-auto px-8 py-3 sm:py-4 rounded-xl font-bold text-sm transition-all shadow-lg hover:scale-[1.02] disabled:opacity-50 text-center"
             style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}>
             {loading ? 'Creating...' : 'Create Tournament'}
           </button>
        </div>
      </form>
    </div>
  );
}