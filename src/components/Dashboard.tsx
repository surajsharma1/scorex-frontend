import { Trophy, Users, Video, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { tournamentAPI, teamAPI, overlayAPI } from '../services/api';

export default function Dashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [overlays, setOverlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const tournamentsData = await tournamentAPI.getAll();
      setTournaments(tournamentsData);

      let allTeams: any[] = [];
      for (const tournament of tournamentsData) {
        const tournamentTeams = await teamAPI.getByTournament(tournament._id);
        allTeams = [...allTeams, ...tournamentTeams];
      }
      setTeams(allTeams);

      let allOverlays: any[] = [];
      for (const tournament of tournamentsData) {
        const tournamentOverlays = await overlayAPI.getByTournament(tournament._id);
        allOverlays = [...allOverlays, ...tournamentOverlays];
      }
      setOverlays(allOverlays);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Active Tournaments', value: tournaments.length.toString(), icon: Trophy, color: 'green' },
    { label: 'Total Teams', value: teams.length.toString(), icon: Users, color: 'blue' },
    { label: 'Overlays Created', value: overlays.length.toString(), icon: Video, color: 'purple' },
    { label: 'YouTube Links', value: overlays.filter((o: any) => o.publicId).length.toString(), icon: TrendingUp, color: 'orange' },
  ];

  const recentTournaments = tournaments.slice(0, 3);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading data...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 mt-2">
          Manage your cricket tournaments and create stunning overlays for YouTube
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, { bg: string; text: string }> = {
            green: { bg: 'bg-green-100', text: 'text-green-600' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
            purple: { bg: 'bg-blue-100', text: 'text-blue-600' },
            orange: { bg: 'bg-blue-100', text: 'text-blue-600' },
          };
          const colors = colorClasses[stat.color] || colorClasses.green;

          return (
            <div
              key={index}
              className="card hover-shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Recent Tournaments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>
                  Tournament Name
                </th>
                <th>
                  Format
                </th>
                <th>
                  Teams
                </th>
                <th>
                  Status
                </th>
                <th>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTournaments.length > 0 ? (
                recentTournaments.map((tournament: any) => (
                  <tr key={tournament._id}>
                    <td className="font-semibold text-gray-900">
                      {tournament.name}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {tournament.format}
                      </span>
                    </td>
                    <td className="text-gray-600">
                      {tournament.numberOfTeams} teams
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          tournament.status === 'active'
                            ? 'badge-green'
                            : 'badge-gray'
                        }`}
                      >
                        {tournament.status}
                      </span>
                    </td>
                    <td>
                      <button className="text-green-600 font-semibold">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-600">
                    No tournaments yet. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg-grid-cols-2">
        <div className="gradient-green rounded-xl p-8 text-white shadow-lg">
          <h3 className="text-2xl font-bold mb-3">Create New Tournament</h3>
          <p className="mb-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Start a new cricket tournament with custom teams, players, and brackets
          </p>
          <button className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold transition-colors">
            Get Started
          </button>
        </div>

        <div className="gradient-blue rounded-xl p-8 text-white shadow-lg">
          <h3 className="text-2xl font-bold mb-3">Design Custom Overlay</h3>
          <p className="mb-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Create or edit overlays with full customization for your YouTube videos
          </p>
          <button className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors">
            Open Editor
          </button>
        </div>
      </div>
    </div>
  );
}