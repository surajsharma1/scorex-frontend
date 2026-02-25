// Core Data Models

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  profilePicture?: string;
  bio?: string;
  role?: 'admin' | 'user' | 'organizer';
  stats?: {
    tournamentsCreated: number;
    matchesManaged: number;
    teamsCreated: number;
  };
  createdAt?: string;
}

export interface Player {
  id?: string;
  _id?: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket Keeper';
  jerseyNumber: number | string;
  stats?: {
    matches: number;
    runs: number;
    wickets: number;
    average?: number;
  };
}

export interface Team {
  _id: string;
  name: string;
  shortName: string;
  color: string;
  logo?: string;
  players: Player[];
  tournament?: string;
  stats?: {
    played: number;
    won: number;
    lost: number;
    points: number;
    nrr: number;
  };
  // For live match display
  batsmen?: Batsman[];
  bowler?: Bowler;
}

export interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  format: 'T20' | 'ODI' | 'Test';
  teams: Team[];
  numberOfTeams?: number;
  liveScores?: LiveScores;
}

// Pagination type
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface Match {
  _id: string;
  tournament: Tournament | string;
  team1: Team;
  team2: Team;
  date: string;
  venue: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'upcoming';
  matchType: string;
  tossWinner?: string;
  tossChoice?: 'bat' | 'bowl';
  
  // Live Score Data
  score1?: number;
  wickets1?: number;
  overs1?: number;
  score2?: number;
  wickets2?: number;
  overs2?: number;
  
  currentRunRate?: number;
  requiredRunRate?: number;
  target?: number;
  
  videoLink?: string;
  liveStreamUrl?: string;
  
  liveScores?: LiveScores;
  
  // Added for live tracking
  battingTeam?: 'team1' | 'team2';
}

// Complex Scoring Types
export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isStriker: boolean;
  out?: string;
}

export interface Bowler {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
}

export interface TeamInnings {
  name: string;
  score: number;
  wickets: number;
  overs: number;
  balls: number;
  batsmen: Batsman[];
  bowler: Bowler | null;
}

export interface LiveScores {
  team1: TeamInnings;
  team2: TeamInnings;
  battingTeam: 'team1' | 'team2';
  currentRunRate: number;
  requiredRunRate: number;
  target: number;
  lastFiveOvers: string;
  innings: number;
  isChasing: boolean;
  [key: string]: any; // Index signature for dynamic access
}

export interface Message {
  _id: string;
  content: string;
  from: string;
  to: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  _id: string;
  player?: { name: string };
  team?: { name: string };
  stats: {
    runs?: number;
    wickets?: number;
    matches: number;
    average?: number;
    strikeRate?: number;
    economy?: number;
    overs?: number;
    wins?: number;
    losses?: number;
  };
}

export interface Friend {
  _id: string;
  status: 'pending' | 'accepted';
  from?: User;
  to?: User;
}

export interface Club {
  _id: string;
  name: string;
  description: string;
  members: User[];
  admin: string;
}

export interface Overlay {
  id: string;
  name: string;
  file: string;
  type: 'free' | 'premium';
  color: string;
}
