import { useState, useEffect } from 'react';
import { User, Camera, Save, Trophy, Users, Eye, Edit2, Mail, Calendar } from 'lucide-react';
import { userAPI } from '../services/api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      username: '',
      email: '',
      bio: '',
      fullName: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const u = response.data;
      setUser(u);
      setFormData({
          username: u.username || '',
          email: u.email || '',
          bio: u.bio || '',
          fullName: u.fullName || ''
      });
    } catch (error) {
      console.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
      try {
          // Assuming updateProfile endpoint exists
          await userAPI.updateProfile(formData);
          setIsEditing(false);
          fetchProfile();
          alert("Profile updated!");
      } catch (e) {
          alert("Failed to update profile");
      }
  };

  if (loading) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="px-8 pb-8">
                <div className="relative flex justify-between items-end -mt-12 mb-6">
                    <div className="relative">
                        <img 
                            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${formData.username}&background=random`} 
                            className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-md bg-white"
                        />
                        <button className="absolute bottom-0 right-0 p-1 bg-gray-800 text-white rounded-full hover:bg-gray-700 border border-white">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition dark:text-white">
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        {isEditing ? (
                            <input 
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                className="text-2xl font-bold border rounded p-1 w-full dark:bg-gray-700 dark:text-white"
                                placeholder="Full Name"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.fullName || user?.username}</h1>
                        )}
                        <p className="text-gray-500">@{user?.username}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {user?.email}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h3 className="font-semibold mb-2 dark:text-white">Bio</h3>
                        {isEditing ? (
                            <textarea 
                                value={formData.bio}
                                onChange={e => setFormData({...formData, bio: e.target.value})}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                rows={3}
                            />
                        ) : (
                            <p className="text-gray-600 dark:text-gray-300">{user?.bio || "No bio yet."}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Trophy className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold dark:text-white">{user?.stats?.tournamentsCreated || 0}</span>
                <span className="text-sm text-gray-500">Tournaments</span>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <Eye className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-3xl font-bold dark:text-white">{user?.stats?.matchesManaged || 0}</span>
                <span className="text-sm text-gray-500">Matches Managed</span>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold dark:text-white">{user?.stats?.teamsCreated || 0}</span>
                <span className="text-sm text-gray-500">Teams Created</span>
            </div>
        </div>
    </div>
  );
}