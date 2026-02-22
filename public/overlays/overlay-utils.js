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

// ============================================
// COMPREHENSIVE SCORE UPDATE HANDLER
// Updates all common overlay elements with real data
// ============================================

window.handleOverlayScoreUpdate = function(data) {
  // 1. TOURNAMENT NAME
  const tournamentEl = document.getElementById('tournament-name') || 
                       document.querySelector('.tournament-badge') ||
                       document.querySelector('.prism-header') ||
                       document.querySelector('.top-mono') ||
                       document.querySelector('.top-vector') ||
                       document.querySelector('.top-news') ||
                       document.querySelector('.top-lens') ||
                       document.querySelector('.top-edge');
  if (tournamentEl && data.tournament) {
    tournamentEl.textContent = data.tournament.name;
  }
  
  // 2. TEAM 1 (Batting or Bowling)
  const team1NameEl = document.getElementById('team1-name');
  const team1ShortEl = document.getElementById('team1-short');
  const team1ScoreEl = document.getElementById('team1-score');
  const team1WicketsEl = document.getElementById('team1-wickets');
  const team1OversEl = document.getElementById('team1-overs');
  
  if (data.team1) {
    if (team1NameEl) team1NameEl.textContent = data.team1.name;
    if (team1ShortEl) team1ShortEl.textContent = data.team1.shortName || data.team1.name.substring(0, 3).toUpperCase();
    if (team1ScoreEl) team1ScoreEl.textContent = data.team1.score;
    if (team1WicketsEl) team1WicketsEl.textContent = data.team1.wickets;
    if (team1OversEl) team1OversEl.textContent = data.team1.overs;
  }
  
  // 3. TEAM 2 (Batting or Bowling)
  const team2NameEl = document.getElementById('team2-name');
  const team2ShortEl = document.getElementById('team2-short');
  const team2ScoreEl = document.getElementById('team2-score');
  const team2WicketsEl = document.getElementById('team2-wickets');
  const team2OversEl = document.getElementById('team2-overs');
  
  if (data.team2) {
    if (team2NameEl) team2NameEl.textContent = data.team2.name;
    if (team2ShortEl) team2ShortEl.textContent = data.team2.shortName || data.team2.name.substring(0, 3).toUpperCase();
    if (team2ScoreEl) team2ScoreEl.textContent = data.team2.score;
    if (team2WicketsEl) team2WicketsEl.textContent = data.team2.wickets;
    if (team2OversEl) team2OversEl.textContent = data.team2.overs;
  }
  
  // 4. STRIKER BATSMAN
  const strikerNameEl = document.getElementById('striker-name');
  const strikerRunsEl = document.getElementById('striker-runs');
  const strikerStatEl = document.getElementById('striker-stat');
  
  if (data.striker) {
    if (strikerNameEl) strikerNameEl.textContent = data.striker.name;
    if (strikerRunsEl) strikerRunsEl.textContent = `${data.striker.runs}${data.striker.status || '*'}(${data.striker.balls})`;
    if (strikerStatEl) strikerStatEl.textContent = `${data.striker.runs} (${data.striker.balls})${data.striker.status || '*'}`;
  }
  
  // 5. NON-STRIKER BATSMAN
  const nonStrikerNameEl = document.getElementById('nonstriker-name');
  const nonStrikerRunsEl = document.getElementById('nonstriker-runs');
  const nonStrikerStatEl = document.getElementById('nonstriker-stat');
  
  if (data.nonStriker) {
    if (nonStrikerNameEl) nonStrikerNameEl.textContent = data.nonStriker.name;
    if (nonStrikerRunsEl) nonStrikerRunsEl.textContent = `${data.nonStriker.runs}(${data.nonStriker.balls})`;
    if (nonStrikerStatEl) nonStrikerStatEl.textContent = `${data.nonStriker.runs} (${data.nonStriker.balls})`;
  }
  
  // 6. BOWLER
  const bowlerNameEl = document.getElementById('bowler-name');
  const bowlerStatEl = document.getElementById('bowler-stat');
  
  if (data.bowler) {
    if (bowlerNameEl) bowlerNameEl.textContent = data.bowler.name;
    if (bowlerStatEl) bowlerStatEl.textContent = `${data.bowler.overs}-${data.bowler.maidens}-${data.bowler.runs}-${data.bowler.wickets}`;
  }
  
  // 7. MATCH STATS (Run Rate, Target, etc)
  const crrEl = document.getElementById('current-run-rate');
  const rrrEl = document.getElementById('required-run-rate');
  const targetEl = document.getElementById('target');
  
  if (data.stats) {
    if (crrEl) crrEl.textContent = data.stats.currentRunRate || '0.00';
    if (rrrEl) rrrEl.textContent = data.stats.requiredRunRate || '0.00';
    if (targetEl && data.stats.target) targetEl.textContent = `TARGET ${data.stats.target}`;
  }
  
  // 8. OVER NUMBER
  const overEl = document.getElementById('over-number');
  if (overEl && data.team1?.overs) {
    overEl.textContent = data.team1.overs;
  }
  
  // 9. Dispatch custom event for overlay-specific handling
  const event = new CustomEvent('scoreUpdated', { detail: data });
  window.dispatchEvent(event);
  
  // 10. Call the global onScoreUpdate if it exists (for backward compatibility)
  if (typeof window.onScoreUpdate === 'function') {
    window.onScoreUpdate(data);
  }
};

// Initialize listener for score updates
window.addEventListener('scoreUpdated', function(e) {
  window.handleOverlayScoreUpdate(e.detail);
});
