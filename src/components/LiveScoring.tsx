import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useCricketScoring } from '../hooks/useCricketScoring';
import { matchApi, BallPayload } from '../services/matchApi';
import { socket } from '../services/socket';

export default function LiveScoring() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matchState, scoreRuns, scoreExtra, takeWicket, undoLastBall } = useCricketScoring();
  const [isSyncing, setIsSyncing] = useState(false);
  const [matchLoaded, setMatchLoaded] = useState(false);

  // Initial Load: Fetch DB state and populate hook
  useEffect(() => {
    if (!matchId) return;
    
    const loadMatch = async () => {
      try {
        const res = await matchApi.getMatch(matchId);
        const matchData = res.data?.data || res.data;
        
        if (matchData && matchData.firstInnings) {
          // Initialize hook with DB state
          console.log("Match loaded from DB:", matchData);
          setMatchLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load match:", error);
      }
    };
    
    loadMatch();
  }, [matchId]);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!matchId) return;

    // Join the match room
    socket.emit('join_match', matchId);

    // Listen for match updates from other scorers
    const handleMatchUpdate = (updatedMatch: any) => {
      console.log('Received match update via socket:', updatedMatch);
      // Here you could update the local state with the new match data
      // For now, we just log it to avoid overriding local scoring
    };

    socket.on('match_updated', handleMatchUpdate);

    return () => {
      socket.emit('leave_match', matchId);
      socket.off('match_updated', handleMatchUpdate);
    };
  }, [matchId]);

  // Helper to calculate current over for the DB log
  const currentOver = Math.floor(matchState.totalValidBalls / 6);
  const currentBallInOver = (matchState.totalValidBalls % 6) + 1;

  // --- Wrapper Functions that handle both UI and DB ---

  const handleScoreRuns = async (runs: number, isBoundary = false) => {
    // Validate matchId before making API call
    if (!matchId || matchId === 'undefined' || matchId === 'null') {
      console.error("Cannot score: invalid matchId", matchId);
      alert("Error: Match ID is invalid. Please refresh the page.");
      return;
    }

    // 1. Instantly update UI (Optimistic Update)
    scoreRuns(runs, isBoundary);

    // 2. Format payload for MongoDB - use string IDs (will be validated by backend)
    const payload: BallPayload = {
      overNumber: currentOver,
      ballNumber: currentBallInOver,
      bowler: matchState.bowler.id || 'unknown',
      striker: matchState.striker.id || 'unknown',
      nonStriker: matchState.nonStriker.id || 'unknown',
      runsOffBat: runs,
      extras: 0,
      extraType: 'None',
      isWicket: false,
      wicketType: 'None'
    };

    // 3. Sync to Backend silently
    try {
      setIsSyncing(true);
      await matchApi.scoreBall(matchId, payload);
    } catch (error) {
      console.error("Network Error: Failed to sync ball to database", error);
      alert("Sync failed! Undoing last action to prevent desync.");
      undoLastBall(); // Rollback UI if DB fails
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWicket = async (wicketType: string) => {
    // Validate matchId before making API call
    if (!matchId || matchId === 'undefined' || matchId === 'null') {
      console.error("Cannot record wicket: invalid matchId", matchId);
      return;
    }

    takeWicket(wicketType as any, 0);

    const payload: BallPayload = {
      overNumber: currentOver,
      ballNumber: currentBallInOver,
      bowler: matchState.bowler.id || 'unknown',
      striker: matchState.striker.id || 'unknown',
      nonStriker: matchState.nonStriker.id || 'unknown',
      runsOffBat: 0,
      extras: 0,
      extraType: 'None',
      isWicket: true,
      wicketType: wicketType
    };

    try {
      setIsSyncing(true);
      await matchApi.scoreBall(matchId, payload);
    } catch (error) {
      console.error("Failed to sync wicket:", error);
      undoLastBall();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUndo = async () => {
    // Validate matchId before making API call
    if (!matchId || matchId === 'undefined' || matchId === 'null') {
      console.error("Cannot undo: invalid matchId", matchId);
      return;
    }

    // Revert frontend instantly
    undoLastBall();
    // Revert backend mathematically
    try {
      await matchApi.undoBall(matchId);
    } catch (error) {
      console.error("Failed to undo in DB");
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      {/* Network Status Indicator */}
      {isSyncing && <div className="text-yellow-400 text-xs text-right">Syncing...</div>}

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto mt-4">
        {/* Scoreboard Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-green-400 tracking-tighter">
            {matchState.teamScore} <span className="text-gray-400 text-4xl">/</span> {matchState.teamWickets}
          </h1>
          <p className="text-xl text-gray-400 mt-2">
            Overs: <span className="text-white font-bold">
              {Math.floor(matchState.totalValidBalls / 6)}.{matchState.totalValidBalls % 6}
            </span>
          </p>
        </div>

        {/* Core Run Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button onClick={() => handleScoreRuns(0)} className="bg-gray-700 hover:bg-gray-600 p-4 rounded text-xl font-bold transition-colors">0</button>
          <button onClick={() => handleScoreRuns(1)} className="bg-gray-700 hover:bg-gray-600 p-4 rounded text-xl font-bold transition-colors">1</button>
          <button onClick={() => handleScoreRuns(2)} className="bg-gray-700 hover:bg-gray-600 p-4 rounded text-xl font-bold transition-colors">2</button>
          <button onClick={() => handleScoreRuns(3)} className="bg-gray-700 hover:bg-gray-600 p-4 rounded text-xl font-bold transition-colors">3</button>
          <button onClick={() => handleScoreRuns(4, true)} className="bg-blue-600 hover:bg-blue-500 p-4 rounded text-xl font-bold transition-colors">4</button>
          <button onClick={() => handleScoreRuns(6, true)} className="bg-green-600 hover:bg-green-500 p-4 rounded text-xl font-bold transition-colors">6</button>
        </div>

        {/* Wicket & Extras */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => handleWicket('Caught')} className="bg-red-600 hover:bg-red-500 p-4 rounded text-xl font-bold tracking-wider transition-colors">OUT</button>
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors">WD</button>
            <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors">NB</button>
          </div>
        </div>

        {/* Danger Zone (Undo) */}
        <div className="border-t border-gray-700 pt-4">
          <button 
            onClick={handleUndo} 
            disabled={matchState.history.length === 0}
            className="w-full bg-gray-800 border border-gray-600 text-gray-300 p-3 rounded disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            ↺ Undo Last Ball
          </button>
        </div>
      </div>
    </div>
  );
}
