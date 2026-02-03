import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Settings, Eye, BarChart3, User } from 'lucide-react'; // Added User icon
import { useState } from 'react';

export default function Sidebar() {
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  const menuItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/overlay', icon: Eye, label: 'Overlays' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 bg-gray-900">
          <h1 className="text-xl font-bold text-white">ScoreX</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
          >
            <User className="w-5 h-5 mr-3" />
            Profile
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src="https://via.placeholder.com/100" // Replace with user's profile picture URL
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="text-white font-semibold">Username: John Doe</p> {/* Replace with dynamic username */}
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 text-sm text-gray-300"
                    onChange={(e) => {
                      // Handle image upload here (e.g., send to backend)
                      console.log('Selected file:', e.target.files?.[0]);
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowProfile(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}