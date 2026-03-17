import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, teamAPI } from '../services/api';
import { Team } from './types';
import { Calendar, Trophy, Users, CheckCircle, Lock } from 'lucide-react';
import Membership from './Membership';

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
  const [showPayment, setShowPayment] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<'free' | 'basic' | 'premium'>('free');
  const navigate = useNavigate();

  // Check membership status on component mount
  useEffect(() => {
    const checkMembership = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const membership = payload.membership || 'free';
          
          // Check if membership has expired
          if (payload.membershipExpiresAt) {
            const expiryDate = new Date(payload.membershipExpiresAt);
            if (expiryDate < new Date()) {
              // Membership has expired
              setMembershipStatus('free');
              return;
            }
          }
          
          setMembershipStatus(membership as 'free' | 'basic' | 'premium');
        } catch (error) {
          console.error('Error parsing token:', error);
          setMembershipStatus('free');
        }
      } else {
        setMembershipStatus('free');
      }
    };
    
    checkMembership();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamAPI.getTeams();
        // Handle both array and object response formats
        const teams = Array.isArray(res.data) ? res.data : res.data.teams || [];
        setAvailableTeams(teams);
      } catch (error) {
        console.error("Failed to load teams:", error);
        setAvailableTeams([]);
      }
    };
    fetchTeams();
  }, []);

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
    setError(null);
    
    try {
      // Map frontend fields to backend API expected fields
      // Backend expects lowercase: locationType ('indoor', 'outdoor', 'both')
      // type ('round_robin', 'knockout', 'double_elimination', 'league', 'group_stage')
      const payload = {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        organizer: 'Local',
        location: 'Stadium',
        // Don't send locationType and type - let backend use defaults
        teams: formData.selectedTeams
      };
      
      console.log('Creating tournament with payload:', payload);
      console.log('Full payload details:', JSON.stringify(payload, null, 2));
      
      const res = await tournamentAPI.createTournament(payload);
      console.log('Tournament created successfully:', res.data);
      
      // Navigate to tournaments list
      navigate('/tournaments');
    } catch (err: any) {
      console.error('Failed to create tournament:', err);
      console.error('Error response:', err.response?.data);
      
      // Show more detailed error message
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        // Handle Zod validation errors array
        const errorMessages = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        setError(errorMessages);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create tournament. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show error alert
  useEffect(() => {
    if (error) {
      alert(error);
      setError(null);
    }
  }, [error]);

  // Show payment modal if user needs to upgrade
  if (showPayment) {
    return <Membership />;
  }

  // Check if user has premium membership - if not, prompt for upgrade
  const requiresPremium = membershipStatus === 'free';

  const handleUpgradeClick = () => {
    setShowPayment(true);
  };

  // Has access - show form
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-full sm:max-w-2xl lg:max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">

        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4 sm:p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                <Trophy className="w-5 sm:w-6 h-5 sm:h-6" /> Create Tournament
              </h2>

              <p className="text-green-100 opacity-90">Setup a new league or series</p>
            </div>
            {requiresPremium && (
              <button
                onClick={handleUpgradeClick}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
              >
                <Lock className="w-4 h-4" />
                Upgrade to Premium
              </button>
            )}
            {!requiresPremium && membershipStatus === 'basic' && (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Basic Plan
              </span>
            )}
            {!requiresPremium && membershipStatus === 'premium' && (
              <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Premium Plan
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="sm:col-span-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
            {availableTeams.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 sm:max-h-56 lg:max-h-60 overflow-y-auto border p-3 sm:p-4 rounded-lg dark:border-gray-600">
                {availableTeams.map(team => (
                  <div 
                    key={team._id}
                    onClick={() => handleTeamToggle(team._id)}
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer border transition-all flex items-center justify-between ${
                      formData.selectedTeams.includes(team._id)
                        ? 'bg-green-50 border-green-500 dark:bg-green-900/30'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                    }`}
                  >
                    <span className="font-medium dark:text-white text-sm truncate">{team.name}</span>
                    {formData.selectedTeams.includes(team._id) && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 border rounded-lg">
                No teams available. You can create a tournament without teams.
              </div>
            )}
          </div>

          <div className="pt-4 border-t dark:border-gray-700 flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
             <button
               type="button"
               onClick={() => navigate('/tournaments')}
               className="px-4 sm:px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 w-full sm:w-auto"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="px-4 sm:px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-md disabled:opacity-50 w-full sm:w-auto"
             >
               {loading ? 'Creating...' : 'Create Tournament'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
