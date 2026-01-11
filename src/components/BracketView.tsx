import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, Plus, Edit, Trash2, Play } from 'lucide-react';
import { tournamentAPI, bracketAPI } from '../services/api';

interface BracketViewProps {
  onNavigate: (view: string) => void;
}

const BracketView: React.FC<BracketViewProps> = ({ onNavigate }) => {
  const [tournamentList, setTournamentList] = useState([]);
  const [bracketList, setBracketList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tournamentsData, bracketsData] = await Promise.all([
        tournamentAPI.getAll(),
        bracketAPI.getAll()
      ]);
      setTournamentList(tournamentsData);
      setBracketList(bracketsData);
    } catch (err: any) {
      setError('Failed to load data. Please check your connection.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading brackets...</div>
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
          Tournament Brackets
        </h1>
        <button className="btn btn-primary">
          <Plus className="icon" />
          Create Bracket
        </button>
      </div>

      <div className="grid grid-cols-3">
        {bracketList.map((bracket: any) => (
          <div key={bracket._id} className="card">
            <div className="card-header">
              <h3 className="card-title">{bracket.name}</h3>
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
                <span>{bracket.numberOfTeams} Teams</span>
              </div>
              <div className="stat-item">
                <Calendar className="icon text-green" />
                <span>{bracket.type}</span>
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary btn-full">
                <Play className="icon" />
                View Bracket
              </button>
            </div>
          </div>
        ))}
      </div>

      {bracketList.length === 0 && (
        <div className="empty-state">
          <Trophy className="empty-icon" />
          <h3>No brackets yet</h3>
          <p>Create your first tournament bracket to get started.</p>
          <button className="btn btn-primary">
            <Plus className="icon" />
            Create Bracket
          </button>
        </div>
      )}
    </div>
  );
};

export default BracketView;