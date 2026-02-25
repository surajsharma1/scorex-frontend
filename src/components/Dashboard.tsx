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
      // Fetch all data in parallel
      const [tRes, mRes, teamRes] = await Promise.all([
        tournamentAPI.getTournaments(),
        matchAPI.getAllMatches(),
        teamAPI.getTeams()
      ]);

      const matches = mRes.data.matches || [];
      const live = matches.filter((m: any) => m.status === 'ongoing').length;

      setStats({
        tournaments: Array.isArray(tRes.data) ? tRes.data.length : (tRes.data.tournaments || []).length,
        matches: matches.length,
        teams: Array.isArray(teamRes.data) ? teamRes.data.length : (teamRes.data.teams || []).length,
        liveMatches: live
      });
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  // Chart Data Configuration
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Matches Played',
      data: [12, 19, 3, 5, 2, 3], // TODO: Connect to real analytics API
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }]
  };

  const pieData = {
    labels: ['Won Batting 1st', 'Won Chasing', 'Draw/Tie'],
    datasets: [{
      data: [12, 19, 3], 
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
      ],
      borderWidth: 1,
    }]
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
           <p className="text-gray-500 dark:text-gray-400">Overview of your cricket organization</p>
        </div>
        <button 
          onClick={() => navigate('/tournaments/create')}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-900/20 font-bold"
        >
          <Plus className="w-5 h-5" /> New Tournament
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
           title="Total Tournaments" 
           value={stats.tournaments} 
           icon={<Trophy className="w-6 h-6 text-blue-600" />} 
           bg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatsCard 
           title="Matches Managed" 
           value={stats.matches} 
           icon={<Activity className="w-6 h-6 text-green-600" />} 
           bg="bg-green-100 dark:bg-green-900/30"
        />
        <StatsCard 
           title="Active Teams" 
           value={stats.teams} 
           icon={<Users className="w-6 h-6 text-purple-600" />} 
           bg="bg-purple-100 dark:bg-purple-900/30"
        />
        
        {/* Live Match Card */}
        <div 
            onClick={() => navigate('/matches/live')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-2 border-red-100 dark:border-red-900/30 cursor-pointer hover:shadow-md hover:border-red-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Live Now</p>
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-3xl font-black text-red-500">{stats.liveMatches}</h3>
                {stats.liveMatches > 0 && (
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Match Activity</h3>
          <div className="h-64 flex justify-center w-full">
            <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Win Distribution</h3>
          <div className="h-64 flex justify-center w-full">
            <Pie data={pieData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Stats
function StatsCard({ title, value, icon, bg }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
                <h3 className="text-3xl font-black dark:text-white mt-1">{value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${bg}`}>
                {icon}
            </div>
        </div>
    )
}