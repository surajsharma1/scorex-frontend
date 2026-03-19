import { useState, useEffect } from 'react';
import { friendAPI, userAPI } from '../services/api';
import { UserPlus, Users, Search, Check, X, UserMinus, MessageCircle, Clock, UserCheck } from 'lucide-react';

export default function FriendList() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    try {
      const [fRes, rRes] = await Promise.allSettled([friendAPI.getFriends(), friendAPI.getPendingRequests()]);
      if (fRes.status === 'fulfilled') setFriends(fRes.value.data.data || fRes.value.data || []);
      if (rRes.status === 'fulfilled') {
        const requestsData = rRes.value.data.data || rRes.value.data || { incoming: [], outgoing: [] };
        setRequests(requestsData.incoming || []);
        setSent(requestsData.outgoing || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await userAPI.searchUsers(search);
      setSearchResults(res.data.data || res.data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const sendRequest = async (userId: string) => {
    try { await friendAPI.sendRequest(userId); showToast('Friend request sent!'); doSearch(); }
    catch (e: any) { showToast(e.response?.data?.message || 'Failed to send request'); }
  };

  const accept = async (id: string) => {
    try { await friendAPI.acceptRequest(id); showToast('Friend added!'); load(); }
    catch { console.error('accept failed'); }
  };

  const reject = async (id: string) => {
    try { await friendAPI.rejectRequest(id); load(); }
    catch { console.error('reject failed'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this friend?')) return;
    try { await friendAPI.removeFriend(id); showToast('Friend removed.'); load(); }
    catch { console.error('remove failed'); }
  };

  const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) => (
    <div className={`rounded-full flex items-center justify-center text-black font-black flex-shrink-0 ${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}`}
      style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', boxShadow: '0 0 8px rgba(34,197,94,0.25)' }}>
      {(name || '?')[0]?.toUpperCase()}
    </div>
  );

  const tabs = [
    { key: 'friends', label: 'Friends', count: friends.length },
    { key: 'requests', label: 'Requests', count: requests.length },
    { key: 'search', label: 'Find People', count: 0 },
  ] as const;

  return (
    <div className="p-6 max-w-3xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* BG orb */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
          style={{ background: 'rgba(34,197,94,0.9)', color: '#fff', border: '1px solid rgba(34,197,94,0.5)', backdropFilter: 'blur(8px)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 relative">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users className="w-6 h-6 text-green-400" /> Friends
          </h1>
        </div>
        <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>Connect with cricket players around the world</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
            style={tab === t.key
              ? { background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }
              : { color: 'var(--text-secondary)' }}>
            {t.label}
            {t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                style={tab === t.key
                  ? { background: 'rgba(0,0,0,0.2)', color: '#000' }
                  : { background: 'rgba(239,68,68,0.8)', color: '#fff' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SEARCH TAB */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search by username or email..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <button onClick={doSearch} disabled={searching}
              className="px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
              {searching ? '...' : 'Search'}
            </button>
          </div>
          <div className="space-y-2">
            {searchResults.map(u => (
              <div key={u._id} className="flex items-center justify-between p-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <Avatar name={u.username} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                  </div>
                </div>
                <button onClick={() => sendRequest(u._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
                  <UserPlus className="w-3.5 h-3.5" /> Add Friend
                </button>
              </div>
            ))}
            {search && searchResults.length === 0 && !searching && (
              <div className="text-center py-10 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Search className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found for "{search}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUESTS TAB */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 && sent.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <UserCheck className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No pending requests</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>When someone sends you a request it will appear here</p>
            </div>
          ) : (
            <>
              {requests.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Incoming Requests</p>
                  <div className="space-y-2">
                    {requests.map((r: any) => (
                      <div key={r._id} className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'var(--bg-card)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <div className="flex items-center gap-3">
                          <Avatar name={r.from?.username || r.user1?.username || '?'} />
                          <div>
                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{r.from?.username || r.user1?.username}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sent you a friend request</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => accept(r._id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button onClick={() => reject(r._id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sent.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sent Requests</p>
                  <div className="space-y-2">
                    {sent.map((r: any) => (
                      <div key={r._id} className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <Avatar name={r.to?.username || r.user2?.username || '?'} />
                          <div>
                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{r.to?.username || r.user2?.username}</p>
                            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                              <Clock className="w-3 h-3" /> Pending response
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FRIENDS TAB */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No friends yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Search for players and send them a request</p>
              <button onClick={() => setTab('search')}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
                Find Friends
              </button>
            </div>
          ) : friends.map((f: any) => {
            const friend = f.user1?._id === f.user2?._id ? f.user1 : (f.user2 || f.user1 || f.from || f);
            return (
              <div key={f._id} className="flex items-center justify-between p-4 rounded-xl transition-all hover:-translate-y-0.5 group"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <Avatar name={friend.username || '?'} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{friend.username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{friend.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                    title="Message">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(f._id)}
                    className="p-2 rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                    title="Remove friend">
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
