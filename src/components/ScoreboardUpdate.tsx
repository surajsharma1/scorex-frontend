import { useState, useEffect } from 'react';
import { Save, Coins, RotateCcw } from 'lucide-react';
import { tournamentAPI } from '../services/api';
import { Tournament, Team } from './types';

type ScoringButtonType = 'wide' | 'noBall' | 'bye' | 'legBye' | null;

interface TeamScore {
  name: string;
  score: number;
  wickets: number;
  overs: number;
  balls: number;
}

interface LiveScores {
  team1: TeamScore;
  team2: TeamScore;
  battingTeam: 'team1' | 'team2';
  currentRunRate: number;
  requiredRunRate: number;
  target: number;
  lastFiveOvers: string;
}

interface ScoreboardUpdateProps {
  tournament: Tournament;
  onUpdate: () => void;
}

const scoringOptions = [
  { label: 'Wide', runs: 1, extraType: 'wide' },
  { label: 'No Ball', runs: 1, extraType: 'noBall' },
  { label: 'Bye', runs: 1, extraType: 'bye' },
  { label: 'Leg Bye', runs: 1, extraType: 'legBye' },
];

// Helper to format overs display (e.g., 10.2)
const formatOvers = (overs: number, balls: number) => `${overs}.${balls}`;

const getTeamName = (teams: Team[], index: number) => teams[index]?.name || `Team ${index + 1}`;

export default function ScoreboardUpdate({ tournament, onUpdate }: ScoreboardUpdateProps) {
  const teams = tournament.teams as unknown as Team[];
  
  const [liveScores, setLiveScores] = useState<LiveScores>(() => {
    const existing = tournament.liveScores;
    return {
      team1: { 
        name: getTeamName(teams, 0), 
        score: existing?.team1?.score || 0, 
        wickets: existing?.team1?.wickets || 0, 
        overs: existing?.team1?.overs || 0, 
        balls: existing?.team1?.balls || 0 
      },
      team2: { 
        name: getTeamName(teams, 1), 
        score: existing?.team2?.score || 0, 
        wickets: existing?.team2?.wickets || 0, 
        overs: existing?.team2?.overs || 0, 
        balls: existing?.team2?.balls || 0 
      },
      battingTeam: 'team1',
      currentRunRate: existing?.currentRunRate || 0,
      requiredRunRate: existing?.requiredRunRate || 0,
      target: existing?.target || 0,
      lastFiveOvers: existing?.lastFiveOvers || '',
    };
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Toss and match type states
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | null>(null);
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl' | null>(null);

  // Broadcast Channel for Overlay Communication
  const channel = new BroadcastChannel('cricket_score_updates');

  useEffect(() => {
    // Broadcast updates to all listening overlays whenever liveScores changes
    channel.postMessage(liveScores);
  }, [liveScores]);

  const updateStats = (field: string, value: unknown) => {
    setLiveScores(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateTeamStats = (team: 'team1' | 'team2', field: string, value: unknown) => {
    setLiveScores(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [field]: value
      }
    }));
  };

  const handleScoreUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      await tournamentAPI.updateLiveScores(tournament._id, liveScores);
      onUpdate();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update scores';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToss = (winner: 'team1' | 'team2', choice: 'bat' | 'bowl') => {
    setTossWinner(winner);
    setTossChoice(choice);
    // Logic to set which team is currently batting based on toss
    const battingTeam = choice === 'bat' ? winner : (winner === 'team1' ? 'team2' : 'team1');
    updateStats('battingTeam', battingTeam);
  };

  const addRuns = (team: 'team1' | 'team2', runs: number, isExtra: boolean = false, extraType: ScoringButtonType = null) => {
    const currentTeam = liveScores[team];
    let newScore = currentTeam.score + runs;
    let newBalls = currentTeam.balls;
    let newOvers = currentTeam.overs;

    // Extras like Wide and No Ball don't count as legal balls
    if (!isExtra || (extraType !== 'wide' && extraType !== 'noBall')) {
      newBalls += 1;
      if (newBalls === 6) {
        newOvers += 1;
        newBalls = 0;
      }
    }

    setLiveScores(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        score: newScore,
        balls: newBalls,
        overs: newOvers
      }
    }));

    // Broadcast score update to overlays
    channel.postMessage({ type: 'SCORE_UPDATE', team, score: newScore, overs: formatOvers(newOvers, newBalls) });
  };

  const addWicket = (team: 'team1' | 'team2') => {
    const currentTeam = liveScores[team];
    if (currentTeam.wickets < 10) {
      updateTeamStats(team, 'wickets', currentTeam.wickets + 1);
      
      // Update balls/overs for the wicket ball
      let newBalls = currentTeam.balls + 1;
      let newOvers = currentTeam.overs;
      if (newBalls === 6) {
        newOvers += 1;
        newBalls = 0;
      }
      updateTeamStats(team, 'balls', newBalls);
      updateTeamStats(team, 'overs', newOvers);
      
      // Trigger Wicket Animation on Overlay
      channel.postMessage({ type: 'WICKET', message: 'OUT!' });
    }
  };

  const resetInnings = (team?: 'team1' | 'team2') => {
    const teamName = team 
      ? (team === 'team1' ? getTeamName(teams, 0) : getTeamName(teams, 1))
      : 'all';
      
    if (window.confirm(`Are you sure you want to reset ${teamName} scores?`)) {
      if (team) {
        setLiveScores(prev => ({
          ...prev,
          [team]: { ...prev[team], score: 0, wickets: 0, overs: 0, balls: 0 }
        }));
      } else {
        setLiveScores(prev => ({
          ...prev,
          team1: { ...prev.team1, score: 0, wickets: 0, overs: 0, balls: 0 },
          team2: { ...prev.team2, score: 0, wickets: 0, overs: 0, balls: 0 },
          currentRunRate: 0,
          requiredRunRate: 0,
          target: 0,
          lastFiveOvers: '',
        }));
      }
    }
  };

  const switchBatting = () => {
    updateStats('battingTeam', liveScores.battingTeam === 'team1' ? 'team2' : 'team1');
  };

  const renderTeamScoreCard = (team: 'team1' | 'team2', isBatting: boolean) => {
    const teamData = liveScores[team];
    const teamName = team === 'team1' ? getTeamName(teams, 0) : getTeamName(teams, 1);
    
    return (
      <div className="bg-gray-700 p-6 rounded-xl border border-gray-600 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-blue-400">{teamName}</h2>
            {isBatting && <span className="px-2 py-1 bg-green-600 text-xs rounded-full">BATting</span>}
          </div>
          <div className="text-3xl font-mono font-bold">
            {teamData.score}/{teamData.wickets}
            <span className="text-sm text-gray-400 ml-2">
              ({formatOvers(teamData.overs, teamData.balls)})
            </span>
          </div>
        </div>
        
        {/* Scoring Buttons (0, 1, 2, 3, 4, 6, Wicket) */}
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <button
              key={run}
              onClick={() => addRuns(team, run)}
              className="py-4 bg-gray-600 hover:bg-blue-500 rounded-lg font-bold text-xl transition-colors"
            >
              {run === 4 || run === 6 ? <span className="text-yellow-400">{run}</span> : run}
            </button>
          ))}
          <button
            onClick={() => addWicket(team)}
            className="py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-xl col-span-2"
          >
            WICKET
          </button>
        </div>

        {/* Reset Team Button */}
        <button
          onClick={() => resetInnings(team)}
          className="mt-3 w-full py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset {teamName}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toss Section */}
      {!tossWinner && (
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" /> Toss Decision
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleToss('team1', 'bat')}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              {getTeamName(teams, 0)} won & Batting
            </button>
            <button 
              onClick={() => handleToss('team2', 'bat')}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              {getTeamName(teams, 1)} won & Batting
            </button>
          </div>
        </div>
      )}

      {/* Main Scoring Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderTeamScoreCard('team1', liveScores.battingTeam === 'team1')}
        {renderTeamScoreCard('team2', liveScores.battingTeam === 'team2')}
      </div>

      {/* Switch Batting Team Button */}
      {tossWinner && (
        <button
          onClick={switchBatting}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
        >
          Switch Batting
        </button>
      )}

      {/* Extras & Special Scoring */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Extras</h3>
        <div className="flex flex-wrap gap-2">
          {scoringOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => addRuns(liveScores.battingTeam, opt.runs, true, opt.extraType as ScoringButtonType)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-md text-sm font-semibold transition"
            >
              +{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Stats Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Current Run Rate</label>
          <input
            type="number"
            step="0.01"
            value={liveScores.currentRunRate}
            onChange={(e) => updateStats('currentRunRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Required Run Rate</label>
          <input
            type="number"
            step="0.01"
            value={liveScores.requiredRunRate}
            onChange={(e) => updateStats('requiredRunRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Target</label>
          <input
            type="number"
            value={liveScores.target}
            onChange={(e) => updateStats('target', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Last 5 Overs</label>
          <input
            type="text"
            placeholder="e.g., 1 4 W 0 6 1"
            value={liveScores.lastFiveOvers}
            onChange={(e) => updateStats('lastFiveOvers', e.target.value)}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4">
        {error && <p className="text-red-400 self-center mr-auto">{error}</p>}
        <button
          onClick={() => resetInnings()}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition-all"
        >
          <RotateCcw className="w-5 h-5" /> Reset All
        </button>
        <button
          onClick={handleScoreUpdate}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-green-900/20"
        >
          {loading ? 'Saving...' : <><Save className="w-5 h-5" /> UPDATE LIVE SCORE</>}
        </button>
      </div>
    </div>
  );
}
