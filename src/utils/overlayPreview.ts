/**
 * Overlay Preview Utilities - Iframe Replacement
 * Ports backend demo/normalize logic to frontend for iframe-free previews
 */

export interface PreviewData {
  matchName: string;
  tournamentName: string;
  team1Name: string;
  team1Score: number;
  team1Wickets: number;
  team1Overs: string;
  strikerName: string;
  strikerRuns: number;
  strikerBalls: number;
  nonStrikerName: string;
  nonStrikerRuns: number;
  nonStrikerBalls: number;
  bowlerName: string;
  bowlerRuns: number;
  bowlerWickets: number;
  bowlerOvers: string;
  target: number;
  runRate: string;
  requiredRunRate: string;
  status: string;
}

// Ported from backend public/overlays/engine.js getDemoData()
export function getDemoData(progress: number = 0.69): PreviewData {
  const target = 180;
  const team1Score = Math.round(target * progress);
  const team1Wickets = Math.round(10 * progress);
  const strikerRuns = Math.round(68 * progress);
  const nonStrikerRuns = Math.round(32 * progress);
  const bowlerRuns = Math.round(45 * progress);
  const bowlerWickets = Math.round(2 * progress);

  return {
    matchName: 'ScoreX Premium Showcase',
    tournamentName: 'MEMBERSHIP DEMO',
    team1Name: 'PREMIUM BATS',
    team1Score,
    team1Wickets,
    team1Overs: '14.2',
    strikerName: 'V Kohli',
    strikerRuns,
    strikerBalls: 42,
    nonStrikerName: 'R Sharma',
    nonStrikerRuns,
    nonStrikerBalls: 28,
    bowlerName: 'J Anderson',
    bowlerRuns,
    bowlerWickets,
    bowlerOvers: '3.4',
    target,
    runRate: '8.44',
    requiredRunRate: '9.23',
    status: 'LIVE'
  };
}

// Ported from backend public/overlays/overlay-utils.js normalizeScoreData()
export function normalizeScoreData(rawData: any): PreviewData | null {
  if (!rawData) return null;

  // Simplified normalization with fallbacks (full logic ported)
  return {
    matchName: rawData.name || 'Live Match',
    tournamentName: rawData.tournament?.name || 'SCOREX LIVE',
    team1Name: rawData.team1Name || rawData.battingTeamName || 'Team 1',
    team1Score: Math.max(0, Number(rawData.team1Score) || 0),
    team1Wickets: Math.max(0, Number(rawData.team1Wickets) || 0),
    team1Overs: rawData.team1Overs || '0.0',
    strikerName: rawData.strikerName || '',
    strikerRuns: Math.max(0, Number(rawData.strikerRuns) || 0),
    strikerBalls: Math.max(0, Number(rawData.strikerBalls) || 0),
    nonStrikerName: rawData.nonStrikerName || '',
    nonStrikerRuns: Math.max(0, Number(rawData.nonStrikerRuns) || 0),
    nonStrikerBalls: Math.max(0, Number(rawData.nonStrikerBalls) || 0),
    bowlerName: rawData.currentBowlerName || rawData.bowlerName || 'Bowler',
    bowlerRuns: Math.max(0, Number(rawData.bowlerRuns) || 0),
    bowlerWickets: Math.max(0, Number(rawData.bowlerWickets) || 0),
    bowlerOvers: rawData.bowlerOvers || '0.0',
    target: Math.max(0, Number(rawData.target) || 0),
    runRate: Number(rawData.runRate || 0).toFixed(2),
    requiredRunRate: Number(rawData.requiredRunRate || 0).toFixed(2),
    status: rawData.status || 'LIVE'
  };
}

// Simulate engine.js update for preview divs
export function updatePreviewData(container: HTMLElement | null, data: PreviewData) {
  if (!container) return;

  try {
    // Update common data elements (used across overlay templates)
    const selectors: Record<string, string> = {
      matchName: '#matchName',
      teamName: '#teamName',
      teamScore: '#teamScore',
      teamWickets: '#teamWickets',
      teamOvers: '#teamOvers',
      strikerName: '#strikerName',
      strikerRuns: '#strikerRuns',
      strikerBalls: '#strikerBalls',
      nonStrikerName: '#nonStrikerName',
      nonStrikerRuns: '#nonStrikerRuns',
      nonStrikerBalls: '#nonStrikerBalls',
      bowlerName: '#bowlerName',
      bowlerRuns: '#bowlerRuns',
      bowlerWickets: '#bowlerWickets',
      bowlerOvers: '#bowlerOvers',
      target: '#target',
      runRate: '#runRate',
      requiredRunRate: '#requiredRunRate',
      status: '#status'
    };

    Object.entries(selectors).forEach(([key, selector]) => {
      try {
        const el = container.querySelector(selector) as HTMLElement;
        if (el && data[key as keyof PreviewData] !== undefined) {
          el.textContent = String(data[key as keyof PreviewData]);
          el.style.opacity = '1'; // Fade in updates
          // Trigger animation on score changes (like React key remount)
          if (key === 'teamScore' || key === 'teamWickets' || key === 'strikerRuns') {
            el.classList.add('animate-pulse');
            el.dataset.runKey = data.team1Score?.toString() || '0';
            setTimeout(() => el.classList.remove('animate-pulse'), 300);
          }
        }
      } catch {}
    });
  } catch (e) {
    console.warn('Preview data update failed:', e);
  }

  // Dispatch on the container div (for OverlayPreviewRenderer internal listener)
 // container.dispatchEvent(new CustomEvent('scorex:update', { detail: data, bubbles: true }));

  // Dispatch on window — engine.js + overlay scripts listen on window
 // window.dispatchEvent(new CustomEvent('scorex:update', { detail: data }));

  // Also post UPDATE_SCORE message — this is what overlay <script> blocks listen for
  window.postMessage({ type: 'UPDATE_SCORE', data }, '*');
}

/**
 * Trigger 4 / 6 / WICKET animations in overlay scripts.
 *
 * lvl2 overlays detect animations via SCORE DELTA (new - old === 4/6, or wickets increased).
 * So we send two consecutive UPDATE_SCORE messages:
 *   1. baseline data  (establishes cSc / cWk inside overlay script)
 *   2. incremented data  (delta triggers the animation branch)
 *
 * lvl1 overlays have no animation, so they just silently update their DOM.
 */
export function pushAnimation(
  type: 'FOUR' | 'SIX' | 'WICKET',
  container: HTMLElement | null,
  baseProgress: number = 0.69
) {
  const base = getDemoData(baseProgress);

  // Step 1: send baseline so overlay script knows previous score (establishes cSc/cWk)
  updatePreviewData(container, base);
  window.postMessage({ type: 'UPDATE_SCORE', data: base }, '*');
  window.dispatchEvent(new CustomEvent('scorex:update', { detail: base }));

  // Step 2: after a short tick, send incremented value so overlay delta logic fires
  setTimeout(() => {
    const updated: any = type === 'FOUR'
      ? { ...base, team1Score: base.team1Score + 4, strikerRuns: base.strikerRuns + 4, lastBall: 'FOUR', lastBallRuns: 4 }
      : type === 'SIX'
      ? { ...base, team1Score: base.team1Score + 6, strikerRuns: base.strikerRuns + 6, lastBall: 'SIX', lastBallRuns: 6 }
      : { ...base, team1Wickets: base.team1Wickets + 1, strikerName: 'New Batter', strikerRuns: 0, strikerBalls: 0, lastBall: 'WICKET', wicket: true };

    updatePreviewData(container, updated as PreviewData);
    // UPDATE_SCORE is what every overlay HTML file listens for via window.addEventListener('message')
    window.postMessage({ type: 'UPDATE_SCORE', data: updated }, '*');
    window.dispatchEvent(new CustomEvent('scorex:update', { detail: updated }));
  }, 80);
}

const htmlCache = new Map<string, { html: string; timestamp: number }>();

// Fetch overlay HTML for preview (cached, timeout/retry)
export async function fetchOverlayHTML(baseUrl: string, template: string): Promise<string> {
  const cacheKey = `${baseUrl}-${template}`;
  const cached = htmlCache.get(cacheKey);
  const now = Date.now();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.html;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for prod backend

  try {
    const response = await fetch(`${baseUrl}/overlays/${template}?preview=true`, {
      headers: { 'Accept': 'text/html' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${template} not found`);
    
    const html = await response.text();
    htmlCache.set(cacheKey, { html, timestamp: now });
    return html;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Preview HTML fetch failed:', error);
    
    // Fallback with better UX
    return `<div style="padding:3rem;text-align:center;color:#888;background:linear-gradient(135deg,#1e293b,#334155);border-radius:1.5rem;font-family:system-ui;border:2px dashed #64748b">
      <h3 style="color:#f1f5f9;margin-bottom:1rem;font-size:1.4rem">📺 Preview: ${template}</h3>
      <p style="font-size:1.1rem;margin-bottom:0.5rem">Template loading from backend...</p>
      <p style="font-size:0.9rem;color:#94a3b8">Live data updates work via demo mode</p>
      <p style="font-size:0.8rem;color:#64748b;margin-top:1rem">Try 4️⃣ 6️⃣ OUT buttons!</p>
    </div>`;
  }
}

