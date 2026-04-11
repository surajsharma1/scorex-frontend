import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { Zap, ChevronLeft } from 'lucide-react';

export default function LiveMatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    matchAPI.getMatch(id)
      .then(res => {
        const data = res.data.data || res.data;
        setMatch({
          ...data,
          team1Name: data.team1Name || data.teamA?.name || data.team1?.name || 'Team 1',
          team2Name: data.team2Name || data.teamB?.name || data.team2?.name || 'Team 2',
          team1Score: data.team1Score ?? data.score1 ?? data.firstInnings?.totalRuns ?? 0,
          team1Wickets: data.team1Wickets ?? data.wickets1 ?? data.firstInnings?.totalWickets ?? 0,
          team2Score: data.team2Score ?? data.score2 ?? data.secondInnings?.totalRuns ?? 0,
          team2Wickets: data.team2Wickets ?? data.wickets2 ?? data.secondInnings?.totalWickets ?? 0,
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!match) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <p className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>Match not found.</p>
        <button
          onClick={() => navigate('/live')}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          Back to Live Matches
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 transition-colors p-2 rounded-lg"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        {/* Main card */}
        <div
          className="rounded-3xl p-8 text-center shadow-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* LIVE badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-6"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
            LIVE
          </div>

          <h1 className="text-3xl font-black mb-8" style={{ color: 'var(--text-primary)' }}>
            {match.name || `${match.team1Name} vs ${match.team2Name}`}
          </h1>

          {/* Scoreline */}
          <div className="flex justify-between items-center mb-10 gap-4">
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {match.team1Name}
              </h2>
              <p className="text-4xl font-black text-green-400">
                {match.team1Score}
                <span className="text-2xl" style={{ color: 'var(--text-secondary)' }}>/{match.team1Wickets}</span>
              </p>
              {match.team1Overs != null && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  ({Number(match.team1Overs).toFixed(1)} ov)
                </p>
              )}
            </div>

            <div className="px-4 text-xl font-bold" style={{ color: 'var(--text-muted)' }}>VS</div>

            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {match.team2Name}
              </h2>
              <p className="text-4xl font-black text-green-400">
                {match.team2Score}
                <span className="text-2xl" style={{ color: 'var(--text-secondary)' }}>/{match.team2Wickets}</span>
              </p>
              {match.team2Overs != null && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  ({Number(match.team2Overs).toFixed(1)} ov)
                </p>
              )}
            </div>
          </div>

          {/* Venue / format info */}
          {(match.venue || match.format) && (
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {[match.format, match.venue].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={() => navigate(`/live-scoring/${match._id}`)}
            className="px-8 py-4 rounded-2xl transition-all font-black flex items-center justify-center gap-2 mx-auto w-full md:w-auto text-lg shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #10b981)',
              color: '#000',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #4ade80, #34d399)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(34,197,94,0.35)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #22c55e, #10b981)';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
          >
            <Zap className="w-5 h-5" /> Open Live Scoring Engine
          </button>
        </div>
      </div>
    </div>
  );
}
