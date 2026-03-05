import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI, tournamentAPI } from '../services/api';
import { Match, Tournament } from './types';
import { Calendar, Clock, Trophy, Video, ChevronRight } from 'lucide-react';

export default function LiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchMatches(selectedTournament);
    } else {
      fetchAllMatches();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await tournamentAPI.getTournaments();
      const tournamentsData = response.data.tournaments || response.data || [];
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      setTournaments([]);
    }
  };

  const fetchMatches = async (tournamentId: string) => {
    setLoading(true);
    try {
      // API now returns response.data directly
      const data = await matchAPI.getMatchesByTournament(tournamentId);
      console.log('fetchMatches response:', data);
      // Backend returns { success: true, data: matches, count: n } or just the array
      let matchesData: any[] = [];
      if (Array.isArray(data)) {
        matchesData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        matchesData = data.data;
      } else if (data?.matches && Array.isArray(data.matches)) {
        matchesData = data.matches;
      }
      setMatches(matchesData);
    } catch (error: any) {
      console.error('Failed to fetch matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMatches = async () => {
    setLoading(true);
    try {
      const tourResponse = await tournamentAPI.getTournaments();
      const tournamentsData = tourResponse.data.tournaments || tourResponse.data || [];
      
      if (Array.isArray(tournamentsData) && tournamentsData.length > 0) {
        const allMatches: Match[] = [];
        for (const tournament of tournamentsData) {
          try {
            // API now returns response.data directly
            const data = await matchAPI.getMatchesByTournament(tournament._id);
            // Backend returns { success: true, data: matches, count: n } or just the array
            let matchesData: any[] = [];
            if (Array.isArray(data)) {
              matchesData = data;
            } else if (data?.data && Array.isArray(data.data)) {
              matchesData = data.data;
            } else if (data?.matches && Array.isArray(data.matches)) {
              matchesData = data.matches;
            }
            if (Array.isArray(matchesData)) {
              allMatches.push(...matchesData);
            }
          } catch (e) {
            console.error(`Failed to fetch matches for tournament ${tournament._id}`);
          }
        }
        setMatches(allMatches);
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ongoing':
        return 'bg-red-600';
      case 'completed':
        return 'bg-gray-600';
      case 'scheduled':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Helper function to get tournament name
  const getTournamentName = (tournament: Tournament | string | undefined): string => {
    if (!tournament) return 'Tournament';
    if (typeof tournament === 'string') return 'Tournament';
    return tournament.name || 'Tournament';
  };

  const liveMatches = matches.filter((m: Match) => m.status === 'ongoing');
  const upcomingMatches = matches.filter((m: Match) => m.status === 'scheduled');
  const completedMatches = matches.filter((m: Match) => m.status === 'completed');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Live Matches</h1>
          <p className="text-gray-400">Watch live cricket scores and updates</p>
        </div>

        {/* Tournament Filter */}
        <div className="mb-6">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full md:w-64 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Matches Section */}
        {liveMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
              Live Now ({liveMatches.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match: Match) => (
                <MatchCard 
                  key={match._id} 
                  match={match} 
                  onClick={() => navigate(`/live-scoring/${match._id}`)}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                  getTournamentName={getTournamentName}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Matches Section */}
        {upcomingMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Upcoming ({upcomingMatches.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match: Match) => (
                <MatchCard 
                  key={match._id} 
                  match={match} 
                  onClick={() => navigate(`/match/${match._id}`)}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                  getTournamentName={getTournamentName}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Matches Section */}
        {completedMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Completed ({completedMatches.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedMatches.map((match: Match) => (
                <MatchCard 
                  key={match._id} 
                  match={match} 
                  onClick={() => navigate(`/match/${match._id}`)}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                  getTournamentName={getTournamentName}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {matches.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Matches Found</h3>
            <p className="text-gray-400">
              {selectedTournament 
                ? 'No matches scheduled in this tournament yet.' 
                : 'No matches available at the moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  onClick: () => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  getStatusColor: (status: string) => string;
  getTournamentName: (tournament: Tournament | string | undefined) => string;
}

function MatchCard({ match, onClick, formatDate, formatTime, getStatusColor, getTournamentName }: MatchCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all duration-300 cursor-pointer hover:transform hover:scale-[1.02] border border-gray-700 hover:border-green-500"
    >
      {/* Header with status */}
      <div className={`${getStatusColor(match.status || 'scheduled')} px-4 py-2 flex justify-between items-center`}>
        <span className="text-sm font-medium uppercase">{match.status}</span>
        <ChevronRight className="w-5 h-5" />
      </div>

      {/* Teams */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 text-center">
            <div className="text-lg font-bold truncate">{match.team1?.name || 'Team 1'}</div>
            <div className="text-3xl font-bold text-yellow-400">{match.score1 || 0}</div>
          </div>
          <div className="text-gray-500 text-xl font-bold mx-4">vs</div>
          <div className="flex-1 text-center">
            <div className="text-lg font-bold truncate">{match.team2?.name || 'Team 2'}</div>
            <div className="text-3xl font-bold text-yellow-400">{match.score2 || 0}</div>
          </div>
        </div>

        {/* Match Info */}
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Trophy className="w-4 h-4" />
            <span className="truncate">{getTournamentName(match.tournament)}</span>
          </div>
          <div className="flex items-center gap-4 text-gray-500 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(match.date)}
            </div>
            {match.date && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(match.date)}
              </div>
            )}
          </div>
        </div>

        {/* Score Info */}
        {(match.status === 'ongoing' || match.status === 'completed') && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {match.team1?.name}: {match.overs1?.toFixed(1) || '0.0'} overs
              </span>
              <span className="text-gray-400">
                {match.team2?.name}: {match.overs2?.toFixed(1) || '0.0'} overs
              </span>
            </div>
            {match.wickets1 !== undefined && match.wickets2 !== undefined && (
              <div className="text-center mt-1 text-gray-400 text-sm">
                ({match.wickets1}/{match.wickets2})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
