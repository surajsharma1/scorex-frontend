export type ExtraType = 'None' | 'WD' | 'NB' | 'B' | 'LB';
export type WicketType = 'Bowled' | 'Caught' | 'LBW' | 'Run Out' | 'Stumped' | 'Hit Wicket' | 'Other';
export interface PlayerStats {
    id: string;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    wickets?: number;
    overs?: number;
}
export interface MatchState {
    teamScore: number;
    teamWickets: number;
    totalValidBalls: number;
    striker: PlayerStats;
    nonStriker: PlayerStats;
    bowler: PlayerStats;
    currentOverLog: string[];
    history: Omit<MatchState, 'history'>[];
}
export type Action = {
    type: 'SCORE_RUNS';
    payload: {
        runs: number;
        isBoundary?: boolean;
    };
} | {
    type: 'EXTRA';
    payload: {
        type: ExtraType;
        runsOffBat: number;
        extraRuns: number;
    };
} | {
    type: 'WICKET';
    payload: {
        type: WicketType;
        runsCompletedBeforeOut: number;
    };
} | {
    type: 'SWAP_STRIKE';
} | {
    type: 'END_OVER';
    payload: {
        nextBowler: PlayerStats;
    };
} | {
    type: 'CHANGE_BATSMAN';
    payload: {
        newBatsman: PlayerStats;
    };
} | {
    type: 'UNDO';
};
export declare function useCricketScoring(initialMatchData?: Partial<MatchState>): {
    matchState: MatchState;
    dispatch: import("react").Dispatch<Action>;
    scoreRuns: (runs: number, isBoundary?: boolean) => void;
    scoreExtra: (type: ExtraType, runsOffBat: number, extraRuns: number) => void;
    takeWicket: (type: WicketType, runsCompletedBeforeOut?: number) => void;
    undoLastBall: () => void;
};
//# sourceMappingURL=useCricketScoring.d.ts.map