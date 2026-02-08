import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Friend } from './types';
import { friendAPI } from '../services/api';
import { Users, UserPlus, UserCheck, UserX, Loader } from 'lucide-react';

interface FriendListProps {
  onFriendSelect?: (friend: User) => void;
}

const FriendList: React.FC<FriendListProps> = ({ onFriendSelect }) => {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await friendAPI.getFriends();
      setFriends(response.data.friends);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          {t('friends.title', 'Friends')}
        </h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {t('friends.pendingRequests', 'Pending Requests')}
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {request.from.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {request.from.username}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request._id)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    aria-label={`Accept friend request from ${request.from.username}`}
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request._id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
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

      {/* Friends List */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          {t('friends.myFriends', 'My Friends')} ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {t('friends.noFriends', 'No friends yet')}
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => onFriendSelect?.(friend)}
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {friend.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {friend.username}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFriend(friend._id);
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
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
