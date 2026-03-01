import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../services/api';
import { Tournament } from './types';
import { Search, Filter, Calendar, Users, Trophy, Radio } from 'lucide-react';

export default function TournamentList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const res = await tournamentAPI.getTournaments();
      // Handle both array response and object with tournaments property
      const data = Array.isArray(res.data) ? res.data : (res.data?.tournaments || []);
      setTournaments(data);
    } catch (error) {
      console.error("Failed to load tournaments", error);
      // Set empty array on error to prevent crash
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = (Array.isArray(tournaments) ? tournaments : []).filter((t: Tournament) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tournaments</h1>
          <p className="text-gray-500 dark:text-gray-400">Browse and join cricket leagues</p>
        </div>
        <Link 
          to="/tournaments/create" 
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg transition-all"
        >
          Create Tournament
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tournaments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="pl-10 p-3 pr-8 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="ongoing">Live / Ongoing</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <Link 
              to={`/tournaments/${tournament._id}`} 
              key={tournament._id}
              className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 dark:border-gray-700 group"
            >
              <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <Trophy className="w-16 h-16 text-white opacity-20 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate pr-2">
                    {tournament.name}
                  </h3>
                  {tournament.status === 'ongoing' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full animate-pulse">
                      <Radio className="w-3 h-3" /> LIVE
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{tournament.teams?.length || 0} Teams</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-md capitalize font-medium
                    ${tournament.status === 'completed' ? 'bg-gray-100 text-gray-600' : 
                      tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                  `}>
                    {tournament.status}
                  </span>
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
          
          {filteredTournaments.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500">
              No tournaments found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
