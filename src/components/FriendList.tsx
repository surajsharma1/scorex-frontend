import { useState, useEffect } from 'react';
import { friendAPI, userAPI } from '../services/api';
import { UserPlus, Users, Search, Check, X, UserMinus } from 'lucide-react';

export default function FriendList() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');

  const load = async () => {
    try {
      const [fRes, rRes] = await Promise.all([friendAPI.getFriends(), friendAPI.getPendingRequests()]);
      setFriends(fRes.data.data || fRes.data || []);
      setRequests(rRes.data.data || rRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const doSearch = async () => {
    if (!search.trim()) return;
    try {
      const res = await userAPI.searchUsers(search);
      setSearchResults(res.data.data || res.data || []);
    } catch (e) { setSearchResults([]); }
  };

  const sendRequest = async (userId: string) => {
    try { await friendAPI.sendRequest(userId); doSearch(); }
    catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
  };

  const accept = async (id: string) => {
    try { await friendAPI.acceptRequest(id); await load(); }
    catch (e) { console.error(e); }
  };

  const reject = async (id: string) => {
    try { await friendAPI.rejectRequest(id); await load(); }
    catch (e) { console.error(e); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this friend?')) return;
    try { await friendAPI.removeFriend(id); await load(); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-blue-400" /> Friends</h1>

      <div className="flex gap-1 border-b border-slate-800 mb-6">
        {(['friends', 'requests', 'search'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t}{t === 'requests' && requests.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">{requests.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search by username or email..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={doSearch} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all">Search</button>
          </div>
          <div className="space-y-2">
            {searchResults.map(u => (
              <div key={u._id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{u.username}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </div>
                </div>
                <button onClick={() => sendRequest(u._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-400 text-xs font-semibold rounded-lg transition-all">
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-600">No pending friend requests</div>
          ) : requests.map((r: any) => (
            <div key={r._id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {(r.from?.username || r.user1?.username || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{r.from?.username || r.user1?.username}</p>
                  <p className="text-slate-500 text-xs">Sent you a friend request</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => accept(r._id)}
                  className="p-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/40 text-green-400 rounded-lg transition-all">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => reject(r._id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-400 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'friends' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No friends yet</p>
              <button onClick={() => setTab('search')} className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-semibold">Find friends →</button>
            </div>
          ) : friends.map((f: any) => {
            const friend = f.user1 || f.from || f;
            return (
              <div key={f._id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {(friend.username || '?')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{friend.username}</p>
                    <p className="text-slate-500 text-xs">{friend.email}</p>
                  </div>
                </div>
                <button onClick={() => remove(f._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all">
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
