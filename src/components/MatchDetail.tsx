import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { socket } from '../services/socket';
import { useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import {
  ArrowLeft, Zap, BarChart2, Users, MapPin, Shield, Activity
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface Props {
  matchId: string;
  onBack?: () => void;
  openScoreboard?: () => void;
}

const TABS = [
  { key: 'overview',    label: 'Overview',   icon: '📋' },
  { key: 'scoreboard',  label: 'Scoreboard', icon: '🏏' },
  { key: 'players',     label: 'Players',    icon: '👥' },
  { key: 'leaderboard', label: 'Leaders',    icon: '🏆' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function MatchDetail({ matchId, onBack, openScoreboard }: Props) {
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('overview');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isScorerAssigned, setIsScorerAssigned] = useState(false);
  const [assigningScorer, setAssigningScorer] = useState(false);
  const { addToast } = useToast();

  const tabBarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    matchAPI.getMatch(matchId)
      .then(r => setMatch(r.data.data))
      .catch(e => { console.error(e); setMatch(null); })
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)); } catch (e) { console.error('Failed to parse user'); }
    }
  }, []);

  useEffect(() => {
    if (match && currentUser) setIsScorerAssigned(match.scorerId === currentUser._id);
  }, [match, currentUser]);

  // Scroll to top of content when tab changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  if (loading) return (
    <div className="flex items-center justify-center py-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-12 h-12 border-4 border-t-transparent rounded-2xl animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!match) return (
    <div className="p-8 text-center text-lg" style={{ color: 'var(--text-muted)' }}>Match not found</div>
  );

  const innings1 = match.innings?.[0];
  const innings2 = match.innings?.[1];
  const team1 = match.team1;
  const team2 = match.team2;

  const allBatsmen: any[] = [];
  const allBowlers: any[] = [];
  [innings1, innings2].filter(Boolean).forEach((inn: any) => {
    inn.batsmen?.forEach((b: any) => allBatsmen.push({ ...b, team: inn.teamName }));
    inn.bowlers?.forEach((b: any) => allBowlers.push({ ...b, team: inn.teamName }));
  });
  allBatsmen.sort((a, b) => (b.runs ?? 0) - (a.runs ?? 0));

  const handleDeleteMatch = async () => {
    if (!confirm(`Delete "${match.name}" match? This action cannot be undone.`)) return;
    try {
      await matchAPI.deleteMatch(matchId);
      addToast({ type: 'success', title: 'Match Deleted', message: 'Match has been deleted successfully.' });
      if (onBack) onBack();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to delete match' });
    }
  };

  const isAuthorized = currentUser && (currentUser.role === 'admin' || currentUser._id === match.tournament?.createdBy?._id);

  const scrollTabs = (dir: 'left' | 'right') => {
    if (tabBarRef.current) tabBarRef.current.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100%' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-20">

        {/* Top bar: back + title + actions */}
        <div className="flex items-center gap-2 px-3 py-3 sm:px-5 sm:py-4">
          <button onClick={onBack}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-95"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-black truncate text-base sm:text-xl leading-tight"
              style={{ color: 'var(--text-primary)' }}>{match.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {match.venue && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <MapPin className="w-3 h-3" />{match.venue}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Shield className="w-3 h-3" />{match.format}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => navigate(`/matches/${matchId}/score`)}
              className="flex items-center gap-1.5 px-3 py-2 font-bold rounded-xl text-xs sm:text-sm transition-all active:scale-95 hover:brightness-110 shadow-lg"
              style={{ background: 'var(--accent)', color: '#000' }}>
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Live Scoring</span>
              <span className="xs:hidden">Score</span>
            </button>

            {isAuthorized && (
              <>
                {!isScorerAssigned ? (
                  <button
                    onClick={async () => {
                      setAssigningScorer(true);
                      try {
                        await matchAPI.updateMatch(matchId, { scorerId: currentUser!._id });
                        setIsScorerAssigned(true);
                        addToast({ type: 'success', title: 'Success', message: 'You are now assigned as scorer!' });
                      } catch (e: any) {
                        addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to assign scorer' });
                      } finally { setAssigningScorer(false); }
                    }}
                    disabled={assigningScorer}
                    title="Assign as Scorer"
                    className="flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: '#1d4ed8', color: '#fff', border: '1px solid #2563eb' }}>
                    {assigningScorer ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--accent)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <Shield className="w-3 h-3" />✓
                  </span>
                )}
                <button onClick={handleDeleteMatch} title="Delete Match"
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Score card */}
        <div className="mx-3 mb-3 sm:mx-5 sm:mb-4 rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-3 items-center">
            {/* Team 1 */}
            <div className="text-center px-3 py-4 sm:px-6">
              <p className="font-black text-xs sm:text-sm uppercase tracking-wide truncate mb-1"
                style={{ color: 'var(--text-secondary)' }}>{match.team1Name}</p>
              <p className="font-black text-2xl sm:text-4xl leading-none"
                style={{ color: 'var(--text-primary)' }}>{match.team1Score}<span className="text-lg sm:text-2xl" style={{ color: 'var(--text-muted)' }}>/{match.team1Wickets}</span></p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {Number(match.team1Overs ?? 0).toFixed(1)} ov
              </p>
            </div>

            {/* VS */}
            <div className="text-center flex flex-col items-center gap-1">
              <span className="font-black text-base sm:text-xl tracking-widest"
                style={{ color: 'var(--accent)' }}>VS</span>
              {match.status === 'live' && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                  LIVE
                </span>
              )}
            </div>

            {/* Team 2 */}
            <div className="text-center px-3 py-4 sm:px-6">
              <p className="font-black text-xs sm:text-sm uppercase tracking-wide truncate mb-1"
                style={{ color: 'var(--text-secondary)' }}>{match.team2Name}</p>
              <p className="font-black text-2xl sm:text-4xl leading-none"
                style={{ color: 'var(--text-primary)' }}>{match.team2Score}<span className="text-lg sm:text-2xl" style={{ color: 'var(--text-muted)' }}>/{match.team2Wickets}</span></p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {Number(match.team2Overs ?? 0).toFixed(1)} ov
              </p>
            </div>
          </div>

          {match.resultSummary && (
            <div className="px-4 py-2.5 text-center text-sm font-bold"
              style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--accent)', borderTop: '1px solid rgba(34,197,94,0.2)' }}>
              {match.resultSummary}
            </div>
          )}
        </div>

        {/* Tab bar with scroll arrows */}
        <div className="relative flex items-center px-1 pb-0">
          <button onClick={() => scrollTabs('left')}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all sm:hidden"
            style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div ref={tabBarRef}
            className="flex-1 flex items-center gap-1 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {TABS.map(t => {
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap"
                  style={active ? {
                    background: 'var(--bg-primary)',
                    color: 'var(--accent)',
                    borderTop: '2px solid var(--accent)',
                    borderLeft: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    marginBottom: '-1px',
                  } : {
                    color: 'var(--text-muted)',
                    borderBottom: '2px solid transparent',
                  }}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <button onClick={() => scrollTabs('right')}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all sm:hidden"
            style={{ color: 'var(--text-muted)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────── */}
      <div ref={contentRef} className="p-3 sm:p-5 space-y-4 sm:space-y-6 pb-12">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {match.tossWinnerName && (
              <InfoCard>
                <Label>Toss</Label>
                <p style={{ color: 'var(--text-primary)' }}>
                  <strong>{match.tossWinnerName}</strong> won the toss and chose to <strong>{match.tossDecision}</strong>
                </p>
              </InfoCard>
            )}

            {[innings1, innings2].filter(Boolean).map((inn: any, i: number) => (
              <div key={i} className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                {/* Innings header */}
                <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
                  style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      Innings {i + 1}
                    </p>
                    <p className="font-black text-base sm:text-xl" style={{ color: 'var(--text-primary)' }}>{inn.teamName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-2xl sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                      {inn.score}/{inn.wickets}
                    </p>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      RR: {inn.runRate?.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                </div>

                {inn.targetScore && (
                  <div className="px-4 py-2.5 text-sm font-bold"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
                    Target: {inn.targetScore} runs
                  </div>
                )}

                {/* Extras grid */}
                <div className="grid grid-cols-4 divide-x p-0"
                  style={{ borderTop: '1px solid var(--border)' }}>
                  {[
                    { label: 'Wides', val: inn.extras?.wides ?? 0 },
                    { label: 'No Balls', val: inn.extras?.noBalls ?? 0 },
                    { label: 'Byes', val: inn.extras?.byes ?? 0 },
                    { label: 'Leg Byes', val: inn.extras?.legByes ?? 0 },
                  ].map(e => (
                    <div key={e.label} className="text-center py-3 px-1"
                      style={{ borderRight: '1px solid var(--border)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{e.label}</p>
                      <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{e.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SCOREBOARD ── */}
        {tab === 'scoreboard' && (
          <div className="space-y-4 sm:space-y-6">
            {[innings1, innings2].filter(Boolean).map((inn: any, i: number) => (
              <div key={i} className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
                  style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Innings {i + 1}</p>
                    <p className="font-black text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>{inn.teamName}</p>
                  </div>
                  <p className="font-black text-xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
                    {inn.score}/{inn.wickets}
                    <span className="text-sm sm:text-base font-semibold ml-1" style={{ color: 'var(--text-muted)' }}>
                      ({inn.overs?.toFixed ? inn.overs.toFixed(1) : 0} ov)
                    </span>
                  </p>
                </div>

                {/* Batting table */}
                {inn?.batsmen?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={{ minWidth: '420px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                          <th className="text-left py-2.5 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Batsman</th>
                          {['R','B','4s','6s','SR'].map(h => (
                            <th key={h} className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wide w-10" style={{ color: 'var(--text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inn.batsmen.map((b: any, j: number) => (
                          <tr key={j} className="transition-colors"
                            style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td className="py-3 px-4">
                              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}
                                {b.isStriker && !b.isOut && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--accent)', color: '#000' }}>*</span>}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: b.isOut ? 'var(--text-muted)' : 'var(--accent)' }}>
                                {b.isOut ? `${String(b.outType ?? '').replace('_', ' ')} b ${b.outTo ?? ''}` : 'not out'}
                              </p>
                            </td>
                            <td className="py-3 px-2 text-center font-black text-lg" style={{ color: 'var(--text-primary)' }}>{b.runs ?? 0}</td>
                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.balls ?? 0}</td>
                            <td className="py-3 px-2 text-center font-bold" style={{ color: 'var(--accent)' }}>{b.fours ?? 0}</td>
                            <td className="py-3 px-2 text-center font-bold" style={{ color: '#a855f7' }}>{b.sixes ?? 0}</td>
                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.strikeRate?.toFixed(1) ?? '0.0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Extras row */}
                {inn.extras && (
                  <div className="px-4 py-2.5 text-xs sm:text-sm"
                    style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Extras: {inn.extras?.total || 0} </span>
                    (W: {inn.extras?.wides || 0}, NB: {inn.extras?.noBalls || 0}, B: {inn.extras?.byes || 0}, LB: {inn.extras?.legByes || 0})
                  </div>
                )}

                {/* Bowling table */}
                {inn.bowlers?.length > 0 && (
                  <div className="overflow-x-auto" style={{ borderTop: '2px solid var(--border)' }}>
                    <table className="w-full text-sm" style={{ minWidth: '340px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                          <th className="text-left py-2.5 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Bowler</th>
                          {['O','M','R','W','Eco'].map(h => (
                            <th key={h} className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wide w-10" style={{ color: 'var(--text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inn.bowlers.map((b: any, j: number) => (
                          <tr key={j} className="transition-colors"
                            style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</td>
                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{Math.floor(b.overs ?? 0)}.{(b.balls ?? 0) % 6}</td>
                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.maidens ?? 0}</td>
                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.runs ?? 0}</td>
                            <td className="py-3 px-2 text-center font-black text-lg" style={{ color: '#f87171' }}>{b.wickets ?? 0}</td>
                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.economy?.toFixed(2) ?? '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Fall of wickets */}
                {inn.fallOfWickets?.length > 0 && (
                  <div className="px-4 py-3 sm:px-6 text-xs"
                    style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    <span className="font-bold uppercase tracking-wide mr-2" style={{ color: 'var(--text-muted)' }}>FoW:</span>
                    {inn.fallOfWickets.map((f: any) => `${f.score}/${f.wicket} (${f.batsman}, ${f.overs})`).join(' • ')}
                  </div>
                )}
              </div>
            ))}

          </div>
        )}

        {/* ── PLAYERS ── */}
        {tab === 'players' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: match.team1Name || 'Team 1', players: team1?.players || [] },
              { name: match.team2Name || 'Team 2', players: team2?.players || [] },
            ].map((side, i) => (
              <div key={i} className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {/* Team header */}
                <div className="px-4 py-3 sm:px-6 sm:py-4"
                  style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <h3 className="font-black text-base sm:text-xl" style={{ color: 'var(--text-primary)' }}>{side.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{side.players.length} Players</p>
                </div>

                {side.players.length === 0 ? (
                  <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No players added yet</div>
                ) : (
                  <div>
                    {side.players.map((p: any, j: number) => {
                      const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
                        batsman:     { label: 'BAT',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
                        bowler:      { label: 'BOWL', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                        allrounder:  { label: 'ALL',  color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
                        'all-rounder': { label: 'ALL', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
                        wicketkeeper:{ label: 'WK',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                        wk:          { label: 'WK',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                      };
                      const roleLower = (p.role || '').toLowerCase();
                      const rm = roleMeta[roleLower] || { label: (p.role || 'PLAYER').toUpperCase().slice(0, 4), color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
                      const jersey = p.jerseyNumber ?? p.jersey ?? (j + 1);
                      return (
                        <div key={j} className="flex items-center gap-3 px-4 py-3 sm:px-6 transition-colors"
                          style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {/* Jersey number */}
                          <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-sm font-black"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                            #{jersey}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                          </div>
                          {/* Role badge */}
                          <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wide"
                            style={{ background: rm.bg, color: rm.color, border: `1px solid ${rm.color}30` }}>
                            {rm.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {tab === 'leaderboard' && (
          <div className="space-y-4 sm:space-y-6">

            {/* Batting */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4"
                style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                <BarChart2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <span className="font-black text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>Batting Leaderboard</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: '360px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left py-2.5 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Player</th>
                      {['R','B','4s','6s','SR'].map(h => (
                        <th key={h} className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wide w-10" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allBatsmen.slice(0, 10).map((b, i) => (
                      <tr key={i} className="transition-colors"
                        style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg text-xs font-black"
                              style={{ background: 'var(--bg-elevated)', color: i === 0 ? '#fbbf24' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.team}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-black text-lg" style={{ color: 'var(--text-primary)' }}>{b.runs ?? 0}</td>
                        <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.balls ?? 0}</td>
                        <td className="py-3 px-2 text-center font-bold" style={{ color: 'var(--accent)' }}>{b.fours ?? 0}</td>
                        <td className="py-3 px-2 text-center font-bold" style={{ color: '#a855f7' }}>{b.sixes ?? 0}</td>
                        <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.strikeRate?.toFixed(1) ?? '0.0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowling */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4"
                style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="font-black text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>Bowling Leaderboard</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: '320px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left py-2.5 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Player</th>
                      {['O','R','W','Eco'].map(h => (
                        <th key={h} className="text-center py-2.5 px-2 font-semibold text-xs uppercase tracking-wide w-10" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allBowlers.sort((a, b) => (b.wickets ?? 0) - (a.wickets ?? 0)).slice(0, 10).map((b, i) => (
                      <tr key={i} className="transition-colors"
                        style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg text-xs font-black"
                              style={{ background: 'var(--bg-elevated)', color: i === 0 ? '#fbbf24' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.team}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{Math.floor(b.overs ?? 0)}.{(b.balls ?? 0) % 6}</td>
                        <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.runs ?? 0}</td>
                        <td className="py-3 px-2 text-center font-black text-lg" style={{ color: '#f87171' }}>{b.wickets ?? 0}</td>
                        <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{b.economy?.toFixed(2) ?? '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small helper components ── */
function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-2"
      style={{ color: 'var(--text-muted)' }}>{children}</p>
  );
}