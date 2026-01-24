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
    <div className="p-6">
      <h2 className="text-2xl mb-4">Create Team</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <input
          type="text"
          placeholder="Team Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="color"
          placeholder="Color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <h3 className="text-lg mb-2">Players</h3>
        {formData.players.map((player, index) => (
          <div key={index} className="mb-4 p-4 border rounded">
            <input
              type="text"
              placeholder="Player Name"
              value={player.name}
              onChange={(e) => updatePlayer(index, 'name', e.target.value)}
              className="w-full p-2 mb-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Role (e.g., Batsman)"
              value={player.role}
              onChange={(e) => updatePlayer(index, 'role', e.target.value)}
              className="w-full p-2 mb-2 border rounded"
              required
            />
            <input
              type="number"
              placeholder="Jersey Number"
              value={player.jerseyNumber}
              onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value)}
              className="w-full p-2 mb-2 border rounded"
              required
            />
          </div>
        ))}
        <button type="button" onClick={addPlayer} className="bg-gray-500 text-white px-4 py-2 rounded mr-2">
          Add Player
        </button>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}