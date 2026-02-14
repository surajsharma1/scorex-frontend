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
  const navigate = useNavigate();

  const fetchTeams = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await teamAPI.getTeams(page, 10);
      const newTeams = response.data.teams || [];
      const paginationData = response.data.pagination;

      if (append) {
        setTeams(prev => [...prev, ...newTeams]);
      } else {
        setTeams(newTeams);
      }

      setPagination(paginationData);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch teams');
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
      <button
        onClick={() => navigate('/teams/new')}
        className="btn-primary mb-4"
        aria-label="Create a new team"
      >
        Create New
      </button>
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
