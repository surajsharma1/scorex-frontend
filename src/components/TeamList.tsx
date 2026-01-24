import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../services/api';
import { Team } from './types';

export default function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await teamAPI.getTeams();
        setTeams(response.data);
      } catch (error) {
        console.error('Failed to fetch teams');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Teams</h2>
      <button onClick={() => navigate('/teams/new')} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Create New</button>
      <ul className="space-y-2">
        {teams.map((team) => (
          <li key={team._id} className="bg-white p-4 rounded shadow">
            <h3>{team.name}</h3>
            <button onClick={() => navigate(`/teams/${team._id}/edit`)} className="text-blue-500">Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}