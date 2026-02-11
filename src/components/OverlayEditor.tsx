import { useState, useEffect } from 'react';
import { Eye, Download, Settings, Crown, Edit, Trash2 } from 'lucide-react';
import { overlayAPI, tournamentAPI } from '../services/api';
import { Overlay, Tournament } from './types';
import Payment from './Payment';

const PRE_DESIGNED_OVERLAYS = [
  {
    id: 'classic',
    name: 'Classic Score',
    description: 'Traditional cricket scoreboard with team names and scores',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/classic-preview.png',
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean, modern design with essential match information',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/modern-preview.png',
  },
  {
    id: 'dark',
    name: 'Dark Theme',
    description: 'Dark overlay with neon accents for night streaming',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/dark-preview.png',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Ultra-clean design focusing on scores only',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/minimalist-preview.png',
  },
  {
    id: 'retro',
    name: 'Retro Style',
    description: 'Vintage cricket scoreboard design',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/retro-preview.png',
  },
  {
    id: 'gradient',
    name: 'Gradient Flow',
    description: 'Smooth gradient backgrounds with flowing colors',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/gradient-preview.png',
  },
  {
    id: 'vintage',
    name: 'Vintage Cricket',
    description: 'Old-school cricket board with classic fonts',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/vintage-preview.png',
  },
  {
    id: 'chalkboard',
    name: 'Chalkboard',
    description: 'Green chalkboard with handwritten-style scores',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/chalkboard-preview.png',
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    description: 'Ultra-minimal dark theme with subtle highlights',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/minimal-dark-preview.png',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    description: 'Calming ocean waves with blue gradients',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/ocean-preview.png',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural forest theme with green tones',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/forest-preview.png',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm sunset colors with golden highlights',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/sunset-preview.png',
  },
  {
    id: 'desert',
    name: 'Desert Sands',
    description: 'Sandy desert theme with warm earth tones',
    membership: 'basic',
    level: 'basic',
    preview: '/overlays/desert-preview.png',
  },
  {
    id: 'broadcast',
    name: 'Broadcast Style',
    description: 'Professional broadcast-quality overlay',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/broadcast-preview.png',
  },
  {
    id: 'ipl',
    name: 'IPL Style',
    description: 'Inspired by Indian Premier League design',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/ipl-preview.png',
  },
  {
    id: 'animated',
    name: 'Animated Score',
    description: 'Dynamic overlay with smooth animations',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/animated-preview.png',
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    description: 'Vibrant neon colors with glowing effects',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/neon-preview.png',
  },
  {
    id: 'glass',
    name: 'Glass Morphism',
    description: 'Modern glass-like design with transparency',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/glass-preview.png',
  },
  {
    id: 'wooden',
    name: 'Wooden Board',
    description: 'Classic wooden scoreboard appearance',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/wooden-preview.png',
  },
  {
    id: 'metallic',
    name: 'Metallic Shine',
    description: 'Shiny metallic overlay with reflections',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/metallic-preview.png',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic cyberpunk style with digital elements',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/cyberpunk-preview.png',
  },
  {
    id: 'particle',
    name: 'Particle Effect',
    description: 'Animated particles floating around the scoreboard',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/particle-preview.png',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    description: '3D holographic projection effect',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/holographic-preview.png',
  },
  {
    id: 'fire',
    name: 'Fire Theme',
    description: 'Fiery animated background with flame effects',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/fire-preview.png',
  },
  {
    id: 'space',
    name: 'Space Theme',
    description: 'Cosmic space background with stars and planets',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/space-preview.png',
  },
  {
    id: 'crystal',
    name: 'Crystal Clear',
    description: 'Crystal-like transparency with prism effects',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/crystal-preview.png',
  },
  {
    id: 'storm',
    name: 'Storm Clouds',
    description: 'Dramatic storm clouds with lightning effects',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/storm-preview.png',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Northern lights with colorful aurora effects',
    membership: 'designer',
    level: 'designer',
    preview: '/overlays/aurora-preview.png',
  },
];

interface OverlayEditorProps {
  selectedTournament?: Tournament | null;
}

export default function OverlayEditor({ selectedTournament: propSelectedTournament }: OverlayEditorProps) {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<Overlay | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(propSelectedTournament || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<Overlay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userMembership, setUserMembership] = useState('free');
  const [userRole, setUserRole] = useState('viewer');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchData();
    // Get user info from localStorage or API
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'viewer');
        setUserMembership(payload.membership || 'free');
        // If admin, set to pro for full access
        if (payload.role === 'admin') {
          setUserMembership('pro');
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      const [overlaysRes, tournamentsRes] = await Promise.all([
        overlayAPI.getOverlays(),
        tournamentAPI.getTournaments(),
      ]);
      const overlaysData = overlaysRes.data || [];
      const tournamentsData = tournamentsRes.data?.tournaments || tournamentsRes.data || [];
      let filteredOverlays = Array.isArray(overlaysData) ? overlaysData : [];

      // If selectedTournament is passed as prop, filter overlays by that tournament
      if (propSelectedTournament) {
        filteredOverlays = filteredOverlays.filter(overlay => overlay.tournament?._id === propSelectedTournament._id);
      }

      setOverlays(filteredOverlays);
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch data');
      setOverlays([]);
      setTournaments([]);
    }
  };

  const handleSelectOverlay = async (overlayTemplate: any) => {
    if (!selectedTournament) {
      setError('Please select a tournament first');
      return;
    }

    if (overlayTemplate.membership !== 'free' && userMembership === 'free') {
      setError(`This overlay requires a ${overlayTemplate.membership} membership`);
      return;
    }

    setLoading(true);
    try {
      const overlayData = {
        name: `${selectedTournament.name} - ${overlayTemplate.name}`,
        tournament: selectedTournament._id,
        template: overlayTemplate.id,
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

      const response = await overlayAPI.createOverlay(overlayData);
      setSelectedOverlay(response.data);
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create overlay');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOverlay = (overlay: Overlay) => {
    setEditingOverlay(overlay);
    setShowCreateForm(true);
  };

  const handleDeleteOverlay = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this overlay?')) {
      try {
        await overlayAPI.deleteOverlay(id);
        fetchData();
        if (selectedOverlay && selectedOverlay._id === id) {
          setSelectedOverlay(null);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete overlay');
      }
    }
  };

  const handlePreview = (overlay: Overlay) => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    window.open(`${backendUrl}/overlays/public/${overlay.publicId}`, '_blank');
  };

  const handleDownload = (overlay: Overlay) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    navigator.clipboard.writeText(`${backendUrl}/api/overlays/public/${overlay.publicId}`);
    alert('Overlay URL copied to clipboard!');
  };

  const renderOverlayPreview = (overlay: Overlay) => {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg relative overflow-hidden shadow-lg">
        <div className="absolute top-6 left-6 right-6">
                  <div
            className="rounded-lg p-4 shadow-xl"
            style={{
              backgroundColor: overlay.config.backgroundColor,
              opacity: overlay.config.opacity / 100,
            }}
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-white text-xs opacity-80">TEAM 1</p>
                <p className="text-white text-2xl font-bold">Team 1</p>
                <p className="text-white text-xl">185/4</p>
                <p className="text-white text-xs opacity-80">20.0 Overs</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white text-xs opacity-80">VS</p>
                  <p className="text-yellow-400 text-sm font-bold mt-1">
                    {overlay.tournament?.name || 'Tournament'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-xs opacity-80">TEAM 2</p>
                <p className="text-white text-2xl font-bold">Team 2</p>
                <p className="text-white text-xl">142/7</p>
                <p className="text-white text-xs opacity-80">16.2 Overs</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-xs">Current Run Rate</p>
                <p className="text-white font-bold text-lg">8.75</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Required Rate</p>
                <p className="text-white font-bold text-lg">12.30</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Last 5 Overs</p>
                <p className="text-white font-bold text-lg">48/2</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Target</p>
                <p className="text-green-400 font-bold text-lg">186</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20">
          <Settings className="w-32 h-32 text-white" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 bg-gray-900 text-white min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-blue-400">Overlay Editor</h1>
          <p className="text-gray-300 mt-2">
            Select and customize overlays for YouTube videos
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRE_DESIGNED_OVERLAYS.map((overlayTemplate) => (
          <div
            key={overlayTemplate.id}
            className={`bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${
              overlayTemplate.membership !== 'free' && userMembership === 'free'
                ? 'opacity-60'
                : ''
            }`}
          >
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings className="w-16 h-16 text-white opacity-50" />
              </div>
              {overlayTemplate.membership !== 'free' && (
                <div className="absolute top-2 right-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">
                {overlayTemplate.name}
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                {overlayTemplate.description}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    overlayTemplate.membership === 'free'
                      ? 'bg-green-100 text-green-800'
                      : overlayTemplate.membership === 'premium'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {overlayTemplate.membership.toUpperCase()}
                </span>
                <button
                  onClick={() => {
                    if (overlayTemplate.membership !== 'free' && userMembership === 'free') {
                      setShowPayment(true);
                    } else {
                      handleSelectOverlay(overlayTemplate);
                    }
                  }}
                  disabled={!selectedTournament}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {overlayTemplate.membership === 'free' ? 'Select' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {overlays.length > 0 && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Your Overlays</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overlays.map((overlay) => (
              <div
                key={overlay._id}
                className={`border border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  selectedOverlay && selectedOverlay._id === overlay._id
                    ? 'border-green-500 bg-gray-700'
                    : 'bg-gray-800'
                }`}
                onClick={() => setSelectedOverlay(overlay)}
              >
                <h3 className="font-bold text-white mb-2">{overlay.name}</h3>
                <p className="text-sm text-gray-300 mb-3">
                  {overlay.tournament?.name} - {overlay.template}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(overlay);
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(overlay);
                    }}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Link</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditOverlay(overlay);
                    }}
                    className="bg-yellow-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOverlay(overlay._id);
                    }}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOverlay && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">{selectedOverlay.name}</h2>
            <button
              onClick={() => setSelectedOverlay(null)}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>

          {renderOverlayPreview(selectedOverlay)}

          <div className="mt-4 p-4 bg-gray-700 border border-gray-600 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong>YouTube Overlay Link:</strong> This overlay can be used as a browser source in OBS or directly embedded in YouTube streams.
            </p>
            <div className="mt-2 flex space-x-2">
              <input
                type="text"
                value={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/overlays/public/${selectedOverlay.publicId}`}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-sm text-white"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/overlays/public/${selectedOverlay.publicId}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="font-bold text-white mb-3">Membership Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Free</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Classic Score overlay</li>
              <li>• Basic customization</li>
              <li>• Up to 2 tournaments</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-400 mb-2">Premium</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Modern Minimal overlay</li>
              <li>• Advanced customization</li>
              <li>• Up to 10 tournaments</li>
              <li>• Priority support</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-400 mb-2">Pro</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• All overlay templates</li>
              <li>• Full customization</li>
              <li>• Unlimited tournaments</li>
              <li>• Live score integration</li>
              <li>• Custom branding</li>
            </ul>
          </div>
        </div>
      </div>

      {showPayment && (
        <Payment
          onClose={() => setShowPayment(false)}
          onSuccess={(plan) => {
            setUserMembership(plan);
            setShowPayment(false);
            setError(`Successfully upgraded to ${plan} plan!`);
          }}
        />
      )}
    </div>
  );
}
