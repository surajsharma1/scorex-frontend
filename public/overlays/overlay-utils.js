// Overlay Utilities - Team/Player Toggle and Data Management

// Sample match data (will be replaced by API data)
let matchData = {
  tournament: {
    name: 'Premier League T20',
    logo: ''
  },
  team1: {
    name: 'Mumbai Warriors',
    shortName: 'MW',
    score: '185',
    wickets: '4',
    overs: '20.0',
    color: '#004BA0',
    players: [
      { name: 'Rohit Sharma', role: 'Batsman (C)' },
      { name: 'Quinton de Kock', role: 'WK-Batsman' },
      { name: 'Suryakumar Yadav', role: 'Batsman' },
      { name: 'Ishan Kishan', role: 'WK-Batsman' },
      { name: 'Kieron Pollard', role: 'All-rounder' },
      { name: 'Hardik Pandya', role: 'All-rounder' },
      { name: 'Krunal Pandya', role: 'All-rounder' },
      { name: 'Rahul Chahar', role: 'Bowler' },
      { name: 'Trent Boult', role: 'Bowler' },
      { name: 'Jasprit Bumrah', role: 'Bowler' },
      { name: 'Adam Milne', role: 'Bowler' }
    ]
  },
  team2: {
    name: 'Chennai Kings',
    shortName: 'CK',
    score: '142',
    wickets: '7',
    overs: '16.2',
    color: '#FCCA06',
    players: [
      { name: 'MS Dhoni', role: 'WK-Batsman (C)' },
      { name: 'Ruturaj Gaikwad', role: 'Batsman' },
      { name: 'Faf du Plessis', role: 'Batsman' },
      { name: 'Moeen Ali', role: 'All-rounder' },
      { name: 'Ambati Rayudu', role: 'Batsman' },
      { name: 'Ravindra Jadeja', role: 'All-rounder' },
      { name: 'Sam Curran', role: 'All-rounder' },
      { name: 'Dwayne Bravo', role: 'All-rounder' },
      { name: 'Shardul Thakur', role: 'Bowler' },
      { name: 'Deepak Chahar', role: 'Bowler' },
      { name: 'Josh Hazlewood', role: 'Bowler' }
    ]
  },
  stats: {
    currentRunRate: '8.75',
    requiredRunRate: '12.30',
    last5Overs: '48/2',
    target: '186'
  },
  status: 'In Progress',
  result: 'Mumbai Warriors need 44 runs in 22 balls'
};

// Initialize overlay with data
function initOverlay(customData = null) {
  if (customData) {
    matchData = { ...matchData, ...customData };
  }
  updateScoreDisplay();
  setupTeamsPanel();
}

// Update score display
function updateScoreDisplay() {
  // Team 1
  const team1Name = document.getElementById('team1-name');
  const team1Score = document.getElementById('team1-score');
  const team1Overs = document.getElementById('team1-overs');
  
  if (team1Name) team1Name.textContent = matchData.team1.name;
  if (team1Score) team1Score.textContent = `${matchData.team1.score}/${matchData.team1.wickets}`;
  if (team1Overs) team1Overs.textContent = `${matchData.team1.overs} Overs`;
  
  // Team 2
  const team2Name = document.getElementById('team2-name');
  const team2Score = document.getElementById('team2-score');
  const team2Overs = document.getElementById('team2-overs');
  
  if (team2Name) team2Name.textContent = matchData.team2.name;
  if (team2Score) team2Score.textContent = `${matchData.team2.score}/${matchData.team2.wickets}`;
  if (team2Overs) team2Overs.textContent = `${matchData.team2.overs} Overs`;
  
  // Tournament
  const tournamentName = document.getElementById('tournament-name');
  if (tournamentName) tournamentName.textContent = matchData.tournament.name;
  
  // Stats
  const crr = document.getElementById('current-rr');
  const rrr = document.getElementById('required-rr');
  const last5 = document.getElementById('last-5');
  const target = document.getElementById('target');
  
  if (crr) crr.textContent = matchData.stats.currentRunRate;
  if (rrr) rrr.textContent = matchData.stats.requiredRunRate;
  if (last5) last5.textContent = matchData.stats.last5Overs;
  if (target) target.textContent = matchData.stats.target;
  
  // Result
  const result = document.getElementById('match-result');
  if (result) result.textContent = matchData.result;
}

// Setup teams panel
function setupTeamsPanel() {
  const teamsPanel = document.getElementById('teams-panel');
  if (!teamsPanel) return;
  
  const team1Roster = document.getElementById('team1-roster');
  const team2Roster = document.getElementById('team2-roster');
  const team1Title = document.getElementById('team1-roster-title');
  const team2Title = document.getElementById('team2-roster-title');
  
  if (team1Title) team1Title.textContent = matchData.team1.name;
  if (team2Title) team2Title.textContent = matchData.team2.name;
  
  if (team1Roster) {
    team1Roster.innerHTML = matchData.team1.players.map(player => `
      <li class="player-item">
        <span class="player-name">${player.name}</span>
        <span class="player-role">${player.role}</span>
      </li>
    `).join('');
  }
  
  if (team2Roster) {
    team2Roster.innerHTML = matchData.team2.players.map(player => `
      <li class="player-item">
        <span class="player-name">${player.name}</span>
        <span class="player-role">${player.role}</span>
      </li>
    `).join('');
  }
}

// Toggle teams panel
function toggleTeamsPanel() {
  const panel = document.getElementById('teams-panel');
  if (panel) {
    panel.classList.toggle('active');
  }
}

// Close teams panel
function closeTeamsPanel() {
  const panel = document.getElementById('teams-panel');
  if (panel) {
    panel.classList.remove('active');
  }
}

// Fetch live data from API
async function fetchLiveData(matchId, apiBaseUrl) {
  try {
    const response = await fetch(`${apiBaseUrl}/matches/${matchId}`);
    const data = await response.json();
    
    if (data) {
      matchData = {
        tournament: {
          name: data.tournament?.name || 'Tournament',
          logo: data.tournament?.logo || ''
        },
        team1: {
          name: data.team1?.name || 'Team 1',
          shortName: data.team1?.shortName || 'T1',
          score: data.team1Score?.runs?.toString() || '0',
          wickets: data.team1Score?.wickets?.toString() || '0',
          overs: data.team1Score?.overs?.toString() || '0.0',
          color: data.team1?.color || '#004BA0',
          players: data.team1?.players || []
        },
        team2: {
          name: data.team2?.name || 'Team 2',
          shortName: data.team2?.shortName || 'T2',
          score: data.team2Score?.runs?.toString() || '0',
          wickets: data.team2Score?.wickets?.toString() || '0',
          overs: data.team2Score?.overs?.toString() || '0.0',
          color: data.team2?.color || '#FCCA06',
          players: data.team2?.players || []
        },
        stats: {
          currentRunRate: data.currentRunRate?.toFixed(2) || '0.00',
          requiredRunRate: data.requiredRunRate?.toFixed(2) || '0.00',
          last5Overs: data.last5Overs || '0/0',
          target: data.target?.toString() || '0'
        },
        status: data.status || 'Scheduled',
        result: data.result || ''
      };
      
      updateScoreDisplay();
      setupTeamsPanel();
    }
  } catch (error) {
    console.error('Error fetching match data:', error);
  }
}

// Auto-refresh data
function startAutoRefresh(matchId, apiBaseUrl, intervalMs = 5000) {
  fetchLiveData(matchId, apiBaseUrl);
  return setInterval(() => fetchLiveData(matchId, apiBaseUrl), intervalMs);
}

// Get URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    matchId: params.get('matchId'),
    apiBaseUrl: params.get('apiUrl') || 'http://localhost:5000/api/v1'
  };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const { matchId, apiBaseUrl } = getUrlParams();
  
  if (matchId) {
    startAutoRefresh(matchId, apiBaseUrl);
  } else {
    initOverlay();
  }
});

// Export functions for external use
window.OverlayUtils = {
  initOverlay,
  updateScoreDisplay,
  toggleTeamsPanel,
  closeTeamsPanel,
  fetchLiveData,
  startAutoRefresh,
  getMatchData: () => matchData,
  setMatchData: (data) => { matchData = data; updateScoreDisplay(); setupTeamsPanel(); }
};
