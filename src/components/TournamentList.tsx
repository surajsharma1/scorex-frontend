import { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';

export default function TournamentList() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await tournamentAPI.getTournaments();
        setTournaments(response.data);
      } catch (error) {
        console.error('Failed to fetch tournaments');
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Tournaments</h2>
      <a href="/tournaments/new" className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block">Create New</a>
      <ul className="space-y-2">
        {tournaments.map((tournament) => (
          <li key={tournament._id} className="bg-white p-4 rounded shadow">
            <h3>{tournament.name}</h3>
            <a href={`/tournaments/${tournament._id}/edit`} className="text-blue-500">Edit</a>
          </li>
        ))}
      </ul>
    </div>
  );
}