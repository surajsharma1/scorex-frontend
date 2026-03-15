import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Trophy, Users, Activity, Plus, ArrowRight, BarChart3 } from 'lucide-react';
import api, { tournamentAPI, matchAPI, teamAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Stats {
  tournaments: number;
  matches: number;
  teams: number;
  liveMatches: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    tournaments: 0, matches: 0, teams: 0, liveMatches: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [tournamentsRes, matchesRes, teamsRes, liveRes] = await Promise.all([
        tournamentAPI.getTournaments(),
        matchAPI.getMatches(),
        teamAPI.getTeams(),
        matchAPI.getLiveMatches()
      ]);

      const tournaments = Array.isArray(tournamentsRes.data) 
        ? tournamentsRes.data.length 
        : tournamentsRes.data?.tournaments?.length || 0;
      
      const matches = Array.isArray(matchesRes.data) 
        ? matchesRes.data.length 
        : matchesRes.data?.matches?.length || 0;
      
      const teams = Array.isArray(teamsRes.data) 
        ? teamsRes.data.length 
        : teamsRes.data?.teams?.length || 0;

      const liveMatches = Array.isArray(liveRes.data) 
        ? liveRes.data.length 
        : liveRes.data?.length || 0;

      setStats({ tournaments, matches, teams, liveMatches });
    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Matches',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
    }]
  };

  const pieData = {
    labels: ['Won 1st Bat', 'Chasing Wins', 'Ties/No Result'],
    datasets: [{
      data: [55, 40, 5],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)'
      ],
      borderWidth: 2
    }]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ScoreX Dashboard
            </h1>
            <p className="text-xl text-slate-300 mt-2">Your cricket empire at a glance</p>
          </div>
          <button 
            onClick={() => navigate('/tournaments/new')}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-3"
          >
            <Plus size={24} />
            New Tournament
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard 
            title="Tournaments" 
            value={stats.tournaments.toLocaleString()} 
            change="+12%"
            icon={<Trophy size={32} />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard 
            title="Matches" 
            value={stats.matches.toLocaleString()} 
            change="+28%"
            icon={<BarChart3 size={32} />}
            color="from-emerald-500 to-teal-600"
          />
          <StatsCard 
            title="Teams" 
            value={stats.teams.toLocaleString()} 
            change="+5%"
            icon={<Users size={32} />}
            color="from-purple-500 to-indigo-600"
          />
          <LiveStatsCard 
            value={stats.liveMatches}
            onClick={() => navigate('/live')}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-white">Recent Activity</h3>
            <div className="h-80">
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-white">Win Distribution</h3>
            <div className="h-80">
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  return (
    <div className="group bg-white/10 hover:bg-white/20 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 font-medium text-sm uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-black text-white mt-2">{value}</p>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold mt-2">
            <ArrowUp className="w-4 h-4" /> {change}
          </span>
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 transition-all`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function LiveStatsCard({ value, onClick }: { value: number; onClick: () => void }) {
  return (
    <div 
      className="group bg-gradient-to-br from-red-500 to-orange-500 p-8 rounded-3xl shadow-2xl cursor-pointer hover:shadow-red-500/25 transition-all hover:-translate-y-2 relative overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 animate-shimmer"></div>
      <div className="relative z-10">
        <p className="text-white/90 font-medium text-sm uppercase tracking-wide">Live Matches</p>
        <div className="flex items-center gap-3 mt-2">
          <h3 className="text-4xl font-black text-white">{value}</h3>
          {value > 0 && (
            <div className="flex h-6 w-6 relative">
              <div className="animate-ping absolute inset-0 rounded-full bg-white/75 opacity-75"></div>
              <div className="relative inset-0 w-6 h-6 bg-white rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

