import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { matchAPI } from '../services/api';
import { Match } from './types';
import { ArrowLeft, Play, Pause, ExternalLink, Maximize2, Volume2, VolumeX, RefreshCw, Tv, BarChart3, Users } from 'lucide-react';

export default function LiveMatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showEmbed, setShowEmbed] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [tab, setTab] = useState<'summary' | 'batsmen' | 'bowlers' | 'extras'>('summary');
  const currentInningIndex = match?.currentInnings ? match.currentInnings - 1 : 0;
  const currentInnings = match?.innings?.[currentInningIndex];
  const inningsToShow = currentInnings ? [currentInnings, ...match.innings.filter((_:any, idx: number) => idx !== currentInningIndex)] : match.innings || [];

  useEffect(() => {
    if (id) {
      fetchMatch();
      // Auto-refresh every 5 seconds
      const interval = setInterval(fetchMatch, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchMatch = async () => {
    if (!id) return;
    try {
      const response = await matchAPI.getMatch(id);
      
      // Handle different response formats - backend returns { success: true, data: match }
      let data;
      if (response.data && response.data.data) {
        // { success: true, data: { ... } }
        data = response.data.data;
      } else if (response.data && response.data._id) {
        // { success: true, data: ... } where data is the match directly
        data = response.data;
      } else {
        data = response.data;
      }
      
      // Transform backend data to frontend format
      if (data && data._id) {
        const transformedMatch = {
          ...data,
          // Map backend field names to frontend expectations
          team1: data.teamA,
          team2: data.teamB,
          tournament: data.tournamentId,
          date: data.matchDate,
          matchType: data.format,
          status: data.status?.toLowerCase() || 'scheduled',
          // Live scores from innings data
          score1: data.firstInnings?.totalRuns,
          wickets1: data.firstInnings?.totalWickets,
          overs1: data.firstInnings?.totalOversBowled,
          score2: data.secondInnings?.totalRuns,
          wickets2: data.secondInnings?.totalWickets,
          overs2: data.secondInnings?.totalOversBowled,
        };
        setMatch(transformedMatch);
        setLastUpdate(new Date());
      } else {
        setMatch(null);
      }
    } catch (error) {
      console.error('Failed to fetch match:', error);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert YouTube/Twitch URLs to embed URLs
  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop() 
        : new URL(url).searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : url;
    }
    
    // Twitch
    if (url.includes('twitch.tv')) {
      const channel = url.split('/').pop()?.replace('?channel=', '');
      return channel ? `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true` : url;
    }
    
    // Direct embed
    return url;
  };

  // Check if URL is embeddable
  const isEmbeddable = (url: string): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('twitch.tv');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Match not found</p>
          <Link to="/matches" className="text-red-400 hover:underline">Back to Matches</Link>
        </div>
      </div>
    );
  }

  const hasVideo = match.videoLink || (match.videoLinks && match.videoLinks.length > 0);
  const videoUrl = match.videoLink || (match.videoLinks && match.videoLinks[0]) || '';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-700 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                {match.team1?.name} <span className="text-gray-400">vs</span> {match.team2?.name}
              </h1>
              <p className="text-sm text-gray-400">
                {typeof match.tournament === 'string' ? 'Tournament Match' : match.tournament?.name}
                <span className="mx-2">•</span>
                <span className="text-red-500 flex items-center gap-1 inline-flex">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  LIVE
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchMatch}
              className="p-2 rounded-full hover:bg-gray-700 transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <span className="text-xs text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-4">
            {hasVideo ? (
              <>
                {/* Video Controls */}
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Live Stream</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowEmbed(!showEmbed)}
                      className={`px-3 py-1 rounded text-sm ${showEmbed ? 'bg-purple-600' : 'bg-gray-700'}`}
                    >
                      {showEmbed ? 'Embed' : 'Embed'}
                    </button>
                    {videoUrl && (
                      <a 
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                    )}
                  </div>
                </div>

                {/* Video Player */}
                <div className="bg-black rounded-b-lg overflow-hidden aspect-video">
                  {showEmbed && isEmbeddable(videoUrl) ? (
                    <iframe
                      src={getEmbedUrl(videoUrl)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Live Stream"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Stream is not available for embedding</p>
                        {videoUrl && (
                          <a 
                            href={videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
                          >
                            <ExternalLink className="w-4 h-4" /> Watch Live
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Multiple Video Links */}
                {match.videoLinks && match.videoLinks.length > 1 && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Available Streams</h3>
                    <div className="flex flex-wrap gap-2">
                      {match.videoLinks.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-1 rounded text-sm ${index === 0 ? 'bg-purple-600' : 'bg-gray-700'} hover:opacity-80`}
                        >
                          Stream {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-800 p-8 rounded-lg text-center">
                <Tv className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No live stream available</p>
              </div>
            )}

            {/* Match Info */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Venue:</span> {match.venue || 'Not specified'}
                </div>
                <div>
                  <span className="text-gray-500">Match Type:</span> {match.matchType || 'T20'}
                </div>
                <div>
                  <span className="text-gray-500">Date:</span> {new Date(match.date).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-gray-500">Status:</span> 
                  <span className="text-red-500 ml-1 capitalize">{match.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Score Section */}
          <div className="space-y-4">
            {/* Score Card */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-center">
                <span className="text-white font-bold flex items-center justify-center gap-2">
                  <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                  LIVE SCORE
                </span>
              </div>
              
              <div className="p-6">
                {/* Team 1 */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <div className="w-14 h-14 mx-auto bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl mb-2">
                      {match.team1?.shortName || match.team1?.name?.substring(0,2) || 'T1'}
                    </div>
                    <h3 className="font-bold truncate">{match.team1?.name || 'Team 1'}</h3>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-3xl font-bold">
                      {match.score1 || 0}<span className="text-lg text-gray-400">/{match.wickets1 || 0}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {match.overs1 || 0} overs
                    </div>
                  </div>
                </div>

                {/* VS */}
                <div className="text-center text-gray-500 font-bold text-sm my-2">VS</div>

                {/* Team 2 */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center px-4">
                    <div className="text-3xl font-bold">
                      {match.score2 || 0}<span className="text-lg text-gray-400">/{match.wickets2 || 0}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {match.overs2 || 0} overs
                    </div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-14 h-14 mx-auto bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl mb-2">
                      {match.team2?.shortName || match.team2?.name?.substring(0,2) || 'T2'}
                    </div>
                    <h3 className="font-bold truncate">{match.team2?.name || 'Team 2'}</h3>
                  </div>
                </div>

                {/* Match Details */}
                {match.status === 'ongoing' && (
                  <div className="bg-gray-700 p-3 rounded-lg text-center mt-4">
                    {match.target ? (
                      <>
                        <p className="text-sm">
                          Target: <span className="font-bold">{match.target}</span>
                        </p>
                        <p className="text-sm text-gray-300">
                          {match.battingTeam === 'team1' 
                            ? `${match.team1?.name} need ${(match.target || 0) - (match.score1 || 0)} runs`
                            : `${match.team2?.name} need ${(match.target || 0) - (match.score2 || 0)} runs`
                          }
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-300">First innings in progress</p>
                    )}
                    {match.currentRunRate && (
                      <p className="text-xs text-gray-400 mt-1">CRR: {match.currentRunRate}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Scoreboard Tabs */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="flex bg-gray-700 border-t border-gray-600 px-3 py-2 -mx-3 mt-0">
                {(['summary', 'batsmen', 'bowlers', 'extras'] as const).map(t => {
                  const isActive = tab === t;
                  return (
                    <button key={t} onClick={() => setTab(t)}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all relative text-sm"
                      style={isActive 
                        ? { background: '#059669', color: 'white', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }
                        : { color: '#9ca3af' }
                      }>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {tab === 'summary' && (
                  <>
                    {match.status === 'ongoing' && (
                      <>
                        {/* Batsmen Summary */}
                        <div className="bg-gray-700 p-3 rounded-lg mb-4">
                          <h4 className="font-bold mb-2 text-sm">Current Batsmen</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1">
                              <span className="font-medium">{match.strikerName || 'Striker'}</span>
                              <span>*</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="font-medium">{match.nonStrikerName || 'Non-Striker'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Current Bowler */}
                        {match.bowlerName && (
                          <div className="bg-gray-700 p-3 rounded-lg">
                            <h4 className="font-bold mb-2 text-sm">Bowler</h4>
                            <div className="text-xs">{match.bowlerName} - 0/0 (0.0)</div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                {tab === 'batsmen' && (
                  <>
                    {match.innings && match.innings.length > 0 ? (
                      <>
                        {match.innings.slice(0, 2).map((inn: any, i: number) => (
                            <div key={i} className={`mb-4 ${i === 0 ? 'border-2 border-green-500' : ''}`}>
                              <div className={`p-2 rounded-lg mb-2 ${i === 0 ? 'bg-green-900/50' : 'bg-gray-700'}`}>
                                <h4 className={`font-bold text-xs uppercase tracking-wide ${i === 0 ? 'text-green-300' : ''}`}>
                                  {i === 0 ? '⚡ LIVE ' : ''}{inn.teamName || `Innings ${i+1}`}
                                </h4>
                                <p className="text-xs text-gray-300">{inn.score || 0}/{inn.wickets || 0} ({inn.overs || 0}.{inn.balls || 0})</p>
                              </div>
                            {inn.batsmen && inn.batsmen.length > 0 && (
                              <div className="overflow-x-auto bg-gray-900 rounded-lg">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-600 bg-gray-800">
                                      <th className="text-left py-2 px-2 font-semibold text-gray-300">Batsman</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">R</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">B</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">4s</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">6s</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">SR</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inn.batsmen.slice(0, 6).map((b: any, j: number) => (
                                      <tr key={j} className="border-b border-gray-700 hover:bg-gray-800">
                                        <td className="py-1.5 px-2">
                                          <div className="flex flex-col">
                                            <span className="font-semibold text-white truncate max-w-20">{b.name}</span>
                                            {b.isStriker && !b.isOut && <span className="text-yellow-400 text-[10px] font-bold ml-1">*</span>}
                                            {!b.isOut && !b.isStriker && <span className="text-blue-400 text-[10px] font-bold ml-1">NS</span>}
                                            {b.isOut ? (
                                              <span className="text-gray-400 text-[10px]">{b.outType}</span>
                                            ) : (
                                              <span className="text-green-400 text-[10px] font-bold">not out</span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-1.5 px-1 text-center font-bold text-white">{b.runs || 0}</td>
                                        <td className="py-1.5 px-1 text-center text-gray-400">{b.balls || 0}</td>
                                        <td className="py-1.5 px-1 text-center font-bold text-blue-400">{b.fours || 0}</td>
                                        <td className="py-1.5 px-1 text-center font-bold text-purple-400">{b.sixes || 0}</td>
                                        <td className="py-1.5 px-1 text-center text-gray-400">{b.strikeRate?.toFixed(1) || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">No batting data available</div>
                    )}
                  </>
                )}
                {tab === 'bowlers' && (
                  <>
                    {match.innings && match.innings.length > 0 ? (
                      <>
                        {match.innings.slice(0, 2).map((inn: any, i: number) => (
                          <div key={i} className="mb-4">
                            <div className="bg-gray-700 p-2 rounded-lg mb-2">
                              <h4 className="font-bold text-xs uppercase tracking-wide">{inn.teamName || `Innings ${i+1}`} Bowling</h4>
                              <p className="text-xs text-gray-300">Target: {inn.targetScore || '-'}</p>
                            </div>
                            {inn.bowlers && inn.bowlers.length > 0 && (
                              <div className="overflow-x-auto bg-gray-900 rounded-lg">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-600 bg-gray-800">
                                      <th className="text-left py-2 px-3 font-semibold text-gray-300">Bowler</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">O</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">M</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">R</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">W</th>
                                      <th className="text-center py-2 px-1 font-semibold text-gray-300">Eco</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inn.bowlers.slice(0, 6).map((b: any, j: number) => (
                                      <tr key={j} className="border-b border-gray-700 hover:bg-gray-800">
                                        <td className="py-1.5 px-3 font-bold text-white truncate max-w-20">{b.name}</td>
                                        <td className="py-1.5 px-1 text-center text-gray-400">{(b.overs || 0).toFixed(1)}</td>
                                        <td className="py-1.5 px-1 text-center text-gray-400">{b.maidens || 0}</td>
                                        <td className="py-1.5 px-1 text-center text-gray-400">{b.runs || 0}</td>
                                        <td className="py-1.5 px-1 text-center font-bold text-red-400">{b.wickets || 0}</td>
                                        <td className="py-1.5 px-1 text-center text-gray-400">{b.economy?.toFixed(2) || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">No bowling data available</div>
                    )}
                  </>
                )}
                {tab === 'extras' && (
                  <>
                    {match.innings && match.innings.length > 0 ? (
                      <>
                        {match.innings.slice(0, 2).map((inn: any, i: number) => (
                          <div key={i} className="mb-4">
                            <div className="bg-gray-700 p-2 rounded-lg mb-2">
                              <h4 className="font-bold text-xs uppercase tracking-wide">{inn.teamName || `Innings ${i+1}`} Extras</h4>
                            </div>
                            {inn.extras ? (
                              <div className="bg-gray-900 rounded-lg p-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Wides: <span className="font-bold text-white">{inn.extras.wides || 0}</span></div>
                                  <div>No Balls: <span className="font-bold text-white">{inn.extras.noBalls || 0}</span></div>
                                  <div>Byes: <span className="font-bold text-white">{inn.extras.byes || 0}</span></div>
                                  <div>Leg Byes: <span className="font-bold text-white">{inn.extras.legByes || 0}</span></div>
                                  <div className="col-span-2 font-bold text-sm border-t border-gray-700 pt-1 mt-1">
                                    Total Extras: <span className="text-white">{inn.extras.total || 0}</span>
                                  </div>
                                </div>
                                {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                                  <div className="mt-3 pt-2 border-t border-gray-700">
                                    <h5 className="font-bold text-xs mb-1 text-gray-300">Fall of Wickets</h5>
                                    <p className="text-xs text-gray-400 leading-tight">
                                      {inn.fallOfWickets.slice(0, 4).map((f: any) => `${f.score}/${f.wicket} (${f.batsman})`).join(' | ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-400 text-sm">No extras data</div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">No extras data available</div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link 
                to={`/match/${match._id}`}
                className="block w-full text-center py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
              >
                Full Scorecard
              </Link>
              <Link 
                to={`/tournaments/${typeof match.tournament === 'string' ? match.tournament : match.tournament?._id}`}
                className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
              >
                Tournament Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
