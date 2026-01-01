import { useState } from 'react';
import { overlayAPI } from '../services/api';

export default function OverlayForm() {
  const [formData, setFormData] = useState({ name: '', template: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await overlayAPI.createOverlay(formData);
      alert('Overlay created!');
      window.location.href = '/overlays';
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
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}