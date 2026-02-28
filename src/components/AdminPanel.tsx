import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { Users, Search, Ban, Unlock, Crown, Shield, Trash2, Activity, Trophy, MessageSquare, Calendar, X, Clock } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'viewer' | 'organizer' | 'admin';
  membershipLevel: number;
  membershipExpiry?: string;
  isVerified: boolean;
  createdAt: string;
  deleted?: boolean;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [membershipLevel, setMembershipLevel] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    totalMatches: 0,
    activeUsers: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await userAPI.getAllUsers();
      setUsers(res.data.users || res.data || []);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStats({
      totalUsers: users.length,
      totalTournaments: 0,
      totalMatches: 0,
      activeUsers: users.filter(u => !u.deleted).length
    });
  }, [users]);

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    try {
      if (currentlyBanned) {
        await userAPI.unbanUser(userId);
      } else {
        await userAPI.banUser(userId);
      }
      loadUsers();
    } catch (e) {
      console.error("Failed to update user status", e);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await userAPI.updateUserRole(userId, newRole);
      loadUsers();
    } catch (e) {
      console.error("Failed to update user role", e);
    }
  };

  const openMembershipModal = (user: User) => {
    setSelectedUser(user);
    setMembershipLevel(user.membershipLevel || 0);
    setDurationMonths(1);
    setShowMembershipModal(true);
  };

  const handleUpdateMembership = async () => {
    if (!selectedUser) return;
    
    try {
      await userAPI.updateUserMembership(selectedUser._id, {
        level: membershipLevel,
        durationMonths: durationMonths
      });
      setShowMembershipModal(false);
      setSelectedUser(null);
      loadUsers();
      alert(`Membership updated successfully for ${selectedUser.username}!`);
    } catch (e) {
      console.error("Failed to update membership", e);
      alert("Failed to update membership. Please try again.");
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const getMembershipLabel = (level: number) => {
    switch (level) {
      case 0: return 'Free';
      case 1: return 'Basic';
      case 2: return 'Premium';
      default: return 'Unknown';
    }
  };

  const getMembershipBadge = (level: number) => {
    switch (level) {
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>;
      case 'organizer':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold flex items-center gap-1"><Crown className="w-3 h-3" /> Organizer</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">Viewer</span>;
    }
  };

  if (loading) return <div className="p-8 text-center dark:text-white">Loading admin panel...</div>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-600" />
          Admin Panel
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Manage users and system settings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold dark:text-white">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tournaments</p>
              <p className="text-2xl font-bold dark:text-white">{stats.totalTournaments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Matches</p>
              <p className="text-2xl font-bold dark:text-white">{stats.totalMatches}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openMembershipModal(user)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getMembershipBadge(user.membershipLevel)} hover:opacity-80 transition-opacity flex items-center gap-1`}
                    >
                      <Crown className="w-3 h-3" />
                      {getMembershipLabel(user.membershipLevel)}
                      {user.membershipExpiry && (
                        <span className="text-xs ml-1 opacity-75">
                          ({new Date(user.membershipExpiry).toLocaleDateString()})
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.deleted ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <Ban className="w-3 h-3" /> Banned
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <Activity className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {/* Ban/Unban Button */}
                      <button
                        onClick={() => handleBanUser(user._id, !!user.deleted)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.deleted 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                        title={user.deleted ? 'Unban User' : 'Ban User'}
                      >
                        {user.deleted ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>

                      {/* Role Change Dropdown */}
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user._id, e.target.value)}
                        className="p-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-green-500"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>

      {/* Membership Update Modal */}
      {showMembershipModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Update Membership
              </h2>
              <button
                onClick={() => setShowMembershipModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">User</p>
                <p className="font-medium dark:text-white text-lg">{selectedUser.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Membership Level
                </label>
                <select
                  value={membershipLevel}
                  onChange={(e) => setMembershipLevel(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={0}>Free</option>
                  <option value={1}>Basic</option>
                  <option value={2}>Premium</option>
                </select>
              </div>

              {membershipLevel > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration (Months)
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                    <option value={999}>Lifetime</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {durationMonths === 999 
                      ? 'Lifetime membership (never expires)' 
                      : `Membership will expire in ${durationMonths} month${durationMonths > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> This will immediately grant {getMembershipLabel(membershipLevel)} membership to this user.
                  {membershipLevel > 0 && durationMonths !== 999 && ` The membership will be active for ${durationMonths} month${durationMonths > 1 ? 's' : ''}.`}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMembershipModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMembership}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Update Membership
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
