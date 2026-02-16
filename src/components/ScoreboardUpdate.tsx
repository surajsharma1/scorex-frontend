import { useState, useEffect } from 'react';
import { Save, Play, Pause, Coins, Trophy, Plus, X } from 'lucide-react';
import { tournamentAPI } from '../services/api';
import { Tournament } from './types';

type ScoringButtonType = 'wide' | 'noBall' | 'bye' | 'legBye' | null;

interface ScoringOption {
  label: string;
  runs: number;
  extraType: string;
}


interface ScoreboardUpdateProps {
  tournament: Tournament;
  onUpdate: () => void;
}

export default function ScoreboardUpdate({ tournament, onUpdate }: ScoreboardUpdateProps) {
  const [liveScores, setLiveScores] = useState(tournament.liveScores || {
    team1: { name: '', score: 0, wickets: 0, overs: 0, balls: 0 },
    team2: { name: '', score: 0, wickets: 0, overs: 0, balls: 0 },
    currentRunRate: 0,
    requiredRunRate: 0,
    target: 0,
    lastFiveOvers: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Toss and match type states
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | null>(null);
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl' | null>(null);
  const [matchType, setMatchType] = useState<'League' | 'Quarter-Final' | 'Semi-Final' | 'Final' | 'Playoff'>('League');
  const [currentBattingTeam, setCurrentBattingTeam] = useState<'team1' | 'team2'>('team1');
  
  // Scoring popup state
  const [activeScoringButton, setActiveScoringButton] = useState<ScoringButtonType>(null);
  const [showScoringPopup, setShowScoringPopup] = useState(false);


  useEffect(() => {
    setLiveScores(tournament.liveScores || {
      team1: { name: '', score: 0, wickets: 0, overs: 0, balls: 0 },
      team2: { name: '', score: 0, wickets: 0, overs: 0, balls: 0 },
      currentRunRate: 0,
      requiredRunRate: 0,
      target: 0,
      lastFiveOvers: '',
    });
  }, [tournament]);


  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await tournamentAPI.updateLiveScores(tournament._id, liveScores);
      onUpdate();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update scores');
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    setLoading(true);
    try {
      await tournamentAPI.goLive(tournament._id);
      onUpdate();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to go live');
    } finally {
      setLoading(false);
    }
  };

  const updateScore = (team: 'team1' | 'team2', field: string, value: any) => {
    setLiveScores(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [field]: value
      }
    }));
  };

  const updateStats = (field: string, value: any) => {
    setLiveScores(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Cricket scoring functions
  const addRuns = (runs: number, extraType: string = 'normal') => {
    setLiveScores(prev => {
      const team = currentBattingTeam;
      const currentTeam = prev[team];
      
      let newScore = currentTeam.score;
      let newBalls = currentTeam.balls;
      let newOvers = currentTeam.overs;
      let newWickets = currentTeam.wickets;
      
      // Handle different scoring types
      if (extraType === 'normal') {
        newScore += runs;
        newBalls += 1;
      } else if (extraType === 'wide') {
        // Wide adds to team score but not batsman, no ball counted
        newScore += runs + 1; // +1 for the wide itself
      } else if (extraType === 'noBall') {
        // No ball adds to team score, extra runs can be scored
        newScore += runs + 1; // +1 for the no ball itself
        // No ball doesn't count as a legal delivery for over calculation
      } else if (extraType === 'bye' || extraType === 'legBye') {
        // Byes and leg byes add to team score but not batsman
        newScore += runs;
        newBalls += 1;
      }
      
      // Calculate overs (6 balls = 1 over)
      if (newBalls >= 6) {
        newOvers = Math.floor(newOvers) + 1;
        newBalls = 0;
      }
      
      return {
        ...prev,
        [team]: {
          ...currentTeam,
          score: newScore,
          balls: newBalls,
          overs: newOvers,
          wickets: newWickets
        }
      };
    });
  };

  const addWicket = () => {
    setLiveScores(prev => {
      const team = currentBattingTeam;
      const currentTeam = prev[team];
      
      let newBalls = currentTeam.balls + 1;
      let newOvers = currentTeam.overs;
      let newWickets = currentTeam.wickets + 1;
      
      // Calculate overs (6 balls = 1 over)
      if (newBalls >= 6) {
        newOvers = Math.floor(newOvers) + 1;
        newBalls = 0;
      }
      
      return {
        ...prev,
        [team]: {
          ...currentTeam,
          wickets: newWickets,
          balls: newBalls,
          overs: newOvers
        }
      };
    });
  };

  const openScoringPopup = (buttonType: ScoringButtonType) => {
    setActiveScoringButton(buttonType);
    setShowScoringPopup(true);
  };

  const closeScoringPopup = () => {
    setActiveScoringButton(null);
    setShowScoringPopup(false);
  };

  const handleScoringOption = (runs: number) => {
    if (activeScoringButton) {
      addRuns(runs, activeScoringButton);
      closeScoringPopup();
    }
  };

  const getScoringOptions = (): ScoringOption[] => {
    switch (activeScoringButton) {
      case 'wide':
        return [
          { label: 'Wide', runs: 0, extraType: 'wide' },
          { label: 'Wide + 1', runs: 1, extraType: 'wide' },
          { label: 'Wide + 2', runs: 2, extraType: 'wide' },
          { label: 'Wide + 3', runs: 3, extraType: 'wide' },
          { label: 'Wide + 4', runs: 4, extraType: 'wide' },
          { label: 'Wide + 5', runs: 5, extraType: 'wide' },
        ];
      case 'noBall':
        return [
          { label: 'No Ball', runs: 0, extraType: 'noBall' },
          { label: 'No Ball + 1', runs: 1, extraType: 'noBall' },
          { label: 'No Ball + 2', runs: 2, extraType: 'noBall' },
          { label: 'No Ball + 3', runs: 3, extraType: 'noBall' },
          { label: 'No Ball + 4', runs: 4, extraType: 'noBall' },
          { label: 'No Ball + 5', runs: 5, extraType: 'noBall' },
          { label: 'No Ball + 6', runs: 6, extraType: 'noBall' },
        ];
      case 'bye':
        return [
          { label: 'Bye', runs: 0, extraType: 'bye' },
          { label: 'Bye + 1', runs: 1, extraType: 'bye' },
          { label: 'Bye + 2', runs: 2, extraType: 'bye' },
          { label: 'Bye + 3', runs: 3, extraType: 'bye' },
        ];
      case 'legBye':
        return [
          { label: 'Leg Bye', runs: 0, extraType: 'legBye' },
          { label: 'Leg Bye + 1', runs: 1, extraType: 'legBye' },
          { label: 'Leg Bye + 2', runs: 2, extraType: 'legBye' },
          { label: 'Leg Bye + 3', runs: 3, extraType: 'legBye' },
        ];
      default:
        return [];
    }
  };


  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Live Scoreboard Update</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleGoLive}
            disabled={loading || tournament.isLive}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              tournament.isLive
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{tournament.isLive ? 'Live' : 'Go Live'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Scores'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Match Setup Section */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Match Setup
        </h3>
        
        {/* Match Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Match Type</label>
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
          >
            <option value="League">League Match</option>
            <option value="Quarter-Final">Quarter-Final</option>
            <option value="Semi-Final">Semi-Final</option>
            <option value="Final">Final</option>
            <option value="Playoff">Playoff</option>
          </select>
        </div>

        {/* Toss Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Coins className="w-4 h-4 mr-2" />
              Toss Winner
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setTossWinner('team1')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  tossWinner === 'team1'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Team 1
              </button>
              <button
                onClick={() => setTossWinner('team2')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  tossWinner === 'team2'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Team 2
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Toss Choice</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setTossChoice('bat')}
                disabled={!tossWinner}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  tossChoice === 'bat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50'
                }`}
              >
                Bat First
              </button>
              <button
                onClick={() => setTossChoice('bowl')}
                disabled={!tossWinner}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  tossChoice === 'bowl'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50'
                }`}
              >
                Bowl First
              </button>
            </div>
          </div>
        </div>

        {/* Current Batting Team Selection */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Current Batting Team</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentBattingTeam('team1')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentBattingTeam === 'team1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Team 1 Batting
            </button>
            <button
              onClick={() => setCurrentBattingTeam('team2')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentBattingTeam === 'team2'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Team 2 Batting
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Team 1 */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-4">Team 1</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
              <input
                type="text"
                value={liveScores.team1.name}
                onChange={(e) => updateScore('team1', 'name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                placeholder="Enter team name"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Score</label>
                <input
                  type="number"
                  value={liveScores.team1.score}
                  onChange={(e) => updateScore('team1', 'score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Wickets</label>
                <input
                  type="number"
                  value={liveScores.team1.wickets}
                  onChange={(e) => updateScore('team1', 'wickets', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Overs</label>
                <input
                  type="number"
                  step="0.1"
                  value={liveScores.team1.overs}
                  onChange={(e) => updateScore('team1', 'overs', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Balls</label>
                <input
                  type="number"
                  value={liveScores.team1.balls || 0}
                  onChange={(e) => updateScore('team1', 'balls', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Team 2 */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-4">Team 2</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
              <input
                type="text"
                value={liveScores.team2.name}
                onChange={(e) => updateScore('team2', 'name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                placeholder="Enter team name"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Score</label>
                <input
                  type="number"
                  value={liveScores.team2.score}
                  onChange={(e) => updateScore('team2', 'score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Wickets</label>
                <input
                  type="number"
                  value={liveScores.team2.wickets}
                  onChange={(e) => updateScore('team2', 'wickets', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Overs</label>
                <input
                  type="number"
                  step="0.1"
                  value={liveScores.team2.overs}
                  onChange={(e) => updateScore('team2', 'overs', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Balls</label>
                <input
                  type="number"
                  value={liveScores.team2.balls || 0}
                  onChange={(e) => updateScore('team2', 'balls', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Cricket Scoring Controls */}
      <div className="mt-6 bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">
          Cricket Scoring - {currentBattingTeam === 'team1' ? 'Team 1' : 'Team 2'} Batting
        </h3>
        
        {/* Normal Runs */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Runs</label>
          <div className="grid grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 6].map((runs) => (
              <button
                key={runs}
                onClick={() => addRuns(runs, 'normal')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {runs}
              </button>
            ))}
          </div>
        </div>

        {/* Wicket */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Wicket</label>
          <button
            onClick={addWicket}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Wicket Fall!
          </button>
        </div>

        {/* Special Scoring Buttons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Extras (Click for options)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => openScoringPopup('wide')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              Wide <Plus className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => openScoringPopup('noBall')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              No Ball <Plus className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => openScoringPopup('bye')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              Bye <Plus className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => openScoringPopup('legBye')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              Leg Bye <Plus className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Scoring Options Popup */}
      {showScoringPopup && activeScoringButton && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white capitalize">
                {activeScoringButton.replace(/([A-Z])/g, ' $1').trim()} Options
              </h3>
              <button
                onClick={closeScoringPopup}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {getScoringOptions().map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleScoringOption(option.runs)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors border border-gray-500"
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={closeScoringPopup}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Match Statistics */}
      <div className="mt-6 bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">Match Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Current Run Rate</label>
            <input
              type="number"
              step="0.01"
              value={liveScores.currentRunRate}
              onChange={(e) => updateStats('currentRunRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Required Run Rate</label>
            <input
              type="number"
              step="0.01"
              value={liveScores.requiredRunRate}
              onChange={(e) => updateStats('requiredRunRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Target</label>
            <input
              type="number"
              value={liveScores.target}
              onChange={(e) => updateStats('target', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Last 5 Overs</label>
            <input
              type="text"
              value={liveScores.lastFiveOvers}
              onChange={(e) => updateStats('lastFiveOvers', e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
              placeholder="e.g., 1 4 6 W 2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
