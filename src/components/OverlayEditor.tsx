import { useState, useEffect } from 'react';
import { Eye, Download, Settings, Crown, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { overlayAPI, matchAPI } from '../services/api';
import { Overlay, Match, Tournament } from './types';
import Payment from './Payment';

// Dynamic overlay list based on actual files in public/overlays folder
const PRE_DESIGNED_OVERLAYS = [
  // Free Level Overlays - Available to all users
  {
    id: 'vintage',
    name: 'Vintage Cricket',
    description: 'Old-school cricket board with classic newspaper aesthetics',
    membership: 'free',
    level: 'basic',
    preview: '/overlays/vintage.html',
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    description: 'Ultra-minimal dark theme with subtle neon highlights',
    membership: 'free',
    level: 'basic',
    preview: '/overlays/gate-minimal-dark.html',
  },
  {
    id: 'slate-gold',
    name: 'Slate Gold',
    description: 'Dark slate with gold accents for premium look',
    membership: 'free',
    level: 'basic',
    preview: '/overlays/slate-gold-ashes.html',
  },
  {
    id: 'minimalist',
    name: 'Minimalist Split',
    description: 'Ultra-clean split bar design focusing on essential score',
    membership: 'free',
    level: 'basic',
    preview: '/overlays/minimalist-split-bar.html',
  },
  // Basic Level Overlays (Level 1) - Premium
  {
    id: 'gradient',
    name: 'Gradient Monolith',
    description: 'Smooth gradient backgrounds with flowing color transitions',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/gradient-monolith.html',
  },
  {
    id: 'neon',
    name: 'Neon Vector',
    description: 'Vibrant neon vector style with glowing effects',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/neon-vector-replay.html',
  },
  {
    id: 'circuit',
    name: 'Circuit Node',
    description: 'Futuristic circuit board design with neon accents',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/circuit-node-neon.html',
  },
  {
    id: 'cyber',
    name: 'Cyber Shield',
    description: 'Futuristic cyberpunk shield design',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/cyber-shield.html',
  },
  {
    id: 'hex',
    name: 'Hex Perimeter',
    description: 'Hexagonal pattern with modern aesthetics',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/hex-perimeter.html',
  },
  {
    id: 'grid',
    name: 'Grid Sunset',
    description: 'Warm sunset colors with grid pattern',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/grid-sunset-red.html',
  },
  {
    id: 'titan',
    name: 'Titan Perimeter',
    description: 'Bold titan design with strong perimeter lines',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/titan-perimeter.html',
  },
  {
    id: 'prism',
    name: 'Prism Pop',
    description: 'Colorful prism effect with vibrant pops',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/prism-pop-desert.html',
  },
  {
    id: 'modern',
    name: 'Modern Monolith',
    description: 'Modern slab design with clean lines',
    membership: 'premium',
    level: 'basic',
    preview: '/overlays/modern-monolith-slab.html',
  },
  // Designer Level Overlays (Level 2) - Animated & Complex
  {
    id: 'apex',
    name: 'Apex Cradle Gold',
    description: 'Premium apex design with gold accents',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/apex-cradle-gold.html',
  },
  {
    id: 'aurora',
    name: 'Aurora Glass BBL',
    description: 'Aurora borealis effect with glass morphism',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/aurora-glass-bbl.html',
  },
  {
    id: 'mono',
    name: 'Mono Cyberpunk',
    description: 'Monochrome cyberpunk style',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/mono-cyberpunk.html',
  },
  {
    id: 'storm',
    name: 'Storm Flare',
    description: 'Dramatic storm clouds with flare effects',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/storm-flare-rail.html',
  },
  {
    id: 'titanium',
    name: 'Titanium Dark',
    description: 'Premium titanium finish with dark theme',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/titanium-dark-ribbon.html',
  },
  {
    id: 'retro',
    name: 'Retro Glitch HUD',
    description: 'Retro arcade style with glitch effects',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/retro-glitch-hud.html',
  },
  {
    id: 'wooden2',
    name: 'Wooden Board',
    description: 'Classic wooden scoreboard with grain textures',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/wooden2.html',
  },
  {
    id: 'interceptor',
    name: 'Interceptor Orange',
    description: 'Bold orange interceptor design',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/interceptor-orange.html',
  },
  {
    id: 'metallic',
    name: 'Metallic Eclipse',
    description: 'Metallic eclipse lens effect',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/metallic-eclipse-lens.html',
  },
  {
    id: 'red',
    name: 'Red Spine Replay',
    description: 'Bold red spine design for replays',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/red-spine-replay.html',
  },
  {
    id: 'double-rail',
    name: 'Double Rail Broadcast',
    description: 'Professional broadcast style with dual rails',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/Double-Rail-Broadcast.html',
  },
  {
    id: 'rail-world',
    name: 'Rail World',
    description: 'World broadcast rail design',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/rail-world-broadcast.html',
  },
  {
    id: 'news',
    name: 'News Ticker Broadcast',
    description: 'News ticker style broadcast overlay',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/news-ticker-broadcast.html',
  },
  {
    id: 'vertical',
    name: 'Vertical Slice Ashes',
    description: 'Vertical slice design for Ashes series',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/vertical-slice-ashes.html',
  },
  {
    id: 'velocity',
    name: 'Velocity Frame V2',
    description: 'Velocity frame design v2',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/velocity-frame-v2.html',
  },
  {
    id: 'velocity-frame',
    name: 'Velocity Frame',
    description: 'Velocity frame design',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/velocity-frame.html',
  },
  {
    id: 'fire',
    name: 'Fire Win Predictor',
    description: 'Fiery win predictor with flame effects',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/fire-win-predictor.html',
  },
  {
    id: 'broadcast-bug',
    name: 'Broadcast Score Bug',
    description: 'Professional broadcast score bug',
    membership: 'premium',
    level: 'designer',
    preview: '/overlays/broadcast-score-bug.html',
  },
];

interface OverlayEditorProps {
  selectedMatch?: Match | null;
  selectedTournament?: Tournament | null;
}

export default function OverlayEditor({ selectedMatch: propSelectedMatch, selectedTournament }: OverlayEditorProps) {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<Overlay | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(propSelectedMatch || null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<Overlay | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    template: 'modern',
    config: {
      backgroundColor: '#16a34a',
      opacity: 90,
      fontFamily: 'Inter',
      position: 'top',
      showAnimations: true,
      autoUpdate: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [creatingOverlay, setCreatingOverlay] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userMembership, setUserMembership] = useState('free');
  const [userRole, setUserRole] = useState('viewer');
  const [showPayment, setShowPayment] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchData();
    // Get user info from localStorage or API
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'viewer');
        
        // Check if membership has expired
        let membership = payload.membership || 'free';
        if (payload.membershipExpiresAt) {
          const expiryDate = new Date(payload.membershipExpiresAt);
          if (expiryDate < new Date()) {
            // Membership has expired, reset to free
            membership = 'free';
          }
        }
        
        setUserMembership(membership);
        // If admin, set to pro for full access
        if (payload.role === 'admin') {
          setUserMembership('pro');
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      
      // First clear existing data to show loading state better
      setError('');
      
      const [overlaysRes, matchesRes] = await Promise.all([
        overlayAPI.getOverlays(),
        matchAPI.getAllMatches(),
      ]);
      
      // Handle both response formats: direct array or { data: [...] }
      let overlaysData = overlaysRes.data;
      let matchesData = matchesRes.data;
      
      // If response has nested data structure, extract it
      if (overlaysData && overlaysData.data) {
        overlaysData = overlaysData.data;
      }
      if (matchesData && matchesData.data) {
        matchesData = matchesData.data;
      }
      
      console.log('Overlays data:', overlaysData);
      console.log('Matches data:', matchesData);
      
      // Set the overlays and matches in state - THIS IS THE FIX!
      setOverlays(Array.isArray(overlaysData) ? overlaysData : []);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (error: any) {
      console.error('Error fetching overlays:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
      setOverlays([]);
      setMatches([]);
    }
  };

  // Filter matches based on selectedTournament
  useEffect(() => {
    if (selectedTournament && selectedTournament._id) {
      const filtered = matches.filter(match => 
        match.tournament === selectedTournament._id
      );
      setFilteredMatches(filtered);
    } else {
      // If no tournament selected, show all matches
      setFilteredMatches(matches);
    }
  }, [selectedTournament, matches]);


  const handleSelectOverlay = async (overlayTemplate: any) => {
    // Check if user is logged in first
    if (!isLoggedIn) {
      setError('Please log in to create overlays');
      return;
    }

    if (!selectedMatch) {
      setError('Please select a match first from the dropdown above');
      return;
    }

    if (overlayTemplate.membership !== 'free' && userMembership === 'free') {
      setError(`This overlay requires a premium membership. Please upgrade to create this overlay.`);
      setShowPayment(true);
      return;
    }

    setCreatingOverlay(true);
    setError('');
    try {
      const overlayData = {
        name: `${selectedMatch.team1?.name || 'Team 1'} vs ${selectedMatch.team2?.name || 'Team 2'} - ${overlayTemplate.name}`,
        match: selectedMatch._id,
        tournament: selectedMatch.tournament,
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
      setSuccess('Overlay created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (error: any) {
      console.error('Error creating overlay:', error);
      if (error.response?.status === 401) {
        setError('Please log in to create overlays');
      } else {
        setError(error.response?.data?.message || 'Failed to create overlay. Please try again.');
      }
    } finally {
      setCreatingOverlay(false);
    }
  };


  const handleEditOverlay = (overlay: Overlay) => {
    setEditingOverlay(overlay);
    setShowCreateForm(true);
    setFormData({
      name: overlay.name,
      template: overlay.template,
      config: overlay.config || {},
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('config.')) {
      const configKey = name.replace('config.', '');
      setFormData({
        ...formData,
        config: {
          ...formData.config,
          [configKey]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    
    try {
      if (editingOverlay) {
        // Update existing overlay
        await overlayAPI.updateOverlay(editingOverlay._id, formData);
        setSuccess('Overlay updated successfully!');
        setEditingOverlay(null);
        setShowCreateForm(false);
      } else {
        // Create new overlay - need a match selected
        if (!selectedMatch) {
          setError('Please select a match first');
          setFormLoading(false);
          return;
        }
        const overlayData = {
          ...formData,
          match: selectedMatch._id,
          tournament: selectedMatch.tournament,
          elements: [],
        };
        await overlayAPI.createOverlay(overlayData);
        setSuccess('Overlay created successfully!');
        setShowCreateForm(false);
      }
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (error: any) {
      console.error('Error saving overlay:', error);
      setError(error.response?.data?.message || 'Failed to save overlay');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingOverlay(null);
    setFormData({
      name: '',
      template: 'modern',
      config: {
        backgroundColor: '#16a34a',
        opacity: 90,
        fontFamily: 'Inter',
        position: 'top',
        showAnimations: true,
        autoUpdate: true,
      },
    });
  };

  const handleDeleteOverlay = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this overlay?')) {
      try {
        setLoading(true);
        await overlayAPI.deleteOverlay(id);
        setSuccess('Overlay deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchData();
        if (selectedOverlay && selectedOverlay._id === id) {
          setSelectedOverlay(null);
        }
      } catch (error: any) {
        console.error('Error deleting overlay:', error);
        setError(error.response?.data?.message || 'Failed to delete overlay');
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper function to get the backend URL dynamically based on current environment
  const getBackendUrl = (): string => {
    // First check if explicitly set in environment variable
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }
    // If running in production (different hostname), use the current window location
    const currentHost = window.location.origin;
    // If frontend is on a different port than 3000/5173, it's likely production
    // So use the same origin for backend
    return currentHost;
  };

// Mapping of template IDs to actual HTML filenames
const TEMPLATE_FILE_MAP: Record<string, string> = {
    'vintage': 'vintage.html',
    'minimal-dark': 'gate-minimal-dark.html',
    'slate-gold': 'slate-gold-ashes.html',
    'minimalist': 'minimalist-split-bar.html',
    'gradient': 'gradient-monolith.html',
    'neon': 'neon-vector-replay.html',
    'circuit': 'circuit-node-neon.html',
    'cyber': 'cyber-shield.html',
    'hex': 'hex-perimeter.html',
    'grid': 'grid-sunset-red.html',
    'titan': 'titan-perimeter.html',
    'prism': 'prism-pop-desert.html',
    'modern': 'modern-monolith-slab.html',
    'apex': 'apex-cradle-gold.html',
    'aurora': 'aurora-glass-bbl.html',
    'mono': 'mono-cyberpunk.html',
    'storm': 'storm-flare-rail.html',
    'titanium': 'titanium-dark-ribbon.html',
    'retro': 'retro-glitch-hud.html',
    'wooden2': 'wooden2.html',
    'interceptor': 'interceptor-orange.html',
    'metallic': 'metallic-eclipse-lens.html',
    'red': 'red-spine-replay.html',
    'double-rail': 'Double-Rail-Broadcast.html',
    'rail-world': 'rail-world-broadcast.html',
    'news': 'news-ticker-broadcast.html',
    'vertical': 'vertical-slice-ashes.html',
    'velocity': 'velocity-frame-v2.html',
    'velocity-frame': 'velocity-frame.html',
    'fire': 'fire-win-predictor.html',
    'broadcast-bug': 'broadcast-score-bug.html',
  };

  // Helper to get the overlay URL - point directly to Vercel to avoid CORS issues
  const getOverlayUrl = (overlay: Overlay): string => {
    // Use direct Vercel URL format to avoid cross-origin issues
    // URL format: https://scorex-live.vercel.app/overlays/{template}.html?matchId={matchId}&apiBaseUrl={apiBaseUrl}
    const frontendUrl = 'https://scorex-live.vercel.app';
    // Map template ID to actual filename, fallback to template + .html
    const templateId = overlay.template || 'vintage';
    const templateName = TEMPLATE_FILE_MAP[templateId] || `${templateId}.html`;
    const matchId = overlay.match?._id || overlay.match || '';
    const apiBaseUrl = 'https://scorex-backend.onrender.com/api/v1';
    
    return `${frontendUrl}/overlays/${templateName}?matchId=${matchId}&apiBaseUrl=${encodeURIComponent(apiBaseUrl)}`;
  };

  const handlePreview = async (overlay: Overlay) => {
    try {
      // Use the publicUrl from backend or generate one
      const overlayUrl = getOverlayUrl(overlay);
      window.open(overlayUrl, '_blank');
    } catch (error) {
      console.error('Error previewing overlay:', error);
      // Fallback to direct template access if backend fails
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      // Ensure template has .html extension
      let templateName = overlay.template || 'vintage';
      if (!templateName.endsWith('.html')) {
        templateName = templateName + '.html';
      }
      const templateUrl = `/overlays/${templateName}`;
      const matchId = overlay.match?._id || overlay.match || '';
      window.open(`${templateUrl}?matchId=${matchId}&apiBaseUrl=${encodeURIComponent(apiBaseUrl)}`, '_blank');
    }
  };

  const handleDownload = (overlay: Overlay) => {
    // Use the publicUrl from backend or generate one
    const overlayUrl = getOverlayUrl(overlay);
    navigator.clipboard.writeText(overlayUrl);
    setSuccess('Overlay URL copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const renderOverlayPreview = (overlay: Overlay) => {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg relative overflow-hidden shadow-lg">
        <div className="absolute top-6 left-6 right-6">
          <div
            className="rounded-lg p-4 shadow-xl"
            style={{
              backgroundColor: overlay.config?.backgroundColor || '#16a34a',
              opacity: (overlay.config?.opacity || 90) / 100,
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
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Login Warning */}
      {!isLoggedIn && (
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-300 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>You are not logged in. Please log in to create and manage overlays.</span>
        </div>
      )}

      {/* Match Selector */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select a Match</h3>
        {filteredMatches.length === 0 ? (
          <p className="text-gray-400">No matches available. Please create a match first.</p>
        ) : (
          <>
            <select
              value={selectedMatch?._id || ''}
              onChange={(e) => {
                const match = filteredMatches.find(m => m._id === e.target.value);
                setSelectedMatch(match || null);
                setError('');
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="">-- Select a match --</option>
              {filteredMatches.map((match) => (
                <option key={match._id} value={match._id}>
                  {match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'} - {new Date(match.date).toLocaleDateString()}
                </option>
              ))}
            </select>
            {selectedMatch && (
              <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Selected: {selectedMatch.team1?.name || 'Team 1'} vs {selectedMatch.team2?.name || 'Team 2'}
              </p>
            )}
            {!selectedMatch && (
              <p className="text-sm text-yellow-400 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Please select a match to create an overlay
              </p>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to Create an Overlay</h3>
        <ol className="list-decimal list-inside text-gray-300 space-y-2">
          <li>Select a match from the dropdown above</li>
          <li>Choose an overlay template from the options below</li>
          <li>Click "Create" to generate the overlay</li>
          <li>Use the Preview, Edit, and Delete buttons to manage your overlays</li>
          <li>Copy the overlay link to use in OBS or YouTube</li>
        </ol>
      </div>

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
                    // Check if user is logged in
                    if (!isLoggedIn) {
                      setError('Please log in to create overlays');
                      return;
                    }
                    
                    // Check if user has the required membership
                    const hasBasicAccess = userMembership !== 'free' && 
                      (userMembership === 'premium' || userMembership === 'pro' || 
                       userMembership === 'premium-level1' || userMembership === 'premium-level2');
                    const hasDesignerAccess = userMembership === 'premium-level2' || 
                      userMembership === 'pro' || userRole === 'admin';
                    
                    if (overlayTemplate.membership === 'free') {
                      handleSelectOverlay(overlayTemplate);
                    } else if (overlayTemplate.level === 'designer') {
                      // Designer level requires premium-level2
                      if (hasDesignerAccess) {
                        handleSelectOverlay(overlayTemplate);
                      } else {
                        setError('This designer overlay requires Premium Level 2 membership');
                        setShowPayment(true);
                      }
                    } else {
                      // Basic premium level
                      if (hasBasicAccess) {
                        handleSelectOverlay(overlayTemplate);
                      } else {
                        setError('This overlay requires a premium membership');
                        setShowPayment(true);
                      }
                    }
                  }}
                  disabled={!selectedMatch || creatingOverlay}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creatingOverlay ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Creating...
                    </>
                  ) : (
                    (() => {
                      // Determine button text based on access
                      const hasBasicAccess = userMembership !== 'free' && 
                        (userMembership === 'premium' || userMembership === 'pro' || 
                         userMembership === 'premium-level1' || userMembership === 'premium-level2');
                      const hasDesignerAccess = userMembership === 'premium-level2' || 
                        userMembership === 'pro' || userRole === 'admin';
                      
                      if (overlayTemplate.membership === 'free') {
                        return 'Create';
                      } else if (overlayTemplate.level === 'designer') {
                        return hasDesignerAccess ? 'Create' : 'Upgrade';
                      } else {
                        return hasBasicAccess ? 'Create' : 'Upgrade';
                      }
                    })()
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Your Overlays Section - Always show if user is logged in, even if empty */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Your Overlays</h2>
        
        {isLoggedIn ? (
          overlays.length > 0 ? (
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
                    {overlay.match ? `${overlay.match.team1?.name || 'Team 1'} vs ${overlay.match.team2?.name || 'Team 2'}` : 'No match'} - {overlay.template}
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
          ) : (
            <div className="text-center py-8">
              <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">You haven't created any overlays yet.</p>
              <p className="text-gray-500 text-sm">Select a match and click "Create" on any template above to get started!</p>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <p className="text-yellow-400 mb-2">Please log in to view your overlays.</p>
            <p className="text-gray-500 text-sm">You need to be logged in to create and manage overlays.</p>
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-4">
          <h2 className="text-xl font-bold text-white mb-4">{editingOverlay ? ' Update' : 'Create'} Overlay</h2>
          <form onSubmit={handleSubmitForm}>
            <input type="text" name="name" value={formData.name} onChange={handleFormChange} 
              className="w-full p-2 mb-2 bg-gray-700 text-white rounded" placeholder="Name" required />
            <select name="template" value={formData.template} onChange={handleFormChange}
              className="w-full p-2 mb-2 bg-gray-700 text-white rounded">
              {PRE_DESIGNED_OVERLAYS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button type="submit" disabled={formLoading}
              className="w-full bg-green-600 text-white p-2 rounded">
              {formLoading ? 'Saving...' : (editingOverlay ? ' Update Overlay' : 'Create Overlay')}
            </button>
          </form>
          <button onClick={handleCloseForm} className="mt-2 w-full bg-gray-600 text-white p-2 rounded">Cancel</button>
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
                value={getOverlayUrl(selectedOverlay)}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-sm text-white"
              />
              <button
                onClick={() => navigator.clipboard.writeText(getOverlayUrl(selectedOverlay))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-blue-400 mb-2">Premium Level 1</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• All basic overlay templates (13 designs)</li>
              <li>• Classic, Modern, Dark, Minimalist themes</li>
              <li>• Nature-themed overlays (Ocean, Forest, Desert, Sunset)</li>
              <li>• Basic customization options</li>
              <li>• Unlimited tournaments</li>
              <li>• Community support</li>
              <li>• Perfect for beginners and casual streamers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-400 mb-2">Premium Level 2</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• All overlay templates (31 designs total)</li>
              <li>• All Premium Level 1 designs</li>
              <li>• Animated & dynamic overlays</li>
              <li>• Broadcast & IPL style overlays</li>
              <li>• Special effects (Fire, Space, Storm, Aurora)</li>
              <li>• Full customization options</li>
              <li>• Priority support</li>
              <li>• Custom branding options</li>
              <li>• Perfect for professional streamers</li>
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
            // Show success message instead of error
            setError('');
            // Optionally show a success toast/message
            alert(`Successfully upgraded to ${plan} plan! You can now create overlays.`);
          }}
        />
      )}
    </div>
  );
}
