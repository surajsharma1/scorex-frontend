/**
 * @deprecated This file is deprecated. All functionality has been merged into api.ts.
 * Please import from '../services/api' instead.
 * 
 * This file is kept for backward compatibility only.
 */

export { 
  matchAPI, 
  BallPayload, 
  PlayerSelectionPayload 
} from './api';

import { api } from './api';

// Re-export for backward compatibility
export const matchApi = {
  scoreBall: (matchId: string, payload: any) => 
    api.put(`/matches/${matchId}/score`, payload),
  undoBall: (matchId: string) => 
    api.put(`/matches/${matchId}/undo`),
  getMatch: (matchId: string) => 
    api.get(`/matches/${matchId}`),
  getMatches: (params?: any) => 
    api.get('/matches', { params }),
  getMatchesByTournament: (tournamentId: string) => 
    api.get('/matches', { params: { tournament: tournamentId } }),
  saveToss: (matchId: string, tossWinnerId: string, decision: string) => 
    api.put(`/matches/${matchId}/toss`, { tossWinnerId, decision }),
  savePlayerSelections: (matchId: string, payload: any) => 
    api.put(`/matches/${matchId}/players`, payload),
  changeBowler: (matchId: string, newBowlerId: string, newBowlerName: string) => 
    api.put(`/matches/${matchId}/bowler`, { newBowler: newBowlerId }),
  updateStriker: (matchId: string, newStrikerId: string, newStrikerName: string) => 
    api.put(`/matches/${matchId}/striker`, { newStriker: newStrikerId }),
  updateNonStriker: (matchId: string, newNonStrikerId: string, newNonStrikerName: string) => 
    api.put(`/matches/${matchId}/nonstriker`, { newNonStriker: newNonStrikerId }),
  getTournamentStats: (tournamentId: string) => 
    api.get(`/matches/stats/${tournamentId}`),
  createMatch: (data: any) => 
    api.post('/matches', data),
  deleteMatch: (matchId: string) => 
    api.delete(`/matches/${matchId}`),
};

export default matchApi;
