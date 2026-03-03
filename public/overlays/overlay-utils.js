// Overlay Utilities - Team/Player Toggle and Data Management
// COMPREHENSIVE - Supports BroadcastChannel, postMessage, and socket.io

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
  if(typeof updateScoreDisplay === 'function') updateScoreDisplay();
  if(typeof setupTeamsPanel === 'function') setupTeamsPanel();
}

// Handle score updates
function handleScoreUpdate(data) {
  matchData = { ...matchData, ...data };
  
  if(typeof updateScoreDisplay === 'function') updateScoreDisplay();
  if(typeof setupTeamsPanel === 'function') setupTeamsPanel();
  
  const event = new CustomEvent('scoreUpdated', { detail: data });
  window.dispatchEvent(event);
  
  if (typeof window.onScoreUpdate === 'function') {
    window.onScoreUpdate(data);
  }
}

// Initialize BroadcastChannel for real-time score updates
window.initBroadcastChannel = function() {
  const channel = new BroadcastChannel('cricket_score_updates');
  
  channel.onmessage = function(event) {
    const data = event.data;
    
    if (data.type === 'WICKET') {
      if (typeof window.triggerPush === 'function') {
        window.triggerPush(data.message || 'OUT!', 'W');
      }
      if (typeof window.onWicket === 'function') {
        window.onWicket(data);
      }
    }
    
    if (data.tournament || data.team1 || data.team2 || data.striker || data.team1Name) {
      handleScoreUpdate(data);
      window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: data }));
    }
  };
  
  console.log('BroadcastChannel initialized: listening for cricket_score_updates');
  return channel;
};

// Listen for postMessage from parent window (LiveScoring.tsx)
window.addEventListener('message', function(event) {
  console.log('PostMessage received in overlay-utils:', event.data);
  if (event.data && event.data.type === 'UPDATE_SCORE' && event.data.data) {
    handleScoreUpdate(event.data.data);
    window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: event.data.data }));
  }
});

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
  const safeSetText = function(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const safeSetHTML = function(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  // 1. TOURNAMENT NAME - check multiple common selectors
  if (data.tournament) {
    safeSetText('tournament-name', data.tournament.name);
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
    
    const scoreFullEl = document.getElementById('team1-score-full');
    if(scoreFullEl) scoreFullEl.textContent = `${data.team1.score}/${data.team1.wickets}`;
  }
  
  // Also handle flat format (from LiveScoring)
  if (data.team1Name !== undefined) {
    safeSetText('team1-name', data.team1Name);
    safeSetText('team1-short', data.team1Name.substring(0, 3).toUpperCase());
    safeSetText('team1-score', data.team1Score || 0);
    safeSetText('team1-wickets', data.team1Wickets || 0);
    safeSetText('team1-overs', data.team1Overs || '0.0');
  }
  
  // 3. TEAM 2
  if (data.team2) {
    safeSetText('team2-name', data.team2.name);
    safeSetText('team2-short', data.team2.shortName || data.team2.name.substring(0, 3).toUpperCase());
    safeSetText('team2-score', data.team2.score);
    safeSetText('team2-wickets', data.team2.wickets);
    safeSetText('team2-overs', data.team2.overs);
  }
  
  // Also handle flat format (from LiveScoring)
  if (data.team2Name !== undefined) {
    safeSetText('team2-name', data.team2Name);
    safeSetText('team2-short', data.team2Name.substring(0, 3).toUpperCase());
    safeSetText('team2-score', data.team2Score || 0);
    safeSetText('team2-wickets', data.team2Wickets || 0);
    safeSetText('team2-overs', data.team2Overs || '0.0');
  }
  
  // 4. STRIKER
  if (data.striker) {
    safeSetText('striker-name', data.striker.name);
    safeSetText('striker-runs', data.striker.runs + (data.striker.status || '*'));
    safeSetText('striker-stat', `${data.striker.runs} (${data.striker.balls})`);
  }
  
  // Handle flat format
  if (data.strikerName !== undefined) {
    safeSetText('striker-name', data.strikerName);
    safeSetText('striker-runs', (data.strikerRuns || 0) + '*');
    safeSetText('striker-stat', `${data.strikerRuns || 0} (${data.strikerBalls || 0})`);
  }
  
  // 5. NON-STRIKER
  if (data.nonStriker) {
    safeSetText('nonstriker-name', data.nonStriker.name);
    safeSetText('nonstriker-runs', data.nonStriker.runs);
    safeSetText('nonstriker-stat', `${data.nonStriker.runs} (${data.nonStriker.balls})`);
  }
  
  // Handle flat format
  if (data.nonStrikerName !== undefined) {
    safeSetText('nonstriker-name', data.nonStrikerName);
    safeSetText('nonstriker-runs', data.nonStrikerRuns || 0);
    safeSetText('nonstriker-stat', `${data.nonStrikerRuns || 0} (${data.nonStrikerBalls || 0})`);
  }
  
  // 6. BOWLER
  if (data.bowler) {
    safeSetText('bowler-name', data.bowler.name);
    safeSetText('bowler-stat', `${data.bowler.overs}-${data.bowler.maidens}-${data.bowler.runs}-${data.bowler.wickets}`);
  }
  
  // Handle flat format
  if (data.bowlerName !== undefined) {
    safeSetText('bowler-name', data.bowlerName);
    safeSetText('bowler-stat', `${data.bowlerOvers || 0}-${data.bowlerMaidens || 0}-${data.bowlerRuns || 0}-${data.bowlerWickets || 0}`);
  }
  
  // 7. MATCH STATS
  if (data.stats) {
    safeSetText('current-run-rate', data.stats.currentRunRate || '0.00');
    safeSetText('required-run-rate', data.stats.requiredRunRate || '0.00');
    const targetEl = document.getElementById('target');
    if (targetEl && data.stats.target) targetEl.textContent = `TARGET ${data.stats.target}`;
  }
  
  // Handle flat format stats
  if (data.runRate !== undefined) {
    safeSetText('current-run-rate', data.runRate);
    safeSetText('required-run-rate', data.requiredRunRate || '0.00');
    const targetEl = document.getElementById('target');
    if (targetEl && data.target) targetEl.textContent = `TARGET ${data.target}`;
  }
};

// Global listener
window.addEventListener('scoreUpdated', function(e) {
  if(window.handleOverlayScoreUpdate) {
    window.handleOverlayScoreUpdate(e.detail);
  }
});

// Also listen for postMessage at global level
if (typeof window !== 'undefined') {
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'UPDATE_SCORE' && event.data.data) {
      if(window.handleOverlayScoreUpdate) {
        window.handleOverlayScoreUpdate(event.data.data);
      }
      window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: event.data.data }));
    }
  });
}
