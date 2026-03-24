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

  // Update common data elements (used across overlay templates)
  const selectors = {
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
    bowlerOvers: '#bowlerOvers'
  };

  Object.entries(selectors).forEach(([key, selector]) => {
    const el = container.querySelector(selector) as HTMLElement;
    if (el && data[key as keyof PreviewData] !== undefined) {
      el.textContent = String(data[key as keyof PreviewData]);
    }
  });

  // Dispatch custom event for template-specific JS
  container.dispatchEvent(new CustomEvent('scorex:update', { detail: data }));
}

// Fetch overlay HTML for preview (proxy via backend to avoid CORS)
async function fetchOverlayHTML(baseUrl: string, template: string): Promise<string> {
  try {
    const response = await fetch(`${baseUrl}/overlays/${template}`, {
      headers: { 'Accept': 'text/html' }
    });
    if (!response.ok) throw new Error('Failed to fetch overlay HTML');
    return await response.text();
  } catch (error) {
    console.warn('Preview HTML fetch failed, using fallback:', error);
    return `<div style="padding:2rem;text-align:center;color:#666;background:#f0f0f0;border-radius:1rem;font-family:system-ui">
      <h3>Preview Template: ${template}</h3>
      <p>Backend proxy needed or template not found</p>
      <p class="text-xs mt-4 opacity-75">Live data ready via demo</p>
    </div>`;
  }
}

