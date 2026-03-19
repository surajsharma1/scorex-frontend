import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clubAPI } from '../services/api';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import ClubMemberList from './ClubMemberList';

interface ClubDetail {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  type: 'public' | 'initiation_required';
  isPublic: boolean;
  memberCount: number;
  owner: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string;
  };
  viceLeaders: Array<{
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string;
  }>;
  members: Array<{
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string;
  }>;
  joinRequests: Array<{
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string;
  }>;
}

const ClubDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchClub = async () => {
      try {
        setLoading(true);
        const res = await clubAPI.getClub(id);
        if (res.data.success) {
          setClub(res.data.data);
          if (user && res.data.data.members.some((m: any) => m._id === user.id)) {
            setIsMember(true);
          }
        }
      } catch (error: any) {
        addToast({
          type: 'error',
          title: 'Error',
          message: error.response?.data?.message || 'Failed to load club'
        });
        navigate('/clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [id, user, addToast, navigate]);

  const handleJoinClub = async () => {
    if (!id || !club) return;
    
    try {
      await clubAPI.joinClub(id);
      addToast({
        type: 'success',
        title: 'Success',
        message: club.isPublic ? 'Joined club!' : 'Join request submitted!'
      });
      setIsMember(club.isPublic);
      if (club.isPublic) {
        setClub({ ...club, memberCount: club.memberCount + 1 });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to join club'
      });
    }
  };

  const handleLeaveClub = async () => {
    if (!id) return;
    
    try {
      await clubAPI.leaveClub(id);
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Left club'
      });
      setIsMember(false);
      if (club) {
        setClub({ ...club, memberCount: club.memberCount - 1 });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to leave club'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Club not found</h1>
          <Link to="/clubs" className="text-green-400 hover:text-green-300 font-medium">
            ← Back to Clubs
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user && (club.owner._id === user.id || club.viceLeaders.some((vl: any) => vl._id === user.id));

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header with banner */}
        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl" style={{ height: '300px' }}>
          {club.banner ? (
            <img src={club.banner} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-green-900/30 to-blue-900/30 flex items-center justify-center">
              <span className="text-4xl font-black opacity-20" style={{ color: 'var(--text-primary)' }}>
                {club.name.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Logo overlay */}
          <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-2xl overflow-hidden border-4 border-[var(--bg-card)] shadow-2xl bg-[var(--bg-card)]">
            {club.logo ? (
              <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-green-400">{club.name.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Club info */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="lg:flex-1">
            <div className="flex items-start gap-4 mb-6">
              <h1 className="text-4xl font-black flex-1" style={{ color: 'var(--text-primary)' }}>
                {club.name}
              </h1>
              <div className="flex gap-2 flex-wrap">
                <span className="px-4 py-2 bg-green-500/10 text-green-400 font-semibold rounded-xl text-sm">
                  {club.memberCount} members
                </span>
                <span className="px-4 py-2 bg-blue-500/10 text-blue-400 font-semibold rounded-xl text-sm">
                  {club.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
            
            <p className="text-xl mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {club.description}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4 items-center">
              {!isMember ? (
                <button
                  onClick={handleJoinClub}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] text-lg"
                >
                  {club.isPublic ? 'Join Club' : 'Request to Join'}
                </button>
              ) : (
                <button
                  onClick={handleLeaveClub}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-red-500/25 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] text-lg"
                >
                  Leave Club
                </button>
              )}
              
              {isAdmin && (
                <Link
                  to={`/clubs/${club._id}/manage`}
                  className="px-8 py-4 bg-[var(--bg-card)] border border-[var(--border)] font-bold rounded-2xl hover:bg-[var(--bg-hover)] transition-all text-lg"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Manage Club
                </Link>
              )}
            </div>
          </div>

          {/* Owner info */}
          <div className="lg:w-80">
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Club Owner</h3>
            <div className="flex items-center gap-4 p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
              <img 
                src={club.owner.profilePicture || '/default-avatar.png'} 
                alt={club.owner.username}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
              />
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {club.owner.username}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {club.owner.fullName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden mb-8">
          <button
            onClick={() => setShowMembers(true)}
            className={`flex-1 py-4 px-6 font-semibold transition-all ${
              showMembers 
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                : 'hover:bg-[var(--bg-hover)]'
            }`}
            style={{ color: showMembers ? 'white' : 'var(--text-primary)' }}
          >
            Members ({club.memberCount})
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowRequests(true)}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                showRequests 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                  : 'hover:bg-[var(--bg-hover)]'
              }`}
              style={{ color: showRequests ? 'white' : 'var(--text-primary)' }}
            >
              Join Requests ({club.joinRequests.length})
            </button>
          )}
        </div>

        {/* Content */}
        {showMembers ? (
          <ClubMemberList 
            members={club.members} 
            viceLeaders={club.viceLeaders}
            isAdmin={isAdmin}
            clubId={club._id}
            onUpdate={() => {}} // Refresh parent on changes
          />
        ) : showRequests && isAdmin ? (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8">
            <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Join Requests ({club.joinRequests.length})
            </h3>
            {club.joinRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
                  No pending join requests
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {club.joinRequests.map((req) => (
                  <div key={req._id} className="flex items-center gap-4 p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-all">
                    <img 
                      src={req.profilePicture || '/default-avatar.png'}
                      alt={req.username}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                        {req.username}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {req.fullName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm">
                        Approve
                      </button>
                      <button className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors text-sm">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ClubDetail;

