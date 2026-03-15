export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'organizer' | 'viewer';
  membership: {
    level: 0 | 1 | 2;
    expires: string;
  };
}

export interface Player {
  _id?: string;
  name: string;
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
  jerseyNumber?: string;
}

export interface Team {
  _id: string;
  name: string;
  shortName: string;
  color?: string;
  players: Player[];
  captain?: string;
  tournamentId?: string;
}

export interface Tournament {
  _id: string;
  name: string;
  type: 'round_robin' | 'knockout' | 'league';
  status: 'upcoming' | 'live' | 'completed';
  format: 'T10' | 'T20' | 'ODI' | 'Test';
  organizer: string;
  teams: Team[];
  matches: Match[];
  startDate: string;
  venue?: string;
  description?: string;
  liveScores?: LiveScores;
  bracket?: any[];
  pointsTable?: any[];
}

export interface Match {
  _id: string;
  name: string;
  tournamentId: string;
  tournament?: Tournament | string;
  team1: Team;
  team2: Team;
  team1Name: string;
  team2Name: string;
  status: 'upcoming' | 'live' | 'completed';
  venue?: string;
  format?: string;
  matchType?: string;
  videoLink?: string;
  liveStreamUrl?: string;
  videoLinks?: string[];
  strikerName?: string;
  nonStrikerName?: string;
  bowlerName?: string;
  battingTeam?: 'team1' | 'team2';
  target?: number;
  currentRunRate?: number;
  score1?: number;
  wickets1?: number;
  overs1?: number;
  score2?: number;
  wickets2?: number;
  overs2?: number;
  tossWinner?: string;
  team1Score: number;
  team1Wickets: number;
  team1Overs: number;
  team2Score: number;
  team2Wickets: number;
  team2Overs: number;
  currentInnings: number;
  liveScores?: LiveScores;
  innings?: Innings[];
  date: string;
}

export interface Innings {
  teamId: string;
  status: 'in_progress' | 'completed';
  score: number;
  wickets: number;
  overs: number;
  balls: number;
  runRate: number;
  targetScore?: number;
  requiredRuns?: number;
  requiredRunRate?: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  batsmen: Batsman[];
  bowlers: Bowler[];
  fallOfWickets: Array<{
    wicket: number;
    score: number;
    overs: number;
    batsman: string;
  }>;
}

export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isStriker?: boolean;
  isOut?: boolean;
  outType?: string;
  outTo?: string;
}

export interface Bowler {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface LiveScores {
  team1: TeamInnings;
  team2: TeamInnings;
  battingTeam: 'team1' | 'team2';
  currentRunRate: number;
  requiredRunRate?: number;
  target?: number;
  lastFiveOvers?: string;
  innings: number;
  isChasing: boolean;
}

export interface TeamInnings {
  name: string;
  score: number;
  wickets: number;
  overs: number;
  balls: number;
  batsmen: Batsman[];
  bowler: Bowler;
}

export interface Message {
  _id: string;
  content: string;
  sender: User;
  timestamp: string;
}

export interface Overlay {
  _id: string;
  name: string;
  template: string;
  config: any;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
