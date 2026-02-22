// Overlay Utilities - Team/Player Toggle and Data Management

// Sample match data (will be replaced by API data)
let matchData = {
  tournament: {
    name: 'Tournament',
    logo: ''
  },
  team1: {
    name: 'Team 1',
    shortName: 'T1',
    score: '0',
    wickets: '0',
    overs: '0.0',
    color: '#004BA0',
    players: []
  },
  team2: {
    name: 'Team 2',
    shortName: 'T2',
    score: '0',
    wickets: '0',
    overs: '0.0',
    color: '#FCCA06',
    players: []
  },
  stats: {
    currentRunRate: '0.00',
    requiredRunRate: '0.00',
    last5Overs: '',
    target: '0'
  },
  status: 'Ready',
  result: ''
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
  if (team1Overs) team1Overs.textContent = `(${matchData.team1.overs})`;
  
  // Team 2
  const team2Name = document.getElementById('team2-name');
  const team2Score = document.getElementById('team2-score');
  const team2Overs = document.getElementById('team2-overs');
  
  if (team2Name) team2Name.textContent = matchData.team2.name;
  if (team2Score) team2Score.textContent = `${matchData.team2.score}/${matchData.team2.wickets}`;
  if (team2Overs) team2Overs.textContent = `(${matchData.team2.overs})`;
}

// Setup Teams Panel
function setupTeamsPanel() {
  const teamsPanel = document.getElementById('teams-panel');
  if (!teamsPanel) return;
  
  teamsPanel.innerHTML = `
    <div class="team-row">
      <div class="team-color" style="background: ${matchData.team1.color}"></div>
      <div class="team-info">
        <div class="team-name">${matchData.team1.name}</div>
        <div class="team-score">${matchData.team1.score}/${matchData.team1.wickets} (${matchData.team1.overs})</div>
      </div>
    </div>
    <div class="team-row">
      <div class="team-color" style="background: ${matchData.team2.color}"></div>
      <div class="team-info">
        <div class="team-name">${matchData.team2.name}</div>
        <div class="team-score">${matchData.team2.score}/${matchData.team2.wickets} (${matchData.team2.overs})</div>
      </div>
    </div>
  `;
}

// Handle score updates
function handleScoreUpdate(data) {
  // Update match data
  matchData = { ...matchData, ...data };
  
  // Update score display
  updateScoreDisplay();
  
  // Update teams panel
  setupTeamsPanel();
  
  // Dispatch custom event for overlay-specific handling
  const event = new CustomEvent('scoreUpdated', { detail: data });
  window.dispatchEvent(event);
  
  // Call the global onScoreUpdate if it exists
  if (typeof window.onScoreUpdate === 'function') {
    window.onScoreUpdate(data);
  }
}

// Initialize BroadcastChannel for real-time score updates
window.initBroadcastChannel = function() {
  const channel = new BroadcastChannel('cricket_score_updates');
  
  channel.onmessage = function(event) {
    const data = event.data;
    
    // Handle wicket events
    if (data.type === 'WICKET') {
      // Trigger wicket animation
      if (typeof window.triggerPush === 'function') {
        window.triggerPush(data.message || 'OUT!', 'W');
      }
      
      // Call custom wicket callback if provided
      if (typeof window.onWicket === 'function') {
        window.onWicket(data);
      }
    }
    
    // Handle regular score updates - dispatch to overlays
    if (data.tournament || data.team1 || data.team2 || data.striker) {
      handleScoreUpdate(data);
      
      // Dispatch scoreUpdated event for overlays
      const scoreEvent = new CustomEvent('scoreUpdated', { detail: data });
      window.dispatchEvent(scoreEvent);
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
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBC);
  } else {
    initBC();
  }
  
  function initBC() {
    setTimeout(function() {
      window.initBroadcastChannel();
      console.log('Auto-initialized BroadcastChannel for real-time score updates');
    }, 100);
  }
})();
