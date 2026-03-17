import { useState, useEffect, useRef } from 'react';
import { Eye, Plus, Save, Trash2, Edit, Copy, RefreshCw, ExternalLink, X } from 'lucide-react';
import { overlayAPI, matchAPI, tournamentAPI } from '../services/api';
import { CreatedOverlay, Match, Tournament } from './types';
import { getBackendBaseUrl } from '../services/env'; 

interface OverlayTemplate {
  id: string;
  name: string;
  file: string;
  category: string;
  color: string;
}

interface Category {
  value: string;
  label: string;
}

interface OverlayManagerProps {
  tournamentId?: string;
  matches?: Match[];
}

export default function OverlayManager({ tournamentId, matches: propMatches }: OverlayManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<OverlayTemplate | null>(null);
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    template: '',
    match: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  
  const [createdOverlays, setCreatedOverlays] = useState<CreatedOverlay[]>([]);
  const [overlaysLoading, setOverlaysLoading] = useState(false);
  
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewOverlay, setPreviewOverlay] = useState<CreatedOverlay | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOverlay, setEditOverlay] = useState<CreatedOverlay | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '' });
  const [editLoading, setEditLoading] = useState(false);
  
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

const baseUrlLocal = getBackendBaseUrl();

  useEffect(() => {
    // Load templates
    fetch('/templates.json')
      .then(res => res.json())
      .then((data: OverlayTemplate[]) => {
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
        }
        // Generate categories
        const cats: Category[] = [{ value: 'all', label: 'All Overlays' }];
        const uniqueCats = [...new Set(data.map(t => t.category))];
        uniqueCats.forEach(cat => {
          cats.push({ value: cat, label: `${cat}.replace('Scoreboard', 'Level 1 - Scoreboard').replace('Replay/Effects', 'Level 2 - Replay/Effects')` });
        });
        setCategories(cats);
      })
      .catch(err => {
        console.error('Failed to load templates:', err);
        setTemplates([]);
      })
      .finally(() => setTemplatesLoading(false));
  }, []);

  const loadCreatedOverlays = async () => {
    try {
      setOverlaysLoading(true);
      const res = await overlayAPI.getOverlays();
      const overlaysData = res.data.overlays || res.data || [];
      
      const overlaysWithComputed = (Array.isArray(overlaysData) ? overlaysData : []).map((overlay: CreatedOverlay) => {
        const baseUrl = baseUrlLocal;
        const publicUrl = `${baseUrl}/api/v1/overlays/public/${overlay.publicId}?template=${overlay.template}`;
        
        let isUrlExpired = false;
        if (overlay.urlExpiresAt) {
          isUrlExpired = new Date(overlay.urlExpiresAt) < new Date();
        }
        
        return {
          ...overlay,
          publicUrl,
          isUrlExpired
        };
      });
      
      setCreatedOverlays(overlaysWithComputed);
    } catch (error) {
      console.error('Failed to fetch created overlays');
      setCreatedOverlays([]);
    } finally {
      setOverlaysLoading(false);
    }
  };

const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      let matchesData: Match[] = [];
if (tournamentId) {
        const res = await matchAPI.getMatches({tournament: tournamentId});
        matchesData = Array.isArray(res.data?.data) ? res.data.data : res.data || [];
      } else if (propMatches) {
        matchesData = propMatches;
      } else {
        const res = await matchAPI.getMatches();
        matchesData = Array.isArray(res.data) ? res.data : res.data?.matches || [];
      }
      setMatches(matchesData.filter((m: Match) => 
        ['live', 'ongoing', 'in_progress', 'upcoming', 'scheduled'].includes((m.status || '').toLowerCase())
      ));
    } catch (error) {
      console.error('Failed to load matches');
      setMatches(propMatches || []);
    }
  };

  const refreshMatches = () => {
    loadMatches();
    // Auto-select first live match for better UX after refresh
    setTimeout(() => {
      if (matches.length > 0) {
        setCreateFormData(prev => ({...prev, match: matches[0]._id || ''}));
      }
    }, 500);
  };

  useEffect(() => {
    loadMatches();
    loadCreatedOverlays();
  }, [tournamentId]);

  const filteredOverlays = selectedCategory === 'all' 
    ? templates 
    : templates.filter(o => o.category === selectedCategory);

  const handleCreateOverlay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.name.trim() || !createFormData.template || !createFormData.match) {
      alert('Please fill all required fields');
      return;
    }
    
    const selectedMatch = matches.find(m => m._id === createFormData.match);
    if (!selectedMatch) {
      alert('Selected match not found');
      return;
    }
    
    const tournamentIdFromMatch = typeof selectedMatch.tournament === 'string' 
      ? selectedMatch.tournament 
      : selectedMatch.tournament?._id;
    
    setCreateLoading(true);
    try {
      const overlayData = {
        name: createFormData.name.trim(),
        template: createFormData.template,
        tournament: tournamentId || tournamentIdFromMatch,
        match: createFormData.match,
        config: {
          backgroundColor: '#16a34a',
          opacity: 90,
          fontFamily: 'Inter',
          position: 'top',
          showAnimations: true,
          autoUpdate: true,
        },
      };
      await overlayAPI.createOverlay(overlayData);
      setShowCreateModal(false);
      setCreateFormData({ name: '', template: '', match: '' });
      loadCreatedOverlays();
    } catch (error) {
      console.error('Failed to create overlay:', error);
      alert('Failed to create overlay. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteOverlay = async (overlayId: string) => {
    if (!confirm('Are you sure you want to delete this overlay?')) return;
    
    try {
      await overlayAPI.deleteOverlay(overlayId);
      loadCreatedOverlays();
    } catch (error) {
      console.error('Failed to delete overlay:', error);
      alert('Failed to delete overlay. Please try again.');
    }
  };

  const handleRegenerateUrl = async (overlayId: string) => {
    if (!confirm('Regenerate URL? Old URL will stop working.')) return;
    
    setRegeneratingId(overlayId);
    try {
      await overlayAPI.regenerateOverlay(overlayId);
      alert('URL regenerated! Valid for 24 hours.');
      loadCreatedOverlays();
    } catch (error) {
      console.error('Failed to regenerate URL:', error);
      alert('Failed to regenerate URL.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleCopyUrl = async (overlay: CreatedOverlay) => {
    try {
      await navigator.clipboard.writeText(overlay.publicUrl || '');
      setCopiedId(overlay._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handlePreviewOverlay = (overlay: CreatedOverlay) => {
    setPreviewOverlay(overlay);
    setShowPreviewModal(true);
  };

  const handleEditOverlay = (overlay: CreatedOverlay) => {
    setEditOverlay(overlay);
    setEditFormData({ name: overlay.name });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editOverlay || !editFormData.name.trim()) {
      alert('Please enter overlay name');
      return;
    }
    
    setEditLoading(true);
    try {
      await overlayAPI.updateOverlay(editOverlay._id, { name: editFormData.name.trim() });
      setShowEditModal(false);
      setEditOverlay(null);
      setEditFormData({ name: '' });
      loadCreatedOverlays();
    } catch (error) {
      console.error('Failed to update overlay:', error);
      alert('Failed to update overlay.');
    } finally {
      setEditLoading(false);
    }
  };

  const formatTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <>
      {tournamentId && (
        <div className="mb-6 p-4 rounded-xl border" style={{ 
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))', 
          borderColor: 'rgba(59,130,246,0.3)'
        }}>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--accent)' }}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.25 5.5c-.375 0-.75.188-1.038.5L6.5 8.25a1.25 1.25 0 002 2h3.586l-.707.707a.5 .5 0 00.854.707l1.5-1.5A1.25 1.25 0 0013.75 10H9.688l.707.707a.5 .5 0 00-.708.707l-1.5-1.5a1.25 1.25 0 00-2.076-1.167l-2.5 2.5A1.25 1.25 0 003.75 13H7a1.25 1.25 0 002.5 0V10H13a1.25 1.25 0 002.5 0v-2.5A1.25 1.25 0 0013.75 6h-3.688l-.707-.707a.5 .5 0 00.708-.707l1.5 1.5a1.25 1.25 0 002.076 1.167l2.5-2.5A1.25 1.25 0 0016.25 7V9.5A1.25 1.25 0 0115 10.75H12.5a1.25 1.25 0 01-2.5 0V9H4a1.25 1.25 0 01-2.5 0V7a1.25 1.25 0 012.5-1.25h3.688l.707.707a.5 .5 0 00-.708.707L6.5 6.75a1.25 1.25 0 002.076-1.167l2.5 2.5A1.25 1.25 0 0110.25 8v-2.5z"/></svg>
            Tournament Overlays ({matches.length} matches)
          </h2>

        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="p-4 rounded-xl border shadow-sm sticky top-4" style={{ 
              background: 'var(--bg-card)', 
              borderColor: 'var(--border)'
            }}>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-green-500/25"
              >
                <Plus className="w-5 h-5" />
                Create Overlay
              </button>
            </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Templates ({filteredOverlays.length})</h3>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white mb-4"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {templatesLoading ? (
                <p>Loading templates...</p>
              ) : filteredOverlays.map(template => (
                <div 
                  key={template.id}
                  onClick={() => {
                    setCreateFormData({...createFormData, template: template.file});
                    setSelectedTemplate(template);
                  }}
                  className={createFormData.template === template.file 
                    ? 'p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border-2 hover:border-green-400 hover:scale-[1.02] border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200'
                    : 'p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border-2 hover:border-green-400 hover:scale-[1.02] border-gray-200 dark:border-gray-700'
                  }
                >
                  <div className={`h-12 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center mb-2`}>
                    <span className="text-white font-bold text-sm tracking-wide">{template.name.substring(0,3)}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white text-center">{template.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{template.category}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-white">Live Matches ({matches.length})</h3>
              <button 
                onClick={refreshMatches}
                disabled={matchesLoading}
                className="flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg shadow-sm transition-all hover:shadow-md flex-shrink-0 ml-2"
                title="Refresh after creating new match"
              >
                {matchesLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className={`p-3 rounded-lg ${matchesLoading ? 'bg-blue-50 dark:bg-blue-900/20 animate-pulse' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
              <select 
                value={createFormData.match}
                onChange={(e) => setCreateFormData({...createFormData, match: e.target.value})}
                disabled={matchesLoading}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">{matchesLoading ? 'Loading matches...' : 'Select Live Match'}</option>
                {matches.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name ? `${m.name} - ` : ''}{m.team1?.name || 'Team 1'} vs {m.team2?.name || 'Team 2'} ({m.status || 'scheduled'})
                  </option>
                ))}
              </select>
            </div>
            {matchesLoading && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Refreshing live matches...
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 dark:text-white">My Overlays ({createdOverlays.length})</h2>
            {overlaysLoading ? (
              <p className="text-gray-500 dark:text-gray-400">Loading overlays...</p>
            ) : createdOverlays.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">No overlays created yet</p>
                <p className="text-sm text-gray-400">Click "Create Overlay" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {createdOverlays.map((overlay) => (
                  <div key={overlay._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg pr-2 truncate flex-1 min-w-0">{overlay.name}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handlePreviewOverlay(overlay)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditOverlay(overlay)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOverlay(overlay._id!)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Template: {overlay.template}</p>
                    
                    <div className="space-y-2 mb-4">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Public URL</label>
                      <div className="flex gap-1">
                        <input
                          readOnly
                          value={overlay.publicUrl || ''}
                          className="flex-1 text-xs px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 truncate"
                        />
                        <button
                          onClick={() => handleCopyUrl(overlay)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Copy URL"
                        >
                          {copiedId === overlay._id ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRegenerateUrl(overlay._id!)}
                          disabled={regeneratingId === overlay._id}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all disabled:opacity-50"
                          title="Regenerate (24h)"
                        >
                          {regeneratingId === overlay._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                        <span className={overlay.isUrlExpired
                          ? "px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        }>

                        {overlay.isUrlExpired ? '⚠️ Expired' : '✅ Active'}
                      </span>
                      {overlay.urlExpiresAt && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatTimeRemaining(overlay.urlExpiresAt)} left
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Create Overlay</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateOverlay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. Final Match Scoreboard"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Template</label>
                <select
                  value={createFormData.template}
                  onChange={(e) => setCreateFormData({...createFormData, template: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select Template</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.file}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Match</label>
                <select
                  value={createFormData.match}
                  onChange={(e) => setCreateFormData({...createFormData, match: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select Match</option>
                  {matches.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name ? `${m.name} - ` : ''}{m.team1?.name || 'Team 1'} vs {m.team2?.name || 'Team 2'} ({m.status || 'scheduled'})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Overlay
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && previewOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm rounded-t-2xl">
              <div>
                <h3 className="text-2xl font-bold text-white">{previewOverlay.name}</h3>
                <p className="text-gray-400">{previewOverlay.template} • {previewOverlay.isUrlExpired ? 'Expired' : 'Active'}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={previewOverlay.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Fullscreen
                </a>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 bg-black rounded-b-2xl overflow-hidden">
              <iframe
                ref={previewIframeRef}
                src={previewOverlay.publicUrl}
                className="w-full h-full rounded-lg border-0"
                title="Overlay Preview"
              />
            </div>
          </div>
        </div>
      )}

      {showEditModal && editOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Edit Overlay</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p><strong>Template:</strong> {editOverlay.template}</p>
                <p><strong>Status:</strong> {editOverlay.isUrlExpired ? 'Expired' : 'Active'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

