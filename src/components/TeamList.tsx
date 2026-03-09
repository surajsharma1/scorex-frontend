import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../services/api';
import { Team, PaginationMeta } from './types';

export default function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTeams = async (page: number = 1, append: boolean = false) => {
    try {
      console.log('Fetching teams...');
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const response = await teamAPI.getTeams();
      console.log('Teams API response:', response);
      
      // Handle different response formats
      let newTeams: Team[] = [];
      let paginationData: PaginationMeta | null = null;
      
      if (response.data && response.data.teams) {
        newTeams = response.data.teams || [];
        paginationData = response.data.pagination;
      } else if (Array.isArray(response.data)) {
        newTeams = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        newTeams = response.data.data;
      } else {
        console.warn('Unexpected teams response format:', response.data);
        newTeams = [];
      }

      if (append) {
        setTeams(prev => [...prev, ...newTeams]);
      } else {
        setTeams(newTeams);
      }

      setPagination(paginationData);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Failed to fetch teams:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Failed to load teams. Please try again.');
      setTeams([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const loadMore = () => {
    if (pagination?.hasNext) {
      fetchTeams(currentPage + 1, true);
    }
  };

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  );

  // Team List Skeleton
  const TeamListSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 p-4 rounded-lg">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  // Error State
  if (error && loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl mb-4" id="teams-heading">Teams</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 font-medium">Error loading teams</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchTeams()}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="p-6" role="status" aria-live="polite" aria-label="Loading teams">
      <LoadingSkeleton />
      <div className="mt-4">
        <TeamListSkeleton />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4" id="teams-heading">Teams</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 font-medium">Error</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchTeams()}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}
      
      <button
        onClick={() => navigate('/teams/new')}
        className="btn-primary mb-4"
        aria-label="Create a new team"
      >
        Create New
      </button>
      
      {teams.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg">No teams found</p>
          <p className="text-sm mt-2">Create your first team to get started!</p>
        </div>
      ) : (
        <ul
          className="space-y-2"
          role="list"
          aria-labelledby="teams-heading"
          aria-label={`List of ${teams.length} teams`}
        >
          {teams.map((team) => (
            <li
              key={team._id}
              className="bg-white p-4 rounded shadow"
              role="listitem"
              aria-label={`Team: ${team.name}`}
            >
              <h3 className="text-lg font-semibold" id={`team-${team._id}-name`}>
                {team.name}
              </h3>
              <button
                onClick={() => navigate(`/teams/${team._id}/edit`)}
                className="text-blue-500 hover:text-blue-700 mt-2"
                aria-label={`Edit team ${team.name}`}
                aria-describedby={`team-${team._id}-name`}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {pagination?.hasNext && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary"
            aria-label={loadingMore ? "Loading more teams" : "Load more teams"}
            aria-disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
