import { useState, useEffect } from 'react';
import { User, Camera, Save, Trophy, Users, Eye } from 'lucide-react'; // Removed unused: Settings
import api, { userAPI } from '../services/api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('John Doe');
  const [profilePicture, setProfilePicture] = useState('https://via.placeholder.com/150');
  const [email, setEmail] = useState('john@example.com');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('Cricket enthusiast and tournament organizer.');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tournamentsCreated] = useState(5);
  const [matchesManaged] = useState(12);
  const [teamsAdded] = useState(8);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.getProfile();
        setUser(response.data);
        setUsername(response.data.username);
        setEmail(response.data.email);
        setProfilePicture(response.data.profilePicture || 'https://via.placeholder.com/150');
        setBio(response.data.bio || '');
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfilePicture(reader.result as string);
      reader.readAsDataURL(file);
      // TODO: Send to backend for upload (e.g., using FormData and fetch)
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile({ username, email, profilePicture, bio });
      setIsEditing(false);
      // Refresh profile data
      const response = await userAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your account details and view statistics</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            <img
              src={profilePicture}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600"
            />
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-2xl font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 w-full border border-gray-300 dark:border-gray-600"
                placeholder="Enter username"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{username}</h2>
            )}
            <p className="text-gray-600 dark:text-gray-400">Member since 2023</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bio</label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Tell us about yourself"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{bio}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Account Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Trophy className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-400">{tournamentsCreated}</p>
            <p className="text-gray-600 dark:text-gray-400">Tournaments Created</p>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Eye className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{matchesManaged}</p>
            <p className="text-gray-600 dark:text-gray-400">Matches Managed</p>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-400">{teamsAdded}</p>
            <p className="text-gray-600 dark:text-gray-400">Teams Added</p>
          </div>
        </div>
      </div>
    </div>
  );
}