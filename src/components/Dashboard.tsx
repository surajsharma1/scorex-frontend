import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Trophy, Users, Activity, Plus, ArrowRight } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    tournaments: 0,
    matches: 0,
    teams: 0,
    liveMatches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tRes, mRes, teamRes] = await Promise.all([
        tournamentAPI.getTournaments(),
        matchAPI.getAllMatches(),
        teamAPI.getTeams()
      ]);

      const matches = mRes.data.matches || [];
      const live = matches.filter((m: any) => m.status === 'ongoing').length;

      setStats({
        tournaments: (tRes.data.tournaments || []).length,
        matches: matches.length,
        teams: (teamRes.data.teams || []).length,
        liveMatches: live
      });
    } catch (e) {
      console.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  // Chart Data Configuration
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Matches Played',
      data: [12, 19, 3, 5, 2, 3], // Placeholder: Replace with real aggregation if backend supports it
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }]
  };

  const pieData = {
    labels: ['Won Batting 1st', 'Won Chasing', 'Draw/Tie'],
    datasets: [{
      data: [12, 19, 3], // Placeholder
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
      ],
      borderWidth: 1,
    }]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
        <button 
          onClick={() => navigate('/tournaments')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> New Tournament
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Tournaments</p>
              <h3 className="text-3xl font-bold dark:text-white">{stats.tournaments}</h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Matches Managed</p>
              <h3 className="text-3xl font-bold dark:text-white">{stats.matches}</h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Active Teams</p>
              <h3 className="text-3xl font-bold dark:text-white">{stats.teams}</h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/live-matches')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Live Now</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold text-red-500">{stats.liveMatches}</h3>
                {stats.liveMatches > 0 && <span className="animate-ping h-3 w-3 rounded-full bg-red-500"></span>}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 dark:text-white">Match Activity</h3>
          <div className="h-64 flex justify-center">
            <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 dark:text-white">Win Distribution</h3>
          <div className="h-64 flex justify-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>
      </div>
    </div>
  );
}