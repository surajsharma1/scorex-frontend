import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { User, Edit3, Save, Image, Mail, User as UserIcon, Calendar, Award, Shield } from 'lucide-react';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profilePicture?: string;
  dob?: string;
  membershipLevel?: number;
  role?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', bio: '', profilePicture: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getProfile();
      setUser(res.user || res);
      if (res.user || res) {
        setFormData({
          fullName: (res.user || res).fullName || '',
          bio: (res.user || res).bio || '',
          profilePicture: (res.user || res).profilePicture || ''
        });
      }
    } catch (e: any) {
      console.error('Profile load error:', e);
      setError(e.response?.data?.message || 'Failed to load profile. Please log in.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setUpdating(true);
      setError(null);
      await userAPI.updateProfile(formData);
      
      // Refresh profile
      await loadProfile();
      setEditMode(false);
    } catch (e: any) {
      console.error('Profile update error:', e);
      setError(e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const getMembershipBadge = (level?: number) => {
    if (!level || level === 0) return 'Free';
    if (level === 1) return 'Basic';
    return 'Premium';
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin': return { icon: Shield, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
      case 'organizer': return { icon: Award, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' };
      default: return { icon: UserIcon, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300' };
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center dark:text-white">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user || error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <UserIcon className="w-12 h-12 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Profile Unavailable</h2>
              <p className="text-red-800 dark:text-red-200">{error || 'No profile data found.'}</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">Please log in or refresh the page.</p>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto shadow-lg"
            >
              Refresh Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const RoleBadge = ({ role }: { role: string }) => {
    const badge = getRoleBadge(role);
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 ${badge.color}`} style={{ minWidth: '80px', justifyContent: 'center' }}>
        <Icon className="w-3.5 h-3.5" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const avatarSrc = user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&amp;background=10b981&amp;color=fff&amp;size=128&amp;font-size=0.6&amp;bold=true`;

  return (
    <div className="p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center lg:text-left lg:flex lg:items-start lg:gap-8">
          <div className="mx-auto lg:mx-0 w-32 h-32 mb-6 lg:mb-0">
            <img
              src={avatarSrc}
              alt={user.fullName || user.username}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-green-200 dark:ring-green-900/50 shadow-xl"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
              <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                {user.fullName || user.username}
              </h1>
              <RoleBadge role={user.role || 'viewer'} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">@{user.username}</p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {user.email}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50`} style={{ minWidth: 'fit-content' }}>
                {getMembershipBadge(user.membershipLevel)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
          >
            {editMode ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
          </button>
          <label className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-green-400 dark:hover:border-green-500 cursor-pointer shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 dark:text-gray-300">
            <Image className="w-4 h-4" />
            Change Avatar
            <input
              type="file"
              name="profilePicture"
              accept="image/*"
              onChange={handleInputChange}
              className="sr-only"
            />
          </label>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Edit Form */}
        {editMode ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Bio (optional)
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  maxLength={500}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={updating}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Updating... </> : <><Save className="w-4 h-4" /> Save Profile</>}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 px-6 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Bio Card */}
            {user.bio && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">{user.bio}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

