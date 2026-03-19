import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import ClubMemberList from './ClubMemberList';

interface ClubManagementProps {}

const ClubManagement: React.FC<ClubManagementProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    if (!id) {
      navigate('/clubs');
      return;
    }
    
    const fetchClub = async () => {
      try {
        const res = await clubAPI.getClub(id);
        if (res.data.success && res.data.data) {
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

  const handleApproveRequest = async (userId: string) => {
    try {
      await clubAPI.approveJoinRequest(id!, userId);
      addToast({ type: 'success', title: 'Approved', message: 'Join request approved' });
      // Refresh club data
      const res = await clubAPI.getClub(id!);
      if (res.data.success) setClub(res.data.data);
    } catch (error: any) {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to approve' 
      });
    }
  };

  const handleRejectRequest = async (userId: string) => {
    // For simplicity, reject = ignore request (remove from joinRequests)
    // In real app, you'd have a reject endpoint that notifies user
    try {
      addToast({ type: 'success', title: 'Ignored', message: 'Request ignored (not added to members)' });
    } catch {
      // No API call needed
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Club not found</h2>
          <button 
            onClick={() => navigate('/clubs')}
            className="px-8 py-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all"
          >
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
              Manage {club.name}
            </h1>
            <p className="text-xl" style={{ color: 'var(--text-muted)' }}>
              {club.memberCount} members | {club.joinRequests?.length || 0} pending requests
            </p>
          </div>
          <button
            onClick={() => navigate(`/clubs/${club._id}`)}
            className="px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all text-lg"
          >
            ← View Club
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden mb-12">
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-5 px-8 font-bold transition-all ${
                activeTab === 'members' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg' 
                  : 'hover:bg-[var(--bg-hover)]'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-5 px-8 font-bold transition-all ${
                activeTab === 'requests' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg' 
                  : 'hover:bg-[var(--bg-hover)]'
              }`}
            >
              Join Requests ({club.joinRequests?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-5 px-8 font-bold transition-all ${
                activeTab === 'settings' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg' 
                  : 'hover:bg-[var(--bg-hover)]'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Members Tab */}
          {activeTab === 'members' && (
            <ClubMemberList
              members={club.members}
              viceLeaders={club.viceLeaders || []}
              isAdmin={true}
              clubId={club._id}
              onUpdate={() => {
                // Refresh
                clubAPI.getClub(club._id).then(res => {
                  if (res.data.success) setClub(res.data.data);
                });
              }}
            />
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
                Join Requests ({club.joinRequests?.length || 0})
              </h3>
              {club.joinRequests && club.joinRequests.length > 0 ? (
                <div className="space-y-4">
                  {club.joinRequests.map((req: any) => (
                    <div key={req._id} className="flex items-center gap-4 p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-all">
                      <img 
                        src={req.profilePicture || '/default-avatar.png'}
                        alt={req.username}
                        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 ring-2 ring-[var(--border)]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                          {req.username}
                        </p>
                        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
                          {req.fullName}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveRequest(req._id)}
                          className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-slate-500/25 transform hover:scale-[1.02]"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    No pending requests
                  </h4>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
                Club Settings
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block font-bold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>
                      Club Name
                    </label>
                    <input
                      type="text"
                      defaultValue={club.name}
                      className="w-full px-6 py-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] focus:ring-2 focus:ring-green-500/30"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>
                      Description
                    </label>
                    <textarea
                      rows={4}
                      defaultValue={club.description}
                      className="w-full px-6 py-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] focus:ring-2 focus:ring-green-500/30 resize-vertical"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 border-2 border-dashed border-[var(--border)] rounded-2xl text-center hover:border-green-500/50 transition-colors">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <div>
                      <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Upload Logo</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click to upload new logo</p>
                    </div>
                    <input type="file" className="hidden" />
                  </div>
                  <div className="p-6 border-2 border-dashed border-[var(--border)] rounded-2xl text-center hover:border-green-500/50 transition-colors">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <div>
                      <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Upload Banner</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click to upload new banner</p>
                    </div>
                    <input type="file" className="hidden" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubManagement;
