import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Plus, Edit, Trash2, Play } from 'lucide-react';
import { tournamentAPI } from '../services/api';

interface TournamentViewProps {
  onNavigate: (view: string) => void;
}

const TournamentView: React.FC<TournamentViewProps> = ({ onNavigate }) => {
  const [tournamentList, setTournamentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    format: 'T20',
    description: '',
    numberOfTeams: 8,
    status: 'upcoming'
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentAPI.getAll();
      setTournamentList(data);
    } catch (err: any) {
      setError('Failed to load tournaments. Please check your connection.');
      console.error('Error loading tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tournamentAPI.create(formData);
      setShowCreateForm(false);
      setFormData({ name: '', format: 'T20', description: '', numberOfTeams: 8, status: 'upcoming' });
      loadTournaments();
    } catch (err: any) {
      console.error('Error creating tournament:', err);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading tournaments...</div>
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
          <Trophy className="icon" />
          Tournaments
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="icon" />
          Create Tournament
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Tournament</h2>
              <button 
                className="btn btn-ghost"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label className="form-label">Tournament Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Format</label>
                <select
                  className="form-select"
                  value={formData.format}
                  onChange={(e) => setFormData({...formData, format: e.target.value})}
                >
                  <option value="T20">T20</option>
                  <option value="T10">T10</option>
                  <option value="ODI">ODI</option>
                  <option value="Test">Test</option>
                  <option value="The Hundred">The Hundred</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Number of Teams</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.numberOfTeams}
                  onChange={(e) => setFormData({...formData, numberOfTeams: parseInt(e.target.value)})}
                  min="2"
                  max="32"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3">
        {tournamentList.map((tournament: any) => (
          <div key={tournament._id} className="card">
            <div className="card-header">
              <h3 className="card-title">{tournament.name}</h3>
              <div className="card-actions">
                <button className="btn btn-sm btn-secondary">
                  <Edit className="icon" />
                </button>
                <button className="btn btn-sm btn-danger">
                  <Trash2 className="icon" />
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="stat-item">
                <Users className="icon text-blue" />
                <span>{tournament.numberOfTeams} Teams</span>
              </div>
              <div className="stat-item">
                <Calendar className="icon text-green" />
                <span>{tournament.format}</span>
              </div>
              <div className="stat-item">
                <Trophy className="icon text-purple" />
                <span className={`status status-${tournament.status}`}>
                  {tournament.status}
                </span>
              </div>
            </div>
            <div className="card-footer">
              <button 
                className="btn btn-primary btn-full"
                onClick={() => onNavigate('teams')}
              >
                <Play className="icon" />
                Manage Teams
              </button>
            </div>
          </div>
        ))}
      </div>

      {tournamentList.length === 0 && (
        <div className="empty-state">
          <Trophy className="empty-icon" />
          <h3>No tournaments yet</h3>
          <p>Create your first tournament to get started.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="icon" />
            Create Tournament
          </button>
        </div>
      )}
    </div>
  );
};

export default TournamentView;