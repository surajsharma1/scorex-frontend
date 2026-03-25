import { useState, useEffect, useRef } from 'react';
import OverlayPreviewRenderer from './OverlayPreviewRenderer';
import { Eye, Plus, Save, Trash2, Edit, Copy, RefreshCw, ExternalLink, X, AlertCircle } from 'lucide-react';
import ManagerPreviewZoom from './ManagerPreviewZoom';
import { overlayAPI, matchAPI, tournamentAPI } from '../services/api';
import { CreatedOverlay, Match, Tournament } from './types';
import { getBackendBaseUrl } from '../services/env';
import { getDemoData, updatePreviewData } from '../utils/overlayPreview';

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
        <div className="mb-6 p-4 rounded-2xl flex items-center gap-3" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}>
          <div className="w-1.5 h-6 rounded-full" style={{ background: 'var(--accent)' }} />
          <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
            Tournament Overlays
            <span className="ml-2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              ({matches.length} match{matches.length !== 1 ? 'es' : ''})
            </span>
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* ── Left sidebar ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Create button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-lg shadow-md"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000', boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
          >
            <Plus className="w-4 h-4" /> Create Overlay
          </button>

          {/* Templates */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Templates <span style={{ color: 'var(--text-muted)' }}>({filteredOverlays.length})</span>
            </h3>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm mb-3 outline-none transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {templatesLoading ? (
                <div className="col-span-2 py-4 text-center">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</p>
                </div>
              ) : filteredOverlays.map(template => (
                <div
                  key={template.id}
                  onClick={() => { setCreateFormData({ ...createFormData, template: template.file }); setSelectedTemplate(template); }}
                  className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] border-2"
                  style={createFormData.template === template.file
                    ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)' }
                    : { borderColor: 'var(--border)', background: 'var(--bg-elevated)' }
                  }
                >
                  <div className={`h-10 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center mb-2`}>
                    <span className="text-white font-black text-xs">{template.name.substring(0, 3).toUpperCase()}</span>
                  </div>
                  <p className="text-xs font-semibold text-center truncate" style={{ color: 'var(--text-primary)' }}>{template.name}</p>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{template.category}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Live matches */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Live Matches <span style={{ color: 'var(--text-muted)' }}>({matches.length})</span>
              </h3>
              <button
                onClick={refreshMatches}
                className="p-1.5 rounded-lg transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                title="Refresh matches"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${matchesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <select
              value={createFormData.match}
              onChange={e => setCreateFormData({ ...createFormData, match: e.target.value })}
              disabled={matchesLoading}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">{matchesLoading ? 'Loading…' : 'Select Live Match'}</option>
              {matches.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name ? `${m.name} – ` : ''}{m.team1?.name || 'Team 1'} vs {m.team2?.name || 'Team 2'} ({m.status || 'scheduled'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── My Overlays ── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-black mb-5" style={{ color: 'var(--text-primary)' }}>
              My Overlays <span style={{ color: 'var(--text-muted)' }}>({createdOverlays.length})</span>
            </h2>

            {overlaysLoading ? (
              <div className="flex flex-col items-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading overlays…</p>
              </div>
            ) : createdOverlays.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <Eye className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>No overlays yet</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click "Create Overlay" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {createdOverlays.map(overlay => (
                  <div
                    key={overlay._id}
                    className="rounded-2xl p-4 group transition-all hover:-translate-y-0.5"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-sm pr-2 truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                        {overlay.name}
                      </h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handlePreviewOverlay(overlay)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }} title="Preview">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEditOverlay(overlay)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }} title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteOverlay(overlay._id!)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }} title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs mb-3 truncate" style={{ color: 'var(--text-muted)' }}>
                      {overlay.template}
                    </p>

                    {/* Public URL */}
                    <div className="mb-3">
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Public URL</label>
                      <div className="flex gap-1">
                        <input
                          readOnly value={overlay.publicUrl || ''}
                          className="flex-1 text-xs px-2.5 py-2 rounded-lg truncate outline-none"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        />
                        <button onClick={() => handleCopyUrl(overlay)}
                          className="p-2 rounded-lg transition-all flex-shrink-0"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: copiedId === overlay._id ? 'var(--accent)' : 'var(--text-muted)' }}
                          title="Copy URL">
                          {copiedId === overlay._id ? <span className="text-xs font-bold">✓</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleRegenerateUrl(overlay._id!)}
                          disabled={regeneratingId === overlay._id}
                          className="p-2 rounded-lg transition-all flex-shrink-0 disabled:opacity-50"
                          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}
                          title="Regenerate (24h)">
                          <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === overlay._id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-1 rounded-full font-semibold"
                        style={overlay.isUrlExpired
                          ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                          : { background: 'rgba(34,197,94,0.1)', color: 'var(--accent)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        {overlay.isUrlExpired ? '⚠ Expired' : '● Active'}
                      </span>
                      {overlay.urlExpiresAt && !overlay.isUrlExpired && (
                        <span style={{ color: 'var(--text-muted)' }}>{formatTimeRemaining(overlay.urlExpiresAt)} left</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full" style={{ background: 'var(--accent)' }} />
                <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Create Overlay</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateOverlay} className="p-5 space-y-4">
              {[
                { label: 'Overlay Name', key: 'name', type: 'input', placeholder: 'e.g. Final Match Scoreboard' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <input
                    type="text" value={createFormData.name} required
                    onChange={e => setCreateFormData({ ...createFormData, name: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Template</label>
                <select value={createFormData.template} onChange={e => setCreateFormData({ ...createFormData, template: e.target.value })} required
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  <option value="">Select Template</option>
                  {templates.map(t => <option key={t.id} value={t.file}>{t.name} ({t.category})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Match</label>
                <select value={createFormData.match} onChange={e => setCreateFormData({ ...createFormData, match: e.target.value })} required
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  <option value="">Select Match</option>
                  {matches.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name ? `${m.name} – ` : ''}{m.team1?.name || 'T1'} vs {m.team2?.name || 'T2'} ({m.status || 'scheduled'})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={createLoading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
                {createLoading
                  ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Creating…</>
                  : <><Plus className="w-4 h-4" /> Create Overlay</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {showPreviewModal && previewOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowPreviewModal(false); }}
        >
          <div className="rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', maxHeight: '90vh' }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-5 py-4 gap-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-6 rounded-full" style={{ background: 'var(--accent)' }} />
                  <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{previewOverlay.name}</h3>
                </div>
                <div className="flex items-center gap-2 ml-3.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Template:</span>
                  <select value={previewTemplate} onChange={e => setPreviewTemplate(e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold outline-none"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    {templates.map(t => <option key={t.id} value={t.file}>{t.name}</option>)}
                  </select>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={previewOverlay.isUrlExpired
                      ? { background: 'rgba(239,68,68,0.1)', color: '#f87171' }
                      : { background: 'rgba(34,197,94,0.1)', color: 'var(--accent)' }}>
                    {previewOverlay.isUrlExpired ? 'Expired' : 'Active'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { if (previewOverlay && previewTemplate !== previewOverlay.template) { if (confirm('Update overlay template permanently?')) { console.log('Would update template to:', previewTemplate); } } }}
                  disabled={!previewOverlay || previewTemplate === previewOverlay.template}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--accent)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <Save className="w-3.5 h-3.5" /> Apply
                </button>
                <a href={previewOverlay.publicUrl || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <ExternalLink className="w-3.5 h-3.5" /> Fullscreen
                </a>
                <button onClick={() => setShowPreviewModal(false)}
                  className="p-2 rounded-xl transition-all"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Controls bar — zoom + push test buttons, NO slider */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Live Preview
                </span>
              </div>

              {/* Zoom controls */}
              <ManagerPreviewZoom containerRef={previewContainerRef} />

              {/* Spacer */}
              <div className="flex-1" />

              {/* Push test buttons — 4, 6, OUT */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Test push:</span>
                <button
                  onClick={() => {
                    const data = { ...getDemoData(0.69), lastBall: 'FOUR', lastBallRuns: 4 };
                    updatePreviewData(previewContainerRef.current, data);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
                  title="Push FOUR to overlay"
                >
                  4️⃣ FOUR
                </button>
                <button
                  onClick={() => {
                    const data = { ...getDemoData(0.69), lastBall: 'SIX', lastBallRuns: 6 };
                    updatePreviewData(previewContainerRef.current, data);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}
                  title="Push SIX to overlay"
                >
                  6️⃣ SIX
                </button>
                <button
                  onClick={() => {
                    const data = { ...getDemoData(0.69), lastBall: 'WICKET', lastBallRuns: 0, wicket: true };
                    updatePreviewData(previewContainerRef.current, data);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                  title="Push WICKET to overlay"
                >
                  🎯 OUT
                </button>
              </div>
            </div>

            {/* Preview frame */}
            <div className="flex-1 overflow-hidden p-4" style={{ background: '#000', minHeight: 0 }}>
              <div
                ref={previewContainerRef}
                className="w-full h-full rounded-xl overflow-hidden"
                style={{ aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.06)', minHeight: '200px' }}
              >
                <OverlayPreviewRenderer
                  template={previewTemplate}
                  progress={previewProgress}
                  baseUrl={baseUrlLocal}
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => setPreviewError(true)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && editOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="rounded-2xl shadow-xl w-full max-w-md"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#fbbf24' }} />
                <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Edit Overlay</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input type="text" value={editFormData.name}
                  onChange={e => setEditFormData({ name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <p><span className="font-semibold">Template:</span> {editOverlay.template}</p>
                <p className="mt-1"><span className="font-semibold">Status:</span> {editOverlay.isUrlExpired ? '⚠ Expired' : '● Active'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveEdit} disabled={editLoading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
                  {editLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
                <button onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
