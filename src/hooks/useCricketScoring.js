import { useReducer, useCallback } from 'react';
// --- Initial State Placeholder ---
const initialState = {
    teamScore: 0,
    teamWickets: 0,
    totalValidBalls: 0,
    striker: { id: 'p1', name: 'Player 1', runs: 0, balls: 0, fours: 0, sixes: 0 },
    nonStriker: { id: 'p2', name: 'Player 2', runs: 0, balls: 0, fours: 0, sixes: 0 },
    bowler: { id: 'b1', name: 'Bowler 1', runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, overs: 0 },
    currentOverLog: [],
    history: [],
};
// --- The Core Logic Engine ---
function scoringReducer(state, action) {
    // Helper to save current state to history before mutating
    const saveHistory = () => {
        const { history, ...currentState } = state;
        return JSON.parse(JSON.stringify(currentState)); // Deep copy to prevent reference bugs
    };
    switch (action.type) {
        case 'SCORE_RUNS': {
            const { runs, isBoundary } = action.payload;
            const isOdd = runs % 2 !== 0;
            return {
                ...state,
                history: [...state.history, saveHistory()],
                teamScore: state.teamScore + runs,
                totalValidBalls: state.totalValidBalls + 1,
                currentOverLog: [...state.currentOverLog, runs.toString()],
                striker: {
                    ...state.striker,
                    runs: state.striker.runs + runs,
                    balls: state.striker.balls + 1,
                    fours: isBoundary && runs === 4 ? state.striker.fours + 1 : state.striker.fours,
                    sixes: isBoundary && runs === 6 ? state.striker.sixes + 1 : state.striker.sixes,
                },
                bowler: {
                    ...state.bowler,
                    runs: state.bowler.runs + runs,
                    overs: (state.bowler.overs || 0) + 1,
                },
                // Auto-swap strike if odd runs scored
                ...(isOdd && {
                    striker: state.nonStriker,
                    nonStriker: state.striker
                })
            };
        }
        case 'EXTRA': {
            const { type, runsOffBat, extraRuns } = action.payload;
            const totalRuns = runsOffBat + extraRuns;
            const isOdd = runsOffBat % 2 !== 0;
            const isWideOrNoBall = type === 'WD' || type === 'NB';
            // Wides/NoBalls don't count as valid balls. Byes/LegByes do.
            const validBallIncrement = isWideOrNoBall ? 0 : 1;
            // Runs off bat during a NoBall go to the batsman. Byes/Wides do not.
            const strikerRunsToAdd = type === 'NB' ? runsOffBat : 0;
            const strikerBallsToAdd = type === 'WD' ? 0 : 1; // Wide doesn't count as ball faced
            return {
                ...state,
                history: [...state.history, saveHistory()],
                teamScore: state.teamScore + totalRuns,
                totalValidBalls: state.totalValidBalls + validBallIncrement,
                currentOverLog: [...state.currentOverLog, `${totalRuns}${type}`],
                striker: {
                    ...state.striker,
                    runs: state.striker.runs + strikerRunsToAdd,
                    balls: state.striker.balls + strikerBallsToAdd,
                },
                bowler: {
                    ...state.bowler,
                    runs: state.bowler.runs + totalRuns, // All extras usually count against bowler economy except Byes/LegByes in some rules
                    overs: (state.bowler.overs || 0) + validBallIncrement,
                },
                ...(isOdd && {
                    striker: state.nonStriker,
                    nonStriker: state.striker
                })
            };
        }
        case 'WICKET': {
            const { type, runsCompletedBeforeOut } = action.payload;
            const isOdd = runsCompletedBeforeOut % 2 !== 0;
            return {
                ...state,
                history: [...state.history, saveHistory()],
                teamScore: state.teamScore + runsCompletedBeforeOut,
                teamWickets: state.teamWickets + 1,
                totalValidBalls: state.totalValidBalls + 1,
                currentOverLog: [...state.currentOverLog, 'W'],
                bowler: {
                    ...state.bowler,
                    wickets: (state.bowler.wickets || 0) + (type !== 'Run Out' ? 1 : 0), // Run outs don't go to bowler
                    overs: (state.bowler.overs || 0) + 1,
                    runs: state.bowler.runs + runsCompletedBeforeOut
                },
                striker: {
                    ...state.striker,
                    runs: state.striker.runs + runsCompletedBeforeOut,
                    balls: state.striker.balls + 1
                },
                // If batsmen crossed before run out, they swap
                ...(isOdd && {
                    striker: state.nonStriker,
                    nonStriker: state.striker
                })
            };
        }
        case 'SWAP_STRIKE':
            return {
                ...state,
                history: [...state.history, saveHistory()],
                striker: state.nonStriker,
                nonStriker: state.striker
            };
        case 'END_OVER':
            return {
                ...state,
                history: [...state.history, saveHistory()],
                currentOverLog: [], // Reset the tracker
                bowler: action.payload.nextBowler, // Inject new bowler
                striker: state.nonStriker, // Strike swaps automatically at end of over
                nonStriker: state.striker
            };
        case 'CHANGE_BATSMAN':
            return {
                ...state,
                history: [...state.history, saveHistory()],
                striker: action.payload.newBatsman
            };
        case 'UNDO': {
            if (state.history.length === 0)
                return state;
            const previousState = state.history[state.history.length - 1];
            const newHistory = state.history.slice(0, -1);
            return {
                ...previousState,
                history: newHistory
            };
        }
        default:
            return state;
    }
}
// --- The Hook ---
export function useCricketScoring(initialMatchData) {
    const [state, dispatch] = useReducer(scoringReducer, { ...initialState, ...initialMatchData });
    // Expose dispatch directly, but also provide wrapped helper functions for clean UI code
    const scoreRuns = useCallback((runs, isBoundary = false) => {
        dispatch({ type: 'SCORE_RUNS', payload: { runs, isBoundary } });
    }, []);
    const scoreExtra = useCallback((type, runsOffBat, extraRuns) => {
        dispatch({ type: 'EXTRA', payload: { type, runsOffBat, extraRuns } });
    }, []);
    const takeWicket = useCallback((type, runsCompletedBeforeOut = 0) => {
        dispatch({ type: 'WICKET', payload: { type, runsCompletedBeforeOut } });
    }, []);
    const undoLastBall = useCallback(() => {
        dispatch({ type: 'UNDO' });
    }, []);
    return {
        matchState: state,
        dispatch,
        scoreRuns,
        scoreExtra,
        takeWicket,
        undoLastBall
    };
}
