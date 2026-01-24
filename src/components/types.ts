export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'organizer';
}

export interface Tournament {
  _id: string;
  name: string;
  description?: string;
  format: string;
  startDate: string;
  numberOfTeams: number;
  status: 'upcoming' | 'active' | 'completed';
  isLive: boolean;
  liveScores?: {
    team1: { name: string; score: number; wickets: number; overs: number };
    team2: { name: string; score: number; wickets: number; overs: number };
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
  _id?: string;
  name: string;
  role: string;
  jerseyNumber: string;
  image?: string;
}

export interface Bracket {
  _id: string;
  tournament: Tournament;
  type: string;
  rounds: any[];
  createdBy: string;
}

export interface Overlay {
  _id: string;
  name: string;
  tournament: Tournament;
  template: string;
  config: any;
  elements: any[];
  publicId: string;
  createdBy: string;
}