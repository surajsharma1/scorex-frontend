import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Friend } from './types';
import { friendAPI, userAPI } from '../services/api';
import { Users, UserPlus, UserCheck, UserX, Loader, Search } from 'lucide-react';

interface FriendListProps {
  onFriendSelect?: (friend: User) => void;
}

const FriendList: React.FC<FriendListProps> = ({ onFriendSelect }) => {
  const { t } = useTranslation();
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
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Users className="h-5 w-5 mr-2" />
          {t('friends.title', 'Friends')}
        </h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {t('friends.pendingRequests', 'Pending Requests')}
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {request.from.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                    {request.from.username}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request._id)}
                    className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    aria-label={`Accept friend request from ${request.from.username}`}
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request._id)}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    aria-label={`Reject friend request from ${request.from.username}`}
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Users */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {t('friends.searchUsers', 'Search Users')}
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder={t('friends.searchPlaceholder', 'Search by username or email...')}
            value={searchQuery}
            onChange={(e) => handleSearchUsers(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {searching && (
            <div className="absolute right-3 top-2.5">
              <Loader className="animate-spin h-4 w-4 text-blue-600" />
            </div>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                onClick={() => handleSendFriendRequest(user._id)}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
                    {user.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    )}
                    {user.bio && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.bio}</p>
                    )}
                  </div>
                </div>
                <UserPlus className="h-4 w-4 text-blue-600" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends List */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          {t('friends.myFriends', 'My Friends')} ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {t('friends.noFriends', 'No friends yet')}
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-100 dark:border-gray-600"
                onClick={() => onFriendSelect?.(friend)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {friend.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{friend.username}</span>
                      {friend.fullName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">({friend.fullName})</span>
                      )}
                    </div>
                    {friend.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{friend.email}</p>
                    )}
                    {friend.bio && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{friend.bio}</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendList;
