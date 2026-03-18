import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, Download, Search, Edit3, X } from 'lucide-react';
import { adminAPI } from '../services/api';

interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  role: string;
  membershipLevel: number;
  createdAt: string;
}

export default function AdminUserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [banDuration, setBanDuration] = useState('1day');
  const [banReason, setBanReason] = useState('');
  const [memLevel, setMemLevel] = useState<1 | 2>(1);
  const [memDuration, setMemDuration] = useState('1week');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    console.log('🔍 DEBUG AdminUserTable: Loading users...');
    try {
      const res = await adminAPI.getUsers();
      console.log('✅ Users loaded:', res.data.data?.length || 0, 'users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('❌ Users API failed:', err.response?.status, err.response?.data || err.message);
    } finally {
      setLoading(false);
      console.log('🔍 DEBUG: Users loading complete');
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      showToast('Role updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update role');
      showToast('Failed to update role', 'error');
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleOptions = ['viewer', 'organizer', 'admin'];

  const handleExport = () => {
    adminAPI.exportUsers().then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    }).catch(() => alert('Export failed'));
  };

  const handleBan = async () => {
    try {
      await adminAPI.banUser(selectedUser!._id, { duration: banDuration, reason: banReason });
      alert('User banned');
      setShowModal(false);
      loadUsers();
    } catch {
      alert('Ban failed');
    }
  };

  const handleUnban = async () => {
    try {
      await adminAPI.unbanUser(selectedUser!._id);
      alert('User unbanned');
      setShowModal(false);
      loadUsers();
    } catch {
      alert('Unban failed');
    }
  };

  const handleAssignMembership = async () => {
    try {
      await adminAPI.assignMembership(selectedUser!._id, { level: memLevel, duration: memDuration });
      alert('Membership assigned');
      setShowModal(false);
      loadUsers();
    } catch {
      alert('Assignment failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>User Management</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filteredUsers.length} users</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-64 focus:outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:scale-105"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl hover:bg-gray-800/20" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Membership</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-[var(--bg-hover)] dark:hover:bg-gray-800/50 transition-all group">

                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{user.username}</div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                      background: user.role === 'admin' ? 'rgba(239,68,68,0.15)' : user.role === 'organizer' ? 'rgba(59,130,246,0.15)' : 'var(--bg-elevated)',
                      color: user.role === 'admin' ? '#ef4444' : user.role === 'organizer' ? '#3b82f6' : 'var(--text-secondary)',
                      border: `1px solid ${user.role === 'admin' ? 'rgba(239,68,68,0.3)' : user.role === 'organizer' ? 'rgba(59,130,246,0.3)' : 'var(--border)' }`
                    }}>
                      {user.role}
                    </span>

                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                      background: user.membershipLevel === 2 ? 'rgba(168,85,247,0.15)' : user.membershipLevel === 1 ? 'rgba(34,197,94,0.15)' : 'var(--bg-elevated)',
                      color: user.membershipLevel === 2 ? '#a855f7' : user.membershipLevel === 1 ? '#22c55e' : 'var(--text-secondary)',
                      border: `1px solid ${user.membershipLevel === 2 ? 'rgba(168,85,247,0.3)' : user.membershipLevel === 1 ? 'rgba(34,197,94,0.3)' : 'var(--border)' }`
                    }}>
                      {user.membershipLevel === 2 ? 'Enterprise' : user.membershipLevel === 1 ? 'Premium' : 'Free'}
                    </span>

                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select 
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole) {
                            updateRole(user._id, newRole);
                            (e.target as HTMLSelectElement).value = ''; // Reset select
                          }
                        }}
                        className="text-xs px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-[var(--bg-hover)] transition-all"
                        style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        <option value="">Change Role</option>
                        {roleOptions.map(role => (
                          <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                        ))}
                      </select>


                      <button 
                        onClick={() => updateRole(user._id, 'viewer')}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
                        title="Demote to viewer"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(user); setShowModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-500 hover:text-blue-700"
                        title="Manage User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manage User Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Manage {selectedUser.username}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Description</h4>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedUser.fullName || 'No full name'} ({selectedUser.email})</p>
              </div>

              {/* Ban Section */}
              <div>
                <h4 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Ban User</h4>
                <select 
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full p-3 border rounded-xl mb-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="1day">1 Day</option>
                  <option value="3day">3 Days</option>
                  <option value="1week">1 Week</option>
                  <option value="1month">1 Month</option>
                  <option value="3month">3 Months</option>
                  <option value="lifetime">Lifetime</option>
                </select>
                <textarea 
                  placeholder="Reason for ban (optional)"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full p-3 border rounded-xl mb-3 resize-vertical"
                  rows={3}
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <button 
                  onClick={async () => {
                    try {
                      await adminAPI.banUser(selectedUser._id, { duration: banDuration, reason: banReason });
                      alert('User banned');
                      setShowModal(false);
                      loadUsers();
                    } catch {
                      alert('Ban failed');
                    }
                  }}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
                >
                  Ban User
                </button>
              </div>

              {/* Unban */}
              <button 
                onClick={async () => {
                  try {
                    await adminAPI.unbanUser(selectedUser._id);
                    alert('User unbanned');
                    setShowModal(false);
                    loadUsers();
                  } catch {
                    alert('Unban failed');
                  }
                }}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
              >
                Unban User
              </button>

              {/* Membership Assign */}
              <div>
                <h4 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Assign Membership</h4>
                <select 
                  value={memLevel}
                  onChange={(e) => setMemLevel(Number(e.target.value) as 1 | 2)}
                  className="w-full p-3 border rounded-xl mb-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value={1}>Premium (Level 1)</option>
                  <option value={2}>Enterprise (Level 2)</option>
                </select>
                <select 
                  value={memDuration}
                  onChange={(e) => setMemDuration(e.target.value)}
                  className="w-full p-3 border rounded-xl mb-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="1day">1 Day</option>
                  <option value="1week">1 Week</option>
                  <option value="1month">1 Month</option>
                  <option value="1year">1 Year</option>
                  <option value="lifetime">Lifetime</option>
                </select>
                <button 
                  onClick={async () => {
                    try {
                      await adminAPI.assignMembership(selectedUser!._id, { level: memLevel, duration: memDuration });
                      alert('Membership assigned');
                      setShowModal(false);
                      loadUsers();
                    } catch {
                      alert('Assignment failed');
                    }
                  }}
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
                >
                  Assign Membership
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
