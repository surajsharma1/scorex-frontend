import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overlayAPI, tournamentAPI } from '../services/api';
import { Tournament } from './types';

export default function OverlayForm() {
  const [formData, setFormData] = useState({ name: '', template: '', tournament: '' });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await tournamentAPI.getTournaments();
        setTournaments(response.data);
      } catch (error) {
        console.error('Failed to fetch tournaments');
      }
    };
    fetchTournaments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter an overlay name');
      return;
    }
    
    if (!formData.template) {
      alert('Please select a template');
      return;
    }
    
    if (!formData.tournament) {
      alert('Please select a tournament');
      return;
    }
    
    setLoading(true);
    try {
      const overlayData = {
        name: formData.name.trim(),
        template: formData.template,
        tournament: formData.tournament,
        config: {
          backgroundColor: '#16a34a',
          opacity: 90,
          fontFamily: 'Inter',
          position: 'top',
          showAnimations: true,
          autoUpdate: true,
        },
        elements: [],
      };
      await overlayAPI.createOverlay(overlayData);
      navigate('/overlays');
    } catch (error) {
      console.error('Failed to create overlay:', error);
      alert('Failed to create overlay. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Overlay</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
            <input
              type="text"
              placeholder="Overlay Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template <span className="text-red-500">*</span></label>
            <select
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select Template</option>
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="dark">Dark</option>
              <option value="neon">Neon</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="minimalist">Minimalist</option>
              <option value="glass2">Glass</option>
              <option value="animated">Animated</option>
              <option value="aurora">Aurora</option>
              <option value="broadcast">Broadcast</option>
              <option value="chalkboard">Chalkboard</option>
              <option value="crystal">Crystal</option>
              <option value="desert">Desert</option>
              <option value="fire">Fire</option>
              <option value="forest">Forest</option>
              <option value="gradient">Gradient</option>
              <option value="holographic">Holographic</option>
              <option value="ipl">IPL</option>
              <option value="metallic">Metallic</option>
              <option value="metallic2">Metallic 2</option>
              <option value="minimal-dark">Minimal Dark</option>
              <option value="neon2">Neon 2</option>
              <option value="ocean">Ocean</option>
              <option value="particle">Particle</option>
              <option value="retro">Retro</option>
              <option value="space">Space</option>
              <option value="storm">Storm</option>
              <option value="sunset">Sunset</option>
              <option value="vintage">Vintage</option>
              <option value="wooden2">Wooden</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tournament</label>
            <select
              value={formData.tournament}
              onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select Tournament</option>
              {tournaments.map((tournament) => (
                <option key={tournament._id} value={tournament._id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Overlay'}
          </button>
        </form>
      </div>
    </div>
  );
}