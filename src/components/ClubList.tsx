import React, { useState, useEffect, useCallback } from 'react';
import { clubAPI } from '../services/api';
import { useAuth } from '../App';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';

interface Club {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  type: 'public' | 'initiation_required';
  isPublic: boolean;
  memberCount: number;
  owner: {
    username: string;
    fullName: string;
    profilePicture: string;
  };
  members: Array<{
    _id: string;
    username: string;
  }>;
}

const ClubList: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'public' | 'my'>('public');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClubs = useCallback(async (tabType: 'public' | 'my' = tab, resetPage = true) => {
    try {
      setLoading(true);
      const params = { 
        search, 
        page: resetPage ? 1 : page, 
        limit: 12,
        ...(tabType === 'public' && { type: 'public' })
      };
      
      const res = tabType === 'public' 
        ? await clubAPI.getClubs(params)
        : await clubAPI.getMyClubs(params);
      
      if (res.data.success) {
        setClubs(tabType === 'public' ? res.data.data : myClubs);
        setMyClubs(tabType === 'my' ? res.data.data : myClubs);
        setTotalPages(res.data.pagination?.pages || 1);
        setPage(res.data.pagination?.page || 1);
      }
    } catch (error: any) {
      console.error('Failed to fetch clubs:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to load clubs'
      });
    } finally {
      setLoading(false);
    }
  }, [tab, search, page, myClubs, addToast]);

  useEffect(() => {
    fetchClubs(tab, true);
  }, [fetchClubs, tab]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleJoinClub = async (clubId: string) => {
    try {
      await clubAPI.joinClub(clubId);
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Join request sent or joined successfully!'
      });
      fetchClubs(tab, true);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to join club'
      });
    }
  };

  const ClubCard = ({ club }: { club: Club }) => (
    <div className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="flex gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
          {club.logo ? (
            <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-green-400">{club.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight group-hover:text-green-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {club.name}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {club.memberCount} members
          </p>
          <p className="text-xs mt-1 px-2 py-1 bg-green-500/10 text-green-400 rounded-full inline-block font-medium">
            {club.isPublic ? 'Public' : 'Private'}
          </p>
        </div>
      </div>
      <p className="text-sm mb-6 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
        {club.description}
      </p>
      <div className="flex gap-3">
        <Link 
          to={`/clubs/${club._id}`}
          className="flex-1 text-center py-3 px-6 border border-[var(--border)] rounded-xl font-medium hover:bg-[var(--bg-hover)] transition-all duration-200"
          style={{ color: 'var(--text-primary)' }}
        >
          View Club
        </Link>
        {user && !club.members.some((m: any) => m._id === user.id) && (
          <button
            onClick={() => handleJoinClub(club._id)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 space-y-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
              {tab === 'public' ? 'Discover Clubs' : 'My Clubs'}
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
              Find and join sports communities or manage your own
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setTab('public')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                tab === 'public' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg shadow-green-500/25' 
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border)]'
              }`}
            >
              Public Clubs
            </button>
            {user && (
              <button
                onClick={() => setTab('my')}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                  tab === 'my'
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border)]'
                }`}
              >
                My Clubs
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <input
            type="text"
            placeholder="Search clubs by name or description..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-12 pr-6 py-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-green-500/30 focus:border-transparent transition-all placeholder:text-[var(--text-muted)]"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tab === 'public' ? clubs.map(club => (
            <ClubCard key={club._id} club={club} />
          )) : myClubs.map(club => (
            <ClubCard key={club._id} club={club} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}

        {user && tab === 'my' && myClubs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-8 3h8M4 21h16M4 17h16m0 0V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              No Clubs Yet
            </h3>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Create your first club or discover public clubs to join
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/clubs/create"
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] text-center"
              >
                Create Club
              </Link>
              <button
                onClick={() => setTab('public')}
                className="px-8 py-4 border border-[var(--border)] bg-[var(--bg-card)] font-semibold rounded-2xl hover:bg-[var(--bg-hover)] transition-all"
                style={{ color: 'var(--text-primary)' }}
              >
                Browse Clubs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubList;

