import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Eye, RefreshCw, AlertCircle, ZoomIn, ZoomOut, RotateCcw,
  Activity, MonitorPlay
} from 'lucide-react';

interface MembershipPreviewProps {
  overlayFile: string;
  planName: string;
  baseUrl: string;
}

const MOCK_SCORE = {
  team1Name: 'MI', team2Name: 'CSK',
  team1ShortName: 'MI', team2ShortName: 'CSK',
  team1Score: 213, team1Wickets: 4, team1Overs: '19.4',
  strikerName: 'R. Sharma', strikerRuns: 82, strikerBalls: 45,
  nonStrikerName: 'H. Pandya', nonStrikerRuns: 24, nonStrikerBalls: 12,
  bowlerName: 'P. Cummins', bowlerRuns: 34, bowlerWickets: 1, bowlerOvers: '3.4',
  target: 214, requiredRuns: 1, remainingBalls: 2,
  tournamentName: 'IPL 2025', matchDisplayName: 'MI vs CSK',
  thisOver: [
    { raw: '1', runs: 1, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
    { raw: 'W', runs: 0, isWicket: true,  isWide: false, isNoBall: false, isFour: false, isSix: false },
    { raw: '4', runs: 4, isWicket: false, isWide: false, isNoBall: false, isFour: true,  isSix: false },
    { raw: '6', runs: 6, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: true  },
    { raw: '\u2022', runs: 0, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
    { raw: '1', runs: 1, isWicket: false, isWide: false, isNoBall: false, isFour: false, isSix: false },
  ],
  sponsors: [{ name: 'TATA', tagline: 'Power of We' }, { name: 'DREAM11', tagline: '' }],
  battingSummary: [
    { name: 'R. Sharma', runs: 82, balls: 45, fours: 8, sixes: 3, isOut: false },
    { name: 'H. Pandya', runs: 24, balls: 12, fours: 1, sixes: 2, isOut: false },
    { name: 'S. Yadav',  runs: 18, balls: 10, fours: 2, sixes: 0, isOut: true  },
    { name: 'R. Jadeja', runs: 10, balls: 5,  fours: 1, sixes: 0, isOut: true  },
  ],
  bowlingSummary: [
    { name: 'P. Cummins', overs: '3.4', runs: 34, wickets: 1, economy: 9.3 },
    { name: 'M. Starc',   overs: '4.0', runs: 38, wickets: 1, economy: 9.5 },
    { name: 'A. Zampa',   overs: '4.0', runs: 28, wickets: 2, economy: 7.0 },
  ],
  team1Players: [
    { name: 'R. Sharma', role: '(C)' }, { name: 'V. Kohli',  role: '' },
    { name: 'H. Pandya', role: '' },    { name: 'R. Jadeja', role: '' },
    { name: 'J. Bumrah', role: '' },
  ],
  team2Players: [
    { name: 'T. Head',    role: '' }, { name: 'P. Cummins', role: '(C)' },
    { name: 'M. Starc',   role: '' }, { name: 'A. Zampa',   role: '' },
  ],
};

const TRIGGERS_LVL1 = [
  { label: '4\ufe0f\u20e3 FOUR',       type: 'FOUR',             color: '#3b82f6' },
  { label: '6\ufe0f\u20e3 SIX',        type: 'SIX',              color: '#22c55e' },
  { label: '\ud83c\udfaf WICKET',      type: 'WICKET',           color: '#ef4444' },
  { label: '\u2696\ufe0f 3rd Umpire',  type: 'DECISION_PENDING', color: '#f59e0b' },
  { label: '\u21a9 Restore',           type: 'RESTORE',          color: '#6b7280' },
];

const TRIGGERS_LVL2 = [
  { label: '\u25b6 VS Screen',         type: 'SHOW_VS_SCREEN',   color: '#3b82f6' },
  { label: '\ud83e\ude99 Toss',        type: 'SHOW_TOSS',        color: '#f59e0b' },
  { label: 'Playing XI',              type: 'SHOW_SQUADS',      color: '#8b5cf6' },
  { label: '4\ufe0f\u20e3 FOUR',       type: 'FOUR',             color: '#3b82f6' },
  { label: '6\ufe0f\u20e3 SIX',        type: 'SIX',              color: '#22c55e' },
  { label: '\ud83c\udfaf WICKET',      type: 'WICKET',           color: '#ef4444' },
  { label: '\u2696\ufe0f 3rd Umpire',  type: 'DECISION_PENDING', color: '#f59e0b' },
  { label: 'Bat Card',                type: 'BATTING_SUMMARY',  color: '#60a5fa' },
  { label: 'Bowl Card',               type: 'BOWLING_SUMMARY',  color: '#818cf8' },
  { label: 'Both Cards',              type: 'BOTH_CARDS',       color: '#c084fc' },
  { label: 'Inns Break',              type: 'INNINGS_BREAK',    color: '#38bdf8' },
  { label: 'Match End',               type: 'MATCH_WIN',        color: '#fb923c' },
  { label: '\u21a9 Restore',           type: 'RESTORE',          color: '#6b7280' },
];

const MembershipPreview: React.FC<MembershipPreviewProps> = ({ overlayFile, planName, baseUrl }) => {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLvl2 = overlayFile.includes('lvl2');
  const triggerBtns = isLvl2 ? TRIGGERS_LVL2 : TRIGGERS_LVL1;
  const clamp = (v: number) => Math.max(0.1, Math.min(3, v));

  // Pixel-perfect scale using ResizeObserver — same as PreviewStudio
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setContainerSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) setContainerSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, []);

  const idealScale = containerSize.w > 0
    ? Math.min(containerSize.w / 1920, containerSize.h / 1080)
    : 0.15;
  const effectiveScale = idealScale * zoom;

  // Direct overlay HTML URL — NOT /studio wrapper
  const backendOrigin = baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  const overlayUrl = `${backendOrigin}/overlays/${overlayFile}?preview=true`;

  const pushScore = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'UPDATE_SCORE', data: MOCK_SCORE, raw: MOCK_SCORE }, '*');
    iframe.contentWindow.postMessage({ type: 'UPDATE_SPONSORS', sponsors: MOCK_SCORE.sponsors, duration: 6 }, '*');
  }, []);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(null);
    setTimeout(pushScore, 600);
  }, [pushScore]);

  const handleError = useCallback(() => {
    setError('Failed to load overlay preview. Check that the backend is reachable.');
    setLoading(false);
  }, []);

  const fireTrigger = useCallback((type: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    let data: any = {};
    switch (type) {
      case 'SHOW_TOSS':        data = { tossWinnerName: 'MUMBAI', tossDecision: 'BAT', team1Name: 'MUMBAI', team2Name: 'CHENNAI' }; break;
      case 'SHOW_SQUADS':      data = { team1Name: 'MUMBAI', team2Name: 'CHENNAI', team1Players: MOCK_SCORE.team1Players, team2Players: MOCK_SCORE.team2Players }; break;
      case 'FOUR':             data = { playerName: 'R. Sharma', runs: MOCK_SCORE.strikerRuns, balls: MOCK_SCORE.strikerBalls }; break;
      case 'SIX':              data = { playerName: 'R. Sharma', runs: MOCK_SCORE.strikerRuns, balls: MOCK_SCORE.strikerBalls }; break;
      case 'WICKET':           data = { playerName: 'R. Sharma', runs: MOCK_SCORE.strikerRuns, balls: MOCK_SCORE.strikerBalls }; break;
      case 'BATTING_SUMMARY':  data = { batsmen: MOCK_SCORE.battingSummary, teamName: 'MUMBAI', innings: 1 }; break;
      case 'BOWLING_SUMMARY':  data = { bowlers: MOCK_SCORE.bowlingSummary, teamName: 'CHENNAI', innings: 1 }; break;
      case 'BOTH_CARDS':       data = { batsmen: MOCK_SCORE.battingSummary, bowlers: MOCK_SCORE.bowlingSummary, innings: 1 }; break;
      case 'INNINGS_BREAK':    data = { chasingTeam: 'CHENNAI', target: 214, inn1Score: 213, inn1Wickets: 4 }; break;
      case 'MATCH_WIN':        data = { winnerName: 'MUMBAI', resultSummary: 'Mumbai won by 5 wickets' }; break;
      default:                 data = {}; break;
    }
    iframe.contentWindow.postMessage({ type: 'OVERLAY_TRIGGER', payload: { type, data, duration: 6 } }, '*');
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <Eye className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{planName} Preview</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-1 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <button onClick={() => setZoom(z => clamp(z * 0.8))} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="px-1.5 text-xs font-bold tabular-nums w-10 text-center" style={{ color: 'var(--accent)' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => clamp(z * 1.25))} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Reset"><RotateCcw className="w-3.5 h-3.5" /></button>
        </div>
        <button onClick={pushScore} className="p-1.5 rounded-lg border transition-all" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }} title="Push demo data">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => window.open(`/studio?level=${isLvl2 ? '2' : '1'}&template=/overlays/${overlayFile}`, '_blank')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all text-xs whitespace-nowrap"
        >
          <MonitorPlay className="w-3.5 h-3.5" /> Full Studio
        </button>
      </div>

      {/* Canvas — 1920×1080 iframe scaled to fit, same as PreviewStudio */}
      <div ref={containerRef} className="relative overflow-hidden" style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}>
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={overlayUrl}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '1920px', height: '1080px',
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, -50%) scale(${effectiveScale})`,
            transformOrigin: 'center center',
            border: 'none', pointerEvents: 'none',
          }}
          sandbox="allow-scripts allow-same-origin"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
              <p className="text-slate-400 text-sm font-medium">Loading overlay…</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-20">
            <div className="text-center p-6 max-w-xs">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-slate-300 text-sm mb-4">{error}</p>
              <button onClick={() => { setLoading(true); setError(null); setIframeKey(k => k + 1); }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all">
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trigger buttons */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <span className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Activity className="w-3.5 h-3.5 text-blue-500" /> Animation Triggers
        </span>
        <div className="flex flex-wrap gap-2 mt-2">
          {triggerBtns.map(btn => (
            <button key={btn.type} onClick={() => fireTrigger(btn.type)}
              className="px-2.5 py-1.5 rounded-lg font-bold text-[11px] border transition-all active:scale-95 whitespace-nowrap"
              style={{ background: `${btn.color}18`, borderColor: `${btn.color}40`, color: btn.color }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${btn.color}30`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${btn.color}18`; }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembershipPreview;
