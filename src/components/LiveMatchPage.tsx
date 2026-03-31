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
        // Handle backend response formats
        const data = res.data.data || res.data;
        // Map backend fields if needed (teamA -> team1Name, etc.)
        setMatch({
          ...data,
          team1Name: data.teamA?.name || data.team1?.name || 'Team 1',
          team2Name: data.teamB?.name || data.team2?.name || 'Team 2',
          team1Score: data.score1 || data.firstInnings?.totalRuns || 0,
          team1Wickets: data.wickets1 || data.firstInnings?.totalWickets || 0,
          team2Score: data.score2 || data.secondInnings?.totalRuns || 0,
          team2Wickets: data.wickets2 || data.secondInnings?.totalWickets || 0,
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-white">Loading match...</div>;
  if (!match) return <div className="p-8 text-center text-white">Match not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen text-white bg-gray-900">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800">
        <ChevronLeft className="w-5 h-5" /> Back
      </button>
      
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 text-center shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-sm font-bold mb-6">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
        </div>
        
        <h1 className="text-3xl font-black mb-8">{match.name || `${match.team1Name} vs ${match.team2Name}`}</h1>
        
        <div className="flex justify-between items-center mb-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{match.team1Name}</h2>
            <p className="text-4xl font-black text-green-400 mt-2">{match.team1Score}/{match.team1Wickets}</p>
          </div>
          <div className="px-4 text-xl font-bold text-gray-500">VS</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{match.team2Name}</h2>
            <p className="text-4xl font-black text-green-400 mt-2">{match.team2Score}/{match.team2Wickets}</p>
          </div>
        </div>

        {/* FIX 1: Routing fixed to open the actual Live Scoring Engine */}
        <button 
          onClick={() => navigate(`/live-scoring/${match._id}`)}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-black rounded-2xl transition-all shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 mx-auto w-full md:w-auto text-lg"
        >
          <Zap className="w-5 h-5" /> Open Live Scoring Engine
        </button>
      </div>
    </div>
  );
}

