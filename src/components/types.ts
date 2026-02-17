export interface User {
  fullName: any;
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'organizer';
  friends?: string[];
  profilePicture?: string;
  bio?: string;
}

export interface Tournament {
  teams: any;
  _id: string;
  name: string;
  description?: string;
  format: string;
  startDate: string;
  numberOfTeams: number;
  status: 'upcoming' | 'active' | 'completed';
  isLive: boolean;
  liveScores?: {
    team1: { name: string; score: number; wickets: number; overs: number; balls?: number };
    team2: { name: string; score: number; wickets: number; overs: number; balls?: number };
    currentRunRate: number;
    requiredRunRate: number;
    target: number;
    lastFiveOvers: string;
  };

  createdBy: string;
}

export interface Team {
  _id: string;
  name: string;
  color: string;
  logo?: string;
  tournament: string;
  players: Player[];
  createdBy: string;
}

export interface Player {
  _id: string;
  name: string;
  role: string;
  jerseyNumber: string;
  image?: string;
  stats?: {
    runs: number;
    wickets: number;
    // Add more stats as needed
  };
}
export interface Bracket {
  _id: string;
  tournament: Tournament;
  type: string;
  numberOfTeams: number;
  rounds: any[];
  createdBy: string;
}

export interface Overlay {
  match: any;
  match: any;
  _id: string;
  name: string;
  tournament: Tournament;
  template: string;
  config: any;
  elements: any[];
  publicId: string;
  createdBy: string;
}
export interface Match {
  _id: string;
  tournament: string;
  team1: Team;
  team2: Team;
  date: string;
  venue?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'upcoming' | 'active'; // Added 'ongoing'
  score1?: number;
  score2?: number;
  wickets1?: number;
  wickets2?: number;
  overs1?: number;
  overs2?: number;
  winner?: string;
  tossWinner?: string;
  matchType?: 'League' | 'Quarter-Final' | 'Semi-Final' | 'Final' | 'Playoff';
  createdBy: string;
}

export interface Notification {
  _id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Friend {
  _id: string;
  from: User;
  to: User;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface Club {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
