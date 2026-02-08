import React, { useState, useEffect } from 'react';
import { Club, User } from './types';
import api from '../services/api';

const ClubManagement: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClubs();
    loadMyClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const response = await api.get('/clubs');
      setClubs(response.data.clubs);
    } catch (error) {
      console.error('Error loading clubs:', error);
    }
  };

  const loadMyClubs = async () => {
    try {
      // This would need a backend endpoint to get user's clubs
      // For now, we'll filter from all clubs
      const response = await api.get('/clubs');
      // In a real implementation, you'd have an endpoint like /api/clubs/my
      setMyClubs(response.data.clubs.filter((club: Club) => club.members.includes('currentUserId')));
    } catch (error) {
      console.error('Error loading my clubs:', error);
    }
  };

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/clubs', newClub);
      setNewClub({ name: '', description: '' });
      setShowCreateForm(false);
      loadClubs();
      loadMyClubs();
    } catch (error) {
      console.error('Error creating club:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinClub = async (clubId: string) => {
    try {
      await api.post(`/clubs/${clubId}/join`);
      loadClubs();
      loadMyClubs();
    } catch (error) {
      console.error('Error joining club:', error);
    }
  };

  const leaveClub = async (clubId: string) => {
    try {
      await api.post(`/clubs/${clubId}/leave`);
      loadClubs();
      loadMyClubs();
    } catch (error) {
      console.error('Error leaving club:', error);
    }
  };

  const updateClub = async (clubId: string, updates: Partial<Club>) => {
    try {
      await api.put(`/clubs/${clubId}`, updates);
      loadClubs();
      loadMyClubs();
      setSelectedClub(null);
    } catch (error) {
      console.error('Error updating club:', error);
    }
  };

  const deleteClub = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club?')) return;
    try {
      await api.delete(`/clubs/${clubId}`);
      loadClubs();
      loadMyClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clubs</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create Club'}
        </button>
      </div>

      {/* Create Club Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Club</h2>
          <form onSubmit={createClub} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Club Name
              </label>
              <input
                type="text"
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newClub.description}
                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Club'}
            </button>
          </form>
        </div>
      )}

      {/* My Clubs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">My Clubs</h2>
        {myClubs.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">You haven't joined any clubs yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClubs.map((club) => (
              <div key={club._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{club.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedClub(club)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => leaveClub(club._id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Leave
                    </button>
                  </div>
                </div>
                {club.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{club.description}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {club.members.length} member{club.members.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Clubs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Discover Clubs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <div key={club._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{club.name}</h3>
              {club.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">{club.description}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                {club.members.length} member{club.members.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => joinClub(club._id)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Join Club
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Club Modal */}
      {selectedClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit Club</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                updateClub(selectedClub._id, {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Club Name
                </label>
                <input
                  name="name"
                  defaultValue={selectedClub.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedClub.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedClub(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => deleteClub(selectedClub._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete Club
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubManagement;
