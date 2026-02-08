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
    <div className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen" role="status" aria-live="polite" aria-label="Loading tournaments">
      <p>Loading tournaments...</p>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <h1 className="text-2xl mb-4" id="tournaments-heading">Tournaments</h1>
      <button
        onClick={() => navigate('/tournaments/new')}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 transition-colors"
        aria-label="Create a new tournament"
      >
        Create New
      </button>
      <ul
        className="space-y-2"
        role="list"
        aria-labelledby="tournaments-heading"
        aria-label={`List of ${tournaments.length} tournaments`}
      >
        {tournaments.map((tournament) => (
          <li
            key={tournament._id}
            className="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-200 dark:border-gray-700"
            role="listitem"
            aria-label={`Tournament: ${tournament.name}`}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id={`tournament-${tournament._id}-name`}>
              {tournament.name}
            </h3>
            <button
              onClick={() => navigate(`/tournaments/${tournament._id}/edit`)}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-2 transition-colors"
              aria-label={`Edit tournament ${tournament.name}`}
              aria-describedby={`tournament-${tournament._id}-name`}
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
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
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
