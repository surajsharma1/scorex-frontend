import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import {
  ArrowLeft, Zap, BarChart2, Users, Trophy, MapPin, Calendar,
  Shield, Activity, Target
} from 'lucide-react';

interface Props {
  matchId: string;
  onBack: () => void;
  openScoreboard: () => void;
}

export default function MatchDetail({ matchId, onBack, openScoreboard }: Props) {
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'scoreboard' | 'players' | 'leaderboard'>('overview');

  useEffect(() => {
    matchAPI.getMatch(matchId)
      .then(r => setMatch(r.data.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!match) return (
    <div className="p-8 text-slate-500 text-center">Match not found</div>
  );

  const innings1 = match.innings?.[0];
  const innings2 = match.innings?.[1];
  const team1 = match.team1;
  const team2 = match.team2;

  // All players for leaderboard
  const allBatsmen: any[] = [];
  const allBowlers: any[] = [];
  [innings1, innings2].filter(Boolean).forEach((inn: any) => {
    inn.batsmen?.forEach((b: any) => {
      allBatsmen.push({ ...b, team: inn.teamName });
    });
    inn.bowlers?.forEach((b: any) => {
      allBowlers.push({ ...b, team: inn.teamName });
    });
  });
  allBatsmen.sort((a, b) => b.runs - a.runs);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg">{match.name}</h1>
            <div className="flex items-center gap-3 text-slate-500 text-xs mt-0.5">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.venue}</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{match.format}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                match.status === 'live' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                match.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>{match.status === 'live' ? '● LIVE' : match.status}</span>
            </div>
          </div>
          <button onClick={() => navigate(`/matches/${matchId}/score`)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all">
            <Zap className="w-4 h-4" /> Live Score
          </button>
        </div>

        {/* Score summary */}
        <div className="flex items-center gap-6 bg-slate-800/50 rounded-2xl p-4 mb-4">
          <div className="flex-1 text-center">
            <p className="text-slate-400 text-xs mb-1">{match.team1Name}</p>
            <p className="text-white font-black text-3xl">{match.team1Score}/{match.team1Wickets}</p>
            <p className="text-slate-500 text-xs">({(match.team1Overs || 0).toFixed ? (match.team1Overs || 0).toFixed(1) : 0} ov)</p>
          </div>
          <div className="text-slate-600 font-bold">vs</div>
          <div className="flex-1 text-center">
            <p className="text-slate-400 text-xs mb-1">{match.team2Name}</p>
            <p className="text-white font-black text-3xl">{match.team2Score}/{match.team2Wickets}</p>
            <p className="text-slate-500 text-xs">({(match.team2Overs || 0).toFixed ? (match.team2Overs || 0).toFixed(1) : 0} ov)</p>
          </div>
        </div>
        {match.resultSummary && (
          <p className="text-center text-green-400 text-sm font-semibold">{match.resultSummary}</p>
        )}

        {/* Tabs */}
        <div className="flex gap-1 -mb-4 pt-2">
          {(['overview', 'scoreboard', 'players', 'leaderboard'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {match.tossWinnerName && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <p className="text-slate-500 text-xs font-semibold mb-1">TOSS</p>
                <p className="text-white">{match.tossWinnerName} won · chose to {match.tossDecision}</p>
              </div>
            )}
            {[innings1, innings2].filter(Boolean).map((inn: any, i: number) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-500 text-xs font-semibold">{i + 1}ST INNINGS</p>
                    <p className="text-white font-bold">{inn.teamName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-2xl">{inn.score}/{inn.wickets}</p>
                    <p className="text-slate-400 text-xs">RR: {inn.runRate?.toFixed(2)}</p>
                  </div>
                </div>
                {inn.targetScore && (
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-2 mb-3">
                    <p className="text-blue-400 text-sm font-semibold">Target: {inn.targetScore} runs</p>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 text-xs text-center">
                  <div className="bg-slate-800 rounded-lg p-2"><div className="text-slate-500">Wides</div><div className="text-white font-bold">{inn.extras?.wides || 0}</div></div>
                  <div className="bg-slate-800 rounded-lg p-2"><div className="text-slate-500">No Balls</div><div className="text-white font-bold">{inn.extras?.noBalls || 0}</div></div>
                  <div className="bg-slate-800 rounded-lg p-2"><div className="text-slate-500">Byes</div><div className="text-white font-bold">{inn.extras?.byes || 0}</div></div>
                  <div className="bg-slate-800 rounded-lg p-2"><div className="text-slate-500">Leg Byes</div><div className="text-white font-bold">{inn.extras?.legByes || 0}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCOREBOARD */}
        {tab === 'scoreboard' && (
          <div className="space-y-6">
            {[innings1, innings2].filter(Boolean).map((inn: any, i: number) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{inn.teamName}</p>
                    <p className="text-slate-500 text-xs">Innings {i + 1}</p>
                  </div>
                  <p className="text-white font-black text-xl">{inn.score}/{inn.wickets} ({inn.overs?.toFixed ? inn.overs.toFixed(1) : 0})</p>
                </div>

                {/* Batting */}
                {inn.batsmen?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="text-left py-2 px-4">Batsman</th>
                          <th className="text-center py-2 px-2">R</th>
                          <th className="text-center py-2 px-2">B</th>
                          <th className="text-center py-2 px-2">4s</th>
                          <th className="text-center py-2 px-2">6s</th>
                          <th className="text-center py-2 px-2">SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inn.batsmen.map((b: any, j: number) => (
                          <tr key={j} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="text-white font-semibold">{b.name}</span>
                                  {b.isStriker && !b.isOut && <span className="ml-1 text-blue-400 text-xs">*</span>}
                                  {!b.isOut && !b.isStriker && <span className="ml-1 text-slate-600 text-xs">†</span>}
                                  {b.isOut && <div className="text-slate-600 text-xs">{b.outType?.replace('_', ' ')} b {b.outTo}</div>}
                                  {!b.isOut && <div className="text-green-500 text-xs">not out</div>}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center text-white font-bold">{b.runs}</td>
                            <td className="py-2.5 px-2 text-center text-slate-400">{b.balls}</td>
                            <td className="py-2.5 px-2 text-center text-blue-400">{b.fours}</td>
                            <td className="py-2.5 px-2 text-center text-purple-400">{b.sixes}</td>
                            <td className="py-2.5 px-2 text-center text-slate-400">{b.strikeRate?.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Extras */}
                <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
                  Extras: {inn.extras?.total || 0} (W:{inn.extras?.wides || 0}, NB:{inn.extras?.noBalls || 0}, B:{inn.extras?.byes || 0}, LB:{inn.extras?.legByes || 0})
                </div>

                {/* Bowling */}
                {inn.bowlers?.length > 0 && (
                  <div className="border-t border-slate-700 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="text-left py-2 px-4">Bowler</th>
                          <th className="text-center py-2 px-2">O</th>
                          <th className="text-center py-2 px-2">M</th>
                          <th className="text-center py-2 px-2">R</th>
                          <th className="text-center py-2 px-2">W</th>
                          <th className="text-center py-2 px-2">Eco</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inn.bowlers.map((b: any, j: number) => (
                          <tr key={j} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 text-white font-semibold">{b.name}</td>
                            <td className="py-2.5 px-2 text-center text-slate-400">{b.overs || 0}.{b.balls ? b.balls % 6 : 0}</td>
                            <td className="py-2.5 px-2 text-center text-slate-400">{b.maidens}</td>
                            <td className="py-2.5 px-2 text-center text-slate-400">{b.runs}</td>
                            <td className="py-2.5 px-2 text-center text-red-400 font-bold">{b.wickets}</td>
                            <td className="py-2.5 px-2 text-center text-slate-400">{b.economy?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Fall of wickets */}
                {inn.fallOfWickets?.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-800">
                    <p className="text-slate-500 text-xs font-semibold mb-1">Fall of Wickets</p>
                    <p className="text-slate-400 text-xs">
                      {inn.fallOfWickets.map((f: any) => `${f.score}/${f.wicket} (${f.batsman}, ${f.overs})`).join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PLAYERS - side by side */}
        {tab === 'players' && (
          <div className="grid grid-cols-2 gap-6">
            {[
              { team: team1, name: match.team1Name, players: team1?.players || [] },
              { team: team2, name: match.team2Name, players: team2?.players || [] }
            ].map((side, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 px-4 py-3 border-b border-slate-700">
                  <p className="text-white font-black">{side.name}</p>
                  <p className="text-slate-500 text-xs">{side.players.length} players</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {side.players.length === 0 ? (
                    <p className="text-slate-600 text-sm p-4 text-center">No players added</p>
                  ) : (
                    side.players.map((p: any, j: number) => (
                      <div key={j} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                          {j + 1}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{p.name}</p>
                          <p className="text-slate-500 text-xs capitalize">{p.role}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MATCH LEADERBOARD */}
        {tab === 'leaderboard' && (
          <div className="space-y-6">
            {/* Batting */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <span className="text-white font-bold">Batting Leaderboard</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="text-left py-2 px-4">Player</th>
                      <th className="text-center py-2 px-2">R</th>
                      <th className="text-center py-2 px-2">B</th>
                      <th className="text-center py-2 px-2">4s</th>
                      <th className="text-center py-2 px-2">6s</th>
                      <th className="text-center py-2 px-2">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBatsmen.map((b, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-2.5 px-4">
                          <div className="text-white font-semibold">{b.name}</div>
                          <div className="text-slate-600 text-xs">{b.team}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-white font-black">{b.runs}</td>
                        <td className="py-2.5 px-2 text-center text-slate-400">{b.balls}</td>
                        <td className="py-2.5 px-2 text-center text-blue-400">{b.fours}</td>
                        <td className="py-2.5 px-2 text-center text-purple-400">{b.sixes}</td>
                        <td className="py-2.5 px-2 text-center text-slate-400">{b.strikeRate?.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowling */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-white font-bold">Bowling Leaderboard</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="text-left py-2 px-4">Player</th>
                      <th className="text-center py-2 px-2">O</th>
                      <th className="text-center py-2 px-2">R</th>
                      <th className="text-center py-2 px-2">W</th>
                      <th className="text-center py-2 px-2">Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBowlers.sort((a, b) => b.wickets - a.wickets).map((b, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-2.5 px-4">
                          <div className="text-white font-semibold">{b.name}</div>
                          <div className="text-slate-600 text-xs">{b.team}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-400">{b.overs || 0}.{b.balls ? b.balls % 6 : 0}</td>
                        <td className="py-2.5 px-2 text-center text-slate-400">{b.runs}</td>
                        <td className="py-2.5 px-2 text-center text-red-400 font-black">{b.wickets}</td>
                        <td className="py-2.5 px-2 text-center text-slate-400">{b.economy?.toFixed(2)}</td>
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
