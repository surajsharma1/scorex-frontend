import { useState, useEffect } from 'react';
import { Trophy, Users, Video, TrendingUp } from 'lucide-react';
import { tournamentAPI, teamAPI, overlayAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    tournaments: 0,
    teams: 0,
    overlays: 0,
    links: 0,
  });
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tournamentsRes, teamsRes, overlaysRes] = await Promise.all([
        tournamentAPI.getTournaments(),
        teamAPI.getTeams(),
        overlayAPI.getOverlays(),
      ]);

      setStats({
        tournaments: tournamentsRes.data.length,
        teams: teamsRes.data.length,
        overlays: overlaysRes.data.length,
        links: 342, // This could be fetched from backend if implemented
      });

      setRecentTournaments(tournamentsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    { label: 'Active Tournaments', value: stats.tournaments, icon: Trophy, color: 'green' },
    { label: 'Total Teams', value: stats.teams, icon: Users, color: 'blue' },
    { label: 'Overlays Created', value: stats.overlays, icon: Video, color: 'purple' },
    { label: 'YouTube Links', value: stats.links, icon: TrendingUp, color: 'orange' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 mt-2">
          Manage your cricket tournaments and create stunning overlays for YouTube
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Recent Tournaments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tournament Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Teams
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTournaments.map((tournament: any, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {tournament.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {tournament.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {tournament.teams?.length || 0} teams
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tournament.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-green-600 hover:text-green-800 font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-8 text-white shadow-lg">
          <h3 className="text-2xl font-bold mb-3">Create New Tournament</h3>
          <p className="text-green-100 mb-6">
            Start a new cricket tournament with custom teams, players, and brackets
          </p>
          <button
            onClick={() => window.location.hash = '#tournaments'}
            className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Get Started
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-lg">
          <h3 className="text-2xl font-bold mb-3">Design Custom Overlay</h3>
          <p className="text-blue-100 mb-6">
            Create or edit overlays with full customization for your YouTube videos
          </p>
          <button
            onClick={() => window.location.hash = '#overlay'}
            className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Open Editor
          </button>
        </div>
      </div>
    </div>
  );
}