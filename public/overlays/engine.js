// public/overlays/engine.js

// 1. Initialize Socket with proper configuration
const socket = io(window.OVERLAY_CONFIG.apiBaseUrl || '/');
const matchId = window.OVERLAY_CONFIG.matchId;
const config = window.OVERLAY_CONFIG || {};

console.log('Engine.js loaded - DEBUG MODE');

// 2. BroadcastChannel for same-browser communication (from ScoreboardUpdate)
let broadcastChannel = null;
try {
    broadcastChannel = new BroadcastChannel('cricket_score_updates');
    console.log('BroadcastChannel created');
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

console.log('DOM elements cached:', Object.keys(els));

// 4. Listen for BroadcastChannel messages (from ScoreboardUpdate in same browser)
if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
        console.log('BroadcastChannel message received:', event.data);
        handleScoreUpdate(event.data);
    };
}

// 4b. POST MESSAGE - Listen for messages from parent window (from LiveScoring.tsx via iframe)
window.addEventListener('message', (event) => {
    console.log('PostMessage received in engine.js:', event.data);
    if (event.data && event.data.type === 'UPDATE_SCORE' && event.data.data) {
        console.log('Processing UPDATE_SCORE:', event.data.data);
        // Transform LiveScoring format to match format
        const data = event.data.data;
        const transformedData = transformLiveScoringData(data);
        console.log('Transformed data:', transformedData);
        handleScoreUpdate(transformedData);
    }
});

// Transform LiveScoring data format to match format
function transformLiveScoringData(data) {
    if (!data) return null;
    
    console.log('transformLiveScoringData called with:', data);
    
    // Check if already in ScoreboardUpdate format (has nested team objects with batsmen)
    if (data.team1 && typeof data.team1 === 'object' && data.team1.batsmen) {
        console.log('Data is already in ScoreboardUpdate format');
        return data;
    }
    
    // Check if already in match format (has team1/team2 objects with score property)
    if (data.team1 && typeof data.team1 === 'object' && data.team1.score !== undefined) {
        console.log('Data is already in match format');
        return data;
    }
    
    // Check if in legacy match format (has score1/score2)
    if (data.score1 !== undefined || data.score2 !== undefined) {
        console.log('Data is in legacy match format');
        return data;
    }
    
    // LiveScoring format: { team1Name, team1Score, team1Wickets, team1Overs, strikerName, ... }
    // Transform to match format
    console.log('Transforming from LiveScoring format');
    return {
        team1: {
            name: data.team1Name || 'Team 1',
            score: data.team1Score || 0,
            wickets: data.team1Wickets || 0,
            overs: parseFloat(data.team1Overs) || 0
        },
        team2: {
            name: data.team2Name || 'Team 2',
            score: data.team2Score || 0,
            wickets: data.team2Wickets || 0,
            overs: parseFloat(data.team2Overs) || 0
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
            currentRunRate: parseFloat(data.runRate) || 0,
            last5Overs: data.lastFiveOvers || ''
        },
        tournament: {
            name: data.tournamentName || 'Tournament'
        },
        status: 'Live'
    };
}

// 5. Handle score updates from any source
function handleScoreUpdate(data) {
    console.log('handleScoreUpdate called with:', data);
    
    // Handle different message types
    if (data.type === 'RUN') {
        console.log(`Run event: ${data.runs}`);
    } else if (data.type === 'EXTRA') {
        console.log(`Extra event: ${data.extraType}`);
    } else if (data.type === 'WICKET' || data.type === 'PUSH_EVENT') {
        showNotification(data.message || 'WICKET!');
    } else if (data.tournament || data.team1 || data.team2) {
        // Full score update data
        console.log('Calling updateBoard');
        updateBoard(data);
    } else if (data.match) {
        // Socket.io format
        console.log('Calling updateBoard with data.match');
        updateBoard(data.match);
    } else {
        console.log('Data format not recognized, keys:', Object.keys(data));
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
    fetchInitialMatchData();
});

// 8. Listen for score updates
socket.on('scoreUpdate', (data) => {
    console.log('Score update received:', data);
    if (data.match) {
        updateBoard(data.match);
    } else if (data.matchId === matchId) {
        updateBoard(data);
    }
});

socket.on('match_update', (data) => {
    console.log('Match update received:', data);
    updateBoard(data);
});

// 9. Update UI Function
function updateBoard(data) {
    if (!data) {
        console.log('updateBoard called with null data');
        return;
    }
    
    console.log('updateBoard called with data keys:', Object.keys(data));
    
    // Check if in ScoreboardUpdate format (nested team objects with batsmen)
    const isScoreboardFormat = data.team1 && typeof data.team1 === 'object' && data.team1.batsmen;
    
    console.log('isScoreboardFormat:', isScoreboardFormat);
    
    if (isScoreboardFormat) {
        updateBoardScoreboardFormat(data);
    } else {
        updateBoardLegacyFormat(data);
    }
    
    triggerPulseAnimations();
}

// Handle ScoreboardUpdate format
function updateBoardScoreboardFormat(data) {
    console.log('Using ScoreboardUpdate format');
    const team1Data = data.team1 || {};
    const team2Data = data.team2 || {};
    
    if (els.team1Name) els.team1Name.innerText = team1Data.name || 'Team 1';
    if (els.team2Name) els.team2Name.innerText = team2Data.name || 'Team 2';
    
    if (els.team1Score) els.team1Score.innerText = `${team1Data.score || 0}/${team1Data.wickets || 0}`;
    if (els.team2Score) els.team2Score.innerText = `${team2Data.score || 0}/${team2Data.wickets || 0}`;
    
    if (els.team1Overs) {
        const overs1 = team1Data.overs || 0;
        els.team1Overs.innerText = typeof overs1 === 'string' ? overs1 : formatOvers(overs1);
    }
    
    if (els.team1Wickets) els.team1Wickets.innerText = team1Data.wickets || 0;
    
    const striker = data.striker || {};
    if (els.striker) els.striker.innerText = `${striker.name || 'Striker'} ${striker.runs || 0}*`;
    if (els.strikerRuns) els.strikerRuns.innerText = striker.runs || 0;
    if (els.strikerBalls) els.strikerBalls.innerText = striker.balls || 0;
    
    const nonStriker = data.nonStriker || {};
    if (els.nonStriker) els.nonStriker.innerText = `${nonStriker.name || 'Non-Striker'} ${nonStriker.runs || 0}`;
    if (els.nonStrikerRuns) els.nonStrikerRuns.innerText = nonStriker.runs || 0;
    if (els.nonStrikerBalls) els.nonStrikerBalls.innerText = nonStriker.balls || 0;
    
    const bowler = data.bowler || {};
    if (els.bowler) els.bowler.innerText = bowler.name || 'Bowler';
    if (els.bowlerOvers) els.bowlerOvers.innerText = bowler.overs || 0;
    if (els.bowlerRuns) els.bowlerRuns.innerText = bowler.runsConceded || 0;
    if (els.bowlerWickets) els.bowlerWickets.innerText = bowler.wickets || 0;
    
    const stats = data.stats || {};
    if (els.crr) els.crr.innerText = `CRR: ${stats.currentRunRate?.toFixed(2) || '0.00'}`;
    if (els.rrr) els.rrr.innerText = `RRR: ${stats.requiredRunRate?.toFixed(2) || '0.00'}`;
    if (els.target) els.target.innerText = `Target: ${stats.target || '-'}`;
    
    if (els.tournament && data.tournament) els.tournament.innerText = data.tournament.name || 'Tournament';
    if (els.matchStatus) els.matchStatus.innerText = data.status || 'Live';
    
    if (els.ballsContainer && stats.last5Overs) updateBallsTracker(stats.last5Overs);
}

// Handle legacy/match format
function updateBoardLegacyFormat(data) {
    console.log('Using legacy/match format');
    
    if (els.team1Name) {
        els.team1Name.innerText = data.team1?.name || data.team1?.shortName || 'Team 1';
    }
    
    if (els.team2Name) {
        els.team2Name.innerText = data.team2?.name || data.team2?.shortName || 'Team 2';
    }
    
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
    
    if (els.team1Overs) {
        const overs1 = data.overs1 || data.team1?.overs || '0.0';
        els.team1Overs.innerText = formatOvers(overs1);
    }
    
    if (els.team2Overs) {
        const overs2 = data.overs2 || data.team2?.overs || '0.0';
        els.team2Overs.innerText = formatOvers(overs2);
    }
    
    if (els.team1Wickets) els.team1Wickets.innerText = data.wickets1 || data.team1?.wickets || 0;
    
    const strikerName = data.striker_name || data.striker?.name || 'Striker';
    const strikerRuns = data.striker_runs || data.striker?.runs || 0;
    if (els.striker) els.striker.innerText = `${strikerName} ${strikerRuns}*`;
    if (els.strikerRuns) els.strikerRuns.innerText = data.striker_runs || data.striker?.runs || 0;
    if (els.strikerBalls) els.strikerBalls.innerText = data.striker_balls || data.striker?.balls || 0;
    
    const nonStrikerName = data.nonstriker_name || data.nonStriker?.name || 'Non-Striker';
    const nonStrikerRuns = data.nonstriker_runs || data.nonStriker?.runs || 0;
    if (els.nonStriker) els.nonStriker.innerText = `${nonStrikerName} ${nonStrikerRuns}`;
    if (els.nonStrikerRuns) els.nonStrikerRuns.innerText = data.nonstriker_runs || data.nonStriker?.runs || 0;
    if (els.nonStrikerBalls) els.nonStrikerBalls.innerText = data.nonstriker_balls || data.nonStriker?.balls || 0;
    
    const bowlerName = data.bowler_name || data.bowler?.name || 'Bowler';
    if (els.bowler) els.bowler.innerText = bowlerName;
    if (els.bowlerOvers) els.bowlerOvers.innerText = data.bowler_overs || data.bowler?.overs || 0;
    if (els.bowlerRuns) els.bowlerRuns.innerText = data.bowler_runs || data.bowler?.runsConceded || 0;
    if (els.bowlerWickets) els.bowlerWickets.innerText = data.bowler_wickets || data.bowler?.wickets || 0;
    
    if (els.crr) els.crr.innerText = `CRR: ${data.crr || '0.00'}`;
    if (els.rrr) els.rrr.innerText = `RRR: ${data.rrr || '0.00'}`;
    if (els.target) els.target.innerText = `Target: ${data.target || '-'}`;
    
    if (els.tournament) els.tournament.innerText = data.tournament?.name || 'Tournament';
    if (els.matchStatus) els.matchStatus.innerText = data.status || 'Live';
    
    if (els.ballsContainer && data.lastFiveOvers) updateBallsTracker(data.lastFiveOvers);
}

function formatOvers(overs) {
    if (typeof overs === 'string') return overs;
    if (typeof overs === 'number') {
        const wholeOvers = Math.floor(overs);
        const balls = Math.round((overs - wholeOvers) * 10);
        return `${wholeOvers}.${balls}`;
    }
    return '0.0';
}

function updateBallsTracker(lastFiveOvers) {
    if (!els.ballsContainer) return;
    
    els.ballsContainer.innerHTML = '';
    
    let balls = [];
    if (typeof lastFiveOvers === 'string') {
        balls = lastFiveOvers.split('').filter(b => ['0', '1', '2', '3', '4', '6', 'W', 'w'].includes(b));
    } else if (Array.isArray(lastFiveOvers)) {
        balls = lastFiveOvers;
    }
    
    const lastOver = balls.slice(-6);
    
    lastOver.forEach((ball, i) => {
        const bDiv = document.createElement('div');
        bDiv.className = `ball-item ball-${ball.toString().toLowerCase()}`;
        
        if (['4', '6'].includes(ball.toString())) bDiv.classList.add('boundary');
        if (['W', 'w'].includes(ball.toString())) bDiv.classList.add('wicket');
        
        bDiv.innerText = ball;
        
        if (config.level >= 2) {
            bDiv.style.animationDelay = `${i * 0.1}s`;
        }
        
        els.ballsContainer.appendChild(bDiv);
    });
}

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

function updateText(element, newValue) {
    if (!element) return;
    if (element.innerText != newValue) {
        element.classList.remove('pulse-update');
        void element.offsetWidth;
        element.innerText = newValue;
        element.classList.add('pulse-update');
    }
}

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
    else return;
    
    text.innerText = message;
    notif.className = `notification-active ${className}`;
    
    setTimeout(() => {
        notif.className = '';
    }, 3000);
}

if (typeof document !== 'undefined' && !document.getElementById('overlay-engine-styles')) {
    const style = document.createElement('style');
    style.id = 'overlay-engine-styles';
    style.textContent = `
        .pulse, .pulse-update { animation: pulse 0.3s ease-in-out; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .ball-item { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; margin: 2px; font-size: 12px; font-weight: bold; background: #444; color: white; }
        .ball-item.boundary { background: #ffc107; color: #000; }
        .ball-item.wicket, .ball-item.ball-w { background: #e53935; color: white; }
        .notification-active { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px 40px; border-radius: 10px; font-size: 24px; font-weight: bold; z-index: 9999; animation: popIn 0.3s ease-out; }
        .notif-4 { background: #4caf50; color: white; }
        .notif-6 { background: #ff9800; color: white; }
        .notif-w { background: #f44336; color: white; }
        @keyframes popIn { from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
    `;
    document.head.appendChild(style);
}

console.log('ScoreX Overlay Engine initialized - DEBUG MODE', { matchId, config });
