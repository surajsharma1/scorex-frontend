import { useState, useEffect, useRef } from 'react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import { Eye, Plus, Save, Trash2, Edit, Copy, RefreshCw, ExternalLink, X, AlertCircle } from 'lucide-react';
import ManagerPreviewZoom from './ManagerPreviewZoom';
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
  const [previewTemplate, setPreviewTemplate] = useState<string>('');


  const [previewProgress, setPreviewProgress] = useState(50);

  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOverlay, setEditOverlay] = useState<CreatedOverlay | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '' });
  const [editLoading, setEditLoading] = useState(false);
  
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

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
          cats.push({ value: cat, label: `${cat.replace('Scoreboard', 'Level 1 - Scoreboard').replace('Replay/Effects', 'Level 2 - Replay/Effects')}` });
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
    setPreviewTemplate(overlay.template);
    const backendBase = baseUrlLocal;
    setPreviewTemplate(overlay.template);
    setPreviewLoading(true);
    setPreviewError(false);
    setShowPreviewModal(true);
  };

  // Preview renderer handles template/progress internally
  useEffect(() => {}, [previewTemplate, previewProgress]);

  // Renderer auto-refreshes

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

          <div className="bg-slate-800/50 dark:bg-slate-800/50 p-6 rounded-xl shadow-sm border border-slate-700/50 backdrop-blur-xl">
            <h3 className="text-lg font-bold mb-4 text-slate-200">Templatest ({filteredOverlays.length})</h3>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-slate-600 bg-slate-700/50 text-slate-200 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {templatesLoading ? (
                <p className="text-slate-400">Loading templates...</p>
              ) : filteredOverlays.map(template => (
                <div 
                  key={template.id}
                  onClick={() => {
                    setCreateFormData({...createFormData, template: template.file});
                    setSelectedTemplate(template);
                  }}
                  className={createFormData.template === template.file 
                    ? 'p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border-2 hover:border-emerald-400 hover:scale-[1.02] border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-400/50'
                    : 'p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border-2 hover:border-emerald-400 hover:scale-[1.02] border-slate-600'
                  }
                >
                  <div className={`h-12 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center mb-2 shadow-lg`}>
                    <span className="text-white font-bold text-sm tracking-wide">{template.name.substring(0,3)}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 text-center">{template.name}</p>
                  <p className="text-xs text-slate-400 text-center">{template.category}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl shadow-sm border border-slate-700/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-200">Live Matches ({matches.length})</h3>
              <button
                className="flex items-center gap-1 px-3 py-2 bg-blue-500/80 hover:bg-blue-600 disabled:bg-blue-400/60 text-slate-100 text-sm font-semibold rounded-lg shadow-sm transition-all hover:shadow-md flex-shrink-0 ml-2 backdrop-blur-sm"
                title="Refresh after creating new match"
              >
                {matchesLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className={`p-3 rounded-lg border border-slate-600/50 ${matchesLoading ? 'bg-blue-500/10 animate-pulse' : 'bg-slate-700/30'}`} style={{backdropFilter: 'blur(10px)'}}>
              <select 
                value={createFormData.match}
                onChange={(e) => setCreateFormData({...createFormData, match: e.target.value})}
                disabled={matchesLoading}
                className="w-full p-3 border border-slate-600 bg-slate-700/50 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-600/50 disabled:cursor-not-allowed disabled:opacity-60"
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
              <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Refreshing live matches...
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-800/70 p-6 rounded-xl shadow-lg border border-slate-700/70 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 text-slate-200">My Overlays ({createdOverlays.length})</h2>
            {overlaysLoading ? (
              <p className="text-slate-400">Loading overlays...</p>
            ) : createdOverlays.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-600">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-4">No overlays created yet</p>
                <p className="text-sm text-slate-500">Click "Create Overlay" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {createdOverlays.map((overlay) => (
                  <div key={overlay._id} className="border border-slate-700/70 rounded-lg p-5 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all bg-slate-800/50 backdrop-blur-sm group">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-slate-200 text-lg pr-2 truncate flex-1 min-w-0">{overlay.name}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handlePreviewOverlay(overlay)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditOverlay(overlay)}
                          className="p-2 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOverlay(overlay._id!)}
                          className="p-2 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">Template: {overlay.template}</p>
                    
                    <div className="space-y-2 mb-4">
                      <label className="block text-xs font-medium text-slate-400 mb-1">Public URL</label>
                      <div className="flex gap-1">
                        <input
                          readOnly
                          value={overlay.publicUrl || ''}
                          className="flex-1 text-xs px-3 py-2 bg-slate-700/70 border border-slate-600 text-slate-200 rounded-lg truncate"
                        />
                        <button
                          onClick={() => handleCopyUrl(overlay)}
                          className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors border border-slate-600"
                          title="Copy URL"
                        >
                          {copiedId === overlay._id ? (
                            <span className="text-emerald-400 font-bold">✓</span>
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRegenerateUrl(overlay._id!)}
                          disabled={regeneratingId === overlay._id}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all disabled:opacity-50 border border-blue-500/30"
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
                          ? "px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30"
                          : "px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }>

                        {overlay.isUrlExpired ? '⚠️ Expired' : '✅ Active'}
                      </span>
                      {overlay.urlExpiresAt && (
                        <span className="text-slate-500">
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

      {/* Modals remain unchanged - already themed */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-200">Create Overlay</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateOverlay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Name</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 text-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g. Final Match Scoreboard"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Template</label>
                <select
                  value={createFormData.template}
                  onChange={(e) => setCreateFormData({...createFormData, template: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 text-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Select Template</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.file}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Match</label>
                <select
                  value={createFormData.match}
                  onChange={(e) => setCreateFormData({...createFormData, match: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 text-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
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
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-slate-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm rounded-t-2xl gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-slate-200">{previewOverlay?.name}</h3>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Template:</span>
                  <select 
                    value={previewTemplate} 
                    onChange={(e) => setPreviewTemplate(e.target.value)}
                    className="px-3 py-1 bg-slate-700/50 border border-slate-600 text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.file}>{t.name}</option>
                    ))}
                  </select>
                  <span>• {previewOverlay?.isUrlExpired ? 'Expired' : 'Active'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (previewOverlay && previewTemplate !== previewOverlay.template) {
                      if (confirm('Update overlay template permanently?')) {
                        // TODO: PATCH api.overlays/{id} {template: previewTemplate}
                        console.log('Would update template to:', previewTemplate);
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-100 rounded-xl font-medium transition-all shadow-lg"
                  disabled={!previewOverlay || previewTemplate === previewOverlay.template}
                >
                  <Save className="w-4 h-4" />
                  Apply Template
                </button>
                <a
                  href={previewOverlay?.publicUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-100 rounded-xl font-medium transition-all shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Fullscreen
                </a>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400 hover:text-slate-200" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 bg-black rounded-b-2xl overflow-hidden relative flex flex-col">
              <div className="mb-4 p-4 bg-gradient-to-br from-slate-900/80 to-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Eye className="w-4 h-4" />Live Preview
                    </p>
                    <div className="flex gap-1">
                      <ManagerPreviewZoom containerRef={previewContainerRef} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Zoom:</span>
                    <span id="manager-zoom-display" className="font-bold text-blue-400">--%</span>
                    <label className="text-xs font-semibold text-slate-300">Progress:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="4"
                      value={previewProgress}
                      onChange={(e) => setPreviewProgress(Number(e.target.value))}
                      className="flex-1 h-3 bg-slate-700 rounded-lg cursor-pointer appearance-none accent-emerald-500 hover:accent-emerald-600 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full shadow-lg hover:shadow-md transition-all"
                    />
                    <span className="font-mono text-sm font-bold text-emerald-400 w-12 text-right">{previewProgress}%</span>
                  </div>
                </div>
              </div>
              <div ref={previewContainerRef} className="preview-container rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/50 hover:border-blue-500/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 flex-1 relative">
                <div className="preview-scale-fallback preview-scale">
                  <OverlayPreviewRenderer
                    template={previewTemplate}
                    progress={previewProgress}
                    baseUrl={baseUrlLocal}
                    onLoad={() => setPreviewLoading(false)}
                    onError={(err) => setPreviewError(true)}
                  />
                </div>
                {previewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    <div className="text-center">
                      <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
                      <p className="text-slate-300 text-lg">Loading overlay preview...</p>
                    </div>
                  </div>
                )}
                {previewError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/95 backdrop-blur-sm">
                    <div className="text-center p-8 rounded-2xl border-2 border-red-500/50 max-w-md bg-slate-900/50">
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                      <h3 className="text-xl font-bold text-white mb-4">Preview Failed</h3>
                      <p className="text-slate-300 mb-6">
                        Backend unreachable (template: {previewTemplate})
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button 
                          onClick={() => window.open(previewSrc, '_blank')}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
                        >
                          Open Direct
                        </button>
                        <button 
                          onClick={() => {
                            setIframeLoading(true);
                            setIframeError(false);
                            setTimeout(() => previewIframeRef.current?.contentWindow?.postMessage({type: 'scorex:refresh'}, '*'), 500);
                          }}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-200">Edit Overlay</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-800 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="text-sm text-slate-400 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p><strong>Template:</strong> {editOverlay.template}</p>
                <p><strong>Status:</strong> {editOverlay.isUrlExpired ? 'Expired' : 'Active'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-slate-100 font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-xl transition-all"
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

