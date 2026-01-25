import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { User } from './types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(decoded);
        if (decoded.role === 'admin') {
          fetchUsers();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (id: string, role: string) => {
    try {
      await userAPI.updateUserRole(id, role);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to update role');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Dashboard</h2>
      <p>Welcome to your dashboard! Manage tournaments, teams, and overlays here.</p>

      <div className="tabs mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
        >
          Overview
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`}
          >
            Users
          </button>
        )}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg">Tournaments</h3>
            <p>View and manage tournaments.</p>
            <button onClick={() => navigate('/tournaments')} className="text-blue-500">Go to Tournaments</button>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg">Teams</h3>
            <p>Manage teams and players.</p>
            <button onClick={() => navigate('/teams')} className="text-blue-500">Go to Teams</button>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg">Overlays</h3>
            <p>Create live streaming overlays.</p>
            <button onClick={() => navigate('/overlay')} className="text-blue-500">Go to Overlays</button>
          </div>
        </div>
      )}

      {activeTab === 'users' && currentUser?.role === 'admin' && (
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">User Management</h3>
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Email</th>
                  <th className="border border-gray-300 px-4 py-2">Role</th>
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{user.username}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.role}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user._id, e.target.value)}
                        className="px-2 py-1 border rounded"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}