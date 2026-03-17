import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Save, Coins, RotateCcw, X, Target, ChevronDown } from 'lucide-react';
import { tournamentAPI, matchAPI } from '../services/api';
import { Tournament, Team, LiveScores, Batsman, Bowler } from './types';

type ExtraType = 'wide' | 'noBall' | 'bye' | 'legBye' | null;
type OutType = 'caught' | 'bowled' | 'lbw' | 'stumped' | 'runOut' | 'hitWicket' | 'handledBall' | 'timedOut' | null;

interface Player { id: string; name: string; role: string; }
interface ScoreboardUpdateProps { tournament: Tournament; matchId?: string; onUpdate: () => void; }

const outTypes: { type: OutType; label: string; short: string }[] = [
  { type: 'caught', label: 'Caught', short: 'CAUGHT' },
  { type: 'bowled', label: 'Bowled', short: 'BOWLED' },
  { type: 'lbw', label: 'LBW', short: 'LBW' },
  { type: 'stumped', label: 'Stumped', short: 'STUMPED' },
  { type: 'runOut', label: 'Run Out', short: 'RUN OUT' },
  { type: 'hitWicket', label: 'Hit Wicket', short: 'HIT WICKET' },
  { type: 'handledBall', label: 'Handled Ball', short: 'HANDLED' },
  { type: 'timedOut', label: 'Timed Out', short: 'TIMED OUT' },
];

const extraRunOptions = [0, 1, 2, 3, 4, 5, 6];
const extraRunLabels: Record<number, string> = { 0: 'Dot', 1: 'Single', 2: 'Double', 3: 'Triple', 4: 'Four', 5: 'Five', 6: 'Six' };
const formatOvers = (overs: number, balls: number) => `${overs}.${balls}`;
const getTeamName = (teams: Team[], index: number) => teams[index]?.name || `Team ${index + 1}`;

const createDefaultBatsmen = (): Batsman[] => [
  { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: true },
  { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: false },
];
const createDefaultBowler = (): Bowler => ({ name: 'Bowler', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 });

// ── Player Selector Dropdown ──────────────────────────────────────────────────
function PlayerSelector({ label, value, players, onChange }: {
  label: string; value: string; players: Player[]; onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
        <span className="truncate">{value || 'Select player'}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {players.length === 0 ? (
            <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>No players available</div>
          ) : players.map(p => (
            <button key={p.id} type="button"
              onClick={() => { onChange(p.name); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm transition-all hover:bg-green-500/10 flex items-center gap-2"
              style={{ color: value === p.name ? '#22c55e' : 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: value === p.name ? '#22c55e' : 'var(--text-muted)' }} />
              <span>{p.name}</span>
              <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{p.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScoreboardUpdate({ tournament, matchId, onUpdate }: ScoreboardUpdateProps) {
  const teams = Array.isArray(tournament.teams) ? tournament.teams : [];
  const channelRef = useRef<BroadcastChannel | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const [liveScores, setLiveScores] = useState<LiveScores>(() => {
    const existing = tournament.liveScores;
    const getTeamData = (teamKey: 'team1' | 'team2', index: number) => ({
      name: existing?.[teamKey]?.name || getTeamName(teams, index),
      score: existing?.[teamKey]?.score || 0,
      wickets: existing?.[teamKey]?.wickets || 0,
      overs: existing?.[teamKey]?.overs || 0,
      balls: existing?.[teamKey]?.balls || 0,
      batsmen: existing?.[teamKey]?.batsmen?.length ? existing[teamKey].batsmen : createDefaultBatsmen(),
      bowler: existing?.[teamKey]?.bowler || createDefaultBowler(),
    });
    return {
      team1: getTeamData('team1', 0),
      team2: getTeamData('team2', 1),
      battingTeam: existing?.battingTeam || 'team1',
      currentRunRate: existing?.currentRunRate || 0,
      requiredRunRate: existing?.requiredRunRate || 0,
      target: existing?.target || 0,
      lastFiveOvers: existing?.lastFiveOvers || '',
      innings: existing?.innings || 1,
      isChasing: existing?.isChasing || false,
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<ExtraType>(null);
  const [showOutOptionsInExtra, setShowOutOptionsInExtra] = useState(false);
  // For retire — which batsman slot is retiring (0=striker, 1=non-striker)
  const [retiringSlot, setRetiringSlot] = useState<0 | 1>(0);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('cricket_score_updates');
    return () => { if (channelRef.current) channelRef.current.close(); };
  }, []);

  useEffect(() => {
    if (!teams || teams.length === 0) return;
    const battingTeamIndex = liveScores.battingTeam === 'team1' ? 0 : 1;
    const battingTeamObj = teams[battingTeamIndex];
    let playersList: Player[] = [];
    if (battingTeamObj?.players) {
      const playersArray = Array.isArray(battingTeamObj.players) ? battingTeamObj.players : [];
      playersList = playersArray.map((p: any) => ({
        id: p._id || p.id || Math.random().toString(),
        name: p.name || 'Unknown Player',
        role: p.role || 'Player'
      }));
    }
    setAvailablePlayers(playersList);
  }, [liveScores.battingTeam, teams, tournament]);

  const saveScoresToBackend = useCallback(async (scores: LiveScores) => {
    if (!matchId || matchId === 'undefined' || matchId === 'null') return;
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      if (matchId) await matchAPI.updateMatch(matchId, scores);
      else await tournamentAPI.updateTournament(tournament._id, { liveScores: scores });
      setLastSaved(new Date());
      onUpdate();
    } catch (err) { console.error('Auto-save failed:', err); }
    finally { isSavingRef.current = false; }
  }, [tournament._id, matchId, onUpdate]);

  useEffect(() => {
    if (!tossWinner || loading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveScoresToBackend(liveScores), 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [liveScores, tossWinner, loading, saveScoresToBackend]);

  const currentTeam = liveScores[liveScores.battingTeam] || { name: 'Batting Team', score: 0, wickets: 0, overs: 0, balls: 0, batsmen: [], bowler: createDefaultBowler() };

  const createOverlayData = useMemo(() => {
    const isBattingTeam1 = liveScores.battingTeam === 'team1';
    const battingTeamData = liveScores[liveScores.battingTeam];
    const bowlingTeamData = isBattingTeam1 ? liveScores.team2 : liveScores.team1;
    const t1Name = teams[0]?.name || 'Team 1';
    const t2Name = teams[1]?.name || 'Team 2';
    return {
      tournament: { name: tournament.name || 'Tournament', id: tournament._id },
      team1: { name: t1Name, shortName: t1Name.substring(0, 3).toUpperCase(), score: isBattingTeam1 ? (battingTeamData?.score || 0) : (bowlingTeamData?.score || 0), wickets: isBattingTeam1 ? (battingTeamData?.wickets || 0) : (bowlingTeamData?.wickets || 0), overs: isBattingTeam1 ? `${battingTeamData?.overs || 0}.${battingTeamData?.balls || 0}` : `${bowlingTeamData?.overs || 0}.${bowlingTeamData?.balls || 0}`, color: '#004BA0', isBatting: isBattingTeam1 },
      team2: { name: t2Name, shortName: t2Name.substring(0, 3).toUpperCase(), score: !isBattingTeam1 ? (battingTeamData?.score || 0) : (bowlingTeamData?.score || 0), wickets: !isBattingTeam1 ? (battingTeamData?.wickets || 0) : (bowlingTeamData?.wickets || 0), overs: !isBattingTeam1 ? `${battingTeamData?.overs || 0}.${battingTeamData?.balls || 0}` : `${bowlingTeamData?.overs || 0}.${bowlingTeamData?.balls || 0}`, color: '#FCCA06', isBatting: !isBattingTeam1 },
      striker: { name: battingTeamData?.batsmen?.[0]?.name || 'Striker', runs: battingTeamData?.batsmen?.[0]?.runs || 0, balls: battingTeamData?.batsmen?.[0]?.balls || 0, fours: battingTeamData?.batsmen?.[0]?.fours || 0, sixes: battingTeamData?.batsmen?.[0]?.sixes || 0, status: '*' },
      nonStriker: { name: battingTeamData?.batsmen?.[1]?.name || 'Non-Striker', runs: battingTeamData?.batsmen?.[1]?.runs || 0, balls: battingTeamData?.batsmen?.[1]?.balls || 0, fours: battingTeamData?.batsmen?.[1]?.fours || 0, sixes: battingTeamData?.batsmen?.[1]?.sixes || 0, status: '' },
      bowler: { name: battingTeamData?.bowler?.name || 'Bowler', overs: battingTeamData?.bowler?.overs || 0, maidens: battingTeamData?.bowler?.maidens || 0, runs: battingTeamData?.bowler?.runs || 0, wickets: battingTeamData?.bowler?.wickets || 0 },
      stats: { currentRunRate: liveScores.currentRunRate || 0, requiredRunRate: liveScores.requiredRunRate || 0, target: liveScores.target || 0, last5Overs: liveScores.lastFiveOvers || '' },
      battingTeam: liveScores.battingTeam, innings: liveScores.innings || 1, status: liveScores.target ? 'Chasing' : 'Batting', result: ''
    };
  }, [liveScores, tournament, teams]);

  useEffect(() => {
    if (channelRef.current && tossWinner) channelRef.current.postMessage(createOverlayData);
  }, [createOverlayData, tossWinner]);

  const triggerWicketAnimation = (message: string) => {
    if (channelRef.current) channelRef.current.postMessage({ type: 'WICKET', message, ...createOverlayData });
  };

  const updateStats = (field: string, value: unknown) => setLiveScores((prev: LiveScores) => ({ ...prev, [field]: value }));

  const handleToss = (team: 'team1' | 'team2', choice: 'bat' | 'bowl') => {
    setTossWinner(team);
    setLiveScores(prev => ({ ...prev, battingTeam: choice === 'bat' ? team : (team === 'team1' ? 'team2' : 'team1') }));
  };

  const addRuns = (runs: number) => {
    setLiveScores((prev: LiveScores) => {
      const teamKey = prev.battingTeam;
      const team = prev[teamKey];
      const newScore = team.score + runs;
      const newBatsmen = [...team.batsmen];
      const strikerIdx = newBatsmen.findIndex(b => b.isStriker);
      if (strikerIdx !== -1) {
        newBatsmen[strikerIdx] = { ...newBatsmen[strikerIdx], runs: newBatsmen[strikerIdx].runs + runs, balls: newBatsmen[strikerIdx].balls + 1, fours: runs === 4 ? newBatsmen[strikerIdx].fours + 1 : newBatsmen[strikerIdx].fours, sixes: runs === 6 ? newBatsmen[strikerIdx].sixes + 1 : newBatsmen[strikerIdx].sixes };
      }
      let newBalls = team.balls + 1, newOvers = team.overs;
      if (newBalls === 6) { newOvers = team.overs + 1; newBalls = 0; }
      const newBowler = team.bowler ? { ...team.bowler, runs: team.bowler.runs + runs, overs: newOvers } : null;
      if (runs % 2 === 1) {
        const temp = newBatsmen[0]; newBatsmen[0] = newBatsmen[1]; newBatsmen[1] = temp;
        newBatsmen[0].isStriker = true; newBatsmen[1].isStriker = false;
      }
      const totalBalls = newOvers * 6 + newBalls;
      const rr = totalBalls > 0 ? newScore / (totalBalls / 6) : 0;
      return { ...prev, [teamKey]: { ...team, score: newScore, balls: newBalls, overs: newOvers, batsmen: newBatsmen, bowler: newBowler }, currentRunRate: parseFloat(rr.toFixed(2)) };
    });
    if (channelRef.current) channelRef.current.postMessage({ type: 'RUN', runs, team: liveScores.battingTeam });
  };

  // Handle retire — opens player selection modal for the retiring slot
  const openRetireModal = (slot: 0 | 1) => {
    setRetiringSlot(slot);
    setShowRetireModal(true);
  };

  const handleRetire = (newPlayerName: string) => {
    setLiveScores((prev: LiveScores) => {
      const teamKey = prev.battingTeam;
      const team = prev[teamKey];
      const newBatsmen = [...team.batsmen];
      newBatsmen[retiringSlot] = {
        name: newPlayerName,
        runs: 0, balls: 0, fours: 0, sixes: 0,
        isStriker: retiringSlot === 0,
      };
      return { ...prev, [teamKey]: { ...team, batsmen: newBatsmen } };
    });
    setShowRetireModal(false);
  };

  // Update batsman name via player selector
  const updateBatsmanName = (slot: 0 | 1, name: string) => {
    setLiveScores((prev: LiveScores) => {
      const teamKey = prev.battingTeam;
      const team = prev[teamKey];
      const newBatsmen = [...team.batsmen];
      if (newBatsmen[slot]) newBatsmen[slot] = { ...newBatsmen[slot], name };
      return { ...prev, [teamKey]: { ...team, batsmen: newBatsmen } };
    });
  };

  // Update bowler name
  const updateBowlerName = (name: string) => {
    setLiveScores((prev: LiveScores) => {
      const teamKey = prev.battingTeam;
      const team = prev[teamKey];
      return { ...prev, [teamKey]: { ...team, bowler: { ...(team.bowler || createDefaultBowler()), name } } };
    });
  };

  // Bowler players = bowling team players
  const bowlingTeamIndex = liveScores.battingTeam === 'team1' ? 1 : 0;
  const bowlingTeamPlayers: Player[] = (teams[bowlingTeamIndex]?.players || []).map((p: any) => ({
    id: p._id || p.id || Math.random().toString(),
    name: p.name || 'Unknown',
    role: p.role || 'Player',
  }));

  const btnStyle = (color: string) => ({
    background: `rgba(${color},0.15)`,
    border: `1px solid rgba(${color},0.35)`,
    color: `rgb(${color})`,
  });

  return (
    <div className="space-y-4 max-w-md mx-auto p-2">

      {/* Retire Modal — shows player selection */}
      {showRetireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>
                Select Incoming Batsman
              </h3>
              <button onClick={() => setShowRetireModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {currentTeam.batsmen?.[retiringSlot]?.name} is retiring. Who is coming in?
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availablePlayers.length === 0 ? (
                <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No players available in squad</p>
              ) : availablePlayers.map(p => (
                <button key={p.id} onClick={() => handleRetire(p.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-xs flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                    {p.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toss Section */}
      {!tossWinner && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Coins className="w-5 h-5 text-yellow-400" /> Toss
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleToss('team1', 'bat')} className="p-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
              {getTeamName(teams, 0)} Bat
            </button>
            <button onClick={() => handleToss('team2', 'bat')} className="p-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
              {getTeamName(teams, 1)} Bat
            </button>
            <button onClick={() => handleToss('team1', 'bowl')} className="p-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {getTeamName(teams, 0)} Bowl
            </button>
            <button onClick={() => handleToss('team2', 'bowl')} className="p-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {getTeamName(teams, 1)} Bowl
            </button>
          </div>
        </div>
      )}

      {/* Scoring Panel */}
      {tossWinner && (
        <>
          {/* Scoreboard */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              {currentTeam.name} batting
            </p>
            <p className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
              {currentTeam.score}/{currentTeam.wickets}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {formatOvers(currentTeam.overs, currentTeam.balls)} overs
              {liveScores.currentRunRate > 0 && ` · CRR ${liveScores.currentRunRate}`}
            </p>
            {liveScores.target > 0 && (
              <p className="text-sm mt-1 font-semibold text-green-400">
                Target: {liveScores.target} · Need {liveScores.target - currentTeam.score} off {((liveScores as any).totalOvers || 20) * 6 - currentTeam.overs * 6 - currentTeam.balls} balls
              </p>
            )}
          </div>

          {/* Player selectors */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Players</p>
            <PlayerSelector
              label={`Striker — ${currentTeam.batsmen?.[0]?.runs || 0} (${currentTeam.batsmen?.[0]?.balls || 0})`}
              value={currentTeam.batsmen?.[0]?.name || ''}
              players={availablePlayers}
              onChange={name => updateBatsmanName(0, name)} />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <PlayerSelector
                  label={`Non-Striker — ${currentTeam.batsmen?.[1]?.runs || 0} (${currentTeam.batsmen?.[1]?.balls || 0})`}
                  value={currentTeam.batsmen?.[1]?.name || ''}
                  players={availablePlayers}
                  onChange={name => updateBatsmanName(1, name)} />
              </div>
            </div>
            {/* Retire buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => openRetireModal(0)}
                className="py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                Retire Striker
              </button>
              <button onClick={() => openRetireModal(1)}
                className="py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                Retire Non-Striker
              </button>
            </div>
            <PlayerSelector
              label="Bowler"
              value={currentTeam.bowler?.name || ''}
              players={bowlingTeamPlayers}
              onChange={name => updateBowlerName(name)} />
          </div>

          {/* Run buttons */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Runs</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3, 4, 6].map(runs => (
                <button key={runs} onClick={() => addRuns(runs)}
                  className="py-3 rounded-xl font-black text-lg transition-all hover:scale-110 active:scale-95"
                  style={runs === 4
                    ? { background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e' }
                    : runs === 6
                    ? { background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)', color: '#eab308' }
                    : { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {runs}
                </button>
              ))}
              <button onClick={() => { setPendingExtraType('wide'); setShowExtraModal(true); }}
                className="py-3 rounded-xl font-bold text-sm transition-all hover:scale-110"
                style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', color: '#22d3ee' }}>
                WD
              </button>
              <button onClick={() => { setPendingExtraType('noBall'); setShowExtraModal(true); }}
                className="py-3 rounded-xl font-bold text-sm transition-all hover:scale-110"
                style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc' }}>
                NB
              </button>
            </div>
          </div>

          {/* Wicket button */}
          <button onClick={() => setShowOutModal(true)}
            className="w-full py-3 rounded-xl font-black text-lg transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
            🏏 WICKET
          </button>

          {/* Status */}
          {lastSaved && (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Saved {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </>
      )}

      {/* Out Modal */}
      {showOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-red-400">Wicket!</h3>
              <button onClick={() => setShowOutModal(false)} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {outTypes.map(o => (
                <button key={o.type}
                  onClick={() => {
                    // Apply wicket
                    setLiveScores((prev: LiveScores) => {
                      const teamKey = prev.battingTeam;
                      const team = prev[teamKey];
                      return { ...prev, [teamKey]: { ...team, wickets: team.wickets + 1 } };
                    });
                    triggerWicketAnimation(o.short);
                    setShowOutModal(false);
                    // Open retire modal (striker out, slot 0)
                    openRetireModal(0);
                  }}
                  className="py-2.5 px-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Extra Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>
                {pendingExtraType === 'wide' ? 'Wide' : 'No Ball'} — Extra Runs
              </h3>
              <button onClick={() => setShowExtraModal(false)} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {extraRunOptions.map(runs => (
                <button key={runs}
                  onClick={() => {
                    setLiveScores((prev: LiveScores) => {
                      const teamKey = prev.battingTeam;
                      const team = prev[teamKey];
                      return { ...prev, [teamKey]: { ...team, score: team.score + runs + 1 } };
                    });
                    setShowExtraModal(false);
                    setPendingExtraType(null);
                  }}
                  className="py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-110"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {extraRunLabels[runs]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
