import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overlayAPI, tournamentAPI } from '../services/api';
import { Tournament } from './types';

export default function OverlayForm() {
  const [formData, setFormData] = useState({ name: '', template: '', tournament: '' });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await tournamentAPI.getTournaments();
        setTournaments(response.data);
      } catch (error) {
        console.error('Failed to fetch tournaments');
      }
    };
    fetchTournaments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tournament) {
      alert('Please select a tournament');
      return;
    }
    setLoading(true);
    try {
      const overlayData = {
        ...formData,
        config: {
          backgroundColor: '#16a34a',
          opacity: 90,
          fontFamily: 'Inter',
          position: 'top',
          showAnimations: true,
          autoUpdate: true,
        },
        elements: [],
      };
      await overlayAPI.createOverlay(overlayData);
      navigate('/overlays');
    } catch (error) {
      alert('Failed to create overlay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Create Overlay</h2>
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
          placeholder="Template"
          value={formData.template}
          onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
        />
        <select
          value={formData.tournament}
          onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
          className="w-full p-2 mb-4 border rounded"
          required
        >
          <option value="">Select Tournament</option>
          {tournaments.map((tournament) => (
            <option key={tournament._id} value={tournament._id}>
              {tournament.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}