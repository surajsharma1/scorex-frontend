import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, teamAPI } from '../services/api';
import { Team } from './types';
import { Calendar, Trophy, Users, CheckCircle, Lock, Crown } from 'lucide-react';
import { getCurrentUser, isPremium } from '../utils/auth';

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
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
    const fetchTeams = async () => {
      try {
        const res = await teamAPI.getTeams();
        setAvailableTeams(res.data);
      } catch (error) {
        console.error("Failed to load teams");
      }
    };
    fetchTeams();
  }, []);

  const checkAccess = () => {
    const user = getCurrentUser();
    if (!user) {
      // Not logged in - check if they can access
      setHasAccess(false);
      return;
    }
    
    // Check if user is admin or has premium membership
    const premium = isPremium();
    setHasAccess(premium || user.role === 'admin');
  };

  const handleTeamToggle = (teamId: string) => {
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
      // API expects 'teams' as an array of IDs
      const payload = {
        ...formData,
        teams: formData.selectedTeams
      };
      await tournamentAPI.createTournament(payload);
      navigate('/tournaments');
    } catch (error) {
      console.error(error);
      alert('Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (hasAccess === null) {
    return <div className="p-8 text-center dark:text-white">Checking access...</div>;
  }

  // No access - show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Premium Feature</h2>
                <p className="text-yellow-100">Tournament Creation</p>
              </div>
            </div>
          </div>

          <div className="p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-yellow-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Upgrade to Create Tournaments
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tournament creation is available to premium members only. 
              Upgrade your membership to unlock this feature and start organizing your own tournaments.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/membership')}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all"
              >
                View Membership Plans
              </button>
              <button
                onClick={() => navigate('/tournaments')}
                className="w-full py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all"
              >
                Browse Tournaments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has access - show form
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6" /> Create Tournament
          </h2>
          <p className="text-green-100 opacity-90">Setup a new league or series</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tournament Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Premier League 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full pl-10 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test Match</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex justify-between">
              <span>Select Teams</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{formData.selectedTeams.length} Selected</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto border p-3 rounded-lg dark:border-gray-600">
              {availableTeams.map(team => (
                <div 
                  key={team._id}
                  onClick={() => handleTeamToggle(team._id)}
                  className={`p-3 rounded-lg cursor-pointer border transition-all flex items-center justify-between ${
                    formData.selectedTeams.includes(team._id)
                      ? 'bg-green-50 border-green-500 dark:bg-green-900/30'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                  }`}
                >
                  <span className="font-medium dark:text-white truncate">{team.name}</span>
                  {formData.selectedTeams.includes(team._id) && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
             <button
               type="button"
               onClick={() => navigate('/tournaments')}
               className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-md"
             >
               {loading ? 'Creating...' : 'Create Tournament'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
