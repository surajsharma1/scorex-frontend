import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overlayAPI } from '../services/api';
import { Overlay } from './types';

export default function OverlayList() {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Overlays</h2>
      <button onClick={() => navigate('/overlays/new')} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Create New</button>
      <ul className="space-y-2">
        {(Array.isArray(overlays) ? overlays : []).map((overlay) => (
          <li key={overlay._id} className="bg-white p-4 rounded shadow">
            <h3>{overlay.name}</h3>
            <button onClick={() => navigate(`/overlays/${overlay._id}/edit`)} className="text-blue-500">Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}