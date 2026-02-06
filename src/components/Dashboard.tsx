import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, statsAPI, tournamentAPI } from '../services/api';
import { User, Tournament } from './types';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Custom hook for user authentication
const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(decoded);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  return currentUser;
};

// Custom hook for admin data
const useAdminData = (isAdmin: boolean) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [tournamentStats, setTournamentStats] = useState<any>({});
  const [userStats, setUserStats] = useState<any>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userAPI.getUsers();
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [tournamentResponse, userResponse] = await Promise.all([
        statsAPI.getTournamentStats(),
        statsAPI.getUserStats()
      ]);
      setTournamentStats(tournamentResponse.data);
      setUserStats(userResponse.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  }, []);

  const updateUserRole = useCallback(async (id: string, role: string) => {
    try {
      await userAPI.updateUserRole(id, role);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update role');
    }
  }, [fetchUsers]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchStats();
    }
  }, [isAdmin, fetchUsers, fetchStats]);

  return { users, loading, tournamentStats, userStats, updateUserRole };
};

// Custom hook for tournament data
const useTournamentData = (isAdmin: boolean) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  const fetchTournaments = useCallback(async () => {
    setLoadingTournaments(true);
    try {
      const response = await tournamentAPI.getTournaments(1, 50); // Fetch more for admin
      setTournaments(response.data.tournaments || []);
    } catch (error) {
      console.error('Failed to fetch tournaments');
    } finally {
      setLoadingTournaments(false);
    }
  }, []);

  const deleteTournament = useCallback(async (id: string) => {
    try {
      await tournamentAPI.deleteTournament(id);
      setTournaments(prev => prev.filter(t => t._id !== id));
    } catch (error) {
      console.error('Failed to delete tournament');
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchTournaments();
    }
  }, [isAdmin, fetchTournaments]);

  return { tournaments, loadingTournaments, deleteTournament };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const currentUser = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { users, loading, tournamentStats, userStats, updateUserRole } = useAdminData(isAdmin);
  const { tournaments, loadingTournaments, deleteTournament } = useTournamentData(isAdmin);

  const tournamentChartData = {
    labels: ['Total', 'Active', 'Completed'],
    datasets: [{
      label: 'Tournaments',
      data: [tournamentStats.totalTournaments, tournamentStats.activeTournaments, tournamentStats.completedTournaments],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
    }],
  };

  const userChartData = {
    labels: ['Total Users', 'Admins', 'Organizers'],
    datasets: [{
      data: [userStats.totalUsers, userStats.adminUsers, userStats.organizerUsers],
      backgroundColor: ['#3B82F6', '#EF4444', '#10B981'],
    }],
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
          <>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`tab ${activeTab === 'tournaments' ? 'tab-active' : ''}`}
            >
              Tournaments
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`}
            >
              Users
            </button>
          </>
        )}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="card p-4">
              <h3 className="text-lg font-bold">Tournaments</h3>
              <p>View and manage tournaments.</p>
              <button onClick={() => navigate('/tournaments')} className="btn btn-primary mt-2">Go to Tournaments</button>
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-bold">Teams</h3>
              <p>Manage teams and players.</p>
              <button onClick={() => navigate('/teams')} className="btn btn-primary mt-2">Go to Teams</button>
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-bold">Overlays</h3>
              <p>Create live streaming overlays.</p>
              <button onClick={() => navigate('/overlay')} className="btn btn-primary mt-2">Go to Overlays</button>
            </div>
          </div>
          {currentUser?.role === 'admin' && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">Tournament Statistics</h3>
                <Bar data={tournamentChartData} />
              </div>
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">User Statistics</h3>
                <Pie data={userChartData} />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && currentUser?.role === 'admin' && (
        <div className="card p-6">
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

      {activeTab === 'tournaments' && currentUser?.role === 'admin' && (
        <div className="card p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Tournament Management</h3>
          {loadingTournaments ? (
            <p>Loading tournaments...</p>
          ) : (
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Name</th>
                  <th className="border border-gray-300 px-4 py-2">Format</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                  <th className="border border-gray-300 px-4 py-2">Start Date</th>
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => (
                  <tr key={tournament._id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{tournament.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{tournament.format}</td>
                    <td className="border border-gray-300 px-4 py-2">{tournament.status}</td>
                    <td className="border border-gray-300 px-4 py-2">{new Date(tournament.startDate).toLocaleDateString()}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() => deleteTournament(tournament._id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
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