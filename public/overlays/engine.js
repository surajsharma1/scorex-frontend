// public/overlays/engine.js

// 1. Initialize Socket
const socket = io(window.OVERLAY_CONFIG.apiBaseUrl);
const matchId = window.OVERLAY_CONFIG.matchId;

// 2. DOM Elements Cache
const els = {
    battingTeam: document.getElementById('battingTeam'),
    bowlingTeam: document.getElementById('bowlingTeam'),
    striker: document.getElementById('striker'),
    nonStriker: document.getElementById('nonStriker'),
    bowler: document.getElementById('bowler'),
    runs: document.getElementById('runs'),
    wickets: document.getElementById('wickets'),
    overs: document.getElementById('overs'),
    crr: document.getElementById('crr'),
    ballsContainer: document.getElementById('ballsContainer'),
    notification: document.getElementById('notificationArea'),
    notificationText: document.getElementById('notificationText')
};

// 3. Connect
socket.on('connect', () => {
    console.log('Connected to ScoreX Live');
    if (matchId) socket.emit('join_match', matchId);
});

// 4. Handle Match Updates
socket.on('match_update', (data) => {
    updateBoard(data);
    
    // Level 2 Notification Logic
    if (window.OVERLAY_CONFIG.level >= 2 && data.lastEvent) {
        handleNotification(data.lastEvent);
    }
});

// 5. Update UI Function
function updateBoard(data) {
    // Text Updates with "Flash" effect if value changed
    updateText(els.runs, data.score || 0);
    updateText(els.wickets, data.wickets || 0);
    updateText(els.overs, data.overs || '0.0');
    
    if(els.battingTeam) els.battingTeam.innerText = data.battingTeam || 'BAT';
    if(els.bowlingTeam) els.bowlingTeam.innerText = data.bowlingTeam || 'BWL';
    if(els.striker) els.striker.innerText = `${data.striker?.name || 'Striker'} ${data.striker?.runs || 0}*`;
    if(els.nonStriker) els.nonStriker.innerText = `${data.nonStriker?.name || 'Non-Striker'} ${data.nonStriker?.runs || 0}`;
    if(els.bowler) els.bowler.innerText = `${data.bowler?.name || 'Bowler'} ${data.bowler?.wickets || 0}/${data.bowler?.runsConceded || 0}`;
    if(els.crr) els.crr.innerText = `CRR: ${data.crr || '0.0'}`;

    // Render Balls (This Over)
    if (els.ballsContainer) {
        els.ballsContainer.innerHTML = '';
        const balls = data.thisOver || [];
        balls.forEach((ball, i) => {
            const bDiv = document.createElement('div');
            bDiv.className = `ball-item ball-${ball}`;
            bDiv.innerText = ball;
            // Stagger animation for Level 2
            if(window.OVERLAY_CONFIG.level >= 2) {
                bDiv.style.animationDelay = `${i * 0.1}s`;
            }
            els.ballsContainer.appendChild(bDiv);
        });
    }
}

// Helper: Only animate if text changes
function updateText(element, newValue) {
    if (!element) return;
    if (element.innerText != newValue) {
        element.classList.remove('pulse-update');
        void element.offsetWidth; // Trigger reflow
        element.innerText = newValue;
        element.classList.add('pulse-update');
    }
}

// 6. Handle Notifications (Wicket/4/6)
function handleNotification(event) {
    if (!['4', '6', 'W', 'WICKET'].includes(event)) return;
    
    const notif = els.notification;
    const text = els.notificationText;
    
    let message = "";
    let className = "";
    
    if (event === '4') { message = "FOUR RUNS!"; className = "notif-4"; }
    else if (event === '6') { message = "HUGE SIX!"; className = "notif-6"; }
    else { message = "WICKET!"; className = "notif-w"; }
    
    text.innerText = message;
    notif.className = `notification-active ${className}`; // Reset class
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notif.className = '';
    }, 3000);
}