import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { Match } from './types';

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLink, setVideoLink] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!id) return;
      try {
        const response = await matchAPI.getMatch(id);
        setMatch(response.data);
        setVideoLink(response.data.videoLink || '');
      } catch (error) {
        console.error('Failed to fetch match');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  const handleSaveVideoLink = async () => {
    if (!match) return;
    try {
      await matchAPI.updateMatch(match._id, { ...match, videoLink });
      setMatch({ ...match, videoLink });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update video link');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!match) return <p>Match not found</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Match Details</h2>

      {/* Scoreboard */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-xl font-bold mb-4">Scoreboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold">{match.team1.name}</h4>
            <p className="text-3xl font-bold">{match.score1}/{match.wickets1}</p>
            <p className="text-sm text-gray-600">Overs: {match.overs1}</p>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-semibold">{match.team2.name}</h4>
            <p className="text-3xl font-bold">{match.score2}/{match.wickets2}</p>
            <p className="text-sm text-gray-600">Overs: {match.overs2}</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-lg">Status: {match.status}</p>
          {match.winner && <p className="text-lg font-bold">Winner: {match.winner}</p>}
        </div>
      </div>

      {/* Match Info */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-xl font-bold mb-4">Match Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Date:</strong> {new Date(match.date).toLocaleDateString()}</p>
            <p><strong>Venue:</strong> {match.venue || 'TBD'}</p>
          </div>
          <div>
            <p><strong>Teams:</strong> {match.team1.name} vs {match.team2.name}</p>
            <p><strong>Tournament:</strong> {match.tournament}</p>
          </div>
        </div>
      </div>

      {/* Video Link */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-bold mb-4">Live Video</h3>
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="url"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="Enter video URL (YouTube, Twitch, etc.)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveVideoLink}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {videoLink ? (
              <div>
                <p className="mb-2"><strong>Video Link:</strong> <a href={videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{videoLink}</a></p>
                <iframe
                  src={videoLink.replace('watch?v=', 'embed/')}
                  title="Live Match Video"
                  className="w-full h-64 rounded"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <p className="text-gray-500">No video link added yet.</p>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              {videoLink ? 'Edit Video Link' : 'Add Video Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
