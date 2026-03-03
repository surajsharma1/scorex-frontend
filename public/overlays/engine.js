// public/overlays/engine.js - COMPREHENSIVE OVERLAY ENGINE
// Handles all data formats and communication methods

// 1. Initialize Socket with proper configuration
const socket = io(window.OVERLAY_CONFIG?.apiBaseUrl || '/');
const matchId = window.OVERLAY_CONFIG?.matchId;
const config = window.OVERLAY_CONFIG || {};

console.log('Engine.js loaded - COMPREHENSIVE DATA MODE v2');

// 2. BroadcastChannel for same-browser communication
let broadcastChannel = null;
try {
    broadcastChannel = new BroadcastChannel('cricket_score_updates');
    console.log('BroadcastChannel created');
} catch (e) {
    console.log('BroadcastChannel not supported in this context');
}

// 3. DOM Elements Cache
const els = {
    team1Name: document.getElementById('team1Name') || document.getElementById('teamName') || document.getElementById('battingTeam'),
    team2Name: document.getElementById('team2Name') || document.getElementById('bowlingTeam'),
    team1Score: document.getElementById('team1Score') || document.getElementById('score'),
    team2Score: document.getElementById('team2Score'),
    team1Wickets: document.getElementById('team1Wickets') || document.getElementById('wickets'),
    team2Wickets: document.getElementById('team2Wickets'),
    team1Overs: document.getElementById('team1Overs') || document.getElementById('overs'),
    team2Overs: document.getElementById('team2Overs'),
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
    crr: document.getElementById('crr'),
    rrr: document.getElementById('rrr'),
    target: document.getElementById('target'),
    ballsContainer: document.getElementById('ballsContainer') || document.getElementById('ballsTracker'),
    tournament: document.getElementById('tournament'),
    matchStatus: document.getElementById('matchStatus') || document.getElementById('status'),
    extras: document.getElementById('extras'),
    notification: document.getElementById('notificationArea'),
    notificationText: document.getElementById('notificationText')
};

console.log('DOM elements cached:', Object.keys(els));

// =====================================================
// COMMUNICATION HANDLERS - ALL METHODS SUPPORTED
// =====================================================

// 4. Listen for BroadcastChannel messages
if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
        console.log('BroadcastChannel message received:', event.data);
        handleScoreUpdate(event.data);
    };
}

// 5. Listen for postMessage from parent window (LiveScoring.tsx via iframe)
window.addEventListener('message', (event) => {
    console.log('PostMessage received in engine.js:', event.data);
    if (event.data && event.data.type === 'UPDATE_SCORE' && event.data.data) {
        console.log('Processing UPDATE_SCORE:', event.data.data);
        const transformedData = transformLiveScoringData(event.data.data);
        console.log('Transformed data:', transformedData);
        handleScoreUpdate(transformedData);
    }
});

// 6. Also listen for socket events
socket.on('connect', function() {
    console.log('Connected to ScoreX Live');
    if (matchId) {
        socket.emit('join_match', matchId);
    }
    fetchInitialMatchData();
});

socket.on('scoreUpdate', function(data) {
    console.log('Score update received:', data);
    if (data.match) {
        handleScoreUpdate(data.match);
    } else if (data.matchId === matchId) {
        handleScoreUpdate(data);
    }
});

socket.on('match_update', function(data) {
    console.log('Match update received:', data);
    handleScoreUpdate(data);
});

// =====================================================
// DATA TRANSFORMATION - COMPREHENSIVE
// =====================================================

function transformLiveScoringData(data) {
    if (!data) return null;
    
    console.log('transformLiveScoringData called with:', data);
    
    // Already in ScoreboardUpdate format (has nested team objects with score)
    if (data.team1 && typeof data.team1 === 'object' && data.team1.score !== undefined) {
        console.log('Data is already in ScoreboardUpdate format');
        return data;
    }
    
    // Legacy match format (has score1/score2)
    if (data.score1 !== undefined || data.score2 !== undefined) {
        console.log('Data is in legacy match format');
        return data;
    }
    
    // LiveScoring format: { team1Name, team1Score, team1Wickets, team1Overs, strikerName, ... }
    console.log('Transforming from LiveScoring format - COMPREHENSIVE');
    
    const isTeam1Batting = data.battingTeam === 'team1' || !data.battingTeam;
    const currentOvers = isTeam1Batting ? data.team1Overs : data.team2Overs;
    
    // Build comprehensive transformed data
    const transformed = {
        team1: {
            name: data.team1Name || 'Team 1',
            shortName: (data.team1Name || 'Team 1').substring(0, 3).toUpperCase(),
            score: data.team1Score || 0,
            wickets: data.team1Wickets || 0,
            overs: parseFloat(data.team1Overs) || 0,
            extras: data.team1Extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
            isBatting: isTeam1Batting
        },
        team2: {
            name: data.team2Name || 'Team 2',
            shortName: (data.team2Name || 'Team 2').substring(0, 3).toUpperCase(),
            score: data.team2Score || 0,
            wickets: data.team2Wickets || 0,
            overs: parseFloat(data.team2Overs) || 0,
            extras: data.team2Extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
            isBatting: !isTeam1Batting
        },
        striker: {
            name: data.strikerName || 'Striker',
            runs: data.strikerRuns || 0,
            balls: data.strikerBalls || 0,
            fours: data.strikerFours || 0,
            sixes: data.strikerSixes || 0,
            status: '*'
        },
        nonStriker: {
            name: data.nonStrikerName || 'Non-Striker',
            runs: data.nonStrikerRuns || 0,
            balls: data.nonStrikerBalls || 0,
            fours: data.nonStrikerFours || 0,
            sixes: data.nonStrikerSixes || 0,
            status: ''
        },
        bowler: {
            name: data.bowlerName || 'Bowler',
            overs: data.bowlerOvers || 0,
            maidens: data.bowlerMaidens || 0,
            runsConceded: data.bowlerRuns || 0,
            wickets: data.bowlerWickets || 0
        },
        stats: {
            currentRunRate: parseFloat(data.runRate) || 0,
            requiredRunRate: parseFloat(data.requiredRunRate) || 0,
            target: data.target || 0,
            last5Overs: data.lastFiveOvers || data.last5Overs || '',
            last6Balls: data.last6Balls || data.lastFiveOvers || ''
        },
        tournament: {
            name: data.tournamentName || 'Tournament',
            id: data.tournamentId || ''
        },
        match: {
            id: data.matchId || matchId || '',
            status: data.status || 'Live',
            innings: data.innings || 1,
            result: data.result || ''
        },
        // Flat format for overlays that use flat field names
        team1Name: data.team1Name || 'Team 1',
        team2Name: data.team2Name || 'Team 2',
        score1: data.team1Score || 0,
        score2: data.team2Score || 0,
        wickets1: data.team1Wickets || 0,
        wickets2: data.team2Wickets || 0,
        overs1: data.team1Overs || '0.0',
        overs2: data.team2Overs || '0.0',
        striker_name: data.strikerName || 'Striker',
        striker_runs: data.strikerRuns || 0,
        striker_balls: data.strikerBalls || 0,
        nonstriker_name: data.nonStrikerName || 'Non-Striker',
        nonstriker_runs: data.nonStrikerRuns || 0,
        nonstriker_balls: data.nonStrikerBalls || 0,
        bowler_name: data.bowlerName || 'Bowler',
        bowler_overs: data.bowlerOvers || 0,
        bowler_runs: data.bowlerRuns || 0,
        bowler_wickets: data.bowlerWickets || 0,
        crr: data.runRate || '0.00',
        rrr: data.requiredRunRate || '0.00',
        lastFiveOvers: data.lastFiveOvers || data.last5Overs || '',
        target: data.target || '-',
        status: 'Live'
    };
    
    console.log('Transformed data:', transformed);
    return transformed;
}

// =====================================================
// MAIN SCORE UPDATE HANDLER
// =====================================================

function handleScoreUpdate(data) {
    console.log('handleScoreUpdate called with:', data);
    
    // Handle different message types
    if (data.type === 'RUN') {
        console.log('Run event: ' + data.runs);
        showNotification(data.runs + ' RUNS');
    } else if (data.type === 'EXTRA') {
        console.log('Extra event: ' + data.extraType);
        showNotification(data.extraType.toUpperCase() + ' + ' + data.runs);
    } else if (data.type === 'WICKET' || data.type === 'PUSH_EVENT') {
        showNotification(data.message || 'WICKET!');
    } else if (data.tournament || data.team1 || data.team2 || data.team1Name) {
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

function showNotification(message) {
    if (!els.notification || !els.notificationText) return;
    
    els.notificationText.innerText = message;
    els.notification.className = 'notification-active';
    
    if (message.includes('4')) {
        els.notification.classList.add('notif-4');
    } else if (message.includes('6')) {
        els.notification.classList.add('notif-6');
    } else if (message.includes('WICKET') || message.includes('OUT') || message.includes('WIDE') || message.includes('NO BALL')) {
        els.notification.classList.add('notif-w');
    }
    
    setTimeout(function() {
        els.notification.className = '';
    }, 3000);
}

// =====================================================
// UI UPDATE FUNCTIONS
// =====================================================

async function fetchInitialMatchData() {
    if (!matchId) {
        console.log('No matchId provided, waiting for BroadcastChannel events...');
        return;
    }
    
    try {
        var apiBaseUrl = config.apiBaseUrl || '/api/v1';
        var response = await fetch(apiBaseUrl + '/matches/' + matchId);
        
        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }
        
        var matchData = await response.json();
        console.log('Initial match data fetched:', matchData);
        updateBoard(matchData);
    } catch (error) {
        console.error('Failed to fetch initial match data:', error);
    }
}

function updateBoard(data) {
    if (!data) {
        console.log('updateBoard called with null data');
        return;
    }
    
    console.log('updateBoard called with data keys:', Object.keys(data));
    
    var isScoreboardFormat = data.team1 && typeof data.team1 === 'object' && (data.team1.batsmen || data.team1.score !== undefined);
    
    console.log('isScoreboardFormat:', isScoreboardFormat);
    
    if (isScoreboardFormat) {
        updateBoardScoreboardFormat(data);
    } else {
        updateBoardLegacyFormat(data);
    }
    
    triggerPulseAnimations();
}

function updateBoardScoreboardFormat(data) {
    console.log('Using ScoreboardUpdate format - COMPREHENSIVE');
    var team1Data = data.team1 || {};
    var team2Data = data.team2 || {};
    
    // Team Names
    if (els.team1Name) els.team1Name.innerText = team1Data.name || 'Team 1';
    if (els.team2Name) els.team2Name.innerText = team2Data.name || 'Team 2';
    
    // Scores
    if (els.team1Score) els.team1Score.innerText = (team1Data.score || 0) + '/' + (team1Data.wickets || 0);
    if (els.team2Score) els.team2Score.innerText = (team2Data.score || 0) + '/' + (team2Data.wickets || 0);
    
    // Overs
    if (els.team1Overs) {
        var overs1 = team1Data.overs || 0;
        els.team1Overs.innerText = typeof overs1 === 'string' ? overs1 : formatOvers(overs1);
    }
    if (els.team2Overs) {
        var overs2 = team2Data.overs || 0;
        els.team2Overs.innerText = typeof overs2 === 'string' ? overs2 : formatOvers(overs2);
    }
    
    // Wickets
    if (els.team1Wickets) els.team1Wickets.innerText = team1Data.wickets || 0;
    if (els.team2Wickets) els.team2Wickets.innerText = team2Data.wickets || 0;
    
    // Striker
    var striker = data.striker || {};
    if (els.striker) els.striker.innerText = (striker.name || 'Striker') + ' ' + (striker.runs || 0) + (striker.status || '*');
    if (els.strikerRuns) els.strikerRuns.innerText = striker.runs || 0;
    if (els.strikerBalls) els.strikerBalls.innerText = striker.balls || 0;
    
    // Non-Striker
    var nonStriker = data.nonStriker || {};
    if (els.nonStriker) els.nonStriker.innerText = (nonStriker.name || 'Non-Striker') + ' ' + (nonStriker.runs || 0);
    if (els.nonStrikerRuns) els.nonStrikerRuns.innerText = nonStriker.runs || 0;
    if (els.nonStrikerBalls) els.nonStrikerBalls.innerText = nonStriker.balls || 0;
    
    // Bowler
    var bowler = data.bowler || {};
    if (els.bowler) els.bowler.innerText = bowler.name || 'Bowler';
    if (els.bowlerOvers) els.bowlerOvers.innerText = bowler.overs || 0;
    if (els.bowlerRuns) els.bowlerRuns.innerText = bowler.runsConceded || bowler.runs || 0;
    if (els.bowlerWickets) els.bowlerWickets.innerText = bowler.wickets || 0;
    
    // Stats
    var stats = data.stats || {};
    if (els.crr) els.crr.innerText = 'CRR: ' + (stats.currentRunRate ? stats.currentRunRate.toFixed(2) : '0.00');
    if (els.rrr) els.rrr.innerText = 'RRR: ' + (stats.requiredRunRate ? stats.requiredRunRate.toFixed(2) : '0.00');
    if (els.target) els.target.innerText = 'Target: ' + (stats.target || '-');
    
    // Tournament
    if (els.tournament) {
        var tournamentName = data.tournament ? data.tournament.name : null;
        els.tournament.innerText = tournamentName || 'Tournament';
    }
    if (els.matchStatus) els.matchStatus.innerText = data.status || data.match?.status || 'Live';
    
    // Balls tracker
    var last5Overs = stats.last5Overs || stats.last6Balls || data.lastFiveOvers || '';
    if (els.ballsContainer && last5Overs) {
        updateBallsTracker(last5Overs);
    }
    
    // Extras
    if (els.extras && team1Data.extras) {
        var extras = team1Data.extras;
        var extrasText = '';
        if (extras.wides) extrasText += 'W:' + extras.wides + ' ';
        if (extras.noBalls) extrasText += 'NB:' + extras.noBalls + ' ';
        if (extras.byes) extrasText += 'B:' + extras.byes + ' ';
        if (extras.legByes) extrasText += 'LB:' + extras.legByes + ' ';
        els.extras.innerText = extrasText.trim() || 'Extras: 0';
    }
}

function updateBoardLegacyFormat(data) {
    console.log('Using legacy/match format - COMPREHENSIVE');
    
    // Team Names
    if (els.team1Name) {
        els.team1Name.innerText = data.team1Name || (data.team1 ? data.team1.name : null) || (data.team1 ? data.team1.shortName : null) || 'Team 1';
    }
    
    if (els.team2Name) {
        els.team2Name.innerText = data.team2Name || (data.team2 ? data.team2.name : null) || (data.team2 ? data.team2.shortName : null) || 'Team 2';
    }
    
    // Scores
    if (els.team1Score) {
        var score1 = data.score1 || (data.team1 ? data.team1.score : null) || 0;
        var wickets1 = data.wickets1 || (data.team1 ? data.team1.wickets : null) || 0;
        els.team1Score.innerText = score1 + '/' + wickets1;
    }
    
    if (els.team2Score) {
        var score2 = data.score2 || (data.team2 ? data.team2.score : null) || 0;
        var wickets2 = data.wickets2 || (data.team2 ? data.team2.wickets : null) || 0;
        els.team2Score.innerText = score2 + '/' + wickets2;
    }
    
    // Overs
    if (els.team1Overs) {
        var overs1 = data.overs1 || (data.team1 ? data.team1.overs : null) || '0.0';
        els.team1Overs.innerText = formatOvers(overs1);
    }
    
    if (els.team2Overs) {
        var overs2 = data.overs2 || (data.team2 ? data.team2.overs : null) || '0.0';
        els.team2Overs.innerText = formatOvers(overs2);
    }
    
    // Wickets
    if (els.team1Wickets) els.team1Wickets.innerText = data.wickets1 || (data.team1 ? data.team1.wickets : null) || 0;
    if (els.team2Wickets) els.team2Wickets.innerText = data.wickets2 || (data.team2 ? data.team2.wickets : null) || 0;
    
    // Striker
    var strikerName = data.strikerName || data.striker_name || (data.striker ? data.striker.name : null) || 'Striker';
    var strikerRuns = data.strikerRuns || data.striker_runs || (data.striker ? data.striker.runs : null) || 0;
    var strikerBalls = data.strikerBalls || data.striker_balls || (data.striker ? data.striker.balls : null) || 0;
    if (els.striker) els.striker.innerText = strikerName + ' ' + strikerRuns + '*';
    if (els.strikerRuns) els.strikerRuns.innerText = strikerRuns;
    if (els.strikerBalls) els.strikerBalls.innerText = strikerBalls;
    
    // Non-Striker
    var nonStrikerName = data.nonStrikerName || data.nonstriker_name || (data.nonStriker ? data.nonStriker.name : null) || 'Non-Striker';
    var nonStrikerRuns = data.nonStrikerRuns || data.nonstriker_runs || (data.nonStriker ? data.nonStriker.runs : null) || 0;
    var nonStrikerBalls = data.nonStrikerBalls || data.nonstriker_balls || (data.nonStriker ? data.nonStriker.balls : null) || 0;
    if (els.nonStriker) els.nonStriker.innerText = nonStrikerName + ' ' + nonStrikerRuns;
    if (els.nonStrikerRuns) els.nonStrikerRuns.innerText = nonStrikerRuns;
    if (els.nonStrikerBalls) els.nonStrikerBalls.innerText = nonStrikerBalls;
    
    // Bowler
    var bowlerName = data.bowlerName || data.bowler_name || (data.bowler ? data.bowler.name : null) || 'Bowler';
    var bowlerOvers = data.bowlerOvers || data.bowler_overs || (data.bowler ? data.bowler.overs : null) || 0;
    var bowlerRuns = data.bowlerRuns || data.bowler_runs || (data.bowler ? data.bowler.runsConceded : null) || 0;
    var bowlerWickets = data.bowlerWickets || data.bowler_wickets || (data.bowler ? data.bowler.wickets : null) || 0;
    if (els.bowler) els.bowler.innerText = bowlerName;
    if (els.bowlerOvers) els.bowlerOvers.innerText = bowlerOvers;
    if (els.bowlerWickets) els.bowlerWickets.innerText = bowlerWickets;
    var bowlerRunsEl = document.getElementById('bowlerRuns');
    if (bowlerRunsEl) bowlerRunsEl.innerText = bowlerRuns;
    
    // Run rates
    if (els.crr) els.crr.innerText = 'CRR: ' + (data.crr || data.runRate || '0.00');
    if (els.rrr) els.rrr.innerText = 'RRR: ' + (data.rrr || data.requiredRunRate || '0.00');
    if (els.target) els.target.innerText = 'Target: ' + (data.target || '-');
    
    // Tournament
    if (els.tournament) els.tournament.innerText = data.tournamentName || (data.tournament ? data.tournament.name : null) || 'Tournament';
    if (els.matchStatus) els.matchStatus.innerText = data.status || 'Live';
    
    // Balls tracker
    var lastFive = data.lastFiveOvers || data.last5Overs || data.last6Balls || '';
    if (els.ballsContainer && lastFive) {
        updateBallsTracker(lastFive);
    }
}

function formatOvers(overs) {
    if (typeof overs === 'string') return overs;
    if (typeof overs === 'number') {
        var wholeOvers = Math.floor(overs);
        var balls = Math.round((overs - wholeOvers) * 10);
        return wholeOvers + '.' + balls;
    }
    return '0.0';
}

function updateBallsTracker(lastFiveOvers) {
    if (!els.ballsContainer) return;
    
    els.ballsContainer.innerHTML = '';
    
    var balls = [];
    if (typeof lastFiveOvers === 'string') {
        balls = lastFiveOvers.split('').filter(function(b) { return ['0','1','2','3','4','6','W','w'].indexOf(b) !== -1; });
    } else if (Array.isArray(lastFiveOvers)) {
        balls = lastFiveOvers;
    }
    
    var lastOver = balls.slice(-6);
    
    lastOver.forEach(function(ball, i) {
        var bDiv = document.createElement('div');
        bDiv.className = 'ball-item ball-' + ball.toString().toLowerCase();
        
        if (['4', '6'].indexOf(ball.toString()) !== -1) bDiv.classList.add('boundary');
        if (['W', 'w'].indexOf(ball.toString()) !== -1) bDiv.classList.add('wicket');
        
        bDiv.innerText = ball;
        
        if (config.level >= 2) {
            bDiv.style.animationDelay = (i * 0.1) + 's';
        }
        
        els.ballsContainer.appendChild(bDiv);
    });
}

function triggerPulseAnimations() {
    var elements = document.querySelectorAll('#score, #overs, #wickets, #crr, #striker, #bowler');
    elements.forEach(function(el) {
        if (el) {
            el.classList.remove('pulse');
            void el.offsetWidth;
            el.classList.add('pulse');
        }
    });
}

// Add dynamic styles
if (typeof document !== 'undefined' && !document.getElementById('overlay-engine-styles')) {
    var style = document.createElement('style');
    style.id = 'overlay-engine-styles';
    style.textContent = '.pulse, .pulse-update { animation: pulse 0.3s ease-in-out; } @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } .ball-item { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; margin: 2px; font-size: 12px; font-weight: bold; background: #444; color: white; } .ball-item.boundary { background: #ffc107; color: #000; } .ball-item.wicket, .ball-item.ball-w { background: #e53935; color: white; } .notification-active { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px 40px; border-radius: 10px; font-size: 24px; font-weight: bold; z-index: 9999; animation: popIn 0.3s ease-out; } .notif-4 { background: #4caf50; color: white; } .notif-6 { background: #ff9800; color: white; } .notif-w { background: #f44336; color: white; } @keyframes popIn { from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }';
    document.head.appendChild(style);
}

console.log('ScoreX Overlay Engine v2 initialized - ALL COMMUNICATION METHODS SUPPORTED', { matchId: matchId, config: config });
