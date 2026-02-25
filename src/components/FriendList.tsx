import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Friend } from './types';
import { friendAPI, userAPI } from '../services/api';
import { Users, UserPlus, UserCheck, UserX, Loader, Search, MessageCircle, Check, X } from 'lucide-react';
import MessageChat from './MessageChat';

type TabType = 'friends' | 'requests' | 'find';

export default function FriendList() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, rRes] = await Promise.all([
          friendAPI.getFriends(),
          friendAPI.getPendingRequests()
      ]);
      setFriends(fRes.data.friends || []);
      setRequests(rRes.data.requests || []);
    } catch (e) {
      console.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!searchQuery) return;
      try {
          const res = await userAPI.searchUsers(searchQuery);
          setSearchResults(res.data.users || []);
      } catch(e) { console.error("Search failed"); }
  };

  const sendRequest = async (userId: string) => {
      try {
          await friendAPI.sendRequest(userId);
          alert("Friend request sent!");
      } catch(e) { alert("Failed to send request"); }
  };

  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
      try {
          if(action === 'accept') await friendAPI.acceptRequest(requestId);
          else await friendAPI.rejectRequest(requestId);
          loadData(); // Refresh list
      } catch(e) { alert("Action failed"); }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
          <Users className="text-blue-500" /> Friends & Community
      </h1>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 w-fit mb-6 border dark:border-gray-700">
          <button onClick={() => setActiveTab('friends')} className={`px-4 py-2 rounded ${activeTab === 'friends' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600'}`}>My Friends</button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded flex items-center gap-2 ${activeTab === 'requests' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600'}`}>
              Requests 
              {requests.length > 0 && <span className="bg-red-500 text-white text-xs px-2 rounded-full">{requests.length}</span>}
          </button>
          <button onClick={() => setActiveTab('find')} className={`px-4 py-2 rounded ${activeTab === 'find' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600'}`}>Find People</button>
      </div>

      {loading ? <div className="p-10 text-center"><Loader className="animate-spin mx-auto" /></div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
            
            {/* FRIENDS TAB */}
            {activeTab === 'friends' && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {friends.length === 0 && <p className="text-gray-400 p-4">No friends yet.</p>}
                    {friends.map(friend => (
                        <div key={friend._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-800">
                                    {friend.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold dark:text-white">{friend.username}</span>
                            </div>
                            <button 
                                onClick={() => setSelectedFriend(friend)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
                <div className="p-4 space-y-3">
                    {requests.length === 0 && <p className="text-gray-400 p-4">No pending requests.</p>}
                    {requests.map(req => (
                        <div key={req._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold dark:text-white">{req.from?.username || 'Unknown User'}</span>
                                <span className="text-xs text-gray-500">sent a request</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleRequest(req._id, 'accept')} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"><Check className="w-4 h-4" /></button>
                                <button onClick={() => handleRequest(req._id, 'reject')} className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FIND TAB */}
            {activeTab === 'find' && (
                <div className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                        <input 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search username..."
                            className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                            <Search className="w-4 h-4" /> Search
                        </button>
                    </form>
                    <div className="space-y-3">
                        {searchResults.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-3 border rounded dark:border-gray-700">
                                <span className="font-medium dark:text-white">{user.username}</span>
                                <button onClick={() => sendRequest(user._id)} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center gap-1">
                                    <UserPlus className="w-3 h-3" /> Add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {selectedFriend && (
          <MessageChat friend={selectedFriend} onClose={() => setSelectedFriend(null)} />
      )}
    </div>
  );
}