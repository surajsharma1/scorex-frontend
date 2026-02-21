import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { matchAPI, tournamentAPI } from '../services/api';
import { Match, Tournament } from './types';
import ScoreboardUpdate from './ScoreboardUpdate';

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLink, setVideoLink] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(true);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!id) return;
      try {
        const response = await matchAPI.getMatches(id);
        setMatch(response.data);
        setVideoLink(response.data.videoLink || '');
        
        // Load tournament for scoreboard
        if (response.data.tournament) {
          try {
            const tournamentId = typeof response.data.tournament === 'string' 
              ? response.data.tournament 
              : response.data.tournament._id;
            const tournamentResponse = await tournamentAPI.getTournament(tournamentId);
            setTournament(tournamentResponse.data);
          } catch (err) {
            console.error('Failed to load tournament');
          }
        }
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

  const handleScoreUpdate = async () => {
    // Refresh tournament data and sync to match scores
    if (id && tournament) {
      try {
        // Get updated tournament with liveScores
        const tournamentResponse = await tournamentAPI.getTournament(tournament._id);
        const updatedTournament = tournamentResponse.data;
        setTournament(updatedTournament);
        
        // Extract scores from tournament liveScores and update match
        const liveScores = updatedTournament.liveScores;
        if (liveScores) {
          const battingTeam = liveScores.battingTeam || 'team1';
          const team1Data = liveScores.team1 || {};
          const team2Data = liveScores.team2 || {};
          
          let newScore1 = 0;
          let newWickets1 = 0;
          let newOvers1 = 0;
          let newScore2 = 0;
          let newWickets2 = 0;
          let newOvers2 = 0;
          
          if (battingTeam === 'team1') {
            newScore1 = team1Data.score || 0;
            newWickets1 = team1Data.wickets || 0;
            newOvers1 = team1Data.overs || 0;
            newScore2 = team2Data.score || 0;
            newWickets2 = team2Data.wickets || 0;
            newOvers2 = team2Data.overs || 0;
          } else {
            newScore1 = team2Data.score || 0;
            newWickets1 = team2Data.wickets || 0;
            newOvers1 = team2Data.overs || 0;
            newScore2 = team1Data.score || 0;
            newWickets2 = team1Data.wickets || 0;
            newOvers2 = team1Data.overs || 0;
          }
          
          // Update match with new scores
          await matchAPI.updateMatchScore(id, {
            score1: newScore1,
            wickets1: newWickets1,
            overs1: newOvers1,
            score2: newScore2,
            wickets2: newWickets2,
            overs2: newOvers2,
          });
          
          // Refresh match data
          const matchResponse = await matchAPI.getMatches(id);
          setMatch(matchResponse.data);
        }
      } catch (error) {
        console.error('Failed to sync scores:', error);
      }
    }
  };

  if (loading) return <p className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">Loading...</p>;
  if (!match) return <p className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">Match not found</p>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Match Details</h2>
        <button
          onClick={() => setShowScoreboard(!showScoreboard)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {showScoreboard ? 'Hide Scoreboard' : 'Show Scoreboard'}
        </button>
      </div>

      {/* Scoreboard Update Component */}
      {showScoreboard && tournament && (
        <div className="mb-6">
          <ScoreboardUpdate tournament={tournament} onUpdate={handleScoreUpdate} />
        </div>
      )}

      {/* Simple Score Display */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Scoreboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{match.team1?.name}</h4>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{match.score1 || 0}/{match.wickets1 || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overs: {match.overs1 || 0}</p>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{match.team2?.name}</h4>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{match.score2 || 0}/{match.wickets2 || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overs: {match.overs2 || 0}</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-lg text-gray-900 dark:text-white">Status: {match.status}</p>
          {match.winner && <p className="text-lg font-bold text-gray-900 dark:text-white">Winner: {match.winner}</p>}
        </div>
      </div>

      {/* Match Info */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Match Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-900 dark:text-white"><strong>Date:</strong> {new Date(match.date).toLocaleDateString()}</p>
            <p className="text-gray-900 dark:text-white"><strong>Venue:</strong> {match.venue || 'TBD'}</p>
          </div>
          <div>
            <p className="text-gray-900 dark:text-white"><strong>Teams:</strong> {match.team1?.name} vs {match.team2?.name}</p>
            <p className="text-gray-900 dark:text-white"><strong>Tournament:</strong> {match.tournament}</p>
          </div>
        </div>
      </div>

      {/* Video Link */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Live Video</h3>
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="url"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="Enter video URL (YouTube, Twitch, etc.)"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveVideoLink}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {videoLink ? (
              <div>
                <p className="mb-2 text-gray-900 dark:text-white"><strong>Video Link:</strong> <a href={videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{videoLink}</a></p>
                <iframe
                  src={videoLink.replace('watch?v=', 'embed/')}
                  title="Live Match Video"
                  className="w-full h-64 rounded"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No video link added yet.</p>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              {videoLink ? 'Edit Video Link' : 'Add Video Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
