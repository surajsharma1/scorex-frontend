import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overlayAPI } from '../services/api';
import { Overlay } from './types';

const overlayTypes = [
  'Cricket Score Overlay',
  'Custom Overlay',
  // Add more types as needed
];

export default function OverlayList() {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOverlays = async () => {
      try {
        const response = await overlayAPI.getOverlays();
        setOverlays(response.data);
      } catch (error) {
        console.error('Failed to fetch overlays');
      } finally {
        setLoading(false);
      }
    };
    fetchOverlays();
  }, []);

  const handleCreateOverlay = async () => {
    if (!selectedType) {
      alert('Please select an overlay type');
      return;
    }
    setCreating(true);
    try {
      const overlayData = {
        name: `New ${selectedType}`,
        template: selectedType,
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
      // Refresh the list
      const response = await overlayAPI.getOverlays();
      setOverlays(response.data);
      setSelectedType('');
    } catch (error) {
      alert('Failed to create overlay');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Overlays</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Overlay Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-700 text-white"
          >
            <option value="">Select Type</option>
            {overlayTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCreateOverlay}
          disabled={creating || !selectedType}
          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {creating ? 'Creating...' : 'Create Overlay'}
        </button>
        <ul className="space-y-2">
          {(Array.isArray(overlays) ? overlays : []).map((overlay) => (
            <li key={overlay._id} className="bg-gray-700 p-4 rounded shadow">
              <h3 className="text-white">{overlay.name}</h3>
              <button onClick={() => navigate(`/overlays/${overlay._id}/edit`)} className="text-green-500">Edit</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
