import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Edit, Trash2, Eye, Youtube, Palette } from 'lucide-react';
import { overlayAPI, tournamentAPI } from '../services/api';

interface OverlayEditorProps {
  onNavigate: (view: string) => void;
}

const OverlayEditor: React.FC<OverlayEditorProps> = ({ onNavigate }) => {
  const [overlayList, setOverlayList] = useState([]);
  const [tournamentList, setTournamentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    tournament: '',
    template: 'classic',
    config: {
      backgroundColor: '#16a34a',
      opacity: 90,
      fontFamily: 'Inter',
      position: 'top'
    },
    elements: [],
    publicId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overlaysData, tournamentsData] = await Promise.all([
        overlayAPI.getAll(),
        tournamentAPI.getAll()
      ]);
      setOverlayList(overlaysData);
      setTournamentList(tournamentsData);
    } catch (err: any) {
      setError('Failed to load data. Please check your connection.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await overlayAPI.create(formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        tournament: '',
        template: 'classic',
        config: {
          backgroundColor: '#16a34a',
          opacity: 90,
          fontFamily: 'Inter',
          position: 'top'
        },
        elements: [],
        publicId: ''
      });
      loadData();
    } catch (err: any) {
      console.error('Error creating overlay:', err);
    }
  };

  const generateYouTubeLink = async (overlayId: string) => {
    try {
      const link = await overlayAPI.generateYouTubeLink(overlayId);
      navigator.clipboard.writeText(link);
      alert('YouTube link copied to clipboard!');
    } catch (err: any) {
      console.error('Error generating YouTube link:', err);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading overlays...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">
          <Monitor className="icon" />
          Overlay Editor
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="icon" />
          Create Overlay
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Overlay</h2>
              <button 
                className="btn btn-ghost"
                onClick={() => setShowCreateForm(false)}
              >              </button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label className="form-label">Overlay Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tournament</label>
                <select
                  className="form-select"
                  value={formData.tournament}
                  onChange={(e) => setFormData({...formData, tournament: e.target.value})}
                  required
                >
                  <option value="">Select Tournament</option>
                  {tournamentList.map((tournament: any) => (
                    <option key={tournament._id} value={tournament._id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Background Color</label>
                  <input
                    type="color"
                    className="form-input"
                    value={formData.config.backgroundColor}
                    onChange={(e) => setFormData({...formData, config: {...formData.config, backgroundColor: e.target.value}})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select
                    className="form-select"
                    value={formData.config.position}
                    onChange={(e) => setFormData({...formData, config: {...formData.config, position: e.target.value}})}
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Opacity: {formData.config.opacity}%</label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="100"
                  value={formData.config.opacity}
                  onChange={(e) => setFormData({...formData, config: {...formData.config, opacity: parseInt(e.target.value)}})}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Overlay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3">
        {overlayList.map((overlay: any) => (
          <div key={overlay._id} className="card">
            <div className="card-header">
              <h3 className="card-title">{overlay.name}</h3>
              <div className="card-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSelectedOverlay(overlay)}
                >
                  <Edit className="icon" />
                </button>
                <button className="btn btn-sm btn-danger">
                  <Trash2 className="icon" />
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="overlay-preview" style={{
                backgroundColor: overlay.config.backgroundColor,
                opacity: overlay.config.opacity / 100
              }}>
                <div className="preview-text">Preview</div>
              </div>
              <div className="stat-item">
                <Palette className="icon text-blue" />
                <span>{overlay.template}</span>
              </div>
            </div>
            <div className="card-footer">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => generateYouTubeLink(overlay._id)}
              >
                <Youtube className="icon" />
                YouTube Link
              </button>
              <button className="btn btn-primary btn-sm">
                <Eye className="icon" />
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {overlayList.length === 0 && (
        <div className="empty-state">
          <Monitor className="empty-icon" />
          <h3>No overlays yet</h3>
          <p>Create your first overlay for streaming.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="icon" />
            Create Overlay
          </button>
        </div>
      )}

      {selectedOverlay && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>Edit Overlay - {(selectedOverlay as any).name}</h2>
              <button 
                className="btn btn-ghost"
                onClick={() => setSelectedOverlay(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="overlay-editor">
                <div className="editor-panel">
                  <h3>Overlay Settings</h3>
                  {/* Overlay editing controls would go here */}
                </div>
                <div className="preview-panel">
                  <h3>Live Preview</h3>
                  <div className="overlay-canvas" style={{
                    backgroundColor: (selectedOverlay as any).config.backgroundColor,
                    opacity: (selectedOverlay as any).config.opacity / 100
                  }}>
                    <div className="overlay-content">
                      Tournament Overlay Preview
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayEditor;