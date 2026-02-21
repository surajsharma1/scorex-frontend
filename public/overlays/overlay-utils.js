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
      // Calculate run rates based on match data
      const overs1 = parseFloat(data.overs1) || 0;
      const overs2 = parseFloat(data.overs2) || 0;
      const score1 = parseInt(data.score1) || 0;
      const score2 = parseInt(data.score2) || 0;
      
      const currentRunRate = overs2 > 0 ? (score2 / overs2).toFixed(2) : '0.00';
      const target = score1 + 1;
      const remainingRuns = target - score2;
      const remainingOvers = 20 - overs2; // Assuming T20 format
      const requiredRunRate = remainingOvers > 0 ? (remainingRuns / remainingOvers).toFixed(2) : '0.00';
      
      matchData = {
        tournament: {
          name: data.tournament?.name || 'Tournament',
          logo: data.tournament?.logo || ''
        },
        team1: {
          name: data.team1?.name || 'Team 1',
          shortName: data.team1?.shortName || 'T1',
          score: data.score1?.toString() || '0',
          wickets: data.wickets1?.toString() || '0',
          overs: data.overs1?.toString() || '0.0',
          color: data.team1?.color || '#004BA0',
          players: data.team1?.players || []
        },
        team2: {
          name: data.team2?.name || 'Team 2',
          shortName: data.team2?.shortName || 'T2',
          score: data.score2?.toString() || '0',
          wickets: data.wickets2?.toString() || '0',
          overs: data.overs2?.toString() || '0.0',
          color: data.team2?.color || '#FCCA06',
          players: data.team2?.players || []
        },
        stats: {
          currentRunRate: currentRunRate,
          requiredRunRate: requiredRunRate,
          last5Overs: data.last5Overs || '-',
          target: target.toString()
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

// Get URL parameters and OVERLAY_CONFIG
function getUrlParams() {
  // First check if we have OVERLAY_CONFIG from backend injection
  if (window.OVERLAY_CONFIG) {
    return {
      matchId: window.OVERLAY_CONFIG.matchId || null,
      apiBaseUrl: window.OVERLAY_CONFIG.apiBaseUrl || null,
      publicId: window.OVERLAY_CONFIG.publicId || null,
      overlayName: window.OVERLAY_CONFIG.overlayName || null
    };
  }
  
  // Otherwise check URL parameters
  const params = new URLSearchParams(window.location.search);
  return {
    matchId: params.get('matchId'),
    apiBaseUrl: params.get('apiBaseUrl') || params.get('apiUrl') || 'https://scorex-backend.onrender.com/api/v1',
    publicId: null,
    overlayName: null
  };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const { matchId, apiBaseUrl } = getUrlParams();
  
  if (matchId) {
    console.log('Starting auto-refresh with matchId:', matchId, 'apiBaseUrl:', apiBaseUrl);
    startAutoRefresh(matchId, apiBaseUrl);
  } else {
    console.log('No matchId found, using sample data');
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

/**
 * Universal Score Update Function for all overlays
 * Updates all score-related elements with proper ID naming conventions
 * @param {Object} data - Match data object containing team scores, players, etc.
 */
window.updateScore = function(data) {
  if (!data) return;
  
  // Team 1 elements
  const team1Name = document.getElementById('team1-name');
  const team1Short = document.getElementById('team1-short');
  const team1Score = document.getElementById('team1-score');
  const team1Wickets = document.getElementById('team1-wickets');
  const team1Overs = document.getElementById('team1-overs');
  
  if (team1Name) team1Name.textContent = data.team1?.name || '';
  if (team1Short) team1Short.textContent = data.team1?.shortName || '';
  if (team1Score) team1Score.textContent = data.team1?.score || '0';
  if (team1Wickets) team1Wickets.textContent = data.team1?.wickets || '0';
  if (team1Overs) team1Overs.textContent = data.team1?.overs || '0.0';
  
  // Team 2 elements
  const team2Name = document.getElementById('team2-name');
  const team2Short = document.getElementById('team2-short');
  const team2Score = document.getElementById('team2-score');
  const team2Wickets = document.getElementById('team2-wickets');
  const team2Overs = document.getElementById('team2-overs');
  
  if (team2Name) team2Name.textContent = data.team2?.name || '';
  if (team2Short) team2Short.textContent = data.team2?.shortName || '';
  if (team2Score) team2Score.textContent = data.team2?.score || '0';
  if (team2Wickets) team2Wickets.textContent = data.team2?.wickets || '0';
  if (team2Overs) team2Overs.textContent = data.team2?.overs || '0.0';
  
  // Striker elements
  const strikerName = document.getElementById('striker-name');
  const strikerRuns = document.getElementById('striker-runs');
  const strikerBalls = document.getElementById('striker-balls');
  const strikerStatus = document.getElementById('striker-status');
  
  if (strikerName) strikerName.textContent = data.striker?.name || '';
  if (strikerRuns) strikerRuns.textContent = data.striker?.runs || '0';
  if (strikerBalls) strikerBalls.textContent = data.striker?.balls || '0';
  if (strikerStatus) strikerStatus.textContent = data.striker?.status || '';
  
  // Non-striker elements
  const nonStrikerName = document.getElementById('nonstriker-name');
  const nonStrikerRuns = document.getElementById('nonstriker-runs');
  const nonStrikerBalls = document.getElementById('nonstriker-balls');
  
  if (nonStrikerName) nonStrikerName.textContent = data.nonStriker?.name || '';
  if (nonStrikerRuns) nonStrikerRuns.textContent = data.nonStriker?.runs || '0';
  if (nonStrikerBalls) nonStrikerBalls.textContent = data.nonStriker?.balls || '0';
  
  // Stats elements
  const crr = document.getElementById('current-rr');
  const rrr = document.getElementById('required-rr');
  const target = document.getElementById('target');
  const last5 = document.getElementById('last-5');
  const tournament = document.getElementById('tournament-name');
  const status = document.getElementById('match-status');
  const result = document.getElementById('match-result');
  
  if (crr) crr.textContent = data.stats?.currentRunRate || '0.00';
  if (rrr) rrr.textContent = data.stats?.requiredRunRate || '0.00';
  if (target) target.textContent = data.stats?.target || '';
  if (last5) last5.textContent = data.stats?.last5Overs || '';
  if (tournament) tournament.textContent = data.tournament?.name || '';
  if (status) status.textContent = data.status || '';
  if (result) result.textContent = data.result || '';
  
  // Dispatch event for custom handling
  window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: data }));
};

/**
 * Trigger push notification with animation
 * @param {string} msg - Message to display
 * @param {string} type - Type: '6' (six), '4' (four), 'W' (wicket), default (single/dot)
 */
window.triggerPush = function(msg, type) {
  // Try multiple common push element IDs
  const pushElements = [
    'push-engine', 'push-val', 'push-monolith', 'push-s', 'push-overlay',
    'push-txt', 'wicket-alert', 'push-text', 'notification-push'
  ];
  
  let pushEl = null;
  for (const id of pushElements) {
    pushEl = document.getElementById(id);
    if (pushEl) break;
  }
  
  if (!pushEl) return;
  
  // Update message
  if (pushEl.innerText !== undefined) {
    pushEl.innerText = msg;
  }
  
  // Apply type-specific styling
  const parent = pushEl.parentElement;
  if (type === '6') {
    pushEl.style.background = '#00ff66';
    pushEl.style.color = '#000';
    if (parent) parent.style.background = '#00ff66';
  } else if (type === '4') {
    pushEl.style.background = '#00f2ff';
    pushEl.style.color = '#000';
    if (parent) parent.style.background = '#00f2ff';
  } else if (type === 'W') {
    pushEl.style.background = '#ff0000';
    pushEl.style.color = '#fff';
    if (parent) parent.style.background = '#ff0000';
  }
  
  // Activate animation
  pushEl.classList.add('active');
  
  // Auto-hide after 3.5 seconds
  setTimeout(() => {
    pushEl.classList.remove('active');
  }, 3500);
};

/**
 * Initialize auto-refresh for live scores
 * @param {string} matchId - Match ID to fetch
 * @param {string} apiBaseUrl - API base URL (optional)
 * @param {number} interval - Refresh interval in ms (default 5000)
 */
window.initLiveScore = function(matchId, apiBaseUrl, interval = 5000) {
  if (!matchId) {
    console.log('No matchId provided, using sample data');
    return;
  }
  
  const baseUrl = apiBaseUrl || 'https://scorex-backend.onrender.com/api/v1';
  
  async function fetchAndUpdate() {
    try {
      const response = await fetch(`${baseUrl}/matches/${matchId}`);
      const data = await response.json();
      
      if (data) {
        // Transform API data to overlay format
        const overlayData = {
          team1: {
            name: data.team1?.name || 'Team 1',
            shortName: data.team1?.shortName || 'T1',
            score: data.score1?.toString() || '0',
            wickets: data.wickets1?.toString() || '0',
            overs: data.overs1?.toString() || '0.0'
          },
          team2: {
            name: data.team2?.name || 'Team 2',
            shortName: data.team2?.shortName || 'T2',
            score: data.score2?.toString() || '0',
            wickets: data.wickets2?.toString() || '0',
            overs: data.overs2?.toString() || '0.0'
          },
          striker: {
            name: data.striker?.name || '',
            runs: data.striker?.runs?.toString() || '0',
            balls: data.striker?.balls?.toString() || '0',
            status: data.striker?.status || ''
          },
          nonStriker: {
            name: data.nonStriker?.name || '',
            runs: data.nonStriker?.runs?.toString() || '0',
            balls: data.nonStriker?.balls?.toString() || '0'
          },
          stats: {
            currentRunRate: data.currentRunRate || '0.00',
            requiredRunRate: data.requiredRunRate || '0.00',
            target: data.target?.toString() || '',
            last5Overs: data.last5Overs || ''
          },
          tournament: {
            name: data.tournament?.name || ''
          },
          status: data.status || '',
          result: data.result || ''
        };
        
        window.updateScore(overlayData);
      }
    } catch (error) {
      console.error('Error fetching live score:', error);
    }
  }
  
  // Initial fetch
  fetchAndUpdate();
  
  // Set up interval
  return setInterval(fetchAndUpdate, interval);
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get('matchId');
  const apiBaseUrl = params.get('apiBaseUrl') || params.get('apiUrl');
  
  if (matchId) {
    console.log('Initializing live score for match:', matchId);
    window.initLiveScore(matchId, apiBaseUrl);
  }
});

// ============================================================
// BroadcastChannel for Real-Time Score Updates
// ============================================================

/**
 * Initialize BroadcastChannel listener for real-time score updates
 * This enables overlays to receive instant updates from ScoreboardUpdate component
 * @param {Function} onScoreUpdate - Callback for score updates
 * @param {Function} onWicket - Callback for wicket events (optional)
 * @returns {BroadcastChannel} The channel instance
 */
window.initBroadcastChannel = function(onScoreUpdate, onWicket) {
  const channel = new BroadcastChannel('cricket_score_updates');
  
  channel.onmessage = (event) => {
    const data = event.data;
    
    // Handle Score Updates
    if (data.team1 || data.team2) {
      // Use the updateScore function from overlay-utils
      if (typeof window.updateScore === 'function') {
        window.updateScore(data);
      }
      console.log("Scores Updated", data);
      
      // Call custom score update callback if provided
      if (typeof onScoreUpdate === 'function') {
        onScoreUpdate(data);
      }
    }
    
    // NEW: Handle Push Events (Animations)
    if (data.type === 'PUSH_EVENT') {
      const container = document.getElementById('push-container'); // Ensure this ID exists
      const textEl = document.getElementById('p-msg');
      
      if (!container || !textEl) return;

      textEl.innerText = data.message;
      
      // Dynamic Styling based on event
      if (data.eventType === 'WICKET') {
        container.style.setProperty('--accent', '#ff0033'); // Red
      } else if (data.eventType === 'SIX') {
        container.style.setProperty('--accent', '#a020f0'); // Purple
      } else if (data.eventType === 'FOUR') {
        container.style.setProperty('--accent', '#00ff66'); // Green
      } else {
        container.style.setProperty('--accent', '#00f2ff'); // Blue/Cyan
      }

      // Trigger CSS Animation
      container.classList.add('active');
      setTimeout(() => container.classList.remove('active'), 3500);
    }
    
    // Check if it's a wicket event (legacy support)
    if (data.type === 'WICKET') {
      // Trigger wicket animation
      if (typeof window.triggerPush === 'function') {
        window.triggerPush(data.message || 'OUT!', 'W');
      }
      
      // Call custom wicket callback if provided
      if (typeof onWicket === 'function') {
        onWicket(data);
      }
    }
  };
  
  console.log('BroadcastChannel initialized: listening for cricket_score_updates');
  return channel;
};

/**
 * Post a score update to all listening overlays
 * @param {Object} scores - Score data object
 */
window.postScoreUpdate = function(scores) {
  const channel = new BroadcastChannel('cricket_score_updates');
  channel.postMessage(scores);
  channel.close();
};

/**
 * Post a wicket event to all listening overlays
 * @param {string} message - Wicket message (default: 'OUT!')
 */
window.postWicketEvent = function(message) {
  const channel = new BroadcastChannel('cricket_score_updates');
  channel.postMessage({ type: 'WICKET', message: message || 'OUT!' });
  channel.close();
};

/**
 * Post a visual push event (4, 6, Wicket) to all overlays
 * @param {string} type - 'FOUR', 'SIX', or 'WICKET'
 * @param {string} message - Custom text to display
 */
window.postPushEvent = function(type, message) {
  const channel = new BroadcastChannel('cricket_score_updates');
  channel.postMessage({ 
    type: 'PUSH_EVENT', 
    eventType: type, 
    message: message || type 
  });
  channel.close();
};

// Auto-initialize BroadcastChannel when overlay-utils.js loads
// This ensures all overlays get real-time updates without needing explicit init
(function() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBC);
  } else {
    initBC();
  }
  
  function initBC() {
    // Small delay to ensure other scripts are loaded
    setTimeout(function() {
      window.initBroadcastChannel();
      console.log('Auto-initialized BroadcastChannel for real-time score updates');
    }, 100);
  }
})();
