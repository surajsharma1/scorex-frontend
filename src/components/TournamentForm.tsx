import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../services/api';

export default function TeamForm() {
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    players: [{ name: '', role: '', jerseyNumber: '' }],
  });
  const [loading, setLoading] = useState(false);                                                                                                                                                                                                                                          
  const navigate = useNavigate();

  const addPlayer = () => {
    setFormData({
      ...formData,
      players: [...formData.players, { name: '', role: '', jerseyNumber: '' }],
    });
  };

  const updatePlayer = (index: number, field: string, value: string) => {
    const updatedPlayers = [...formData.players];
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
    setFormData({ ...formData, players: updatedPlayers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await teamAPI.createTeam(formData);
      navigate('/teams');
    } catch (error) {
      alert('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-light-bg-alt dark:bg-dark-bg text-light-dark dark:text-dark-light min-h-screen">
      <h2 className="text-2xl mb-4 text-light-dark dark:text-dark-light">Create Team</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-bg-alt p-6 rounded shadow-md border border-light-secondary/30 dark:border-dark-primary/30">
        <input
          type="text"
          placeholder="Team Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 mb-4 border border-light-secondary/30 dark:border-dark-primary/30 rounded bg-white dark:bg-dark-bg text-light-dark dark:text-dark-light focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input
          type="color"
          placeholder="Color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-full p-2 mb-4 border border-light-secondary/30 dark:border-dark-primary/30 rounded cursor-pointer"
          required
        />

        <h3 className="text-lg mb-2 text-light-dark dark:text-dark-light">Players</h3>
        {formData.players.map((player, index) => (
          <div key={index} className="mb-4 p-4 border border-light-secondary/30 dark:border-dark-primary/30 rounded bg-light-bg dark:bg-dark-bg">
            <input
              type="text"
              placeholder="Player Name"
              value={player.name}
              onChange={(e) => updatePlayer(index, 'name', e.target.value)}
              className="w-full p-2 mb-2 border border-light-secondary/30 dark:border-dark-primary/30 rounded bg-white dark:bg-dark-bg text-light-dark dark:text-dark-light focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Role (e.g., Batsman)"
              value={player.role}
              onChange={(e) => updatePlayer(index, 'role', e.target.value)}
              className="w-full p-2 mb-2 border border-light-secondary/30 dark:border-dark-primary/30 rounded bg-white dark:bg-dark-bg text-light-dark dark:text-dark-light focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Jersey Number"
              value={player.jerseyNumber}
              onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value)}
              className="w-full p-2 mb-2 border border-light-secondary/30 dark:border-dark-primary/30 rounded bg-white dark:bg-dark-bg text-light-dark dark:text-dark-light focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        ))}
        <button type="button" onClick={addPlayer} className="btn-secondary mr-2">
          Add Player
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}