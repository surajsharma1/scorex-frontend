import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../services/api';
import { Tournament } from './types';

export default function TournamentList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <button onClick={() => navigate('/tournaments/new')} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Create New</button>
      <ul className="space-y-2">
        {tournaments.map((tournament) => (
          <li key={tournament._id} className="bg-white p-4 rounded shadow">
            <h3>{tournament.name}</h3>
            <button onClick={() => navigate(`/tournaments/${tournament._id}/edit`)} className="text-blue-500">Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}