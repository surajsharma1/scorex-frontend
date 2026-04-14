import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { useAuth } from '../App';
import {
  Trophy, Activity, Users, Zap, Plus, ChevronRight,
  BarChart3, Radio, Target, TrendingUp, Clock
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ tournaments: 0, matches: 0, teams: 0, live: 0 });
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tournamentsRes, matchesRes, liveRes] = await Promise.all([
          tournamentAPI.getMyTournaments().catch(() => ({ data: { data: [] } })),
          matchAPI.getMatches({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          matchAPI.getLiveMatches().catch(() => ({ data: { data: [] } })),
        ]);

        const tournaments = tournamentsRes.data.data || [];
        const matches = matchesRes.data.data || [];
        const live = liveRes.data.data || [];

        let teamsCount = 0;
        for (const t of tournaments.slice(0, 3)) {
          if (!t?._id) continue;
          try {
            const teamRes = await teamAPI.getTeams(t._id);
            teamsCount += (teamRes.data?.data || []).length;
          } catch (_) {}
        }

        setStats({ tournaments: tournaments.length, matches: matches.length, teams: teamsCount, live: live.length });
        setLiveMatches(live.slice(0, 3));
        setRecentMatches(matches.filter((m: any) => m.status !== 'live').slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { label: 'Tournaments',   value: stats.tournaments, icon: Trophy,   from: '#f59e0b', to: '#d97706', action: () => navigate('/tournaments') },
    { label: 'Total Matches', value: stats.matches,     icon: Activity, from: '#06b6d4', to: '#0284c7', action: () => navigate('/tournaments') },
    { label: 'Teams',         value: stats.teams,       icon: Users,    from: '#a855f7', to: '#7c3aed', action: () => navigate('/tournaments') },
    { label: 'Live Now',      value: stats.live,        icon: Zap,      from: '#22c55e', to: '#16a34a', action: () => navigate('/live') },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-5xl relative" style={{ background: 'var(--bg-primary)' }}>

      {/* Ambient blobs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none -z-0"
        style={{ background: 'radial-gradient(circle at 80% 20%, rgba(34,197,94,0.06) 0%, transparent 60%)' }} />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] pointer-events-none -z-0"
        style={{ background: 'radial-gradient(circle at 20% 80%, rgba(6,182,212,0.04) 0%, transparent 60%)' }} />

      {/* ── Header ── */}
      <div className="relative mb-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{greeting} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg,var(--accent),#00cc6a)' }}>
                {user?.username}
              </span>
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Your cricket command centre</p>
          </div>
          {stats.live > 0 && (
            <button onClick={() => navigate('/live')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 mt-1 transition-all hover:border-green-400/40"
              style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{stats.live} Live</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map(card => (
          <button key={card.label} onClick={card.action}
            className="group relative rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 hover:-translate-y-1 overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8 opacity-20"
              style={{ background: `radial-gradient(circle, ${card.from}, transparent)` }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-lg relative"
              style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})` }}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {loading ? '–' : card.value}
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
          </button>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <QuickAction icon={<Plus className="w-4 h-4" />}      gradient="linear-gradient(135deg,#22c55e,#16a34a)"  title="New Tournament"     desc="Create a new competition"       onClick={() => navigate('/tournaments')} />
          <QuickAction icon={<Radio className="w-4 h-4" />}     gradient="linear-gradient(135deg,#ef4444,#dc2626)"  title="Live Scoring"       desc="Score a match in real-time"     onClick={() => navigate('/live')} />
          <QuickAction icon={<BarChart3 className="w-4 h-4" />} gradient="linear-gradient(135deg,#a855f7,#7c3aed)"  title="Leaderboard"        desc="Tournament standings & stats"   onClick={() => navigate('/leaderboard')} />
          <QuickAction icon={<Target className="w-4 h-4" />}    gradient="linear-gradient(135deg,#f59e0b,#d97706)"  title="My Tournaments"     desc="Manage your competitions"       onClick={() => navigate('/tournaments')} />
          <QuickAction icon={<TrendingUp className="w-4 h-4" />} gradient="linear-gradient(135deg,#06b6d4,#0284c7)" title="Match History"      desc="Review past match results"      onClick={() => navigate('/live')} />
        </div>
      </div>

      {/* ── Live Matches ── */}
      {liveMatches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Matches
            </h2>
            <button onClick={() => navigate('/live')} className="text-xs font-semibold flex items-center gap-1 hover:text-green-400 transition-colors" style={{ color: 'var(--text-muted)' }}>
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveMatches.map(m => <LiveMatchCard key={m._id} match={m} onView={() => navigate(`/live/${m._id}`)} />)}
          </div>
        </div>
      )}

      {/* ── Recent Matches ── */}
      {liveMatches.length === 0 && recentMatches.length > 0 && (
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3 h-3" /> Recent Matches
          </h2>
          <div className="space-y-2">
            {recentMatches.map(m => (
              <button key={m._id} onClick={() => navigate(`/live/${m._id}`)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all group hover:border-green-500/20"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{m.name || `${m.team1Name} vs ${m.team2Name}`}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.format} · {m.status}</p>
                </div>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && stats.tournaments === 0 && (
        <div className="mt-4 py-12 text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--accent)' }} />
          <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No tournaments yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create your first tournament to get started</p>
          <button onClick={() => navigate('/tournaments')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            <Plus className="w-4 h-4" /> Create Tournament
          </button>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, gradient, title, desc, onClick }: {
  icon: React.ReactNode; gradient: string; title: string; desc: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="group flex items-center gap-3 p-3.5 rounded-xl text-left transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-110 transition-transform"
        style={{ background: gradient }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}

function LiveMatchCard({ match: m, onView }: { match: any; onView: () => void }) {
  const inn = m.innings?.[(m.currentInnings || 1) - 1];
  const score = inn ? `${inn.score || 0}/${inn.wickets || 0}` : null;
  const overs = inn?.balls != null ? `${Math.floor(inn.balls / 6)}.${inn.balls % 6} ov` : null;
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(239,68,68,0.06)' }}>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Live</span>
        {m.format && <span className="text-[10px] ml-auto font-medium" style={{ color: 'var(--text-muted)' }}>{m.format}</span>}
      </div>
      <p className="font-bold text-sm mb-2 line-clamp-1" style={{ color: 'var(--text-primary)' }}>
        {m.name || `${m.team1Name} vs ${m.team2Name}`}
      </p>
      {score && (
        <div className="mb-3">
          <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--accent)' }}>{score}</span>
          {overs && <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>({overs})</span>}
        </div>
      )}
      <button onClick={onView}
        className="w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
        style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--accent)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <Zap className="w-3 h-3" /> Score Live
      </button>
    </div>
  );
}