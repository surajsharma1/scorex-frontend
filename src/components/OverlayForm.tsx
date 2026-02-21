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
              {/* Free Templates */}
              <option value="vintage.html">Vintage Cricket</option>
              <option value="gate-minimal-dark.html">Minimal Dark</option>
              <option value="slate-gold-ashes.html">Slate Gold</option>
              <option value="minimalist-split-bar.html">Minimalist Split</option>
              {/* Premium Basic */}
              <option value="gradient-monolith.html">Gradient Monolith</option>
              <option value="neon-vector-replay.html">Neon Vector</option>
              <option value="circuit-node-neon.html">Circuit Node</option>
              <option value="cyber-shield.html">Cyber Shield</option>
              <option value="hex-perimeter.html">Hex Perimeter</option>
              <option value="grid-sunset-red.html">Grid Sunset</option>
              <option value="titan-perimeter.html">Titan Perimeter</option>
              <option value="prism-pop-desert.html">Prism Pop</option>
              <option value="modern-monolith-slab.html">Modern Monolith</option>
              {/* Premium Designer */}
              <option value="apex-cradle-gold.html">Apex Cradle Gold</option>
              <option value="aurora-glass-bbl.html">Aurora Glass BBL</option>
              <option value="mono-cyberpunk.html">Mono Cyberpunk</option>
              <option value="storm-flare-rail.html">Storm Flare</option>
              <option value="titanium-dark-ribbon.html">Titanium Dark</option>
              <option value="retro-glitch-hud.html">Retro Glitch HUD</option>
              <option value="wooden2.html">Wooden Board</option>
              <option value="interceptor-orange.html">Interceptor Orange</option>
              <option value="metallic-eclipse-lens.html">Metallic Eclipse</option>
              <option value="red-spine-replay.html">Red Spine Replay</option>
              <option value="Double-Rail-Broadcast.html">Double Rail Broadcast</option>
              <option value="rail-world-broadcast.html">Rail World</option>
              <option value="news-ticker-broadcast.html">News Ticker Broadcast</option>
              <option value="vertical-slice-ashes.html">Vertical Slice Ashes</option>
              <option value="velocity-frame-v2.html">Velocity Frame V2</option>
              <option value="velocity-frame.html">Velocity Frame</option>
              <option value="fire-win-predictor.html">Fire Win Predictor</option>
              <option value="broadcast-score-bug.html">Broadcast Score Bug</option>
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