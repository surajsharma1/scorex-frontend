// public/overlays/engine.js

// 1. Initialize Socket with proper configuration
const socket = io(window.OVERLAY_CONFIG.apiBaseUrl || '/');
const matchId = window.OVERLAY_CONFIG.matchId;
const config = window.OVERLAY_CONFIG || {};

// 2. BroadcastChannel for same-browser communication (from ScoreboardUpdate)
let broadcastChannel = null;
try {
    broadcastChannel = new BroadcastChannel('cricket_score_updates');
} catch (e) {
    console.log('BroadcastChannel not supported in this context');
}

// 3. DOM Elements Cache - Common elements across all templates
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
    
    // Notification
    notification: document.getElementById('notificationArea'),
    notificationText: document.getElementById('notificationText')
};

// 4. Listen for BroadcastChannel messages (from ScoreboardUpdate in same browser)
if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
        console.log('BroadcastChannel message received:', event.data);
        handleScoreUpdate(event.data);
    };
}

// 4b. POST MESSAGE - Listen for messages from parent window (from LiveScoring.tsx via iframe)
window.addEventListener('message', (event) => {
    console.log('PostMessage received:', event.data);
    if (event.data && event.data.type === 'UPDATE_SCORE' && event.data.data) {
        // Transform LiveScoring format to match format
        const data = event.data.data;
        const transformedData = transformLiveScoringData(data);
        handleScoreUpdate(transformedData);
    }
});

// Transform LiveScoring data format to match format
function transformLiveScoringData(data) {
    if (!data) return null;
    
    // Check if already in match format
    if (data.team1Score !== undefined || data.score1 !== undefined) {
        return data;
    }
    
    // Check if already in ScoreboardUpdate format
    if (data.team1 && typeof data.team1 === 'object') {
        return data;
    }
    
    // LiveScoring format: { team1Name, team1Score, team1Wickets, team1Overs, ... }
    return {
        team1: {
            name: data.team1Name || 'Team 1',
            score: data.team1Score || 0,
            wickets: data.team1Wickets || 0,
            overs: data.team1Overs || 0
        },
        team2: {
            name: data.team2Name || 'Team 2',
            score: data.team2Score || 0,
            wickets: data.team2Wickets || 0,
            overs: data.team2Overs || 0
        },
        striker: {
            name: data.strikerName || 'Striker',
            runs: data.strikerRuns || 0,
            balls: data.strikerBalls || 0
        },
        nonStriker: {
            name: data.nonStrikerName || 'Non-Striker',
            runs: data.nonStrikerRuns || 0,
            balls: data.nonStrikerBalls || 0
        },
        bowler: {
            name: data.bowlerName || 'Bowler',
            overs: data.bowlerOvers || 0,
            runsConceded: data.bowlerRuns || 0,
            wickets: data.bowlerWickets || 0
        },
        stats: {
            currentRunRate: data.runRate || 0,
            last5Overs: data.lastFiveOvers || ''
        },
        tournament: {
            name: data.tournamentName || 'Tournament'
        },
        battingTeam: data.battingTeam || 'team1',
        status: 'Live'
    };
}

// 5. Handle score updates from any source
function handleScoreUpdate(data) {
    // Handle different message types
    if (data.type === 'RUN') {
        // Just a run event, fetch latest data
        console.log(`Run event: ${data.runs}`);
        // The full data should follow in next message or we fetch
    } else if (data.type === 'EXTRA') {
        console.log(`Extra event: ${data.extraType}`);
    } else if (data.type === 'WICKET' || data.type === 'PUSH_EVENT') {
        // Wicket event - show notification
        showNotification(data.message || 'WICKET!');
    } else if (data.tournament || data.team1 || data.team2) {
        // Full score update data
        updateBoard(data);
    } else if (data.match) {
        // Socket.io format
        updateBoard(data.match);
    }
}

// Show notification for events
function showNotification(message) {
    if (!els.notification || !els.notificationText) return;
    
    els.notificationText.innerText = message;
    els.notification.className = 'notification-active';
    
    if (message.includes('4')) {
        els.notification.classList.add('notif-4');
    } else if (message.includes('6')) {
        els.notification.classList.add('notif-6');
    } else if (message.includes('WICKET') || message.includes('OUT')) {
        els.notification.classList.add('notif-w');
    }
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        els.notification.className = '';
    }, 3000);
}

// 6. Fetch initial match data on load
async function fetchInitialMatchData() {
    if (!matchId) {
        console.log('No matchId provided, waiting for BroadcastChannel events...');
        return;
    }
    
    try {
        const apiBaseUrl = config.apiBaseUrl || '/api/v1';
        const response = await fetch(`${apiBaseUrl}/matches/${matchId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const matchData = await response.json();
        console.log('Initial match data fetched:', matchData);
        updateBoard(matchData);
    } catch (error) {
        console.error('Failed to fetch initial match data:', error);
    }
}

// 7. Connect to socket
socket.on('connect', () => {
    console.log('Connected to ScoreX Live');
    if (matchId) {
        socket.emit('join_match', matchId);
    }
    // Fetch initial data after connecting
    fetchInitialMatchData();
});

// 8. Listen for score updates (correct event name from backend)
socket.on('scoreUpdate', (data) => {
    console.log('Score update received:', data);
    if (data.match) {
        updateBoard(data.match);
    } else if (data.matchId === matchId) {
        // Handle direct match data
        updateBoard(data);
    }
});

// Also listen for match_update for backward compatibility
socket.on('match_update', (data) => {
    console.log('Match update received:', data);
    updateBoard(data);
});

// 9. Update UI Function - Updated to handle ScoreboardUpdate format
function updateBoard(data) {
    if (!data) return;
    
    // Handle ScoreboardUpdate format (nested team objects)
    const isScoreboardFormat = data.team1 && typeof data.team1 === 'object';
    
    if (isScoreboardFormat) {
        // ScoreboardUpdate format
        updateBoardScoreboardFormat(data);
    } else {
        // Legacy/Match format
        updateBoardLegacyFormat(data);
    }
    
    // Trigger pulse animation for changed values
    triggerPulseAnimations();
}

// Handle ScoreboardUpdate format (from ScoreboardUpdate.tsx)
function updateBoardScoreboardFormat(data) {
    const team1Data = data.team1 || {};
    const team2Data = data.team2 || {};
    
    // Update team names
    if (els.team1Name) {
        els.team1Name.innerText = team1Data.name || 'Team 1';
    }
    if (els.team2Name) {
        els.team2Name.innerText = team2Data.name || 'Team 2';
    }
    
    // Update scores
    if (els.team1Score) {
        els.team1Score.innerText = `${team1Data.score || 0}/${team1Data.wickets || 0}`;
    }
    if (els.team2Score) {
        els.team2Score.innerText = `${team2Data.score || 0}/${team2Data.wickets || 0}`;
    }
    
    // Update overs - handle both string and number formats
    if (els.team1Overs) {
        const overs1 = team1Data.overs || 0;
        els.team1Overs.innerText = typeof overs1 === 'string' ? overs1 : formatOvers(overs1);
    }
    if (els.team2Overs) {
        const overs2 = team2Data.overs || 0;
        els.team2Overs.innerText = typeof overs2 === 'string' ? overs2 : formatOvers(overs2);
    }
    
    // Update wickets
    if (els.team1Wickets) {
        els.team1Wickets.innerText = team1Data.wickets || 0;
    }
    
    // Update striker
    const striker = data.striker || {};
    if (els.striker) {
        els.striker.innerText = `${striker.name || 'Striker'} ${striker.runs || 0}${striker.status || ''}`;
    }
    if (els.strikerRuns) {
        els.strikerRuns.innerText = striker.runs || 0;
    }
    if (els.strikerBalls) {
        els.strikerBalls.innerText = striker.balls || 0;
    }
    
    // Update non-striker
    const nonStriker = data.nonStriker || {};
    if (els.nonStriker) {
        els.nonStriker.innerText = `${nonStriker.name || 'Non-Striker'} ${nonStriker.runs || 0}`;
    }
    if (els.nonStrikerRuns) {
        els.nonStrikerRuns.innerText = nonStriker.runs || 0;
    }
    if (els.nonStrikerBalls) {
        els.nonStrikerBalls.innerText = nonStriker.balls || 0;
    }
    
    // Update bowler
    const bowler = data.bowler || {};
    if (els.bowler) {
        els.bowler.innerText = bowler.name || 'Bowler';
    }
    if (els.bowlerOvers) {
        els.bowlerOvers.innerText = bowler.overs || 0;
    }
    if (els.bowlerRuns) {
        els.bowlerRuns.innerText = bowler.runs || 0;
    }
    if (els.bowlerWickets) {
        els.bowlerWickets.innerText = bowler.wickets || 0;
    }
    
    // Update run rates
    const stats = data.stats || {};
    if (els.crr) {
        els.crr.innerText = `CRR: ${stats.currentRunRate?.toFixed(2) || '0.00'}`;
    }
    if (els.rrr) {
        els.rrr.innerText = `RRR: ${stats.requiredRunRate?.toFixed(2) || '0.00'}`;
    }
    if (els.target) {
        els.target.innerText = `Target: ${stats.target || '-'}`;
    }
    
    // Update tournament
    if (els.tournament && data.tournament) {
        els.tournament.innerText = data.tournament.name || 'Tournament';
    }
    
    // Update match status
    if (els.matchStatus) {
        els.matchStatus.innerText = data.status || 'Live';
    }
    
    // Update balls tracker
    if (els.ballsContainer && stats.last5Overs) {
        updateBallsTracker(stats.last5Overs);
    }
}

// Handle legacy/match format
function updateBoardLegacyFormat(data) {
    // Update team 1 (batting team - usually team1)
    if (els.team1Name) {
        els.team1Name.innerText = data.team1?.name || data.team1?.shortName || 'Team 1';
    }
    
    // Update team 2 (bowling team - usually team2)
    if (els.team2Name) {
        els.team2Name.innerText = data.team2?.name || data.team2?.shortName || 'Team 2';
    }
    
    // Update scores
    if (els.team1Score) {
        const score1 = data.score1 || data.team1?.score || 0;
        const wickets1 = data.wickets1 || data.team1?.wickets || 0;
        els.team1Score.innerText = `${score1}/${wickets1}`;
    }
    
    if (els.team2Score) {
        const score2 = data.score2 || data.team2?.score || 0;
        const wickets2 = data.wickets2 || data.team2?.wickets || 0;
        els.team2Score.innerText = `${score2}/${wickets2}`;
    }
    
    // Update overs
    if (els.team1Overs) {
        const overs1 = data.overs1 || data.team1?.overs || '0.0';
        els.team1Overs.innerText = formatOvers(overs1);
    }
    
    if (els.team2Overs) {
        const overs2 = data.overs2 || data.team2?.overs || '0.0';
        els.team2Overs.innerText = formatOvers(overs2);
    }
    
    // Update wickets
    if (els.team1Wickets) {
        els.team1Wickets.innerText = data.wickets1 || data.team1?.wickets || 0;
    }
    
    // Update striker info
    if (els.striker) {
        const strikerName = data.striker_name || data.striker?.name || 'Striker';
        const strikerRuns = data.striker_runs || data.striker?.runs || 0;
        els.striker.innerText = `${strikerName} ${strikerRuns}*`;
    }
    
    if (els.strikerRuns) {
        els.strikerRuns.innerText = data.striker_runs || data.striker?.runs || 0;
    }
    
    if (els.strikerBalls) {
        els.strikerBalls.innerText = data.striker_balls || data.striker?.balls || 0;
    }
    
    // Update non-striker info
    if (els.nonStriker) {
        const nonStrikerName = data.nonstriker_name || data.nonStriker?.name || 'Non-Striker';
        const nonStrikerRuns = data.nonstriker_runs || data.nonStriker?.runs || 0;
        els.nonStriker.innerText = `${nonStrikerName} ${nonStrikerRuns}`;
    }
    
    if (els.nonStrikerRuns) {
        els.nonStrikerRuns.innerText = data.nonstriker_runs || data.nonStriker?.runs || 0;
    }
    
    if (els.nonStrikerBalls) {
        els.nonStrikerBalls.innerText = data.nonstriker_balls || data.nonStriker?.balls || 0;
    }
    
    // Update bowler info
    if (els.bowler) {
        const bowlerName = data.bowler_name || data.bowler?.name || 'Bowler';
        els.bowler.innerText = bowlerName;
    }
    
    if (els.bowlerOvers) {
        els.bowlerOvers.innerText = data.bowler_overs || data.bowler?.overs || 0;
    }
    
    if (els.bowlerRuns) {
        els.bowlerRuns.innerText = data.bowler_runs || data.bowler?.runsConceded || 0;
    }
    
    if (els.bowlerWickets) {
        els.bowlerWickets.innerText = data.bowler_wickets || data.bowler?.wickets || 0;
    }
    
    // Update run rates
    if (els.crr) {
        els.crr.innerText = `CRR: ${data.crr || '0.00'}`;
    }
    
    if (els.rrr) {
        els.rrr.innerText = `RRR: ${data.rrr || '0.00'}`;
    }
    
    if (els.target) {
        els.target.innerText = `Target: ${data.target || '-'}`;
    }
    
    // Update tournament/match info
    if (els.tournament) {
        els.tournament.innerText = data.tournament?.name || 'Tournament';
    }
    
    if (els.matchStatus) {
        els.matchStatus.innerText = data.status || 'Live';
    }
    
    // Update balls this over
    if (els.ballsContainer && data.lastFiveOvers) {
        updateBallsTracker(data.lastFiveOvers);
    }
}

// Helper: Format overs properly
function formatOvers(overs) {
    if (typeof overs === 'string') return overs;
    if (typeof overs === 'number') {
        const wholeOvers = Math.floor(overs);
        const balls = Math.round((overs - wholeOvers) * 10);
        return `${wholeOvers}.${balls}`;
    }
    return '0.0';
}

// Helper: Update balls tracker
function updateBallsTracker(lastFiveOvers) {
    if (!els.ballsContainer) return;
    
    els.ballsContainer.innerHTML = '';
    
    // Parse the last 5 overs string or use array
    let balls = [];
    if (typeof lastFiveOvers === 'string') {
        balls = lastFiveOvers.split('').filter(b => ['0', '1', '2', '3', '4', '6', 'W', 'w'].includes(b));
    } else if (Array.isArray(lastFiveOvers)) {
        balls = lastFiveOvers;
    }
    
    // Take last 6 balls (one over)
    const lastOver = balls.slice(-6);
    
    lastOver.forEach((ball, i) => {
        const bDiv = document.createElement('div');
        bDiv.className = `ball-item ball-${ball.toString().toLowerCase()}`;
        
        // Add special classes for boundaries and wickets
        if (['4', '6'].includes(ball.toString())) {
            bDiv.classList.add('boundary');
        }
        if (['W', 'w'].includes(ball.toString())) {
            bDiv.classList.add('wicket');
        }
        
        bDiv.innerText = ball;
        
        // Stagger animation for Level 2
        if (config.level >= 2) {
            bDiv.style.animationDelay = `${i * 0.1}s`;
        }
        
        els.ballsContainer.appendChild(bDiv);
    });
}

// Helper: Trigger pulse animations
function triggerPulseAnimations() {
    const elements = document.querySelectorAll('#score, #overs, #wickets, #crr, #striker, #bowler');
    elements.forEach(el => {
        if (el) {
            el.classList.remove('pulse');
            void el.offsetWidth;
            el.classList.add('pulse');
        }
    });
}

// Helper: Only animate if text changes
function updateText(element, newValue) {
    if (!element) return;
    if (element.innerText != newValue) {
        element.classList.remove('pulse-update');
        void element.offsetWidth;
        element.innerText = newValue;
        element.classList.add('pulse-update');
    }
}

// 10. Handle Notifications (Wicket/4/6)
function handleNotification(event) {
    if (!event || !els.notification) return;
    
    const notif = els.notification;
    const text = els.notificationText;
    
    if (!text) return;
    
    let message = "";
    let className = "";
    
    if (event === '4') { message = "FOUR RUNS!"; className = "notif-4"; }
    else if (event === '6') { message = "HUGE SIX!"; className = "notif-6"; }
    else if (['W', 'w', 'WICKET'].includes(event)) { message = "WICKET!"; className = "notif-w"; }
    else return; // Don't show notification for other events
    
    text.innerText = message;
    notif.className = `notification-active ${className}`;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notif.className = '';
    }, 3000);
}

// Add CSS for pulse animation if not already defined
if (typeof document !== 'undefined' && !document.getElementById('overlay-engine-styles')) {
    const style = document.createElement('style');
    style.id = 'overlay-engine-styles';
    style.textContent = `
        .pulse, .pulse-update {
            animation: pulse 0.3s ease-in-out;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        .ball-item {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin: 2px;
            font-size: 12px;
            font-weight: bold;
            background: #444;
            color: white;
        }
        .ball-item.boundary {
            background: #ffc107;
            color: #000;
        }
        .ball-item.wicket, .ball-item.ball-w {
            background: #e53935;
            color: white;
        }
        .notification-active {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 9999;
            animation: popIn 0.3s ease-out;
        }
        .notif-4 { background: #4caf50; color: white; }
        .notif-6 { background: #ff9800; color: white; }
        .notif-w { background: #f44336; color: white; }
        @keyframes popIn {
            from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

console.log('ScoreX Overlay Engine initialized', { matchId, config });
