import PageLoader from './PageLoader';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { clubAPI } from '../services/api';

interface Club {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  owner: any;
  members: any[];
  memberCount: number;
  type: 'public' | 'initiation_required';
  isPublic: boolean;
  location?: string;
  joinRequests: any[];
}

const ClubDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/clubs');
      return;
    }

    const fetchClub = async () => {
      try {
        const res = await clubAPI.getClub(id);
        if (res.data.success) {
          setClub(res.data.data);
        } else {
          navigate('/clubs');
        }
      } catch {
        navigate('/clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [id, navigate]);

  const handleJoinClub = async () => {
    if (!club || !user) return;
    if ((club.members || []).some((m: any) => m._id === user.id)) {
      addToast({
        type: 'error',
        title: 'Already Member',
        message: 'You are already a member of this club'
      });
      return;
    }

    try {
      setJoining(true);
      await clubAPI.joinClub(club._id);
      addToast({
        type: 'success',
        title: 'Joined!',
        message: club.isPublic ? 'Joined club successfully!' : 'Join request submitted'
      });
      // Refresh
      const res = await clubAPI.getClub(id!);
      if (res.data.success) setClub(res.data.data);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to join club'
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Club not found</h2>
          <Link 
            to="/clubs"
            className="px-8 py-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all"
          >
            Back to Clubs
          </Link>
        </div>
      </div>
    );
  }

  const isMember = (club.members || []).some((m: any) => m._id === user?.id);
  const isOwner = club.owner._id === user?.id;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/clubs" className="inline-flex items-center gap-2 mb-6 text-lg font-semibold hover:text-green-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
            ← All Clubs
          </Link>
          <div className="flex flex-col items-center gap-4 mb-8">
            {club.logo && (
              <img 
                src={club.logo} 
                alt={club.name}
                className="w-32 h-32 rounded-3xl object-cover shadow-2xl ring-4 ring-green-500/20"
              />
            )}
            <h1 className="text-5xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
              {club.name}
            </h1>
            <div className="flex items-center gap-4 text-lg" style={{ color: 'var(--text-muted)' }}>
              <span>{club.memberCount} members</span>
              <span>•</span>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 font-medium rounded-full text-sm">
                {club.isPublic ? 'Public' : 'Private'}
              </span>
              {club.location && <span>{club.location}</span>}
            </div>
          </div>
        </div>

        {/* Description */}
        {club.description && (
          <div className="bg-[var(--bg-card)] rounded-3xl p-8 mb-12 border border-[var(--border)]">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              About {club.name}
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {club.description}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          {!isMember && !isOwner && (
            <button
              onClick={handleJoinClub}
              disabled={joining}
              className="flex-1 px-8 py-6 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {club.isPublic ? 'Joining...' : 'Request to Join...'}
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {club.isPublic ? 'Join Club' : 'Request to Join'}
                </>
              )}
            </button>
          )}
          {isOwner && (
            <Link
              to={`/clubs/${club._id}/manage`}
              className="flex-1 px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-[1.02] transition-all text-lg flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Club
            </Link>
          )}
          <Link
            to="/clubs"
            className="px-8 py-6 bg-[var(--bg-card)] border border-[var(--border)] font-bold rounded-2xl hover:bg-[var(--bg-hover)] transition-all text-lg flex items-center justify-center"
            style={{ color: 'var(--text-primary)' }}
          >
            ← Browse More Clubs
          </Link>
        </div>

        {/* Owner info */}
        <div className="bg-[var(--bg-card)] rounded-3xl p-8 mb-12 border border-[var(--border)]">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Founded by
          </h2>
          <div className="flex items-center gap-4">
            <img 
              src={club.owner.profilePicture || '/default-avatar.png'} 
              alt={club.owner.username}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[var(--border)]"
            />
            <div>
              <Link to={`/profile/${club.owner._id}`} className="font-bold text-xl hover:text-green-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                {club.owner.username}
              </Link>
              <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
                {club.owner.fullName}
              </p>
            </div>
          </div>
        </div>

        {/* Members preview */}
        <div className="bg-[var(--bg-card)] rounded-3xl p-8 border border-[var(--border)]">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Members ({club.memberCount})
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {(club.members || []).slice(0, 12).map((m: any) => (
              <div key={m._id} className="text-center group">
                <img 
                  src={m.profilePicture || '/default-avatar.png'} 
                  alt={m.username}
                  className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-[var(--border)] hover:ring-green-500/50 transition-all group-hover:scale-105"
                />
                <p className="text-xs mt-2 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {m.username}
                </p>
              </div>
            ))}
            {club.memberCount > 12 && (
              <div className="flex items-center justify-center text-lg font-semibold col-span-1" style={{ color: 'var(--text-primary)' }}>
                +{club.memberCount - 12} more
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;

