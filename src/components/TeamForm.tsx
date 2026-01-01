import { useState } from 'react';
import { teamAPI } from '../services/api';

export default function TeamForm() {
  const [formData, setFormData] = useState({ name: '', color: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await teamAPI.createTeam(formData);
      alert('Team created!');
      window.location.href = '/teams';
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
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
        />
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}