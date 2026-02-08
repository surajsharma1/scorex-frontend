import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Club, User } from './types';
import { clubAPI, userAPI } from '../services/api';
import { Users, Plus, Settings, UserMinus, UserPlus, Loader } from 'lucide-react';

const ClubManagement: React.FC = () => {
  const { t } = useTranslation();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const response = await clubAPI.getClubs();
      const clubsArray = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.clubs) ? response.data.clubs : []);
      setClubs(clubsArray);
      // Filter clubs where user is a member or creator
      // Note: This would need actual user ID from auth context
      setMyClubs(clubsArray.filter((club: Club) => club.members.includes('currentUserId') || club.createdBy === 'currentUserId'));
    } catch (err) {
      setError('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clubAPI.createClub(newClub);
      setNewClub({ name: '', description: '' });
      setShowCreateForm(false);
      loadClubs();
    } catch (err) {
      setError('Failed to create club');
    }
  };

  const handleJoinClub = async (clubId: string) => {
    try {
      await clubAPI.joinClub(clubId);
      loadClubs();
    } catch (err) {
      setError('Failed to join club');
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    try {
      await clubAPI.leaveClub(clubId);
      loadClubs();
    } catch (err) {
      setError('Failed to leave club');
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await userAPI.searchUsers(query);
      const usersArray = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.users) ? response.data.users : []);
      setSearchResults(usersArray);
    } catch (err) {
      console.error('Search failed');
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedClub) return;
    // This would need a backend endpoint to add members
    // For now, just close the modal
    setSelectedClub(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="h-8 w-8 mr-3" />
          {t('clubs.title', 'Club Management')}
        </h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('clubs.create', 'Create Club')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Create Club Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('clubs.createNew', 'Create New Club')}</h2>
          <form onSubmit={handleCreateClub} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('clubs.name', 'Club Name')}
              </label>
              <input
                type="text"
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('clubs.description', 'Description')}
              </label>
              <textarea
                value={newClub.description}
                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {t('common.create', 'Create')}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Clubs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('clubs.myClubs', 'My Clubs')} ({myClubs.length})
          </h2>
        </div>
        <div className="p-4">
          {myClubs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {t('clubs.noClubs', 'You are not a member of any clubs yet')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClubs.map((club) => (
                <div key={club._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{club.name}</h3>
                    <button
                      onClick={() => setSelectedClub(club)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{club.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>{club.members.length} {t('clubs.members', 'members')}</span>
                    <button
                      onClick={() => handleLeaveClub(club._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      {t('clubs.leave', 'Leave')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Clubs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('clubs.allClubs', 'All Clubs')} ({clubs.length})
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club) => (
              <div key={club._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{club.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{club.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {club.members.length} {t('clubs.members', 'members')}
                  </span>
                  <button
                    onClick={() => handleJoinClub(club._id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    {t('clubs.join', 'Join')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {selectedClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('clubs.addMembers', 'Add Members to')} {selectedClub.name}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('clubs.searchUsers', 'Search users...')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchUsers(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {searchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                      onClick={() => handleAddMember(user._id)}
                    >
                      <span className="text-gray-900 dark:text-white">{user.username}</span>
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSelectedClub(null);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubManagement;
