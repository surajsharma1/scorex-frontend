import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Friend } from './types';
import { friendAPI, userAPI } from '../services/api';
import { Users, UserPlus, UserCheck, UserX, Loader, Search, UserMinus } from 'lucide-react';

type TabType = 'friends' | 'requests' | 'find';

interface FriendListProps {
  onFriendSelect?: (friend: User) => void;
}

const FriendList: React.FC<FriendListProps> = ({ onFriendSelect }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setError('');
  };

  const loadFriends = async () => {
    try {
      const response = await friendAPI.getFriends();
      const friendsArray = Array.isArray(response.data.friends) ? response.data.friends : [];
      setFriends(friendsArray);
    } catch (err) {
      setError('Failed to load friends');
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await friendAPI.getFriendRequests();
      setPendingRequests(response.data.requests);
    } catch (err) {
      setError('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendAPI.acceptFriendRequest(requestId);
      loadFriends();
      loadPendingRequests();
    } catch (err) {
      setError('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendAPI.rejectFriendRequest(requestId);
      loadPendingRequests();
    } catch (err) {
      setError('Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendAPI.removeFriend(friendId);
      loadFriends();
    } catch (err) {
      setError('Failed to remove friend');
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await userAPI.searchUsers(query);
      const usersArray = Array.isArray(response.data) ? response.data : [];
      setSearchResults(usersArray);
    } catch (err) {
      console.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await friendAPI.sendFriendRequest(userId);
      setSearchResults([]);
      setSearchQuery('');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send friend request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-8 w-8 text-blue-600 dark:text-dark-accent" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-bg-alt rounded-lg shadow-sm border border-gray-200 dark:border-dark-primary/30">
      <div className="p-4 border-b border-gray-200 dark:border-dark-primary/30">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-light flex items-center">

          <Users className="h-5 w-5 mr-2" />
          {t('friends.title', 'Friends')}
        </h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-dark-primary/30">
        <button
          onClick={() => switchTab('friends')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'friends'
              ? 'text-blue-600 dark:text-dark-accent border-b-2 border-blue-600 dark:border-dark-accent bg-blue-50 dark:bg-dark-primary/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light hover:bg-gray-50 dark:hover:bg-dark-primary/5'
          }`}
        >
          <Users className="h-4 w-4" />
          {t('friends.myFriends', 'My Friends')}
          {friends.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-dark-primary/30 rounded-full">
              {friends.length}
            </span>
          )}
        </button>
        <button
          onClick={() => switchTab('requests')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'requests'
              ? 'text-blue-600 dark:text-dark-accent border-b-2 border-blue-600 dark:border-dark-accent bg-blue-50 dark:bg-dark-primary/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light hover:bg-gray-50 dark:hover:bg-dark-primary/5'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          {t('friends.requests', 'Requests')}
          {pendingRequests.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => switchTab('find')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'find'
              ? 'text-blue-600 dark:text-dark-accent border-b-2 border-blue-600 dark:border-dark-accent bg-blue-50 dark:bg-dark-primary/10'
              : 'text-gray-500 dark:text-dark-accent/70 hover:text-gray-700 dark:hover:text-dark-light hover:bg-gray-50 dark:hover:bg-dark-primary/5'
          }`}
        >
          <Search className="h-4 w-4" />
          {t('friends.findFriends', 'Find Friends')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Friends List Tab */}
        {activeTab === 'friends' && (
          <>
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-light mb-3">
              {t('friends.myFriends', 'My Friends')} ({friends.length})
            </h3>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-dark-accent/70 text-center py-4">
            {t('friends.noFriends', 'No friends yet')}
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-primary/20 rounded-lg cursor-pointer border border-gray-100 dark:border-dark-primary/30"
                onClick={() => onFriendSelect?.(friend)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-500 dark:bg-dark-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {friend.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-light">{friend.username}</span>
                      {friend.fullName && (
                        <span className="text-xs text-gray-500 dark:text-dark-accent/70">({friend.fullName})</span>
                      )}
                    </div>
                    {friend.email && (
                      <p className="text-xs text-gray-500 dark:text-dark-accent/70">{friend.email}</p>
                    )}
                    {friend.bio && (
                      <p className="text-xs text-gray-600 dark:text-dark-accent mt-1">{friend.bio}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFriend(friend._id);
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  aria-label={`Remove ${friend.username} from friends`}
                >
                  <UserX className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          </>
        )}

        {/* Friend Requests Tab */}
        {activeTab === 'requests' && (
          <>
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-light mb-3">
              {t('friends.pendingRequests', 'Pending Requests')} ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-dark-accent/70 text-center py-8">
                {t('friends.noPendingRequests', 'No pending friend requests')}
              </p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-100 dark:border-dark-primary/30">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-300 dark:bg-dark-secondary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-dark-accent">
                          {request.from.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-light">
                          {request.from.username}
                        </span>
                        {request.from.bio && (
                          <p className="text-xs text-gray-500 dark:text-dark-accent/70">{request.from.bio}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        aria-label={`Accept friend request from ${request.from.username}`}
                      >
                        <UserCheck className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label={`Reject friend request from ${request.from.username}`}
                      >
                        <UserX className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Find Friends Tab */}
        {activeTab === 'find' && (
          <>
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-light mb-3">
              {t('friends.searchUsers', 'Search Users')}
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder={t('friends.searchPlaceholder', 'Search by username or email...')}
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-dark-primary/30 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-light"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-dark-accent/50" />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <Loader className="animate-spin h-4 w-4 text-blue-600 dark:text-dark-accent" />
                </div>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-3 max-h-60 overflow-y-auto border border-gray-200 dark:border-dark-primary/30 rounded-lg">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-dark-primary/20 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-dark-primary/20 last:border-b-0"
                    onClick={() => handleSendFriendRequest(user._id)}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-500 dark:bg-dark-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-light">{user.username}</span>
                        {user.email && (
                          <p className="text-xs text-gray-500 dark:text-dark-accent/70">{user.email}</p>
                        )}
                        {user.bio && (
                          <p className="text-xs text-gray-500 dark:text-dark-accent/70">{user.bio}</p>
                        )}
                      </div>
                    </div>
                    <UserPlus className="h-5 w-5 text-blue-600 dark:text-dark-accent" />
                  </div>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <p className="text-sm text-gray-500 dark:text-dark-accent/70 text-center py-4">
                No users found matching "{searchQuery}"
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );

};

export default FriendList;
