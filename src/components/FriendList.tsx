import { useState, useEffect } from 'react';
import { UserPlus, Check, X, Search, Users, UserCheck, UserX } from 'lucide-react';
import { friendAPI, userAPI } from '../services/api';
import { User, Friend } from './types';

export default function FriendList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const res = await friendAPI.getFriends();
      const allFriends = res.data.friends || res.data || [];
      
      // Separate accepted friends and pending requests
      const accepted = allFriends.filter((f: Friend) => f.status === 'accepted');
      const pending = allFriends.filter((f: Friend) => f.status === 'pending');
      
      setFriends(accepted);
      setPendingRequests(pending);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await userAPI.searchUsers(searchQuery);
      setSearchResults(res.data.users || res.data || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await friendAPI.sendRequest(userId);
      // Remove from search results after sending request
      setSearchResults(searchResults.filter(u => u._id !== userId));
      alert('Friend request sent!');
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const acceptRequest = async (friendId: string) => {
    try {
      await friendAPI.acceptRequest(friendId);
      loadFriends();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const rejectRequest = async (friendId: string) => {
    try {
      await friendAPI.rejectRequest(friendId);
      loadFriends();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await friendAPI.removeFriend(friendId);
      loadFriends();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  // Get the other user from a friend object
  const getOtherUser = (friend: Friend) => {
    return friend.to?._id ? friend.to : friend.from;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Friends</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === 'friends' ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === 'requests' ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('find')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === 'find' ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            Find Friends
          </button>
        </div>

        {/* Friends List */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm">Find friends to connect with!</p>
              </div>
            ) : (
              friends.map((friend) => {
                const user = getOtherUser(friend);
                return (
                  <div key={friend._id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold">{user?.username || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-400">{user?.email || ''}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFriend(friend._id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition"
                      title="Remove friend"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pending Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((friend) => {
                const user = getOtherUser(friend);
                return (
                  <div key={friend._id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold">{user?.username || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-400">Wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(friend._id)}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                        title="Accept"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => rejectRequest(friend._id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                        title="Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Find Friends */}
        {activeTab === 'find' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>
              <button
                onClick={searchUsers}
                disabled={searching}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {searchResults.map((user) => (
                <div key={user._id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                      {user.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold">{user.username}</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(user._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add
                  </button>
                </div>
              ))}
              
              {searchQuery && searchResults.length === 0 && !searching && (
                <p className="text-center text-gray-400 py-8">No users found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
