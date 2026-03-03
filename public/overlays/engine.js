// public/overlays/engine.js
// ScoreX Overlay Engine - Comprehensive Data Mode with Multiple Event Listeners

// Initialize Socket with proper configuration
const socket = io(window.OVERLAY_CONFIG.apiBaseUrl || '/');
const matchId = window.OVERLAY_CONFIG.matchId;
const config = window.OVERLAY_CONFIG || {};

console.log('Engine.js loaded - COMPREHENSIVE DATA MODE');

// BroadcastChannel for same-browser communication (from ScoreboardUpdate)
let broadcastChannel = null;
try {
    broadcastChannel = new BroadcastChannel('cricket_score_updates');
    console.log('BroadcastChannel created');
} catch (e) {
    console.log('BroadcastChannel not supported in this context');
}

// ========== UNIFIED DATA NORMALIZER ==========
// This function normalizes data from different sources (LiveScoring.tsx, Socket, etc.)
// to a consistent format that all overlays can use
function normalizeScoreData(data) {
    if (!data) return null;
    
    // Create normalized data object with defaults
    const normalized = {
        // Tournament info
        tournament: data.tournamentName || data.tournament?.name || 'Match',
        tournamentName: data.tournamentName || data.tournament?.name || 'Match',
        
        // Team 1 (batting team)
        team1Name: data.team1Name || data.team1?.name || 'Team 1',
        team1Short: data.team1Name?.substring(0, 3).toUpperCase() || data.team1?.shortName || 'T1',
        team1Score: data.team1Score !== undefined ? data.team1Score : (data.team1?.score || 0),
        team1Wickets: data.team1Wickets !== undefined ? data.team1Wickets : (data.team1?.wickets || 0),
        team1Overs: data.team1Overs || data.team1?.overs || '0.0',
        
        // Team 2 (bowling team)
        team2Name: data.team2Name || data.team2?.name || 'Team 2',
        team2Short: data.team2Name?.substring(0, 3).toUpperCase() || data.team2?.shortName || 'T2',
        team2Score: data.team2Score !== undefined ? data.team2Score : (data.team2?.score || 0),
        team2Wickets: data.team2Wickets !== undefined ? data.team2Wickets : (data.team2?.wickets || 0),
        team2Overs: data.team2Overs || data.team2?.overs || '0.0',
        
        // Current striker
        strikerName: data.strikerName || data.striker?.name || 'Striker',
        strikerRuns: data.strikerRuns !== undefined ? data.strikerRuns : (data.striker?.runs || 0),
        strikerBalls: data.strikerBalls !== undefined ? data.strikerBalls : (data.striker?.balls || 0),
        
        // Current non-striker
        nonStrikerName: data.nonStrikerName || data.nonStriker?.name || 'Non-Striker',
        nonStrikerRuns: data.nonStrikerRuns !== undefined ? data.nonStrikerRuns : (data.nonStriker?.runs || 0),
        nonStrikerBalls: data.nonStrikerBalls !== undefined ? data.nonStrikerBalls : (data.nonStriker?.balls || 0),
        
        // Current bowler
        bowlerName: data.bowlerName || data.bowler?.name || 'Bowler',
        bowlerOvers: data.bowlerOvers !== undefined ? data.bowlerOvers : (data.bowler?.overs || 0),
        bowlerRuns: data.bowlerRuns !== undefined ? data.bowlerRuns : (data.bowler?.runs || 0),
        bowlerWickets: data.bowlerWickets !== undefined ? data.bowlerWickets : (data.bowler?.wickets || 0),
        
        // Match stats
        runRate: data.runRate || data.stats?.currentRunRate || '0.00',
        requiredRunRate: data.requiredRunRate || data.stats?.requiredRunRate || '0.00',
        target: data.target || data.stats?.target || 0,
        
        // Status
        status: data.status || 'Live',
        matchId: data.matchId || '',
        
        // Legacy field names (for backwards compatibility)
        score: `${data.team1Score || 0}/${data.team1Wickets || 0}`,
        overs: data.team1Overs || '0.0',
        score1: data.team1Score,
        wickets1: data.team1Wickets,
        overs1: data.team1Overs,
        score2: data.team2Score,
        wickets2: data.team2Wickets,
        overs2: data.team2Overs,
    };
    
    return normalized;
}

// DOM Elements Cache - Common elements across all templates
const els = {
    // Score elements
    team1Name: document.getElementById('team1Name') || document.getElementById('teamName') || document.getElementById('battingTeam'),
    team2Name: document.getElementById('team2Name') || document.getElementById('bowlingTeam'),
    team1Score: document.getElementById('team1Score') || document.getElementById('score'),
    team2Score: document.getElementById('team2Score'),
    team1Wickets: document.getElementById('team1Wickets') || document.getElementById('wickets'),
    team2Wickets: document.getElementById('team2Wickets'),
    team1Overs: document.getElementById('team1Overs') || document.getElementById('overs'),
    team2Overs: document.getElementById('team2Overs'),
    
    // Player elements
    striker: document.getElementById('striker'),
    strikerRuns: document.getElementById('strikerRuns'),
    strikerBalls: document.getElementById('strikerBalls'),
    nonStriker: document.getElementById('nonStriker'),
    nonStrikerRuns: document.getElementById('nonStrikerRuns'),
    nonStrikerBalls: document.getElementById('nonStrikerBalls'),
    bowler: document.getElementById('bowler'),
    bowlerOvers: document.getElementById('bowlerOvers'),
    bowlerRuns: document.getElementById('bowlerRuns'),
    bowlerWickets: document.getElementById('bowlerWickets'),
    
    // Rate elements
    crr: document.getElementById('crr'),
    rrr: document.getElementById('rrr'),
    target: document.getElementById('target'),
    
    // Balls/Over elements
    ballsContainer: document.getElementById('ballsContainer') || document.getElementById('ballsTracker'),
    
    // Tournament/Match info
    tournament: document.getElementById('tournament'),
    matchStatus: document.getElementById('matchStatus') || document.getElementById('status'),
};

// Socket event handlers
socket.on('connect', function() {
    console.log('Socket connected in overlay engine');
    
    if (matchId) {
        socket.emit('joinMatch', matchId);
    }
});

socket.on('scoreUpdate', function(data) {
    console.log('Socket scoreUpdate received in engine:', data);
    handleScoreUpdate(data.match || data);
});

socket.on('playerUpdate', function(data) {
    console.log('Player update received:', data);
    handleScoreUpdate(data);
});

socket.on('matchUpdate', function(data) {
    console.log('Match update received:', data);
    handleScoreUpdate(data);
});

// BroadcastChannel message handler
if (broadcastChannel) {
    broadcastChannel.onmessage = function(event) {
        console.log('BroadcastChannel message received in engine:', event.data);
        
        // Handle score updates from other tabs
        if (event.data && (event.data.team1Score !== undefined || event.data.strikerName)) {
            handleScoreUpdate(event.data);
        }
        
        // Handle wicket notifications
        if (event.data && event.data.type === 'WICKET') {
            if (typeof window.triggerPush === 'function') {
                window.triggerPush(event.data.message || 'OUT!', 'W');
            }
        }
    };
}

// postMessage listener for iframe communication
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'UPDATE_SCORE' && event.data.data) {
        console.log('postMessage received in engine:', event.data.data);
        handleScoreUpdate(event.data.data);
    }
});

// Main score update handler - dispatches to multiple channels
function handleScoreUpdate(data) {
    if (!data) return;
    
    console.log('Handling score update in engine:', data);
    
    // Normalize the data to handle different formats from different sources
    const normalizedData = normalizeScoreData(data);
    console.log('Normalized data:', normalizedData);
    
    // Update DOM elements with normalized data
    updateDOM(normalizedData);
    
    // Dispatch custom event for overlay-specific handling (with both raw and normalized data)
    const customEvent = new CustomEvent('scoreUpdated', { detail: normalizedData });
    window.dispatchEvent(customEvent);
    
    // Also dispatch with original data for backward compatibility
    const rawEvent = new CustomEvent('scoreUpdatedRaw', { detail: data });
    window.dispatchEvent(rawEvent);
    
    // Call global onScoreUpdate if exists
    if (typeof window.onScoreUpdate === 'function') {
        window.onScoreUpdate(normalizedData);
    }
    
    // Update handleOverlayScoreUpdate if exists
    if (typeof window.handleOverlayScoreUpdate === 'function') {
        window.handleOverlayScoreUpdate(normalizedData);
    }
}

// Update DOM elements with data
function updateDOM(data) {
    // Team 1
    if (data.team1Name !== undefined) {
        safeSetText('team1Name', data.team1Name);
    }
    if (data.team1Score !== undefined) {
        safeSetText('team1Score', data.team1Score);
    }
    if (data.team1Wickets !== undefined) {
        safeSetText('team1Wickets', data.team1Wickets);
    }
    if (data.team1Overs !== undefined) {
        safeSetText('team1Overs', data.team1Overs);
    }
    
    // Team 2
    if (data.team2Name !== undefined) {
        safeSetText('team2Name', data.team2Name);
    }
    if (data.team2Score !== undefined) {
        safeSetText('team2Score', data.team2Score);
    }
    if (data.team2Wickets !== undefined) {
        safeSetText('team2Wickets', data.team2Wickets);
    }
    if (data.team2Overs !== undefined) {
        safeSetText('team2Overs', data.team2Overs);
    }
    
    // Striker
    if (data.strikerName !== undefined) {
        safeSetText('strikerName', data.strikerName);
    }
    if (data.strikerRuns !== undefined) {
        safeSetText('strikerRuns', data.strikerRuns);
    }
    if (data.strikerBalls !== undefined) {
        safeSetText('strikerBalls', data.strikerBalls);
    }
    
    // Non-striker
    if (data.nonStrikerName !== undefined) {
        safeSetText('nonStrikerName', data.nonStrikerName);
    }
    if (data.nonStrikerRuns !== undefined) {
        safeSetText('nonStrikerRuns', data.nonStrikerRuns);
    }
    if (data.nonStrikerBalls !== undefined) {
        safeSetText('nonStrikerBalls', data.nonStrikerBalls);
    }
    
    // Bowler
    if (data.bowlerName !== undefined) {
        safeSetText('bowlerName', data.bowlerName);
    }
    if (data.bowlerOvers !== undefined) {
        safeSetText('bowlerOvers', data.bowlerOvers);
    }
    if (data.bowlerRuns !== undefined) {
        safeSetText('bowlerRuns', data.bowlerRuns);
    }
    if (data.bowlerWickets !== undefined) {
        safeSetText('bowlerWickets', data.bowlerWickets);
    }
    
    // Run rates
    if (data.runRate !== undefined) {
        safeSetText('crr', data.runRate);
    }
    if (data.requiredRunRate !== undefined) {
        safeSetText('rrr', data.requiredRunRate);
    }
    if (data.target !== undefined) {
        safeSetText('target', data.target);
    }
    
    // Tournament
    if (data.tournamentName !== undefined) {
        safeSetText('tournament', data.tournamentName);
    }
}

// Safe text setter with pulse animation
function safeSetText(id, value) {
    if (!id || value === undefined || value === null) return;
    
    const el = document.getElementById(id);
    if (!el) return;
    
    const strValue = String(value);
    if (el.innerText !== strValue) {
        el.innerText = strValue;
        
        // Add pulse animation
        el.classList.remove('pulse');
        void el.offsetWidth;
        el.classList.add('pulse');
    }
}

function updateText(element, newValue) {
    if (!element) return;
    if (element.innerText !== newValue) {
        element.classList.remove('pulse-update');
        void element.offsetWidth;
        element.innerText = newValue;
        element.classList.add('pulse-update');
    }
}

function handleNotification(event) {
    if (!event || !els.notification) return;
    
    var notif = els.notification;
    var text = els.notificationText;
    
    if (!text) return;
    
    var message = '';
    var className = '';
    
    if (event === '4') { message = 'FOUR RUNS!'; className = 'notif-4'; }
    else if (event === '6') { message = 'HUGE SIX!'; className = 'notif-6'; }
    else if (['W', 'w', 'WICKET'].indexOf(event) !== -1) { message = 'WICKET!'; className = 'notif-w'; }
    else return;
    
    text.innerText = message;
    notif.className = 'notification-active ' + className;
    
    setTimeout(function() {
        notif.className = '';
    }, 3000);
}

// Expose functions globally for overlays to use
window.handleScoreUpdate = handleScoreUpdate;
window.triggerPush = handleNotification;

// Add styles dynamically
if (typeof document !== 'undefined' && !document.getElementById('overlay-engine-styles')) {
    var style = document.createElement('style');
    style.id = 'overlay-engine-styles';
    style.textContent = '.pulse, .pulse-update { animation: pulse 0.3s ease-in-out; } @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } .ball-item { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; margin: 2px; font-size: 12px; font-weight: bold; background: #444; color: white; } .ball-item.boundary { background: #ffc107; color: #000; } .ball-item.wicket, .ball-item.ball-w { background: #e53935; color: white; } .notification-active { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px 40px; border-radius: 10px; font-size: 24px; font-weight: bold; z-index: 9999; animation: popIn 0.3s ease-out; } .notif-4 { background: #4caf50; color: white; } .notif-6 { background: #ff9800; color: white; } .notif-w { background: #f44336; color: white; } @keyframes popIn { from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }';
    document.head.appendChild(style);
}

// Auto-initialize BroadcastChannel if not already done
if (typeof window.initBroadcastChannel === 'function') {
    window.initBroadcastChannel();
}

console.log('ScoreX Overlay Engine initialized - COMPREHENSIVE DATA MODE', { matchId: matchId, config: config });
