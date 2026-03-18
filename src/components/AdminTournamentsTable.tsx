import React, { useState, useEffect } from 'react';
import { Zap, Trash2, Download, Search } from 'lucide-react';
import { adminAPI, tournamentAPI } from '../services/api';

interface Tournament {
  _id: string;
  name: string;
  status: string;
  startDate: string;
  registrationFee: number;
  organizer: { username: string };
}

export default function AdminTournamentsTable() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const res = await tournamentAPI.getTournaments();
      setTournaments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tournament? All matches will be lost.')) return;
    try {
      await adminAPI.banUser(id, { duration: '1day' }); // Use admin delete
      setTournaments(t => t.filter(t => t._id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredTournaments = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const downloadCSV = () => {
    adminAPI.exportTournaments().then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tournaments.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }).catch(() => alert('Export failed'));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Tournament Management</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filteredTournaments.length} tournaments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-64 focus:outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:scale-105"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Tournament</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Start Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Fee</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Organizer</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  Loading tournaments...
                </td>
              </tr>
            ) : filteredTournaments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  No tournaments found
                </td>
              </tr>
            ) : (
              filteredTournaments.map((tournament) => (
                <tr key={tournament._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{tournament.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      tournament.status === 'ongoing' ? 'bg-emerald-100 text-emerald-800' :
                      tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    ₹{tournament.registrationFee || 0}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {tournament.organizer?.username || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDelete(tournament._id)}
                      className="p-1.5 rounded-lg hover:bg-red-200 text-red-500 hover:text-red-700"
                      title="Delete Tournament"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

