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
    <div className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <h2 className="text-2xl mb-4 text-gray-900 dark:text-white">Create Team</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded shadow-md border border-gray-300 dark:border-gray-700">
        <input
          type="text"
          placeholder="Team Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
        <input
          type="color"
          placeholder="Color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded"
          required
        />

        <h3 className="text-lg mb-2 text-gray-900 dark:text-white">Players</h3>
        {formData.players.map((player, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
            <input
              type="text"
              placeholder="Player Name"
              value={player.name}
              onChange={(e) => updatePlayer(index, 'name', e.target.value)}
              className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Role (e.g., Batsman)"
              value={player.role}
              onChange={(e) => updatePlayer(index, 'role', e.target.value)}
              className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Jersey Number"
              value={player.jerseyNumber}
              onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value)}
              className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              required
            />
          </div>
        ))}
        <button type="button" onClick={addPlayer} className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600 transition-colors">
          Add Player
        </button>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}