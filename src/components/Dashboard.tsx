import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI, matchAPI, teamAPI } from '../services/api';
import { useAuth } from '../App';
import { Trophy, Activity, Users, Zap, Plus, ChevronRight, BarChart3, Globe } from 'lucide-react';
import StatusBadge from './StatusBadge';



export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ tournaments: 0, matches: 0, teams: 0, live: 0 });
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, mRes, lRes] = await Promise.all([
          tournamentAPI.getMyTournaments(),
          matchAPI.getMatches({ limit: 5 }),
          matchAPI.getLiveMatches()
        ]);
        const tournaments = tRes.data.data || [];
        const matches = mRes.data.data || [];
        const live = lRes.data.data || [];
        const topTournaments = tournaments.slice(0, 3);
        const teamPromises = topTournaments.map(t => 
          teamAPI.getTeams(t._id).catch(() => ({ data: { data: [] } }))
        );
        const teamResponses = await Promise.all(teamPromises);
        let teamsCount = 0;
        teamResponses.forEach(tRes2 => {
          teamsCount += (tRes2.data?.data || []).length;
        });
        setStats({ tournaments: tournaments.length, matches: matches.length, teams: teamsCount, live: live.length });
        setLiveMatches(live.slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const statCards = [
    { label: 'My Tournaments', value: stats.tournaments, icon: Trophy,   gradient: 'from-amber-500 to-orange-500',  glow: 'rgba(245,158,11,0.2)',  action: () => navigate('/tournaments') },
    { label: 'Total Matches',  value: stats.matches,     icon: Activity, gradient: 'from-cyan-500 to-blue-500',     glow: 'rgba(6,182,212,0.2)',   action: () => navigate('/tournaments') },
    { label: 'Teams',          value: stats.teams,       icon: Users,    gradient: 'from-purple-500 to-violet-500', glow: 'rgba(168,85,247,0.2)',  action: () => navigate('/tournaments') },
    { label: 'Live Now',       value: stats.live,        icon: Zap,      gradient: 'from-green-500 to-emerald-500', glow: 'rgba(34,197,94,0.2)',   action: () => navigate('/live') },
  ];

  return (
    <div className="p-6 max-w-5xl relative overflow-hidden min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)' }} />

      <div className="mb-8 relative">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
          <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{user?.username}</span> 👋
          </h1>
        </div>
        <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>Here's what's happening with your tournaments</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <button key={card.label} onClick={card.action}
className="rounded-2xl p-5 text-left transition-all duration-200 gpu-accelerate group hover:-translate-y-1 hover:scale-102" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: `0 4px 24px ${card.glow}` }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{loading ? '–' : card.value}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <QuickAction icon={<Plus className="w-5 h-5 text-white" />} iconBg="bg-gradient-to-br from-green-500 to-emerald-600"
          title="New Tournament" desc="Create and organize a tournament"
          accent="rgba(34,197,94,0.08)" accentBorder="rgba(34,197,94,0.2)" onClick={() => navigate('/tournaments')} />
        <QuickAction icon={<Zap className="w-5 h-5 text-white" />} iconBg="bg-gradient-to-br from-red-500 to-rose-600"
          title="Live Matches" desc="View all ongoing matches"
          accent="rgba(239,68,68,0.08)" accentBorder="rgba(239,68,68,0.2)" onClick={() => navigate('/live')} />
        <QuickAction icon={<BarChart3 className="w-5 h-5 text-white" />} iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
          title="Leaderboard" desc="Check tournament standings"
          accent="rgba(168,85,247,0.08)" accentBorder="rgba(168,85,247,0.2)" onClick={() => navigate('/leaderboard')} />
        <QuickAction icon={<Globe className="w-5 h-5 text-white" />} iconBg="bg-gradient-to-br from-blue-500 to-cyan-600"
          title="Browse Clubs" desc="Join clubs and meet players"
          accent="rgba(6,182,212,0.08)" accentBorder="rgba(6,182,212,0.2)" onClick={() => navigate('/clubs')} />
      </div>

      {liveMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Matches
            </h2>
            <button onClick={() => navigate('/live')} className="text-xs font-semibold flex items-center gap-1 hover:text-green-400 transition-colors" style={{ color: 'var(--text-muted)' }}>
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
            {liveMatches.map(m => (
              <div key={m._id} className="flex-none w-72 min-w-[280px] rounded-2xl p-4 transition-all hover:-translate-y-1 snap-center shadow-lg hover:shadow-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(239,68,68,0.15)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    Live
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="font-bold line-clamp-2" style={{ color: 'var(--text-primary)' }}>{m.name || `${m.team1Name} vs ${m.team2Name}`}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {m.team1Name} <span className="font-bold text-green-400">{m.team1Score}/{m.team1Wickets}</span>
                    </span>
                    <span className="text-xs font-bold mx-2">VS</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="font-bold text-green-400">{m.team2Score}/{m.team2Wickets}</span> {m.team2Name}
                    </span>
                  </div>
                </div>
                <button onClick={() => navigate(`/matches/${m._id}/score`)}
className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600/90 to-orange-600/90 hover:from-red-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-red-500/30 transition-all duration-150 gpu-accelerate active:scale-98">
                  <Zap className="w-4 h-4" /> Live Score
                </button>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, iconBg, title, desc, accent, accentBorder, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-4 rounded-2xl transition-all text-left hover:-translate-y-0.5 group"
      style={{ background: accent, border: `1px solid ${accentBorder}` }}>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>{icon}</div>
      <div>
        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}
