import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overlayAPI, tournamentAPI, matchAPI } from '../services/api';
import { Tournament, Match } from './types';

export default function OverlayForm() {
  const [formData, setFormData] = useState({ name: '', template: '', tournament: '', match: '' });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await tournamentAPI.getTournaments();
        // Handle both response formats: { tournaments: [...] } or direct array
        const tournamentsData = response.data.tournaments || response.data || [];
        setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
      } catch (error) {
        console.error('Failed to fetch tournaments');
        setTournaments([]); // Set empty array on error
      }
    };
    fetchTournaments();
  }, []);

  // Fetch matches when tournament is selected
  useEffect(() => {
    const fetchMatches = async () => {
      if (!formData.tournament) {
        setMatches([]);
        return;
      }
      
      setLoadingMatches(true);
      try {
        // API now returns response.data directly
        const data = await matchAPI.getMatchesByTournament(formData.tournament);
        // Handle different response formats
        let matchesData: any[] = [];
        if (Array.isArray(data)) {
          matchesData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          matchesData = data.data;
        } else if (data?.matches && Array.isArray(data.matches)) {
          matchesData = data.matches;
        }
        setMatches(Array.isArray(matchesData) ? matchesData : []);
      } catch (error) {
        console.error('Failed to fetch matches');
        setMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, [formData.tournament]);

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
      const overlayData: any = {
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
      
      // Add match if selected
      if (formData.match) {
        overlayData.match = formData.match;
      }
      
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
              {/* Level 1 - Basic Templates */}
              <option value="lvl1-broadcast-bar.html">Broadcast Bar</option>
              <option value="lvl1-curved-compact.html">Curved Compact</option>
              <option value="lvl1-dark-angular.html">Dark Angular</option>
              <option value="lvl1-grass-theme.html">Grass Theme</option>
              <option value="lvl1-high-vis.html">High Visibility</option>
              <option value="lvl1-minimal-dark.html">Minimal Dark</option>
              <option value="lvl1-modern-bar.html">Modern Bar</option>
              <option value="lvl1-modern-blue.html">Modern Blue</option>
              <option value="lvl1-paper-style.html">Paper Style</option>
              <option value="lvl1-red-card.html">Red Card</option>
              <option value="lvl1-retro-board.html">Retro Board</option>
              <option value="lvl1-side-panel.html">Side Panel</option>
              <option value="lvl1-simple-text.html">Simple Text</option>
              {/* Level 2 - Advanced Templates */}
              <option value="lvl2-broadcast-pro.html">Broadcast Pro</option>
              <option value="lvl2-cosmic-orbit.html">Cosmic Orbit</option>
              <option value="lvl2-cyber-glitch.html">Cyber Glitch</option>
              <option value="lvl2-flame-thrower.html">Flame Thrower</option>
              <option value="lvl2-glass-morphism.html">Glass Morphism</option>
              <option value="lvl2-gold-rush.html">Gold Rush</option>
              <option value="lvl2-hologram.html">Hologram</option>
              <option value="lvl2-matrix-rain.html">Matrix Rain</option>
              <option value="lvl2-neon-pulse.html">Neon Pulse</option>
              <option value="lvl2-particle-storm.html">Particle Storm</option>
              <option value="lvl2-rgb-split.html">RGB Split</option>
              <option value="lvl2-speed-racer.html">Speed Racer</option>
              <option value="lvl2-tech-hud.html">Tech HUD</option>
              <option value="lvl2-thunder-strike.html">Thunder Strike</option>
              <option value="lvl2-vinyl-spin.html">Vinyl Spin</option>
              <option value="lvl2-water-flow.html">Water Flow</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tournament</label>
            <select
              value={formData.tournament}
              onChange={(e) => setFormData({ ...formData, tournament: e.target.value, match: '' })}
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
          
          {/* Match Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Match (Optional)</label>
            <select
              value={formData.match}
              onChange={(e) => setFormData({ ...formData, match: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={!formData.tournament || loadingMatches}
            >
              <option value="">
                {loadingMatches ? 'Loading matches...' : (formData.tournament ? 'Select Match (Optional)' : 'Select a tournament first')}
              </option>
              {matches.map((matchItem) => (
                <option key={matchItem._id} value={matchItem._id}>
                  {matchItem.team1?.name || 'Team 1'} vs {matchItem.team2?.name || 'Team 2'} ({matchItem.status || 'scheduled'})
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