import { useState, useEffect } from 'react';
import { Users, Shield, Zap, BarChart3, Download } from 'lucide-react';
import api from '../services/api';

export default function AdminPanel() {
  const [stats, setStats] = useState({
    users: 0,
    tournaments: 0,
    matches: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin stats API call
    api.get('/stats/admin').then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const exportData = (type: string) => {
    // Download CSV/JSON
    window.open(`/api/stats/export/${type}`, '_blank');
  };

  if (loading) return <div>Loading admin stats...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-4">
            Admin Panel
          </h1>
          <p className="text-xl text-slate-400">Platform overview & management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <AdminStatCard icon={<Users />} title="Total Users" value={stats.users.toLocaleString()} />
          <AdminStatCard icon={<Zap />} title="Tournaments" value={stats.tournaments.toLocaleString()} />
          <AdminStatCard icon={<BarChart3 />} title="Matches" value={stats.matches.toLocaleString()} />
          <AdminStatCard icon={<Download />} title="Revenue" value={`$${stats.revenue}`} />
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ManagementCard title="User Management" onClick={() => {}} />
          <ManagementCard title="Tournament Audit" onClick={() => {}} />
          <ManagementCard title="Payment Reports" onClick={() => {}} />
          <ManagementCard title="Overlay Stats" onClick={() => {}} />
          <ManagementCard title="System Logs" onClick={() => {}} />
          <ManagementCard title="Export Data" onClick={() => exportData('all')} />
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ icon, title, value }: any) {
  return (
    <div className="group bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 shadow-xl hover:shadow-2xl">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
          {icon}
        </div>
        <div>
          <p className="text-slate-400 font-medium text-sm uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-black text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ManagementCard({ title, onClick }: any) {
  return (
    <div 
      className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 shadow-xl group"
      onClick={onClick}
    >
      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-slate-400">Quick access to {title.toLowerCase()}</p>
    </div>
  );
}

