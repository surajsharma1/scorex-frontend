// Overlay Utilities - Team/Player Toggle and Data Management

// Sample match data (will be replaced by API data)
let matchData = {
  tournament: { name: 'Tournament', logo: '' },
  team1: { name: 'Team 1', shortName: 'T1', score: '0', wickets: '0', overs: '0.0', color: '#004BA0', players: [] },
  team2: { name: 'Team 2', shortName: 'T2', score: '0', wickets: '0', overs: '0.0', color: '#FCCA06', players: [] },
  stats: { currentRunRate: '0.00', requiredRunRate: '0.00', last5Overs: '', target: '0' },
  status: 'Ready',
  result: ''
};

// Initialize overlay with data
function initOverlay(customData = null) {
  if (customData) {
    matchData = { ...matchData, ...customData };
  }
  // Safe calls to updates
  if(typeof updateScoreDisplay === 'function') updateScoreDisplay();
  if(typeof setupTeamsPanel === 'function') setupTeamsPanel();
}

// Handle score updates
function handleScoreUpdate(data) {
  // Update match data
  matchData = { ...matchData, ...data };
  
  // Update score display if specific overlay function exists
  if(typeof updateScoreDisplay === 'function') updateScoreDisplay();
  
  // Update teams panel if exists
  if(typeof setupTeamsPanel === 'function') setupTeamsPanel();
  
  // Dispatch custom event for overlay-specific handling
  const event = new CustomEvent('scoreUpdated', { detail: data });
  window.dispatchEvent(event);
  
  // Call the global onScoreUpdate if it exists (legacy support)
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
      if (typeof window.triggerPush === 'function') {
        window.triggerPush(data.message || 'OUT!', 'W');
      }
      if (typeof window.onWicket === 'function') {
        window.onWicket(data);
      }
    }
    
    // Handle regular score updates
    if (data.tournament || data.team1 || data.team2 || data.striker) {
      handleScoreUpdate(data);
      // Also dispatch event directly here to ensure listeners catch it
      window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: data }));
    }
  };
  
  console.log('BroadcastChannel initialized: listening for cricket_score_updates');
  return channel;
};

// Auto-initialize BroadcastChannel
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBC);
  } else {
    initBC();
  }
  
  function initBC() {
    setTimeout(function() {
      if(window.initBroadcastChannel) {
         window.initBroadcastChannel();
         console.log('Auto-initialized BroadcastChannel');
      }
    }, 100);
  }
})();

// ============================================
// COMPREHENSIVE SCORE UPDATE HANDLER
// Updates all common overlay elements safely
// ============================================

window.handleOverlayScoreUpdate = function(data) {
  const safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // 1. TOURNAMENT NAME - check multiple common selectors
  if (data.tournament) {
    safeSetText('tournament-name', data.tournament.name);
    // Fallback selectors
    const tournamentEl = document.querySelector('.tournament-badge') || 
                         document.querySelector('.prism-header') ||
                         document.querySelector('.top-vector');
    if (tournamentEl) tournamentEl.textContent = data.tournament.name;
  }
  
  // 2. TEAM 1
  if (data.team1) {
    safeSetText('team1-name', data.team1.name);
    safeSetText('team1-short', data.team1.shortName || data.team1.name.substring(0, 3).toUpperCase());
    safeSetText('team1-score', data.team1.score);
    safeSetText('team1-wickets', data.team1.wickets);
    safeSetText('team1-overs', data.team1.overs);
    
    // Combined displays found in some templates
    const scoreFullEl = document.getElementById('team1-score-full');
    if(scoreFullEl) scoreFullEl.textContent = `${data.team1.score}/${data.team1.wickets}`;
  }
  
  // 3. TEAM 2
  if (data.team2) {
    safeSetText('team2-name', data.team2.name);
    safeSetText('team2-short', data.team2.shortName || data.team2.name.substring(0, 3).toUpperCase());
    safeSetText('team2-score', data.team2.score);
    safeSetText('team2-wickets', data.team2.wickets);
    safeSetText('team2-overs', data.team2.overs);
  }
  
  // 4. STRIKER
  if (data.striker) {
    safeSetText('striker-name', data.striker.name);
    safeSetText('striker-runs', data.striker.runs + (data.striker.status || '*'));
    safeSetText('striker-stat', `${data.striker.runs} (${data.striker.balls})`);
  }
  
  // 5. NON-STRIKER
  if (data.nonStriker) {
    safeSetText('nonstriker-name', data.nonStriker.name);
    safeSetText('nonstriker-runs', data.nonStriker.runs);
    safeSetText('nonstriker-stat', `${data.nonStriker.runs} (${data.nonStriker.balls})`);
  }
  
  // 6. BOWLER
  if (data.bowler) {
    safeSetText('bowler-name', data.bowler.name);
    safeSetText('bowler-stat', `${data.bowler.overs}-${data.bowler.maidens}-${data.bowler.runs}-${data.bowler.wickets}`);
  }
  
  // 7. MATCH STATS
  if (data.stats) {
    safeSetText('current-run-rate', data.stats.currentRunRate || '0.00');
    safeSetText('required-run-rate', data.stats.requiredRunRate || '0.00');
    const targetEl = document.getElementById('target');
    if (targetEl && data.stats.target) targetEl.textContent = `TARGET ${data.stats.target}`;
  }
};

// Global listener
window.addEventListener('scoreUpdated', function(e) {
  if(window.handleOverlayScoreUpdate) {
    window.handleOverlayScoreUpdate(e.detail);
  }
});