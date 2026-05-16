import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tournamentAPI } from '../services/api';
import { Trophy, Plus, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';

export default function TournamentList() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentAPI.getMyTournaments()
      .then(res => setTournaments(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Background orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />

      {/* Header — wraps cleanly on mobile, no crooked button */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8 relative">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-green-400 to-emerald-600 flex-shrink-0" />
            <h1 className="text-3xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Trophy className="w-8 h-8 text-green-400" /> Tournaments
            </h1>
          </div>
          <p className="ml-5 text-sm" style={{ color: 'var(--text-muted)' }}>Manage your cricket tournaments</p>
        </div>

        {/* Create button: full-width on xs, auto on sm+ */}
        <Link
          to="/tournaments/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg w-full sm:w-auto"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #10b981)',
            color: '#000',
            boxShadow: '0 0 16px rgba(34,197,94,0.3)',
          }}>
          <Plus className="w-4 h-4" /> Create New
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-primary)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Tournaments Yet</h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Create your first tournament to start managing matches and teams.</p>
          <Link to="/tournaments/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#000' }}>
            <Plus className="w-4 h-4" /> Create Tournament
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Array.isArray(tournaments) ? tournaments : []).map(t => (
            <div key={t._id} onClick={() => navigate(`/tournaments/${t._id}`)}
              className="group cursor-pointer rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-green-400" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{
                    background: t.status === 'ongoing' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                    color: t.status === 'ongoing' ? '#4ade80' : '#94a3b8',
                    border: `1px solid ${t.status === 'ongoing' ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)'}`
                  }}>
                  {t.status}
                </span>
              </div>

              <h3 className="text-lg font-black mb-2 line-clamp-1 group-hover:text-green-400 transition-colors"
                style={{ color: 'var(--text-primary)' }}>
                {t.name}
              </h3>

              <div className="space-y-2 mb-4">
                <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-4 h-4 opacity-70" /> {t.location || 'Location TBA'}
                </p>
                <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Calendar className="w-4 h-4 opacity-70" /> {new Date(t.startDate).toLocaleDateString()}
                </p>
                <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Users className="w-4 h-4 opacity-70" /> {t.teams?.length || 0} Teams
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Manage Tournament
                </span>
                <ChevronRight className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
