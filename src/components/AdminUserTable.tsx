import React, { useState, useEffect, useCallback } from 'react';
import { Users, Download, Search, Edit3, X, CheckCircle, AlertCircle, Ban, ShieldCheck, Crown, Star, Zap, RefreshCw } from 'lucide-react';
import { adminAPI } from '../services/api';

interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  role: string;
  membershipLevel: number;
  membershipExpiresAt?: string;
  createdAt: string;
  banned?: { until: string; reason?: string };
}

interface Toast { id: number; msg: string; type: 'success' | 'error' }

export default function AdminUserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [actionLoading, setActionLoading] = useState('');

  // Modal form state
  const [banDuration, setBanDuration] = useState('1week');
  const [banReason, setBanReason] = useState('');
  const [memLevel, setMemLevel] = useState<1 | 2>(1);
  const [memDuration, setMemDuration] = useState('1month');

  const toast = useCallback((msg: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.data || []);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to load users', 'error');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(u => u.map(x => x._id === userId ? { ...x, role: newRole } : x));
      toast('Role updated successfully', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleBan = async () => {
    if (!selectedUser) return;
    setActionLoading('ban');
    try {
      await adminAPI.banUser(selectedUser._id, { duration: banDuration, reason: banReason });
      toast(`${selectedUser.username} banned for ${banDuration}`, 'success');
      setShowModal(false); setBanReason('');
      loadUsers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Ban failed', 'error');
    } finally { setActionLoading(''); }
  };

  const handleUnban = async () => {
    if (!selectedUser) return;
    setActionLoading('unban');
    try {
      await adminAPI.unbanUser(selectedUser._id);
      toast(`${selectedUser.username} unbanned`, 'success');
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Unban failed', 'error');
    } finally { setActionLoading(''); }
  };

  const handleAssignMembership = async () => {
    if (!selectedUser) return;
    setActionLoading('membership');
    try {
      await adminAPI.assignMembership(selectedUser._id, { level: memLevel, duration: memDuration });
      toast(`Membership assigned to ${selectedUser.username}`, 'success');
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Assignment failed', 'error');
    } finally { setActionLoading(''); }
  };

  const handleExport = () => {
    adminAPI.exportUsers().then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'scorex-users.csv';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast('Users exported', 'success');
    }).catch(() => toast('Export failed', 'error'));
  };

  const isBanned = (u: User) => {
    if (!u.banned?.until) return false;
    return new Date(u.banned.until) > new Date();
  };

  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const membershipColor = (level: number) => ({
    bg: level === 2 ? 'rgba(168,85,247,0.15)' : level === 1 ? 'rgba(34,197,94,0.15)' : 'var(--bg-elevated)',
    color: level === 2 ? '#a855f7' : level === 1 ? '#22c55e' : 'var(--text-muted)',
    border: level === 2 ? 'rgba(168,85,247,0.3)' : level === 1 ? 'rgba(34,197,94,0.3)' : 'var(--border)',
    label: level === 2 ? 'Enterprise' : level === 1 ? 'Premium' : 'Free',
    icon: level === 2 ? Crown : level === 1 ? Star : Zap,
  });

  const roleColor = (role: string) => ({
    bg: role === 'admin' ? 'rgba(239,68,68,0.15)' : role === 'organizer' ? 'rgba(59,130,246,0.15)' : 'var(--bg-elevated)',
    color: role === 'admin' ? '#f87171' : role === 'organizer' ? '#60a5fa' : 'var(--text-muted)',
    border: role === 'admin' ? 'rgba(239,68,68,0.3)' : role === 'organizer' ? 'rgba(59,130,246,0.3)' : 'var(--border)',
  });

  const inp = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="space-y-4">
      {/* Toast stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl pointer-events-auto animate-in slide-in-from-right"
            style={{ background: t.type === 'success' ? 'rgba(34,197,94,0.92)' : 'rgba(239,68,68,0.92)', color: '#fff', backdropFilter: 'blur(12px)', minWidth: '240px' }}>
            {t.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filteredUsers.length} users total</p>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-56 focus:outline-none transition-all"
              style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <button onClick={loadUsers} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white shadow-lg hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['User', 'Email', 'Role', 'Membership', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading users…</p>
              </td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found</p>
              </td></tr>
            ) : filteredUsers.map(user => {
              const mem = membershipColor(user.membershipLevel);
              const role = roleColor(user.role);
              const banned = isBanned(user);
              const MemIcon = mem.icon;
              return (
                <tr key={user._id} className="transition-colors group" style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                        style={{ background: banned ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                          {user.username}
                          {banned && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">BANNED</span>}
                        </div>
                        {user.fullName && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.fullName}</div>}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</td>

                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                      {user.role}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit" style={{ background: mem.bg, color: mem.color, border: `1px solid ${mem.border}` }}>
                      <MemIcon className="w-3 h-3" /> {mem.label}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A'}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        onChange={e => { if (e.target.value) { updateRole(user._id, e.target.value); e.target.value = ''; } }}
                        className="text-xs px-2.5 py-1.5 rounded-lg focus:outline-none transition-all cursor-pointer"
                        style={inp}
                        defaultValue=""
                      >
                        <option value="" disabled>Role…</option>
                        {['viewer', 'organizer', 'admin'].map(r => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => { setSelectedUser(user); setBanReason(''); setShowModal(true); }}
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        title="Manage user"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Manage User Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>{selectedUser.username}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl transition-all hover:scale-110"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5">
              {/* Ban/Unban */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                  <Ban className="w-4 h-4 text-red-400" />
                  <h4 className="font-bold text-sm text-red-400">Ban Management</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Duration</label>
                    <select value={banDuration} onChange={e => setBanDuration(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-sm focus:outline-none transition-all" style={inp}
                      onFocus={e => (e.target.style.borderColor = '#ef4444')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                      <option value="1day">1 Day</option>
                      <option value="3day">3 Days</option>
                      <option value="1week">1 Week</option>
                      <option value="1month">1 Month</option>
                      <option value="3month">3 Months</option>
                      <option value="lifetime">Permanent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Reason (optional)</label>
                    <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
                      placeholder="Reason for ban…" rows={2}
                      className="w-full p-2.5 rounded-xl text-sm resize-none focus:outline-none transition-all" style={inp}
                      onFocus={e => (e.target.style.borderColor = '#ef4444')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleBan} disabled={actionLoading === 'ban'}
                      className="py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                      {actionLoading === 'ban' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                      Ban User
                    </button>
                    <button onClick={handleUnban} disabled={actionLoading === 'unban'}
                      className="py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
                      {actionLoading === 'unban' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Unban
                    </button>
                  </div>
                </div>
              </div>

              {/* Assign Membership */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.25)' }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-sm text-emerald-400">Assign Membership</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Plan</label>
                      <select value={memLevel} onChange={e => setMemLevel(Number(e.target.value) as 1 | 2)}
                        className="w-full p-2.5 rounded-xl text-sm focus:outline-none transition-all" style={inp}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                        <option value={1}>Premium</option>
                        <option value={2}>Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Duration</label>
                      <select value={memDuration} onChange={e => setMemDuration(e.target.value)}
                        className="w-full p-2.5 rounded-xl text-sm focus:outline-none transition-all" style={inp}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                        <option value="1day">1 Day</option>
                        <option value="1week">1 Week</option>
                        <option value="1month">1 Month</option>
                        <option value="1year">1 Year</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={handleAssignMembership} disabled={actionLoading === 'membership'}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)', boxShadow: '0 0 16px rgba(34,197,94,0.3)' }}>
                    {actionLoading === 'membership' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                    Assign Membership
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
