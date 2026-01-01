import { useState, useEffect } from 'react';
import { overlayAPI } from '../services/api';

export default function OverlayList() {
  const [overlays, setOverlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      <a href="/overlays/new" className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block">Create New</a>
      <ul className="space-y-2">
        {overlays.map((overlay) => (
          <li key={overlay._id} className="bg-white p-4 rounded shadow">
            <h3>{overlay.name}</h3>
            <a href={`/overlays/${overlay._id}/edit`} className="text-blue-500">Edit</a>
          </li>
        ))}
      </ul>
    </div>
  );
}