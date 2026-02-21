/**
 * REVISED OVERLAY UTILITIES v2.0
 * Includes: Safe DOM handling, Data Transformation, and Universal Push Engine
 */

let matchData = {
    tournament: { name: 'Premier League T20', logo: '' },
    team1: { name: 'Team 1', shortName: 'T1', score: '0', wickets: '0', overs: '0.0', color: '#004BA0' },
    team2: { name: 'Team 2', shortName: 'T2', score: '0', wickets: '0', overs: '0.0', color: '#FCCA06' },
    striker: { name: '', runs: '0', balls: '0', status: '' },
    nonStriker: { name: '', runs: '0', balls: '0' },
    stats: { currentRunRate: '0.00', requiredRunRate: '0.00', last5Overs: '-', target: '' },
    status: 'Scheduled',
    result: ''
};

/**
 * CORE: Safe Element Updater
 * Prevents "Cannot set property of null" errors
 */
const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
};

/**
 * Universal Update Engine
 * Maps matchData to ANY of the 26 designs provided earlier
 */
window.updateScore = function(data) {
    if (!data) return;
    matchData = { ...matchData, ...data }; // Sync local state

    // Tournament Name - Primary target
    setText('tournament-name', matchData.tournament?.name || '');
    
    // Also check for alternate ID
    const tournamentAlt = document.querySelector('.tournament-name');
    if (tournamentAlt) tournamentAlt.textContent = matchData.tournament?.name || '';

    // Team 1 Mapping
    setText('team1-name', matchData.team1?.name || 'Team 1');
    setText('team1-short', matchData.team1?.shortName || 'T1');
    setText('team1-score', `${matchData.team1?.score || '0'}/${matchData.team1?.wickets || '0'}`);
    setText('team1-overs', matchData.team1?.overs || '0.0');

    // Team 2 Mapping
    setText('team2-name', matchData.team2?.name || 'Team 2');
    setText('team2-short', matchData.team2?.shortName || 'T2');
    setText('team2-score', `${matchData.team2?.score || '0'}/${matchData.team2?.wickets || '0'}`);
    setText('team2-overs', matchData.team2?.overs || '0.0');

    // Live Batting Mapping - Striker
    setText('striker-name', matchData.striker?.name || '');
    setText('striker-runs', matchData.striker?.runs || '0');
    setText('striker-balls', matchData.striker?.balls || '0');
    
    // Non-striker
    setText('nonstriker-name', matchData.nonStriker?.name || '');
    setText('nonstriker-runs', matchData.nonStriker?.runs || '0');
    setText('nonstriker-balls', matchData.nonStriker?.balls || '0');

    // Stats Mapping
    setText('current-rr', matchData.stats?.currentRunRate || '0.00');
    setText('required-rr', matchData.stats?.requiredRunRate || '0.00');
    setText('target', matchData.stats?.target || '');
    setText('match-result', matchData.result || '');

    window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: matchData }));
};

/**
 * Enhanced Push Engine
 * Supports all 26 design variations by scanning for parent containers
 */
window.triggerPush = function(msg, type) {
    const ids = ['push-engine', 'push-val', 'push-monolith', 'push-s', 'push-txt', 'push-text', 'push-i', 'push-m'];
    let pushEl = null;

    for (const id of ids) {
        const found = document.getElementById(id);
        if (found) { pushEl = found; break; }
    }

    if (!pushEl) return;

    // Update Content
    pushEl.innerText = msg;

    // Apply Themed Styling to the container (if exists)
    const container = pushEl.closest('div') || pushEl;
    const colors = { '6': '#00ff66', '4': '#00f2ff', 'W': '#ff0033', 'default': '#ff6600' };
    const selectedColor = colors[type] || colors.default;

    container.style.backgroundColor = selectedColor;
    if (type === 'W') container.style.color = '#fff'; else container.style.color = '#000';

    // Animation Toggle
    pushEl.classList.add('active');
    setTimeout(() => pushEl.classList.remove('active'), 3500);
};

/**
 * Robust Live Data Fetcher
 */
window.initLiveScore = async function(matchId, apiBaseUrl, interval = 5000) {
    const baseUrl = apiBaseUrl || 'https://scorex-backend.onrender.com/api/v1';

    const fetchAndUpdate = async () => {
        try {
            const res = await fetch(`${baseUrl}/matches/${matchId}`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();

            // Transform raw API to our structured matchData
            const sanitizedData = {
                tournament: {
                    name: data.tournament?.name || 'Tournament'
                },
                team1: {
                    name: data.team1?.name || 'Team 1',
                    shortName: data.team1?.shortName || 'T1',
                    score: data.score1 || 0,
                    wickets: data.wickets1 || 0,
                    overs: data.overs1 || 0
                },
                team2: {
                    name: data.team2?.name || 'Team 2',
                    shortName: data.team2?.shortName || 'T2',
                    score: data.score2 || 0,
                    wickets: data.wickets2 || 0,
                    overs: data.overs2 || 0
                },
                striker: {
                    name: data.striker_name || '',
                    runs: data.striker_runs || 0,
                    balls: data.striker_balls || 0
                },
                nonStriker: {
                    name: data.nonstriker_name || '',
                    runs: data.nonstriker_runs || 0,
                    balls: data.nonstriker_balls || 0
                },
                stats: {
                    currentRunRate: data.crr || '0.00',
                    requiredRunRate: data.rrr || '0.00',
                    target: data.target || '',
                    last5Overs: data.last5Overs || '-'
                },
                result: data.result || ''
            };

            window.updateScore(sanitizedData);
        } catch (err) {
            console.error('Fetch Error:', err);
        }
    };

    fetchAndUpdate();
    return setInterval(fetchAndUpdate, interval);
};

// Start logic
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('matchId');
    if (matchId) window.initLiveScore(matchId);
});
