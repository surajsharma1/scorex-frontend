import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, UserPlus, Shield } from 'lucide-react';
import { teamAPI, tournamentAPI } from '../services/api';

interface TeamManagementProps {
  onNavigate: (view: string) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ onNavigate }) => {
  const [teamList, setTeamList] = useState([]);
  const [tournamentList, setTournamentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    tournament: '',
    color: '#16a34a'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, tournamentsData] = await Promise.all([
        teamAPI.getAll(),
        tournamentAPI.getAll()
      ]);
      setTeamList(teamsData);
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
      await teamAPI.create(formData);
      setShowCreateForm(false);
      setFormData({ name: '', tournament: '', color: '#16a34a' });
      loadData();
    } catch (err: any) {
      console.error('Error creating team:', err);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading teams...</div>
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
          <Users className="icon" />
          Team Management
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="icon" />
          Create Team
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Team</h2>
              <button 
                className="btn btn-ghost"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label className="form-label">Team Name</label>
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
              <div className="form-group">
                <label className="form-label">Team Color</label>
                <input
                  type="color"
                  className="form-input"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3">
        {teamList.map((team: any) => (
          <div key={team._id} className="card">
            <div className="card-header">
              <div className="team-header">
                <div 
                  className="team-color" 
                  style={{ backgroundColor: team.color }}
                ></div>
                <h3 className="card-title">{team.name}</h3>
              </div>
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
                <span>{team.players?.length || 0} Players</span>
              </div>
              <div className="stat-item">
                <Shield className="icon text-green" />
                <span>Active</span>
              </div>
            </div>
            <div className="card-footer">
              <button 
                className="btn btn-primary btn-full"
                onClick={() => {
                  setSelectedTeam(team);
                }}
              >
                <UserPlus className="icon" />
                Manage Players
              </button>
            </div>
          </div>
        ))}
      </div>

      {teamList.length === 0 && (
        <div className="empty-state">
          <Users className="empty-icon" />
          <h3>No teams yet</h3>
          <p>Create your first team to get started.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="icon" />
            Create Team
          </button>
        </div>
      )}

      {selectedTeam && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>Manage Players - {(selectedTeam as any).name}</h2>
              <button 
                className="btn btn-ghost"
                onClick={() => setSelectedTeam(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="players-grid">
                {(selectedTeam as any).players?.map((player: any) => (
                  <div key={player._id} className="player-card">
                    <div className="player-info">
                      <h4>{player.name}</h4>
                      <span className="player-role">{player.role}</span>
                      <span className="player-number">#{player.jerseyNumber}</span>
                    </div>
                    <div className="player-actions">
                      <button className="btn btn-sm btn-secondary">
                        <Edit className="icon" />
                      </button>
                      <button className="btn btn-sm btn-danger">
                        <Trash2 className="icon" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="player-card add-player">
                  <button className="btn btn-ghost btn-full">
                    <Plus className="icon" />
                    Add Player
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;