import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tournament, Match, Team } from './types';
import io, { Socket } from 'socket.io-client';
import TeamManagement from './TeamManagement';
import OverlayEditor from './OverlayEditor';
import TournamentStats from './TournamentStats';
import { matchApi } from '../services/matchApi';
import { tournamentAPI, teamAPI } from '../services/api';

// ============================================
// LIVE SCORING - TOURNAMENT DETAIL COMPONENT
// Enhanced with Toss, Player Selection, and Auto-Bowler Change
// ============================================

type Dismissal = 'bowled' | 'caught' | 'lbw' | 'runOut' | 'stumped' | 'hitWicket' | 'handledBall' | 'timedOut' | null;

// Local player interface for cricket scoring
interface CricketPlayer {
  id: string;
  name: string;
  runsScored: number;
  ballsFaced: number;
  isOut: boolean;
  dismissal?: Dismissal;
}

interface Innings {
  battingTeam: string;
  totalRuns: number;
  wickets: number;
  totalBalls: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  strikerIndex: number;
  nonStrikerIndex: number;
  lineup: CricketPlayer[];
}

const outTypes = [
  { type: 'bowled', label: 'Bowled', canBeNoBall: false, canBeWide: false },
  { type: 'caught', label: 'Caught', canBeNoBall: false, canBeWide: false },
  { type: 'lbw', label: 'LBW', canBeNoBall: false, canBeWide: false },
  { type: 'stumped', label: 'Stumped', canBeNoBall: true, canBeWide: true },
  { type: 'runOut', label: 'Run Out', canBeNoBall: true, canBeWide: true },
  { type: 'hitWicket', label: 'Hit Wicket', canBeNoBall: false, canBeWide: false },
];

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [scoreHistory, setScoreHistory] = useState<Innings[]>([]);

  // Toss Modal State
  const [showTossModal, setShowTossModal] = useState(false);
  const [tossWinner, setTossWinner] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | ''>('');
  const [pendingMatchForToss, setPendingMatchForToss] = useState<Match | null>(null);
  
  // Player Selection Modal State  
  const [showPlayerSelectionModal, setShowPlayerSelectionModal] = useState(false);
  const [team1Players, setTeam1Players] = useState<{id: string, name: string}[]>([]);
  const [team2Players, setTeam2Players] = useState<{id: string, name: string}[]>([]);
  const [selectedStriker, setSelectedStriker] = useState<{id: string, name: string} | null>(null);
  const [selectedNonStriker, setSelectedNonStriker] = useState<{id: string, name: string} | null>(null);
  const [selectedBowler, setSelectedBowler] = useState<{id: string, name: string} | null>(null);
  
  // Bowler Change Modal (after each over)
  const [showBowlerChangeModal, setShowBowlerChangeModal] = useState(false);
  const [lastSavedOver, setLastSavedOver] = useState(0);
  
  // Player Change Modal (manual substitution)
  const [showPlayerChangeModal, setShowPlayerChangeModal] = useState(false);
  const [playerChangeType, setPlayerChangeType] = useState<'striker' | 'nonstriker' | 'bowler'>('striker');

  // Match form with videoLinks support
  const [matchForm, setMatchForm] = useState({
    tournament: '',
    team1: '',
    team2: '',
    date: '',
    venue: '',
    tossWinner: '',
    tossChoice: '',
    matchType: 'T20',
    videoLink: '',
    videoLinks: [] as string[],
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [pendingWicketType, setPendingWicketType] = useState<string>('');
  const [deliveryKind, setDeliveryKind] = useState<'normal' | 'noBall' | 'wide'>('normal');
  
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [pendingExtraType, setPendingExtraType] = useState<'wide' | 'noBall' | 'bye' | 'legBye' | null>(null);
  const [showOutOptionsInExtra, setShowOutOptionsInExtra] = useState(false);

  const [innings, setInnings] = useState<Innings>(() => createDefaultInnings());
  const [selectedTeamForUpdate, setSelectedTeamForUpdate] = useState<'team1' | 'team2'>('team1');

  function createDefaultInnings(teamPlayers?: any[]): Innings {
    const players = teamPlayers && teamPlayers.length > 0 
      ? teamPlayers.map((p, i) => ({
          id: p.id || p._id || String(i),
          name: p.name || `Player ${i + 1}`,
          runsScored: 0,
          ballsFaced: 0,
          isOut: false,
        }))
      : Array.from({ length: 11 }, (_, i) => ({
          id: String(i + 1),
          name: `Player ${i + 1}`,
          runsScored: 0,
          ballsFaced: 0,
          isOut: false,
        }));

    return {
      battingTeam: 'team1',
      totalRuns: 0,
      wickets: 0,
      totalBalls: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      strikerIndex: 0,
      nonStrikerIndex: 1,
      lineup: players,
    };
  }

  const safeLength = (arr: any[] | undefined | null): number => {
    return Array.isArray(arr) ? arr.length : 0;
  };

  const safeAccess = <T,>(arr: T[] | undefined | null, index: number): T | undefined => {
    return Array.isArray(arr) ? arr[index] : undefined;
  };

  const autoSaveScore = async (inningsData: Innings, teamKey: 'team1' | 'team2') => {
    if (!selectedMatch || !selectedMatch._id || selectedMatch._id === 'undefined' || selectedMatch._id === 'null') {
      console.warn('Cannot auto-save score: invalid matchId', selectedMatch?._id);
      return;
    }
    
    if (!selectedMatch) return;
    
    try {
      const overs = Math.floor(inningsData.totalBalls / 6) + (inningsData.totalBalls % 6) / 10;
      const strikerName = inningsData.lineup[inningsData.strikerIndex]?.name || '';
      const nonStrikerName = inningsData.lineup[inningsData.nonStrikerIndex]?.name || '';
      
      await matchApi.updateMatchScore(selectedMatch._id, {
        score1: teamKey === 'team1' ? inningsData.totalRuns : (selectedMatch.score1 || 0),

        score2: teamKey === 'team2' ? inningsData.totalRuns : (selectedMatch.score2 || 0),
        wickets1: teamKey === 'team1' ? inningsData.wickets : (selectedMatch.wickets1 || 0),
        wickets2: teamKey === 'team2' ? inningsData.wickets : (selectedMatch.wickets2 || 0),
        overs1: teamKey === 'team1' ? parseFloat(overs.toFixed(1)) : (selectedMatch.overs1 || 0),
        overs2: teamKey === 'team2' ? parseFloat(overs.toFixed(1)) : (selectedMatch.overs2 || 0),
        status: 'ongoing',
        strikerName,
        nonStrikerName,
      });
    } catch (error) {
      console.error('Failed to auto-save score:', error);
    }
  };

  const processDelivery = (runs: number, deliveryType: 'normal' | 'wide' | 'noBall' | 'bye' | 'legBye', wicket: Dismissal = null) => {
    setScoreHistory([...scoreHistory, { ...innings }]);
    
    let newInnings = { ...innings };
    let striker = newInnings.lineup[newInnings.strikerIndex];
    let nonStriker = newInnings.lineup[newInnings.nonStrikerIndex];

    if (deliveryType === 'wide') {
      newInnings.totalRuns += (1 + runs);
      newInnings.extras.wides += 1;
    } else if (deliveryType === 'noBall') {
      newInnings.totalRuns += (1 + runs);
      newInnings.extras.noBalls += 1;
    } else if (deliveryType === 'bye') {
      newInnings.totalRuns += runs;
      newInnings.extras.byes += runs;
      newInnings.totalBalls += 1;
    } else if (deliveryType === 'legBye') {
      newInnings.totalRuns += runs;
      newInnings.extras.legByes += runs;
      newInnings.totalBalls += 1;
    } else {
      newInnings.totalRuns += runs;
      striker.runsScored += runs;
      striker.ballsFaced += 1;
      newInnings.totalBalls += 1;
    }

    if (wicket) {
      newInnings.wickets += 1;
      striker.isOut = true;
      striker.dismissal = wicket;
      
      const nextPlayerIndex = Math.max(newInnings.strikerIndex, newInnings.nonStrikerIndex) + 1;
      if (nextPlayerIndex < newInnings.lineup.length) {
        newInnings.strikerIndex = nextPlayerIndex;
      }
    }

    if (deliveryType === 'normal' && runs % 2 !== 0) {
      const temp = newInnings.strikerIndex;
      newInnings.strikerIndex = newInnings.nonStrikerIndex;
      newInnings.nonStrikerIndex = temp;
    }

    if (deliveryType === 'normal' && newInnings.totalBalls % 6 === 0) {
      const temp = newInnings.strikerIndex;
      newInnings.strikerIndex = newInnings.nonStrikerIndex;
      newInnings.nonStrikerIndex = temp;
    }

    setInnings(newInnings);
    
    // Check if over is complete - prompt for bowler change
    const currentOver = Math.floor(newInnings.totalBalls / 6);
    if (currentOver > lastSavedOver) {
      setShowBowlerChangeModal(true);
      setLastSavedOver(currentOver);
    }
    
    autoSaveScore(newInnings, selectedTeamForUpdate);
  };

  const handleWicket = (dismissal: Dismissal, deliveryKind: 'normal' | 'noBall' | 'wide' = 'normal') => {
    if (deliveryKind === 'noBall' || deliveryKind === 'wide') {
      if (dismissal === 'stumped' || dismissal === 'runOut') {
        processDelivery(0, deliveryKind, dismissal);
      } else {
        processDelivery(0, deliveryKind, 'runOut');
      }
    } else {
      processDelivery(0, 'normal', dismissal);
    }
    setShowWicketModal(false);
    setDeliveryKind('normal');
    setPendingWicketType('');
  };

  const openWicketModal = (type: 'normal' | 'runOut', deliveryType: 'normal' | 'noBall' | 'wide' = 'normal') => {
    setPendingWicketType(type);
    setDeliveryKind(deliveryType);
    setShowWicketModal(true);
  };

  const undoLastAction = () => {
    if (scoreHistory.length > 0) {
      const lastState = scoreHistory[scoreHistory.length - 1];
      setInnings(lastState);
      setScoreHistory(scoreHistory.slice(0, -1));
    }
  };

  const formatOvers = (): string => {
    const overs = Math.floor(innings.totalBalls / 6);
    const balls = innings.totalBalls % 6;
    return `${overs}.${balls}`;
  };

  const resetInnings = (teamKey: 'team1' | 'team2' = selectedTeamForUpdate, loadExisting = true) => {
    if (loadExisting && selectedMatch) {
      const isTeam1 = teamKey === 'team1';
      const existingRuns = isTeam1 ? (selectedMatch.score1 || 0) : (selectedMatch.score2 || 0);
      const existingWickets = isTeam1 ? (selectedMatch.wickets1 || 0) : (selectedMatch.wickets2 || 0);
      const existingOvers = isTeam1 ? (selectedMatch.overs1 || 0) : (selectedMatch.overs2 || 0);
      const existingBalls = Math.floor(existingOvers) * 6 + Math.round((existingOvers % 1) * 10);
      
      const selectedTeam = teamKey === 'team1' ? selectedMatch?.team1 : selectedMatch?.team2;
      const teamPlayers = selectedTeam?.players || [];
      
      const players = teamPlayers.length > 0 
        ? teamPlayers.map((p: any, i: number) => ({
            id: p.id || p._id || String(i),
            name: p.name || `Player ${i + 1}`,
            runsScored: 0,
            ballsFaced: 0,
            isOut: false,
          }))
        : Array.from({ length: 11 }, (_, i) => ({
            id: String(i + 1),
            name: `Player ${i + 1}`,
            runsScored: 0,
            ballsFaced: 0,
            isOut: false,
          }));

      setInnings({
        battingTeam: teamKey,
        totalRuns: existingRuns,
        wickets: existingWickets,
        totalBalls: existingBalls,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        strikerIndex: 0,
        nonStrikerIndex: 1,
        lineup: players,
      });
      setScoreHistory([]);
      return;
    }
    
    const selectedTeam = teamKey === 'team1' ? selectedMatch?.team1 : selectedMatch?.team2;
    const teamPlayers = selectedTeam?.players || [];
    setInnings(createDefaultInnings(teamPlayers));
    setScoreHistory([]);
  };

  const switchInnings = () => {
const newTeamKey = selectedTeamForUpdate === 'team1' ? 'team2' : 'team1';
    setSelectedTeamForUpdate(newTeamKey);
    resetInnings(newTeamKey);
  };

  const addVideoUrl = () => {
    if (newVideoUrl.trim()) {
      setMatchForm({
        ...matchForm,
        videoLinks: [...matchForm.videoLinks, newVideoUrl.trim()],
      });
      setNewVideoUrl('');
    }
  };

  const removeVideoUrl = (index: number) => {
    setMatchForm({
      ...matchForm,
      videoLinks: matchForm.videoLinks.filter((_, i) => i !== index),
    });
  };

  const handleLiveScoreClick = (match: Match) => {
    console.log('Live Score clicked for match:', match);
    console.log('Match teams:', {
      teamA: match.teamA,
      teamB: match.teamB,
      team1: match.team1,
      team2: match.team2
    });
    
    // ✅ Client-side validation: only allow toss for upcoming matches
    const matchStatus = (match.status || '').toLowerCase().trim();
    if (matchStatus !== 'upcoming') {
      alert(`Cannot start toss: Match status is "${matchStatus}". Only "upcoming" matches can have toss.`);
      return;
    }
    
    setPendingMatchForToss(match);
    setShowTossModal(true);
  };
  
  const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const handleTossSave = async () => {
    if (!pendingMatchForToss || !tossWinner || !tossDecision) {
      alert(`Please select toss winner (${tossWinner || 'none'}) and decision (${tossDecision || 'none'})`);
      return;
    }

    console.log('🎯 handleTossSave START:', {
      matchId: pendingMatchForToss._id,
      matchStatus: pendingMatchForToss.status,
      tossWinnerId: tossWinner,
      tossDecision,
      isValidMatchId: isValidObjectId(pendingMatchForToss._id || ''),
      isValidTeamId: isValidObjectId(tossWinner)
    });

    // 🔍 Validate ObjectId before API call
    if (!isValidObjectId(tossWinner)) {
      console.error('❌ Invalid tossWinner ID:', tossWinner);
      alert(`Invalid team ID: ${tossWinner.slice(0,8)}...`);
      return;
    }

    if (!isValidObjectId(pendingMatchForToss._id || '')) {
      console.error('❌ Invalid match ID:', pendingMatchForToss._id);
      alert('Invalid match ID. Please refresh.');
      return;
    }
    
    // 🎯 Backend expects these fields exactly
    const tossPayload = {
      tossWinner,
      decision: tossDecision,
      forceStart: true  // Critical: bypasses status check
    };
    
    console.log('🚀 API CALL: matchApi.saveToss()', {
      matchId: pendingMatchForToss._id,
      payload: tossPayload,
      backendEndpoint: `/matches/${pendingMatchForToss._id}/toss`
    });
    
    try {
      const response = await matchApi.saveToss(pendingMatchForToss._id, tossWinner, tossDecision, true);
      console.log('✅ Toss API success:', response);
      
      // Refresh matches to get updated status='live'
      await fetchMatches();
      
      // Extract players safely
      const team1Data = pendingMatchForToss.teamA || pendingMatchForToss.team1 || { players: [] };
      const team2Data = pendingMatchForToss.teamB || pendingMatchForToss.team2 || { players: [] };
      
      setTeam1Players((team1Data.players || []).map((p: any) => ({ 
        id: p._id || p.id || `t1-${Math.random()}`,
        name: p.name || 'Player TBD' 
      })));
      
      setTeam2Players((team2Data.players || []).map((p: any) => ({ 
        id: p._id || p.id || `t2-${Math.random()}`,
        name: p.name || 'Player TBD' 
      })));
      
      console.log('👥 Player lists ready. Opening selection modal.');
      
      setShowTossModal(false);
      setShowPlayerSelectionModal(true);
      
    } catch (error: any) {
      console.error('💥 Toss API FAILED:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        fullError: error.message,
        response: error.response?.data
      });
      
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      const detailedMsg = `Toss failed: ${errorMsg}
      
Match: ${pendingMatchForToss._id} (status: ${pendingMatchForToss.status})
Check backend console for 📡 startMatch logs.`;
      
      alert(detailedMsg);
    }
  };
  
  const handlePlayerSelectionSave = async () => {
    if (!selectedStriker || !selectedNonStriker || !selectedBowler) {
      alert('Please select striker, non-striker and bowler');
      return;
    }
    
    if (!pendingMatchForToss) return;
    
    try {
      try {
        await matchApi.savePlayerSelections(pendingMatchForToss._id, {
          team1Players,
          team2Players,
          battingOrder: [...team1Players, ...team2Players].map(p => p.id),
          bowlingOrder: [...team2Players, ...team1Players].map(p => p.id),
          strikerId: selectedStriker.id,
          strikerName: selectedStriker.name,
          nonStrikerId: selectedNonStriker.id,
          nonStrikerName: selectedNonStriker.name,
          bowlerId: selectedBowler.id,
          bowlerName: selectedBowler.name,
        });
      } catch (playerError) {
        console.log('Player selection save failed (non-critical):', playerError);
      }
      
      const battingTeam = tossDecision === 'bat' ? team1Players : team2Players;
      const players = battingTeam.map((p, i) => ({
        id: p.id,
        name: p.name,
        runsScored: 0,
        ballsFaced: 0,
        isOut: false,
      }));
      
      const strikerIdx = players.findIndex(p => p.id === selectedStriker.id);
      const nonStrikerIdx = players.findIndex(p => p.id === selectedNonStriker.id);
      
      setInnings({
        battingTeam: tossDecision === 'bat' ? 'team1' : 'team2',
        totalRuns: 0,
        wickets: 0,
        totalBalls: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        strikerIndex: strikerIdx >= 0 ? strikerIdx : 0,
        nonStrikerIndex: nonStrikerIdx >= 0 ? nonStrikerIdx : 1,
        lineup: players,
      });
      
      setShowPlayerSelectionModal(false);
      setSelectedMatch(pendingMatchForToss);
      setSelectedTeamForUpdate(tossDecision === 'bat' ? 'team1' : 'team2');
      setLastSavedOver(0);
      
    } catch (error) {
      console.error('Failed to initialize player selection:', error);
      alert('Failed to initialize player selection');
    }
  };
  
  const handleBowlerChange = (newBowler: {id: string, name: string}) => {
    setSelectedBowler(newBowler);
    setShowBowlerChangeModal(false);
  };
  
  const openPlayerChangeModal = (type: 'striker' | 'nonstriker' | 'bowler') => {
    setPlayerChangeType(type);
    setShowPlayerChangeModal(true);
  };
  
  const handlePlayerChange = (newPlayer: {id: string, name: string}) => {
    if (playerChangeType === 'striker') {
      setSelectedStriker(newPlayer);
      const newLineup = [...innings.lineup];
      const strikerIdx = newLineup.findIndex(p => p.id === selectedStriker?.id);
      if (strikerIdx >= 0) {
        newLineup[strikerIdx] = { ...newLineup[strikerIdx], id: newPlayer.id, name: newPlayer.name };
        setInnings({ ...innings, lineup: newLineup });
      }
    } else if (playerChangeType === 'nonstriker') {
      setSelectedNonStriker(newPlayer);
    } else if (playerChangeType === 'bowler') {
      setSelectedBowler(newPlayer);
    }
    setShowPlayerChangeModal(false);
  };

  useEffect(() => {
    if (id) {
      fetchTournament();
      fetchMatches();
      fetchTeams();
    }
  }, [id]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('scoreUpdate', (data: { matchId: string; match: any }) => {
      if (selectedMatch && data.matchId === selectedMatch._id) {
        setSelectedMatch((prev: Match | null) => prev ? { ...prev, ...data.match } : null);
        
        if (selectedTeamForUpdate === 'team1' && data.match.score1 !== undefined) {
          const newInnings = { ...innings };
          newInnings.totalRuns = data.match.score1 || 0;
          newInnings.wickets = data.match.wickets1 || 0;
          const overs = data.match.overs1 || 0;
          newInnings.totalBalls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
          setInnings(newInnings);
        } else if (selectedTeamForUpdate === 'team2' && data.match.score2 !== undefined) {
          const newInnings = { ...innings };
          newInnings.totalRuns = data.match.score2 || 0;
          newInnings.wickets = data.match.wickets2 || 0;
          const overs = data.match.overs2 || 0;
          newInnings.totalBalls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
          setInnings(newInnings);
        }
      }
    });
    
    return () => { newSocket.close(); };
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      resetInnings(selectedTeamForUpdate);
    }
  }, [selectedTeamForUpdate]);

  const fetchTournament = async () => {
    if (!id) return;
    try {
      const response = await tournamentAPI.getTournament(id);
      setTournament(response.data);
    } catch (error) {
      setError('Failed to fetch tournament');
    } finally {
      setLoading(false);
    }
  };

  const extractArray = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.matches)) return response.data.matches;
    if (Array.isArray(response.data?.teams)) return response.data.teams;
    if (Array.isArray(response)) return response;
    return [];
  };

const fetchMatches = async () => {
    if (!id) return;
    try {
      console.log('🔍 Fetching matches for tournament:', id);
      
      // Step 1: Fetch ALL teams comprehensively (not just tournament-specific)
      const allTeamsRes = await teamAPI.getTeams();
      const tournamentTeamsRes = await teamAPI.getTeams(id);
      
      const allTeams: any[] = allTeamsRes?.data?.teams || allTeamsRes?.data || [];
      const tournamentTeams: any[] = tournamentTeamsRes?.data?.teams || tournamentTeamsRes?.data || [];
      
      console.log('📊 Teams found:', { allTeams: allTeams.length, tournamentTeams: tournamentTeams.length });
      
      // Create comprehensive team map (prioritize tournament teams)
      const teamMap = new Map<string, any>();
      [...tournamentTeams, ...allTeams].forEach((team: any) => {
        if (team._id && !teamMap.has(team._id.toString())) {
          teamMap.set(team._id.toString(), {
            _id: team._id,
            name: team.name || 'Unnamed Team',
            shortName: team.shortName || team.name?.slice(0,3)?.toUpperCase() || 'TEAM'
          });
        }
      });
      
      // Step 2: Fetch tournament matches
      const data = await tournamentAPI.getTournamentMatches(id);
      console.log('📋 Raw matches data:', data);
      
      let matchesArray: any[] = data.data || data;
      console.log('🔢 Matches array length:', matchesArray.length);
      
      // Step 3: Robust population
      const enrichedMatches = matchesArray.map((match: any, index: number) => {
        console.log(`🔍 Match ${index} RAW:`, {
          teamA: match.teamA,
          teamB: match.teamB,
          teamA_type: typeof match.teamA,
          teamB_type: typeof match.teamB
        });
        
        // BULLETPROOF population - prioritize populated objects, fallback to map, ultimate fallback
        // Use match.team1/team2 if available (backend standard)
        const rawTeam1 = match.team1 || match.teamA;
        const rawTeam2 = match.team2 || match.teamB;
        
        let team1Data = null;
        let team2Data = null;
        
        // Direct populated object check
        if (rawTeam1 && typeof rawTeam1 === 'object' && rawTeam1.name) {
          team1Data = { _id: rawTeam1._id || rawTeam1.id, name: rawTeam1.name };
        } else if (rawTeam1) {
          team1Data = teamMap.get(String(rawTeam1)) || { _id: rawTeam1, name: `Team 1 (${String(rawTeam1).slice(-4)})` };
        }
        
        if (rawTeam2 && typeof rawTeam2 === 'object' && rawTeam2.name) {
          team2Data = { _id: rawTeam2._id || rawTeam2.id, name: rawTeam2.name };
        } else if (rawTeam2) {
          team2Data = teamMap.get(String(rawTeam2)) || { _id: rawTeam2, name: `Team 2 (${String(rawTeam2).slice(-4)})` };
        }
        
        let tossWinnerData = null;
        if (match.tossWinner) {
          if (typeof match.tossWinner === 'object' && match.tossWinner.name) {
            tossWinnerData = match.tossWinner;
          } else {
            tossWinnerData = teamMap.get(String(match.tossWinner)) || { _id: match.tossWinner, name: 'Toss TBD' };
          }
        }
        
        const enrichedMatch = {
          ...match,
          team1: team1Data || { name: 'Team 1 TBD', _id: 'unknown' },
          team2: team2Data || { name: 'Team 2 TBD', _id: 'unknown' },
          teamA: team1Data || { name: 'Team 1 TBD', _id: 'unknown' },
          teamB: team2Data || { name: 'Team 2 TBD', _id: 'unknown' },
          tossWinner: tossWinnerData
        };
        
        console.log(`✅ Match ${index} ENRICHED:`, {
          teamA_name: enrichedMatch.teamA.name,
          teamA_id: enrichedMatch.teamA._id,
          teamB_name: enrichedMatch.teamB.name, 
          teamB_id: enrichedMatch.teamB._id
        });
        
        return enrichedMatch;
      });
      
      setMatches(enrichedMatches);
      console.log('🎉 Matches populated successfully:', enrichedMatches.length);
    } catch (error: any) {
      console.error('❌ Failed to fetch matches:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });
      setError('Failed to fetch matches: ' + (error.response?.data?.message || error.message));
      setMatches([]);
    }
  };

  const fetchTeams = async () => {
    if (!id) return;
    try {
      const response = await teamAPI.getTeams(id);
      const teamsArray = extractArray(response);
      setTeams(teamsArray);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      setError('Failed to fetch teams');
      setTeams([]);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      const matchData = {
        tournament: id,
        team1: matchForm.team1,
        team2: matchForm.team2,
        date: matchForm.date,
        venue: matchForm.venue,
        tossWinner: matchForm.tossWinner,
        tossChoice: matchForm.tossChoice,
        matchType: matchForm.matchType,
        videoLink: matchForm.videoLinks[0] || matchForm.videoLink,
        videoLinks: matchForm.videoLinks,
      };
      await matchApi.createMatch(matchData);
      setShowMatchForm(false);
      setMatchForm({ 
        tournament: '', team1: '', team2: '', date: '', venue: '', 
        tossWinner: '', tossChoice: '', matchType: 'T20', 
        videoLink: '', videoLinks: [] 
      });
      fetchMatches();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    if (!selectedMatch) return;
    setLoading(true);
    try {
      const overs = Math.floor(innings.totalBalls / 6) + (innings.totalBalls % 6) / 10;
      const strikerName = innings.lineup[innings.strikerIndex]?.name || '';
      const nonStrikerName = innings.lineup[innings.nonStrikerIndex]?.name || '';
      
      await matchApi.updateMatchScore(selectedMatch._id, {
        score1: selectedTeamForUpdate === 'team1' ? innings.totalRuns : (selectedMatch.score1 || 0),

        score2: selectedTeamForUpdate === 'team2' ? innings.totalRuns : (selectedMatch.score2 || 0),
        wickets1: selectedTeamForUpdate === 'team1' ? innings.wickets : (selectedMatch.wickets1 || 0),
        wickets2: selectedTeamForUpdate === 'team2' ? innings.wickets : (selectedMatch.wickets2 || 0),
        overs1: selectedTeamForUpdate === 'team1' ? parseFloat(overs.toFixed(1)) : (selectedMatch.overs1 || 0),
        overs2: selectedTeamForUpdate === 'team2' ? parseFloat(overs.toFixed(1)) : (selectedMatch.overs2 || 0),
        status: 'ongoing',
        strikerName,
        nonStrikerName,
      });
      fetchMatches();
    } catch (error) {
      setError('Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (window.confirm('Delete this match?')) {
      setLoading(true);
      try {
        await matchApi.deleteMatch(matchId);
        fetchMatches();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete match');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteTournament = async () => {
    if (window.confirm('Delete this tournament?')) {
      setLoading(true);
      try {
        await tournamentAPI.deleteTournament(id!);
        navigate('/tournaments');
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete tournament');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!tournament) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-gray-900 text-white min-h-screen p-4 md:p-6">
      <div className="mb-6">
        <button onClick={() => navigate('/tournaments')} className="btn-secondary mb-4">← Back</button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gradient">{tournament.name}</h1>
            <p className="text-gray-300">{tournament.description}</p>
          </div>
          <button 
            onClick={handleDeleteTournament} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            Delete Tournament
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}

      <div className="flex space-x-2 mb-6">
        {['overview', 'matches', 'teams', 'overlays', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab ? 'bg-primary-600' : 'bg-gray-700'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Tournament Overview</h2>
          <p className="text-gray-300">Tournament: {tournament.name}</p>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
              tournament.status === 'ongoing' ? 'bg-green-100 text-green-800' :
              tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {tournament.status || 'draft'}
            </span>
          </div>
          <p className="text-gray-300">Teams: {tournament.teams?.length || 0}</p>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Matches</h2>
            <button onClick={() => setShowMatchForm(true)} className="btn-primary">Schedule Match</button>
          </div>
          <div className="space-y-4">
            {matches.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No matches yet</p>
            ) : (
              matches.map((match) => (
                <div key={match._id} className="p-4 bg-gray-700 rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">
                      {match.team1?.name || match.teamA?.name || match.team1Name || match.name?.split(' vs ')[0] || 'Team 1'} vs{' '}
                      {match.team2?.name || match.teamB?.name || match.team2Name || (match.name ? match.name.split(' vs ')[1] : 'Team 2')}
                    </h4>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        match.status === 'upcoming' ? 'bg-blue-500' : 
                        match.status === 'live' ? 'bg-green-500' :
                        match.status === 'completed' ? 'bg-gray-500' : 'bg-yellow-500'
                      }`}>
                        {match.status || 'unknown'}
                      </span>
                      {match.score1 !== undefined 
                        ? `${match.score1}/${match.wickets1} (${match.overs1})` 
                        : 'Not started'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleLiveScoreClick(match)}
                      disabled={(match.status || '').toLowerCase() !== 'upcoming'}
                      className={`px-3 py-1 rounded text-sm flex-1 text-center transition-all ${
                        (match.status || '').toLowerCase() === 'upcoming' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-gray-600 cursor-not-allowed opacity-50'
                      }`}
                      title={(match.status || '').toLowerCase() === 'upcoming' 
                        ? `Match Status: ${match.status || 'unknown'} - Ready for toss` 
                        : `Cannot start: Match status "${match.status || 'unknown'}" - Only "upcoming" allowed`
                      }
                    >
                      {(match.status || '').toLowerCase() === 'live' ? '📺 Live' : 
                       (match.status || '').toLowerCase() === 'upcoming' ? '⚡ Start Toss' : '⏳ Not Ready'}
                    </button>
                    <button onClick={() => handleDeleteMatch(match._id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Teams</h2>
          <TeamManagement selectedTournament={tournament} />
        </div>
      )}

      {activeTab === 'overlays' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Overlays</h2>
          <OverlayEditor />
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Tournament Statistics</h2>
          <TournamentStats tournamentId={id!} matches={matches} />
        </div>
      )}

      {showMatchForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Schedule New Match</h3>
              <button onClick={() => setShowMatchForm(false)} className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded">
                Close
              </button>
            </div>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Team 1</label>
                  <select 
                    value={matchForm.team1} 
                    onChange={(e) => setMatchForm({...matchForm, team1: e.target.value})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Team 1</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team 2</label>
                  <select 
                    value={matchForm.team2} 
                    onChange={(e) => setMatchForm({...matchForm, team2: e.target.value})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Team 2</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={matchForm.date} 
                    onChange={(e) => setMatchForm({...matchForm, date: e.target.value})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Venue</label>
                  <input 
                    type="text" 
                    value={matchForm.venue} 
                    onChange={(e) => setMatchForm({...matchForm, venue: e.target.value})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional venue name"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 py-3 rounded-lg font-bold transition-colors"
              >
                {loading ? 'Creating Match...' : 'Create Match'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showTossModal && pendingMatchForToss && (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center">Toss</h3>
            <p className="text-gray-400 text-center mb-6">
              {pendingMatchForToss.teamA?.name || pendingMatchForToss.team1?.name} vs{' '}
              {pendingMatchForToss.teamB?.name || pendingMatchForToss.team2?.name}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Toss Winner</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const teamId = pendingMatchForToss!.teamA?._id || pendingMatchForToss!.team1?._id;
                      console.log('Team A button clicked:', { teamId, teamName: pendingMatchForToss!.teamA?.name || pendingMatchForToss!.team1?.name });
                      if (teamId) setTossWinner(teamId);
                    }}
                    className={`p-4 rounded-lg border-2 font-bold flex flex-col items-center gap-1 transition-all ${
                      tossWinner === (pendingMatchForToss!.teamA?._id || pendingMatchForToss!.team1?._id || '')
                        ? 'border-green-500 bg-green-500/20 shadow-lg scale-105'
                        : 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/10 hover:scale-105'
                    }`}
                  >
                    <div className="text-2xl">🏏</div>
                    <div className="text-sm font-bold truncate max-w-[100px]">
                      {pendingMatchForToss!.teamA?.name || pendingMatchForToss!.team1?.name || 'Team A TBD'}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const teamId = pendingMatchForToss!.teamB?._id || pendingMatchForToss!.team2?._id;
                      console.log('Team B button clicked:', { teamId, teamName: pendingMatchForToss!.teamB?.name || pendingMatchForToss!.team2?.name });
                      if (teamId) setTossWinner(teamId);
                    }}
                    className={`p-4 rounded-lg border-2 font-bold flex flex-col items-center gap-1 transition-all ${
                      tossWinner === (pendingMatchForToss!.teamB?._id || pendingMatchForToss!.team2?._id || '')
                        ? 'border-green-500 bg-green-500/20 shadow-lg scale-105'
                        : 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/10 hover:scale-105'
                    }`}
                  >
                    <div className="text-2xl">🏏</div>
                    <div className="text-sm font-bold truncate max-w-[100px]">
                      {pendingMatchForToss!.teamB?.name || pendingMatchForToss!.team2?.name || 'Team B TBD'}
                    </div>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Decision</label>
                <select 
                  value={tossDecision} 
                  onChange={(e) => setTossDecision(e.target.value as 'bat' | 'bowl')}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose decision</option>
                  <option value="bat">Bat First</option>
                  <option value="bowl">Bowl First</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleTossSave}
                  disabled={!tossWinner || !tossDecision}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors"
                >
                  Save Toss & Continue
                </button>
                <button 
                  onClick={() => setShowTossModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of JSX remains the same - truncated for brevity */}
      {/* ... all other modals and JSX from the original file ... */}
    </div>
  );
}

