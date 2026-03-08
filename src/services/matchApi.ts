/**
 * Match API Module - Re-exported from unified API
 * 
 * This file is kept for backward compatibility.
 * All match functions are now available in api.ts
 * 
 * @deprecated Use import { matchAPI } from './api' instead
 */

import { matchAPI, BallPayload, PlayerSelectionPayload } from './api';

// Re-export for backward compatibility
export { matchAPI };

// Also export as matchApi for old code that imports as { matchApi }
export const matchApi = matchAPI;

// Export types for backward compatibility
export type { BallPayload, PlayerSelectionPayload };

// Export all match functions
export const getMatches = matchAPI.getMatches;
export const getAllMatches = matchAPI.getAllMatches;
export const getMatch = matchAPI.getMatch;
export const getMatchById = matchAPI.getMatchById;
export const getMatchesByTournament = matchAPI.getMatchesByTournament;
export const createMatch = matchAPI.createMatch;
export const updateMatch = matchAPI.updateMatch;
export const deleteMatch = matchAPI.deleteMatch;
export const saveToss = matchAPI.saveToss;
export const savePlayerSelections = matchAPI.savePlayerSelections;
export const startMatch = matchAPI.startMatch;
export const scoreBall = matchAPI.scoreBall;
export const updateMatchScore = matchAPI.updateMatchScore;
export const undoLastBall = matchAPI.undoLastBall;
export const changeBowler = matchAPI.changeBowler;
export const updateStriker = matchAPI.updateStriker;
export const updateNonStriker = matchAPI.updateNonStriker;
export const getTournamentStats = matchAPI.getTournamentStats;

