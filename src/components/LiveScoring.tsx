import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { matchAPI } from '../services/api';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchMatch = async () => {
      try {
        const res = await matchAPI.getMatch(id);
        setMatch(res.data.data || res.data);
      } catch (error) {
        console.error('Failed to fetch match:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();

    socket.emit('joinMatch', id);
    socket.on('scoreUpdate', (data) => {
      setMatch(data);
    });

    return () => {
      socket.emit('leaveMatch', id);
      socket.off('scoreUpdate');
    };
  }, [id]);

  if (loading) return <div>Loading match...</div>;
  if (!match) return <div>Match not found</div>;

  const currentInnings = match.innings[match.currentInnings - 1] || {};
  const score = currentInnings.score || 0;
  const wickets = currentInnings.wickets || 0;
  const overs = currentInnings.overs?.toFixed(1) || '0.0';

  const addBall = async (runs: number) => {
    try {
      await matchAPI.addBall(id!, { runs });
    } catch (error) {
      console.error('Failed to add ball:', error);
    }
  };

  const addWicket = async () => {
    try {
      await matchAPI.addBall(id!, { wicket: true });
    } catch (error) {
      console.error('Failed to add wicket:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Live Scoring
          </h1>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20">
            <h2 className="text-3xl font-bold mb-2">{match.team1Name} vs {match.team2Name}</h2>
            <p className="text-xl text-slate-300">{match.venue} | {match.format}</p>
          </div>
        </div>

        {/* Score Display */}
        <div className="bg-white/5 backdrop-blur-xl p-12 rounded-3xl border border-white/10 shadow-2xl mb-12">
          <div className="text-center">
            <div className="text-6xl font-black mb-4">{score}/{wickets}</div>
            <div className="text-3xl text-slate-300 mb-8">{overs} overs</div>
            <div className="text-2xl font-bold text-emerald-400">
              RR: {currentInnings.runRate?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-12">
          {[0, 1, 2, 3, 4, 6].map((runs) => (
            <button
              key={runs}
              onClick={() => addBall(runs)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-8 px-6 rounded-2xl text-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              {runs === 0 ? '•' : runs}
            </button>
          ))}
          <button
            onClick={addWicket}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-8 px-6 rounded-2xl text-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 col-span-2 md:col-span-1"
          >
            WKT
          </button>
          <button
            onClick={() => addBall(1)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-8 px-6 rounded-2xl text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 col-span-1 md:col-span-1"
          >
            WIDE
          </button>
        </div>

        {/* Recent Balls */}
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
          <h3 className="text-2xl font-bold mb-6">Recent Balls</h3>
          <div className="space-y-2">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center font-mono text-xl">
                  1.2
                </div>
                <div className="flex-1">
                  <span className="font-mono text-lg">Sachin 12(8)</span>
                </div>
                <div className="text-2xl font-bold">4</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

