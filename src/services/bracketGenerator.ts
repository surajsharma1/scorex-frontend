import { BracketMatch } from './supabase';

export function generateBracketMatches(
  bracketId: string,
  teamIds: string[],
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin' | 'group_knockout'
): Omit<BracketMatch, 'id'>[] {
  const matches: Omit<BracketMatch, 'id'>[] = [];
  const teamCount = teamIds.length;

  if (bracketType === 'single_elimination') {
    return generateSingleElimination(bracketId, teamIds);
  } else if (bracketType === 'double_elimination') {
    return generateDoubleElimination(bracketId, teamIds);
  } else if (bracketType === 'round_robin') {
    return generateRoundRobin(bracketId, teamIds);
  } else if (bracketType === 'group_knockout') {
    return generateGroupKnockout(bracketId, teamIds);
  }

  return matches;
}

function generateSingleElimination(bracketId: string, teamIds: string[]): Omit<BracketMatch, 'id'>[] {
  const matches: Omit<BracketMatch, 'id'>[] = [];
  let round = 1;
  let currentTeams = [...teamIds];

  while (currentTeams.length > 1) {
    let matchNumber = 1;
    for (let i = 0; i < currentTeams.length; i += 2) {
      matches.push({
        bracket_id: bracketId,
        round,
        match_number: matchNumber,
        team1_id: currentTeams[i] || undefined,
        team2_id: currentTeams[i + 1] || undefined,
        status: 'pending',
      });
      matchNumber++;
    }
    currentTeams = Array(Math.ceil(currentTeams.length / 2)).fill(null);
    round++;
  }

  return matches;
}

function generateDoubleElimination(bracketId: string, teamIds: string[]): Omit<BracketMatch, 'id'>[] {
  const matches = generateSingleElimination(bracketId, teamIds);
  const roundCount = Math.ceil(Math.log2(teamIds.length));

  for (let i = 1; i <= roundCount - 1; i++) {
    let matchNumber = 1;
    const losersInRound = Math.pow(2, i - 1);
    for (let j = 0; j < losersInRound; j++) {
      matches.push({
        bracket_id: bracketId,
        round: roundCount + i,
        match_number: matchNumber,
        status: 'pending',
      });
      matchNumber++;
    }
  }

  return matches;
}

function generateRoundRobin(bracketId: string, teamIds: string[]): Omit<BracketMatch, 'id'>[] {
  const matches: Omit<BracketMatch, 'id'>[] = [];
  let matchNumber = 1;

  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        bracket_id: bracketId,
        round: 1,
        match_number: matchNumber,
        team1_id: teamIds[i],
        team2_id: teamIds[j],
        status: 'pending',
      });
      matchNumber++;
    }
  }

  return matches;
}

function generateGroupKnockout(bracketId: string, teamIds: string[]): Omit<BracketMatch, 'id'>[] {
  const matches: Omit<BracketMatch, 'id'>[] = [];
  const groupSize = Math.ceil(teamIds.length / 2);
  let matchNumber = 1;

  for (let g = 0; g < 2; g++) {
    const groupStart = g * groupSize;
    const groupEnd = Math.min(groupStart + groupSize, teamIds.length);
    const groupTeams = teamIds.slice(groupStart, groupEnd);

    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          bracket_id: bracketId,
          round: 1,
          match_number: matchNumber,
          team1_id: groupTeams[i],
          team2_id: groupTeams[j],
          status: 'pending',
        });
        matchNumber++;
      }
    }
  }

  const qualifiers = 4;
  for (let i = 0; i < qualifiers; i += 2) {
    matches.push({
      bracket_id: bracketId,
      round: 2,
      match_number: Math.floor(i / 2) + 1,
      status: 'pending',
    });
  }

  for (let i = 0; i < 2; i++) {
    matches.push({
      bracket_id: bracketId,
      round: 3,
      match_number: i + 1,
      status: 'pending',
    });
  }

  matches.push({
    bracket_id: bracketId,
    round: 4,
    match_number: 1,
    status: 'pending',
  });

  return matches;
}