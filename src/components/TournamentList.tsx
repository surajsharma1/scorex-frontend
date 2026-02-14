import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../services/api';
import { Tournament, PaginationMeta } from './types';

export default function TournamentList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const fetchTournaments = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await tournamentAPI.getTournaments(page, 10);
      const newTournaments = response.data.tournaments || [];
      const paginationData = response.data.pagination;

      if (append) {
        setTournaments(prev => [...prev, ...newTournaments]);
      } else {
        setTournaments(newTournaments);
      }

      setPagination(paginationData);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch tournaments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const loadMore = () => {
    if (pagination?.hasNext) {
      fetchTournaments(currentPage + 1, true);
    }
  };

  if (loading) return (
    <div className="p-6 bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-light min-h-screen" role="status" aria-live="polite" aria-label="Loading tournaments">

      <p>Loading tournaments...</p>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-light min-h-screen">

      <h1 className="text-2xl mb-4" id="tournaments-heading">Tournaments</h1>
      <button
        onClick={() => navigate('/tournaments/new')}
        className="btn-primary mb-4"
        aria-label="Create a new tournament"
      >
        Create New
      </button>
      <div
        className="space-y-2"
        role="list"
        aria-labelledby="tournaments-heading"
        aria-label={`List of ${tournaments.length} tournaments`}
      >
        {tournaments.map((tournament) => (
          <div
            key={tournament._id}
            className="flex items-center justify-between w-full bg-white dark:bg-dark-bg-alt p-4 border-b border-gray-200 dark:border-dark-primary/30"

            role="listitem"
            aria-label={`Tournament: ${tournament.name}`}
          >
            <div className="flex items-center space-x-3 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-light" id={`tournament-${tournament._id}-name`}>

                {tournament.name}
              </h3>
            </div>
            <div className="w-10 h-10 bg-gray-300 dark:bg-dark-secondary rounded-full flex items-center justify-center">
              {/* Placeholder for logo */}
              <span className="text-gray-600 dark:text-dark-accent/70 text-sm">Logo</span>

            </div>
            <button
              onClick={() => navigate(`/tournaments/${tournament._id}/edit`)}
              className="text-blue-500 hover:text-blue-600 dark:text-dark-accent dark:hover:text-dark-light transition-colors"

              aria-label={`Edit tournament ${tournament.name}`}
              aria-describedby={`tournament-${tournament._id}-name`}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
      {pagination?.hasNext && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary"
            aria-label={loadingMore ? "Loading more tournaments" : "Load more tournaments"}
            aria-disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
