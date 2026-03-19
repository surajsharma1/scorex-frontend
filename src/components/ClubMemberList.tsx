import React from 'react';
import { Link } from 'react-router-dom';
import { clubAPI } from '../services/api';
import { useToast } from '../hooks/useToast';

interface Member {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  role?: 'owner' | 'vice-leader' | 'member';
}

interface ClubMemberListProps {
  members: Member[];
  viceLeaders: Member[];
  isAdmin: boolean;
  clubId: string;
  onUpdate: () => void;
}

const ClubMemberList: React.FC<ClubMemberListProps> = ({
  members,
  viceLeaders,
  isAdmin,
  clubId,
  onUpdate
}) => {
  const { addToast } = useToast();

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the club?')) return;
    
    try {
      await clubAPI.removeMember(clubId, userId);
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Member removed'
      });
      onUpdate();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to remove member'
      });
    }
  };

  const handleAddViceLeader = async (userId: string) => {
    if (!confirm('Promote this member to Vice Leader?')) return;
    
    try {
      await clubAPI.addViceLeader(clubId, userId);
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Vice Leader promoted'
      });
      onUpdate();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to promote'
      });
    }
  };

  const allMembers = [
    ...viceLeaders.map(m => ({ ...m, role: 'vice-leader' as const })),
    ...members.filter(m => !viceLeaders.some(vl => vl._id === m._id)).map(m => ({ ...m, role: 'member' as const }))
  ];

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8">
      <h3 className="text-2xl font-bold mb-8 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Members ({allMembers.length})
      </h3>

      {allMembers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-800/50 rounded-2xl flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No members yet</h4>
          <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>Be the first to join this club</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {allMembers.map((member) => (
            <div key={member._id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] rounded-xl transition-colors group">
              <img 
                src={member.profilePicture || '/default-avatar.png'}
                alt={member.username}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-[var(--border)]"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {member.username}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {member.fullName}
                </p>
              </div>
              {member.role === 'vice-leader' && (
                <div className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 font-semibold rounded-full text-xs border border-yellow-500/30">
                  Vice Leader
                </div>
              )}
              {isAdmin && member.role === 'member' && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <button
                    onClick={() => handleAddViceLeader(member._id)}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                    title="Promote to Vice Leader"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                    title="Remove Member"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="mt-8 p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
          <h4 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Admin Actions
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Use the management panel to approve requests, promote vice leaders, and more
          </p>
          <Link
            to={`/clubs/${clubId}/manage`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            Go to Management
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ClubMemberList;

